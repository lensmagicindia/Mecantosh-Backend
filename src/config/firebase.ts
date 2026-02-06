import admin from 'firebase-admin';
import { config } from './index.js';
import logger from '../utils/logger.js';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase credentials are configured
  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
    logger.warn('Firebase credentials not configured. Push notifications will be disabled.');
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    logger.info('Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase initialization failed:', error);
    return null;
  }
};

export const getFirebaseApp = (): admin.app.App | null => {
  return firebaseApp;
};

export const getMessaging = (): admin.messaging.Messaging | null => {
  if (!firebaseApp) {
    return null;
  }
  return admin.messaging(firebaseApp);
};

export const getAuth = (): admin.auth.Auth | null => {
  if (!firebaseApp) {
    return null;
  }
  return admin.auth(firebaseApp);
};

export default { initializeFirebase, getFirebaseApp, getMessaging, getAuth };
