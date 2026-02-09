import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mecantosh',

  // JWT — secrets are required, server refuses to start without them
  jwt: {
    accessSecret: (() => {
      if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET env var is required');
      return process.env.JWT_ACCESS_SECRET;
    })(),
    refreshSecret: (() => {
      if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET env var is required');
      return process.env.JWT_REFRESH_SECRET;
    })(),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // OTP
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    length: parseInt(process.env.OTP_LENGTH || '4', 10),
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  },

  // Google Maps
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  // File Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-south-1',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Service Configuration
  service: {
    fee: parseFloat(process.env.SERVICE_FEE || '3.00'),
    taxRate: parseFloat(process.env.TAX_RATE || '0.00'),
    maxBookingsPerSlot: parseInt(process.env.MAX_BOOKINGS_PER_SLOT || '3', 10),
    businessStartHour: parseInt(process.env.BUSINESS_START_HOUR || '8', 10),
    businessEndHour: parseInt(process.env.BUSINESS_END_HOUR || '21', 10),
  },
};

export default config;
