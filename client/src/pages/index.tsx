import { useLocation } from 'wouter';
import { CustomerInfoFlow } from '@/components/customer/CustomerInfoFlow';
import type { OrderType } from '@shared/schema';
import '@/i18n';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [showCustomerFlow, setShowCustomerFlow] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Controlla se customerInfo esiste già nel localStorage
    const customerInfoStr = localStorage.getItem('customerInfo');
    if (customerInfoStr) {
      try {
        const customerInfo = JSON.parse(customerInfoStr);
        // Verifica se i dati sono validi e non scaduti (24 ore)
        const isExpired = Date.now() - customerInfo.timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired && customerInfo.phoneNumber && customerInfo.orderType) {
          // Se i dati sono validi, reindirizza direttamente al menu
          console.log('Customer info found, redirecting to menu');
          setLocation('/menu');
          return;
        }
      } catch (error) {
        console.error('Error parsing customer info:', error);
        localStorage.removeItem('customerInfo');
      }
    }
    
    // Se non ci sono dati validi, mostra il form
    setShowCustomerFlow(true);
  }, [setLocation]);

  const handleCustomerInfoComplete = (data: {
    phoneNumber: string;
    orderType: OrderType;
    tableNumber?: string;
    customerName?: string;
    subscribeToNewsletter?: boolean;
  }) => {
    // Crea un nuovo oggetto senza diffondere le proprietà di data
    const customerInfo = {
      phoneNumber: data.phoneNumber,
      orderType: data.orderType,
      tableNumber: data.tableNumber,
      customerName: data.customerName,
      // Assicurati che subscribeToNewsletter sia sempre un booleano
      subscribeToNewsletter: data.subscribeToNewsletter === true,
      timestamp: Date.now()
    };
    
    console.log('Saving customer info with newsletter choice:', customerInfo);
    
    // Salva i dati in localStorage
    localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
    
    // Verifica che i dati siano stati salvati correttamente
    const savedData = localStorage.getItem('customerInfo');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('Saved data:', parsedData);
      
      // Verifica che il campo subscribeToNewsletter sia presente
      if (parsedData.subscribeToNewsletter === undefined) {
        console.error('subscribeToNewsletter field is missing!');
      }
    }
    
    setLocation('/menu');
  };

  // Mostra un loader mentre controlliamo il localStorage
  if (!showCustomerFlow) {
    return <div className="flex items-center justify-center h-screen">{t('common.loading')}</div>;
  }

  return (
    <main>
      <CustomerInfoFlow onComplete={handleCustomerInfoComplete} />
    </main>
  );
} 