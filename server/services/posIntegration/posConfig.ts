/**
 * Configurazione del Point of Sale (POS)
 * Questo file gestisce le impostazioni del POS basate sulle variabili di ambiente
 */

export interface POSConfig {
  enabled: boolean;
  type: 'stripe' | 'square' | 'clover' | 'none';
  stripeConfig?: {
    secretKey: string;
    publishableKey: string;
    terminalLocation?: string;
    readerId?: string;
  };
}

// Carica la configurazione dalle variabili di ambiente
export const posConfig: POSConfig = {
  enabled: process.env.POS_ENABLED === 'true',
  type: (process.env.POS_TYPE || 'none') as POSConfig['type'],
  stripeConfig: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    terminalLocation: process.env.POS_TERMINAL_LOCATION,
    readerId: process.env.POS_READER_ID,
  },
};

/**
 * Verifica se il POS è abilitato e configurato correttamente
 */
export function isPOSEnabled(): boolean {
  if (!posConfig.enabled) return false;
  
  // Verifica la configurazione in base al tipo di POS
  switch (posConfig.type) {
    case 'stripe':
      return Boolean(posConfig.stripeConfig?.secretKey && posConfig.stripeConfig?.publishableKey);
    case 'square':
    case 'clover':
      // Implementare la verifica per altri tipi di POS quando necessario
      return false;
    default:
      return false;
  }
}

/**
 * Ottiene la configurazione del POS
 */
export function getPOSConfig(): POSConfig {
  return posConfig;
}

/**
 * Ottiene la configurazione di Stripe
 */
export function getStripeConfig() {
  return posConfig.stripeConfig;
} 