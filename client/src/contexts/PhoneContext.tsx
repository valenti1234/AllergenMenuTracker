import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [showDialog, setShowDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  // Check for stored phone number on mount
  useEffect(() => {
    const stored = localStorage.getItem('customerPhone');
    if (stored) {
      setPhoneNumber(stored);
      setIsAuthenticated(true);
      // If we're on the signin page, redirect to menu
      if (window.location.pathname === '/signin' || window.location.pathname === '/') {
        setLocation('/menu');
      }
    } else {
      setShowDialog(true);
    }
  }, [setLocation]);

  // Store phone number when it changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length === 10) {
      localStorage.setItem('customerPhone', phoneNumber);
      setIsAuthenticated(true);
      setShowDialog(false);
    }
  }, [phoneNumber]);

  const signOut = () => {
    localStorage.removeItem('customerPhone');
    setPhoneNumber('');
    setIsAuthenticated(false);
    setLocation('/signin');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setShowDialog(false);
      // Check if there's a stored redirect path
      const redirectPath = localStorage.getItem('redirectAfterPhone');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterPhone');
        setLocation(redirectPath);
      }
    }
  };

  return (
    <PhoneContext.Provider value={{ 
      phoneNumber, 
      setPhoneNumber, 
      signOut,
      isAuthenticated 
    }}>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Phone Number</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(XXX) XXX-XXXX"
                value={phoneNumber}
                onChange={(e) => {
                  // Only allow numbers
                  const cleaned = e.target.value.replace(/\D/g, '');
                  if (cleaned.length <= 10) {
                    setPhoneNumber(cleaned);
                  }
                }}
                required
                pattern="[0-9]{10}"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={phoneNumber.length !== 10}
            >
              Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {children}
    </PhoneContext.Provider>
  );
} 