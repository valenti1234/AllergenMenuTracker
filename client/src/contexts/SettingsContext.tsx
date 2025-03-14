import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

// Define the shape of our settings
interface RestaurantSettings {
  name: {
    en: string;
    it: string;
    es: string;
    [key: string]: string;
  };
  address?: {
    en: string;
    it: string;
    es: string;
    [key: string]: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  currency?: string;
  defaultLanguage?: string;
  // Add other settings as needed
}

interface SettingsContextType {
  settings: RestaurantSettings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  getLocalizedName: () => string;
  getCurrency: () => string;
  formatPrice: (price: number) => string;
}

const defaultSettings: RestaurantSettings = {
  name: {
    en: 'Restaurant',
    it: 'Ristorante',
    es: 'Restaurante'
  },
  currency: 'USD'
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: async () => {},
  getLocalizedName: () => 'Restaurant',
  getCurrency: () => 'USD',
  formatPrice: (price) => `$${price.toFixed(2)}`
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the public endpoint instead of the admin endpoint
      const response = await fetch('/api/settings');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        // If we can't get settings, use defaults
        setSettings(defaultSettings);
        if (response.status !== 401) { // Don't show error for unauthorized
          setError(`Failed to load settings: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setSettings(defaultSettings);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Get the restaurant name in the current language
  const getLocalizedName = (): string => {
    if (!settings) return defaultSettings.name.en;
    
    // Try to get the name in the current language, fallback to English, then to default
    return settings.name?.[language] || 
           settings.name?.en || 
           defaultSettings.name.en;
  };

  // Get the currency from settings
  const getCurrency = (): string => {
    return settings?.currency || defaultSettings.currency || 'USD';
  };

  // Format price based on the currency in settings
  const formatPrice = (price: number): string => {
    const currency = getCurrency();
    
    // Convert price from cents to dollars/euros/etc.
    const convertedPrice = price / 100;
    
    // Format based on currency
    switch (currency) {
      case 'EUR':
        return `€${convertedPrice.toFixed(2)}`;
      case 'GBP':
        return `£${convertedPrice.toFixed(2)}`;
      case 'JPY':
        return `¥${Math.round(convertedPrice)}`;
      case 'INR':
        return `₹${convertedPrice.toFixed(2)}`;
      case 'USD':
      default:
        return `$${convertedPrice.toFixed(2)}`;
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Set up a refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchSettings, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const value = {
    settings,
    loading,
    error,
    refreshSettings: fetchSettings,
    getLocalizedName,
    getCurrency,
    formatPrice
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 