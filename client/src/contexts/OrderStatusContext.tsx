import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { usePhone } from './PhoneContext';
import { useSettings } from './SettingsContext';
import { apiRequest } from '@/lib/api';
import type { Order } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface OrderStatusContextType {
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

const OrderStatusContext = createContext<OrderStatusContextType | undefined>(undefined);

export function OrderStatusProvider({ children }: { children: ReactNode }) {
  // Determina se siamo in un percorso admin
  const isAdminPath = window.location.pathname.startsWith('/admin');
  
  // Se siamo in un percorso admin, non usare le funzionalità di monitoraggio ordini
  if (isAdminPath) {
    return (
      <OrderStatusContext.Provider value={{ 
        isMonitoring: false, 
        startMonitoring: () => {}, 
        stopMonitoring: () => {} 
      }}>
        {children}
      </OrderStatusContext.Provider>
    );
  }
  
  // A questo punto siamo sicuri di essere nell'area clienti, quindi possiamo usare usePhone
  const { phoneNumber } = usePhone();
  const { settings } = useSettings();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const timerRef = useRef<number | null>(null);
  const redirectedOrderRef = useRef<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Funzione per controllare lo stato degli ordini in background
  const checkOrderStatus = async () => {
    if (!phoneNumber) return;
    
    // Verifica le opzioni di pagamento
    const autoRedirectEnabled = (settings as any)?.paymentOptions?.autoRedirectToPayment ?? true;
    const payAtOrderEnabled = (settings as any)?.paymentOptions?.payAtOrder ?? false;
    
    try {
      const response = await apiRequest<Order[]>("GET", `/api/orders/track/${phoneNumber}`);
      
      if (response && Array.isArray(response)) {
        // Cerca un ordine che è passato a "servito"
        const servedOrder = response.find(order => 
          order.status === "served" && 
          order.id !== redirectedOrderRef.current
        );
        
        if (servedOrder) {
          // Memorizza l'ID dell'ordine per evitare reindirizzamenti multipli
          redirectedOrderRef.current = servedOrder.id;
          
          // Mostra un toast per informare l'utente
          toast({
            title: t('notifications.orderServedTitle', { defaultValue: "Il tuo ordine è pronto!" }),
            description: t('notifications.orderServedBody', { 
              defaultValue: "Il tuo ordine #{id} è pronto per essere servito.", 
              id: servedOrder.id.substring(0, 8) 
            }),
            action: !autoRedirectEnabled ? (
              <Button variant="default" size="sm" onClick={() => setLocation(`/payment?orderId=${servedOrder.id}`)}>
                {t('track.payNow', { defaultValue: "Paga ora" })}
              </Button>
            ) : undefined,
          });
          
          // Reindirizza automaticamente se abilitato
          if (autoRedirectEnabled) {
            setLocation(`/payment?orderId=${servedOrder.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Errore nel controllo dello stato dell'ordine:", error);
    }
  };

  const startMonitoring = () => {
    if (isMonitoring || !phoneNumber) return;
    
    // Controlla lo stato ogni 10 secondi
    timerRef.current = window.setInterval(checkOrderStatus, 10000);
    setIsMonitoring(true);
    
    // Esegui un controllo immediato
    checkOrderStatus();
  };

  const stopMonitoring = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsMonitoring(false);
  };

  // Avvia il monitoraggio automaticamente se c'è un numero di telefono
  useEffect(() => {
    if (phoneNumber) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    // Pulisci il timer quando il componente viene smontato
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phoneNumber]);

  return (
    <OrderStatusContext.Provider value={{ isMonitoring, startMonitoring, stopMonitoring }}>
      {children}
    </OrderStatusContext.Provider>
  );
}

export function useOrderStatus() {
  const context = useContext(OrderStatusContext);
  if (context === undefined) {
    throw new Error('useOrderStatus must be used within an OrderStatusProvider');
  }
  return context;
} 