import twilio from 'twilio';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

class SMSService {
  private client: twilio.Twilio | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber) {
      try {
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        this.isConfigured = true;
        logger.info('Twilio SMS service initialized');
      } catch (error) {
        logger.warn('Failed to initialize Twilio:', error);
        this.isConfigured = false;
      }
    } else {
      logger.warn('Twilio credentials not configured. SMS will be logged to console only.');
      this.isConfigured = false;
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string, countryCode: string, otp: string): Promise<boolean> {
    const fullPhone = `${countryCode}${phone}`;
    const message = `Your Mecantosh verification code is: ${otp}. Valid for ${config.otp.expiryMinutes} minutes.`;

    // In development or if Twilio not configured, just log
    if (config.nodeEnv === 'development' || !this.isConfigured) {
      logger.info(`[SMS] To: ${fullPhone} | Message: ${message}`);
      return true;
    }

    try {
      const result = await this.client!.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: fullPhone,
      });

      logger.info(`SMS sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send SMS:', error.message);
      // Don't throw - allow fallback to console logging
      logger.info(`[SMS FALLBACK] To: ${fullPhone} | Message: ${message}`);
      return true;
    }
  }

  /**
   * Send booking received SMS (pending confirmation)
   */
  async sendBookingReceived(
    phone: string,
    countryCode: string,
    bookingNumber: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<boolean> {
    const fullPhone = `${countryCode}${phone}`;
    const message = `Mecantosh Booking Received! Booking #${bookingNumber} for ${serviceName} on ${date} at ${time} is pending confirmation. We'll notify you once confirmed!`;

    if (config.nodeEnv === 'development' || !this.isConfigured) {
      logger.info(`[SMS] To: ${fullPhone} | Message: ${message}`);
      return true;
    }

    try {
      await this.client!.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: fullPhone,
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to send booking received SMS:', error.message);
      return false;
    }
  }

  /**
   * Send booking confirmation SMS (after admin confirms)
   */
  async sendBookingConfirmation(
    phone: string,
    countryCode: string,
    bookingNumber: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<boolean> {
    const fullPhone = `${countryCode}${phone}`;
    const message = `Mecantosh Booking Confirmed! Booking #${bookingNumber}. ${serviceName} on ${date} at ${time}. Thank you for choosing Mecantosh!`;

    if (config.nodeEnv === 'development' || !this.isConfigured) {
      logger.info(`[SMS] To: ${fullPhone} | Message: ${message}`);
      return true;
    }

    try {
      await this.client!.messages.create({
        body: message,
        from: config.twilio.phoneNumber,
        to: fullPhone,
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to send booking SMS:', error.message);
      return false;
    }
  }

  /**
   * Check if SMS service is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }
}

export const smsService = new SMSService();
export default smsService;
