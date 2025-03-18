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
  const currentPath = window.location.pathname;

  // Check for stored customer info on mount
  useEffect(() => {
    console.log("PhoneContext effect running, current path:", currentPath);
    const stored = localStorage.getItem('customerInfo');
    
    if (stored) {
      try {
        const customerInfo: CustomerInfo = JSON.parse(stored);
        // Check if the info is expired (24 hours)
        const now = Date.now();
        if (now - customerInfo.timestamp > 24 * 60 * 60 * 1000) {
          console.log("Customer info expired, removing");
          localStorage.removeItem('customerInfo');
          // Non reindirizzare, lasceremo che l'utente veda la form di signin normalmente
          return;
        }
        
        console.log("Found valid customer info:", customerInfo.phoneNumber);
        setPhoneNumber(customerInfo.phoneNumber);
        setIsAuthenticated(true);
        
        // Se siamo nella home o signin E abbiamo informazioni valide, reindirizzare al menu
        if (currentPath === '/signin' || currentPath === '/') {
          console.log("Redirecting to menu because we're on signin/home with valid info");
          setLocation('/menu');
        }
      } catch (error) {
        console.error('Error parsing customer info:', error);
        localStorage.removeItem('customerInfo');
        // Non reindirizzare, lasceremo che l'utente veda la form di signin normalmente
      }
    } else {
      console.log("No customer info found, staying on current page");
      // Non reindirizzare, l'utente vedrà la form di signin nella home
    }
  }, [setLocation, currentPath]);

  const signOut = () => {
    console.log("Signing out, removing customer info");
    localStorage.removeItem('customerInfo');
    setPhoneNumber('');
    setIsAuthenticated(false);
    // Reindirizza a signin solo se non siamo già lì
    if (currentPath !== '/signin' && currentPath !== '/') {
      setLocation('/signin');
    }
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