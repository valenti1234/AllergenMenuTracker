import { useLocation } from 'wouter';
import { CustomerInfoFlow } from '@/components/customer/CustomerInfoFlow';
import type { OrderType } from '@shared/schema';
import '@/i18n';

export default function HomePage() {
  const [, setLocation] = useLocation();

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

  return (
    <main>
      <CustomerInfoFlow onComplete={handleCustomerInfoComplete} />
    </main>
  );
} 