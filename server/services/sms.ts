import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  try {
    const response = await client.messages.create({
      body: message,
      to: to, // Phone number to send to
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
    });

    return response;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}

export async function sendOrderUpdate(
  phoneNumber: string,
  orderId: string,
  status: string,
  estimatedTime?: number
) {
  let message = `Order #${orderId} status: ${status}.`;
  if (estimatedTime) {
    message += ` Estimated time: ${estimatedTime} minutes.`;
  }

  return sendSMS(phoneNumber, message);
}

export async function sendPromotionalSMS(phoneNumber: string, message: string) {
  // Add unsubscribe information
  const fullMessage = `${message}\n\nReply STOP to unsubscribe.`;
  return sendSMS(phoneNumber, fullMessage);
} 