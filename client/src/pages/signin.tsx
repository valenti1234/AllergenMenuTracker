import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import type { OrderType } from "@shared/schema";

export default function SignIn() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'phone' | 'type' | 'details'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.replace(/\D/g, "").length >= 10) {
      setStep('type');
    }
  };

  const handleTypeSelection = (type: OrderType) => {
    setOrderType(type);
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    if (cleanedNumber.length >= 10 && orderType) {
      if (
        (orderType === 'dine-in' && tableNumber) ||
        (orderType === 'takeaway' && customerName)
      ) {
        // Store all customer info
        localStorage.setItem('customerInfo', JSON.stringify({
          phoneNumber: cleanedNumber,
          orderType,
          tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
          customerName: orderType === 'takeaway' ? customerName : undefined,
          timestamp: Date.now()
        }));
        setLocation("/menu");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === 'phone' && t('auth.enterPhone')}
            {step === 'type' && t('auth.selectOrderType')}
            {step === 'details' && orderType === 'dine-in' && t('auth.enterTableNumber')}
            {step === 'details' && orderType === 'takeaway' && t('auth.enterName')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <Input
                  type="tel"
                  placeholder={t('auth.phoneNumberPlaceholder')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={phoneNumber.replace(/\D/g, "").length < 10}
              >
                {t('common.continue')}
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
                  {t('auth.dineIn')}
                </Button>
                <Button
                  onClick={() => handleTypeSelection('takeaway')}
                  variant="outline"
                  className="h-24"
                >
                  {t('auth.takeaway')}
                </Button>
              </div>
              <Button 
                onClick={() => setStep('phone')}
                variant="ghost"
                className="w-full"
              >
                {t('common.back')}
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
                      ? t('auth.tableNumberPlaceholder')
                      : t('auth.namePlaceholder')
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
                  {t('common.continue')}
                </Button>
                <Button 
                  onClick={() => setStep('type')}
                  variant="ghost"
                  className="w-full"
                >
                  {t('common.back')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 