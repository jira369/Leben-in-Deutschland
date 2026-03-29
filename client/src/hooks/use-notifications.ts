import { useState, useEffect, useCallback } from 'react';
import { isNativePlatform } from '@/lib/platform';
import {
  requestNotificationPermission,
  getFcmToken,
  registerTokenWithServer,
  unregisterTokenFromServer,
} from '@/lib/notifications';

const FCM_TOKEN_KEY = 'fcm_token';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(FCM_TOKEN_KEY));
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!isNativePlatform() && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enable = useCallback(async (reminderHour: number, reminderMinute: number) => {
    setIsRegistering(true);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const fcmToken = await getFcmToken();
      if (!fcmToken) return false;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const platform = isNativePlatform() ? 'android' : 'web';
      await registerTokenWithServer(fcmToken, platform, reminderHour, reminderMinute, timezone);

      localStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      setToken(fcmToken);
      return true;
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (token) {
      await unregisterTokenFromServer(token).catch(() => {});
      localStorage.removeItem(FCM_TOKEN_KEY);
      setToken(null);
    }
  }, [token]);

  return { permission, token, isRegistering, enable, disable };
}
