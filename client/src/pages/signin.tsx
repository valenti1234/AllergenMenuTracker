import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import type { OrderType } from "@shared/schema";
import { usePhone } from "@/contexts/PhoneContext";

export default function SignIn() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { setPhoneNumber, isAuthenticated } = usePhone();
  const [step, setStep] = useState<'phone' | 'type' | 'details'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Controlla se esiste già un'informazione cliente all'avvio
  useEffect(() => {
    console.log("SignIn component mounted");
    
    // Imposta una flag per evitare controlli ripetuti
    if (redirectChecked) return;
    setRedirectChecked(true);
    
    try {
      const storedInfo = localStorage.getItem('customerInfo');
      if (storedInfo) {
        const customerInfo = JSON.parse(storedInfo);
        // Controlla se le informazioni sono ancora valide (meno di 24 ore)
        if (Date.now() - customerInfo.timestamp < 24 * 60 * 60 * 1000) {
          console.log("Valid customer info found in SignIn, redirecting");
          // Imposta i dati nel contesto del telefono
          setPhoneNumber(customerInfo.phoneNumber);
          
          // Usa setLocation per un reindirizzamento controllato
          setLocation('/menu');
        } else {
          console.log("Expired customer info in SignIn, removing");
          // Informazioni scadute, le eliminiamo
          localStorage.removeItem('customerInfo');
        }
      } else {
        console.log("No customer info found in SignIn");
      }
    } catch (error) {
      console.error('Errore nel controllo delle informazioni cliente:', error);
      localStorage.removeItem('customerInfo');
    }
  }, [setPhoneNumber, setLocation, redirectChecked]);

  // Se siamo già autenticati, reindirizza immediatamente
  useEffect(() => {
    if (isAuthenticated && redirectChecked) {
      console.log("User already authenticated in SignIn, redirecting to menu");
      setLocation('/menu');
    }
  }, [isAuthenticated, setLocation, redirectChecked]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.replace(/\D/g, "").length >= 10) {
      setStep('type');
    }
  };

  const handleTypeSelection = (type: OrderType) => {
    setOrderType(type);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedNumber = phoneInput.replace(/\D/g, "");
    if (cleanedNumber.length >= 10 && orderType) {
      if (
        (orderType === 'dine-in' && tableNumber) ||
        (orderType === 'takeaway' && customerName)
      ) {
        // Salva le informazioni cliente nel localStorage
        const customerInfo = {
          phoneNumber: cleanedNumber,
          orderType,
          tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
          customerName: orderType === 'takeaway' ? customerName : undefined,
          timestamp: Date.now()
        };
        
        console.log("Saving customer info:", customerInfo);
        localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
        
        // Imposta il numero di telefono nel contesto
        setPhoneNumber(cleanedNumber);
        
        // Usa setLocation invece di window.location per un reindirizzamento controllato
        console.log("Redirecting to menu after form completion");
        setLocation('/menu');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === 'phone' && t('auth.enterPhone', 'Inserisci il tuo numero di telefono')}
            {step === 'type' && t('auth.selectOrderType', 'Seleziona il tipo di ordine')}
            {step === 'details' && orderType === 'dine-in' && t('auth.enterTableNumber', 'Inserisci il numero del tavolo')}
            {step === 'details' && orderType === 'takeaway' && t('auth.enterName', 'Inserisci il tuo nome')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Input
                  type="tel"
                  placeholder={t('auth.phoneNumberPlaceholder', 'Numero di telefono')}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={phoneInput.replace(/\D/g, "").length < 10}
              >
                {t('common.continue', 'Continua')}
              </Button>
            </form>
          )}

          {step === 'type' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleTypeSelection('dine-in')}
                  variant="outline"
                  className="h-24"
                >
                  {t('auth.dineIn', 'Al tavolo')}
                </Button>
                <Button
                  onClick={() => handleTypeSelection('takeaway')}
                  variant="outline"
                  className="h-24"
                >
                  {t('auth.takeaway', 'Da asporto')}
                </Button>
              </div>
              <Button 
                onClick={() => setStep('phone')}
                variant="ghost"
                className="w-full"
              >
                {t('common.back', 'Indietro')}
              </Button>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <Input
                  type={orderType === 'dine-in' ? "number" : "text"}
                  placeholder={
                    orderType === 'dine-in' 
                      ? t('auth.tableNumberPlaceholder', 'Numero del tavolo')
                      : t('auth.namePlaceholder', 'Il tuo nome')
                  }
                  value={orderType === 'dine-in' ? tableNumber : customerName}
                  onChange={(e) => {
                    if (orderType === 'dine-in') {
                      setTableNumber(e.target.value);
                    } else {
                      setCustomerName(e.target.value);
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={
                    orderType === 'dine-in' 
                      ? !tableNumber
                      : !customerName
                  }
                >
                  {t('common.continue', 'Continua')}
                </Button>
                <Button 
                  onClick={() => setStep('type')}
                  variant="ghost"
                  className="w-full"
                >
                  {t('common.back', 'Indietro')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 