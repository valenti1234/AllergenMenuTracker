import Stripe from 'stripe';
import { Order } from '@shared/schema';
import { getStripeConfig } from './posConfig';

export class StripeTerminalAdapter {
  private stripe: Stripe;
  private terminalLocation?: string;
  private readerId?: string;
  
  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16', // Usa la versione più recente
    });
    
    // Ottieni la configurazione di Stripe dalle variabili di ambiente
    const config = getStripeConfig();
    this.terminalLocation = config?.terminalLocation;
    this.readerId = config?.readerId;
  }
  
  async createPaymentIntent(order: Order) {
    try {
      // Converti l'importo in centesimi (Stripe usa centesimi)
      const amountInCents = Math.round(order.total * 100);
      
      // Crea un Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur', // Usa la valuta appropriata
        payment_method_types: ['card_present'],
        capture_method: 'automatic',
        description: `Order #${order.id}`,
        metadata: {
          orderId: order.id,
          customerName: order.customerName || 'Guest',
          tableNumber: order.tableNumber || 'N/A',
        },
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe Terminal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Converti da centesimi
        paymentMethod: paymentIntent.payment_method,
      };
    } catch (error) {
      console.error('Stripe Terminal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async cancelPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Stripe Terminal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async createConnectionToken() {
    try {
      const connectionToken = await this.stripe.terminal.connectionTokens.create();
      
      return {
        success: true,
        secret: connectionToken.secret,
      };
    } catch (error) {
      console.error('Stripe Terminal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  // Metodo per testare la connessione
  async testConnection() {
    try {
      // Prova a ottenere la lista dei lettori per verificare che le credenziali funzionino
      await this.stripe.terminal.readers.list({
        limit: 1,
      });
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Stripe Terminal connection test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
} 