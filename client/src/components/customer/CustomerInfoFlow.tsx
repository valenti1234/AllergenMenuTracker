import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderType } from '@shared/schema';

interface CustomerInfoFlowProps {
  onComplete: (data: {
    phoneNumber: string;
    orderType: OrderType;
    tableNumber?: string;
    customerName?: string;
    subscribeToNewsletter?: boolean;
  }) => void;
}

export function CustomerInfoFlow({ onComplete }: CustomerInfoFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'type' | 'details' | 'subscribe'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);

  // Log step changes
  useEffect(() => {
    console.log('Current step:', step);
  }, [step]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.replace(/\D/g, '').length >= 10) {
      setStep('type');
    }
  };

  const handleTypeSubmit = (type: OrderType) => {
    setOrderType(type);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Details submitted:', { orderType, phoneNumber, tableNumber, customerName });
    
    // Validate required fields
    if (!orderType || !phoneNumber) {
      console.log('Missing orderType or phoneNumber');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      console.log('Missing table number for dine-in');
      return;
    }
    if (orderType === 'takeaway' && !customerName) {
      console.log('Missing customer name for takeaway');
      return;
    }

    // All validations passed, proceed to subscribe step
    console.log('Moving to subscribe step');
    setStep('subscribe');
  };

  const handleSubscribeSubmit = (subscribe: boolean) => {
    console.log('Newsletter choice:', subscribe);
    if (!orderType || !phoneNumber) return;

    // Imposta lo stato locale prima di chiamare onComplete
    setSubscribeToNewsletter(subscribe);
    
    // Completa il flusso con tutti i dati, inclusa la scelta della newsletter
    const customerData = {
      phoneNumber: phoneNumber.replace(/\D/g, ''),
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      customerName: orderType === 'takeaway' ? customerName : undefined,
      subscribeToNewsletter: subscribe
    };
    
    console.log('Sending customer data with newsletter choice:', customerData);
    onComplete(customerData);
  };

  // Rendering condizionale semplificato
  let content;
  if (step === 'phone') {
    content = (
      <form onSubmit={handlePhoneSubmit} className="mt-8 space-y-6">
        <div className="rounded-md shadow-sm -space-y-px">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
            {t('menu.customerInfo.title')}
          </h2>
          <div>
            <label htmlFor="phone-number" className="sr-only">
              {t('menu.customerInfo.phoneNumber')}
            </label>
            <input
              id="phone-number"
              name="phone"
              type="tel"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={t('menu.customerInfo.phoneNumberPlaceholder')}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('menu.customerInfo.continue')}
          </button>
        </div>
      </form>
    );
  } else if (step === 'type') {
    content = (
      <div className="mt-8 space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          {t('menu.customerInfo.orderTypeTitle')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleTypeSubmit('dine-in')}
            className="flex flex-col items-center justify-center p-6 border-2 rounded-lg hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="text-xl font-medium">{t('menu.customerInfo.dineIn')}</span>
          </button>
          <button
            onClick={() => handleTypeSubmit('takeaway')}
            className="flex flex-col items-center justify-center p-6 border-2 rounded-lg hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <span className="text-xl font-medium">{t('menu.customerInfo.takeaway')}</span>
          </button>
        </div>
        <button
          onClick={() => setStep('phone')}
          className="mt-4 w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('menu.customerInfo.back')}
        </button>
      </div>
    );
  } else if (step === 'details' && orderType) {
    content = (
      <form onSubmit={handleDetailsSubmit} className="mt-8 space-y-6">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          {orderType === 'dine-in'
            ? t('menu.customerInfo.tableNumber')
            : t('menu.customerInfo.customerName')}
        </h2>
        <div className="rounded-md shadow-sm -space-y-px">
          {orderType === 'dine-in' ? (
            <input
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={t('menu.customerInfo.tableNumberPlaceholder')}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          ) : (
            <input
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={t('menu.customerInfo.customerNamePlaceholder')}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          )}
        </div>
        <div className="flex flex-col space-y-4">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('menu.customerInfo.continue')}
          </button>
          <button
            type="button"
            onClick={() => setStep('type')}
            className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('menu.customerInfo.back')}
          </button>
        </div>
      </form>
    );
  } else if (step === 'subscribe') {
    content = (
      <div className="mt-8 space-y-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          {t('newsletter.title')}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {t('newsletter.description')}
        </p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => {
              console.log('Subscribe button clicked');
              setSubscribeToNewsletter(true);
              handleSubscribeSubmit(true);
            }}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('newsletter.subscribe')}
          </button>
          <button
            onClick={() => {
              console.log('Skip button clicked');
              setSubscribeToNewsletter(false);
              handleSubscribeSubmit(false);
            }}
            className="w-full flex justify-center py-3 px-4 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('newsletter.skip')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {content}
      </div>
    </div>
  );
} 