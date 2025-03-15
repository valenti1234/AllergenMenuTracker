import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@shared/schema';
import { useSettings } from '@/contexts/SettingsContext';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Importa la libreria Stripe Terminal
declare global {
  interface Window {
    StripeTerminal?: any;
  }
}

interface POSConfig {
  enabled: boolean;
  type: string;
  publishableKey?: string;
  terminalLocation?: string;
  readerId?: string;
}

interface StripeTerminalPaymentProps {
  order: Order;
  onPaymentComplete: (success: boolean) => void;
}

export function StripeTerminalPayment({ order, onPaymentComplete }: StripeTerminalPaymentProps) {
  const { toast } = useToast();
  const { formatPrice } = useSettings();
  const [terminal, setTerminal] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('idle');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  
  // Ottieni la configurazione del POS
  const { data: posConfig, isLoading: isLoadingConfig } = useQuery<POSConfig>({
    queryKey: ['/api/pos/config'],
  });
  
  // Carica lo script di Stripe Terminal
  useEffect(() => {
    if (!window.StripeTerminal && posConfig?.enabled && posConfig?.type === 'stripe') {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/terminal/v1/';
      script.async = true;
      script.onload = initializeTerminal;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else if (window.StripeTerminal && posConfig?.enabled && posConfig?.type === 'stripe') {
      initializeTerminal();
    }
  }, [posConfig]);
  
  const initializeTerminal = async () => {
    if (!window.StripeTerminal || !posConfig?.enabled || posConfig?.type !== 'stripe') return;
    
    try {
      // Funzione per ottenere il token di connessione dal server
      const fetchConnectionToken = async () => {
        try {
          const response = await apiRequest<{ secret: string }>("POST", "/api/pos/connection-token");
          if (!response || !response.secret) {
            throw new Error('Invalid connection token response');
          }
          return response.secret;
        } catch (error) {
          console.error('Error fetching connection token:', error);
          throw error;
        }
      };
      
      // Inizializza il terminale
      const terminal = window.StripeTerminal.create({
        onFetchConnectionToken: fetchConnectionToken,
        onUnexpectedReaderDisconnect: () => {
          toast({
            variant: "destructive",
            title: "Reader Disconnected",
            description: "The card reader has been disconnected",
          });
          setReader(null);
        },
      });
      
      setTerminal(terminal);
    } catch (error) {
      console.error('Error initializing Stripe Terminal:', error);
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Failed to initialize Stripe Terminal",
      });
    }
  };
  
  const connectToReader = async () => {
    if (!terminal) return;
    
    setIsConnecting(true);
    setStatus('connecting');
    
    try {
      // Se è configurato un lettore specifico, prova a connettersi direttamente
      if (posConfig?.readerId) {
        const connectResult = await terminal.connectReader({
          readerId: posConfig.readerId,
        });
        
        if (connectResult.error) {
          throw new Error(connectResult.error.message);
        }
        
        setReader(connectResult.reader);
        setStatus('connected');
        
        toast({
          title: "Reader Connected",
          description: `Connected to ${connectResult.reader.label}`,
        });
        
        return;
      }
      
      // Altrimenti, scopri i lettori disponibili
      const discoverResult = await terminal.discoverReaders({
        location: posConfig?.terminalLocation,
      });
      
      if (discoverResult.error) {
        throw new Error(discoverResult.error.message);
      }
      
      if (discoverResult.discoveredReaders.length === 0) {
        throw new Error("No readers found");
      }
      
      // Connetti al primo lettore disponibile
      const connectResult = await terminal.connectReader(
        discoverResult.discoveredReaders[0]
      );
      
      if (connectResult.error) {
        throw new Error(connectResult.error.message);
      }
      
      setReader(connectResult.reader);
      setStatus('connected');
      
      toast({
        title: "Reader Connected",
        description: `Connected to ${connectResult.reader.label}`,
      });
    } catch (error) {
      console.error('Error connecting to reader:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to reader",
      });
      setStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const processPayment = async () => {
    if (!terminal || !reader) return;
    
    setIsProcessing(true);
    setStatus('processing');
    
    try {
      // Crea un Payment Intent sul server
      const paymentIntentResponse = await apiRequest<{ clientSecret: string, paymentIntentId: string }>(
        "POST", 
        `/api/pos/payment-intent/${order.id}`
      );
      
      if (!paymentIntentResponse || !paymentIntentResponse.paymentIntentId || !paymentIntentResponse.clientSecret) {
        throw new Error('Invalid payment intent response');
      }
      
      setPaymentIntentId(paymentIntentResponse.paymentIntentId);
      
      // Recupera il Payment Intent sul terminale
      const retrieveResult = await terminal.retrievePaymentIntent(paymentIntentResponse.clientSecret);
      
      if (retrieveResult.error) {
        throw new Error(retrieveResult.error.message);
      }
      
      // Raccogli il pagamento
      const paymentResult = await terminal.collectPaymentMethod(retrieveResult.paymentIntent);
      
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }
      
      // Processa il pagamento
      const processResult = await terminal.processPayment(paymentResult.paymentIntent);
      
      if (processResult.error) {
        throw new Error(processResult.error.message);
      }
      
      // Notifica il server che il pagamento è stato completato
      await apiRequest(
        "POST", 
        `/api/pos/payment-complete/${order.id}`, 
        { 
          paymentIntentId: paymentIntentResponse.paymentIntentId,
          success: true
        }
      );
      
      setStatus('success');
      toast({
        title: "Payment Successful",
        description: "The payment has been processed successfully",
      });
      
      onPaymentComplete(true);
    } catch (error) {
      console.error('Payment error:', error);
      
      // Notifica il server che il pagamento è fallito
      if (paymentIntentId) {
        await apiRequest(
          "POST", 
          `/api/pos/payment-complete/${order.id}`, 
          { 
            paymentIntentId,
            success: false
          }
        );
      }
      
      setStatus('error');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
      });
      
      onPaymentComplete(false);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const cancelPayment = async () => {
    if (paymentIntentId) {
      try {
        await apiRequest(
          "POST", 
          `/api/pos/payment-complete/${order.id}`, 
          { 
            paymentIntentId,
            success: false
          }
        );
        
        toast({
          title: "Payment Cancelled",
          description: "The payment has been cancelled",
        });
        
        onPaymentComplete(false);
      } catch (error) {
        console.error('Error cancelling payment:', error);
      }
    } else {
      onPaymentComplete(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Process Payment</CardTitle>
        <CardDescription>
          Order #{order.id} - Total: {formatPrice(order.total)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {!reader ? (
            <div className="text-center">
              <p className="mb-4">Connect to a card reader to process payment</p>
              <Button 
                onClick={connectToReader} 
                disabled={!terminal || isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect to Reader'
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-2">Connected to reader: {reader.label}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ready to process payment of {formatPrice(order.total)}
              </p>
              
              {status === 'processing' ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Processing payment...</p>
                  <p className="text-sm text-muted-foreground">
                    Please follow the instructions on the card reader
                  </p>
                </div>
              ) : status === 'success' ? (
                <div className="text-center text-green-600">
                  <p className="text-xl font-bold">Payment Successful!</p>
                </div>
              ) : status === 'error' ? (
                <div className="text-center text-red-600">
                  <p>Payment failed. Please try again.</p>
                </div>
              ) : (
                <Button 
                  onClick={processPayment} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  Process Payment
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={cancelPayment}
          disabled={isProcessing && status === 'processing'}
        >
          Cancel
        </Button>
        
        {status === 'success' && (
          <Button onClick={() => onPaymentComplete(true)}>
            Complete Order
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 