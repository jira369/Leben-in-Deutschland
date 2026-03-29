import admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App | null {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;
  if (app) return app;
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const credential = admin.credential.cert(serviceAccount);
    app = admin.initializeApp({ credential });
    return app;
  } catch (err) {
    console.error('[FCM] Failed to initialize Firebase Admin:', err);
    return null;
  }
}

export function getMessaging(): admin.messaging.Messaging | null {
  const firebaseApp = getFirebaseAdmin();
  return firebaseApp ? firebaseApp.messaging() : null;
}
