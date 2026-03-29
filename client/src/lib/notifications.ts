import { isNativePlatform } from './platform';
import { requestWebPushToken } from './firebase';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (isNativePlatform()) {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    const { receive } = await FirebaseMessaging.requestPermissions();
    return receive === 'granted' ? 'granted' : 'denied';
  }
  return Notification.requestPermission();
}

export async function getFcmToken(): Promise<string | null> {
  if (isNativePlatform()) {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    try {
      const { token } = await FirebaseMessaging.getToken();
      return token;
    } catch {
      return null;
    }
  }
  return requestWebPushToken();
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export async function registerTokenWithServer(
  token: string,
  platform: 'android' | 'web',
  reminderHour: number,
  reminderMinute: number,
  userTimezone: string
): Promise<void> {
  await fetch(`${SERVER_URL}/api/fcm/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform, reminderHour, reminderMinute, userTimezone }),
  });
}

export async function unregisterTokenFromServer(token: string): Promise<void> {
  await fetch(`${SERVER_URL}/api/fcm/unregister`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

export async function reportPracticed(token: string): Promise<void> {
  await fetch(`${SERVER_URL}/api/fcm/practiced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}
