import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface CustomerInfo {
  phoneNumber: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: string;
  customerName?: string;
  timestamp: number;
}

interface PhoneContextType {
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const PhoneContext = createContext<PhoneContextType | null>(null);

export function usePhone() {
  const context = useContext(PhoneContext);
  if (!context) {
    throw new Error('usePhone must be used within a PhoneProvider');
  }
  return context;
}

export function PhoneProvider({ children }: { children: React.ReactNode }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  // Check for stored customer info on mount
  useEffect(() => {
    const stored = localStorage.getItem('customerInfo');
    if (stored) {
      try {
        const customerInfo: CustomerInfo = JSON.parse(stored);
        // Check if the info is expired (24 hours)
        const now = Date.now();
        if (now - customerInfo.timestamp > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('customerInfo');
          setLocation('/');
          return;
        }
        setPhoneNumber(customerInfo.phoneNumber);
        setIsAuthenticated(true);
        // If we're on the signin page, redirect to menu
        if (window.location.pathname === '/signin' || window.location.pathname === '/') {
          setLocation('/menu');
        }
      } catch (error) {
        console.error('Error parsing customer info:', error);
        localStorage.removeItem('customerInfo');
        setLocation('/');
      }
    } else {
      setLocation('/');
    }
  }, [setLocation]);

  const signOut = () => {
    localStorage.removeItem('customerInfo');
    setPhoneNumber('');
    setIsAuthenticated(false);
    setLocation('/signin');
  };

  return (
    <PhoneContext.Provider value={{ 
      phoneNumber, 
      setPhoneNumber, 
      signOut,
      isAuthenticated 
    }}>
      {children}
    </PhoneContext.Provider>
  );
} 