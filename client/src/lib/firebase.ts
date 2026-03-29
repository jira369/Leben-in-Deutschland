import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { isNativePlatform } from './platform';

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

function getFirebaseMessaging() {
  if (isNativePlatform()) return null;
  if (messagingInstance) return messagingInstance;

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (!config.apiKey) return null;

  const app = initializeApp(config);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function requestWebPushToken(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    return token;
  } catch (err) {
    console.warn('Failed to get FCM web token', err);
    return null;
  }
}
