import cron from 'node-cron';
import { getMessaging } from './firebase-admin';
import { storage } from './storage';

export function startNotificationCron(): void {
  const messaging = getMessaging();
  if (!messaging) {
    console.log('[FCM Cron] Firebase not configured, skipping notification cron');
    return;
  }

  // Check every minute if any user's reminder time has arrived
  cron.schedule('* * * * *', async () => {
    try {
      const tokens = await storage.getAllFcmTokens();
      const now = new Date();

      for (const record of tokens) {
        if (!record.userTimezone) continue;

        // Get user's local time
        const userNow = new Date(now.toLocaleString('en-US', { timeZone: record.userTimezone }));
        if (userNow.getHours() !== record.reminderHour || userNow.getMinutes() !== record.reminderMinute) continue;

        // Check if already practiced today in user's timezone
        if (record.lastPracticedAt) {
          const todayStart = new Date(userNow);
          todayStart.setHours(0, 0, 0, 0);
          const lastPracticed = new Date(
            record.lastPracticedAt.toLocaleString('en-US', { timeZone: record.userTimezone })
          );
          if (lastPracticed >= todayStart) continue;
        }

        try {
          await messaging.send({
            token: record.token,
            notification: {
              title: 'Zeit zum Lernen! 🇩🇪',
              body: 'Vergiss nicht, heute deine Einbürgerungstest-Übungen zu machen.',
            },
            android: {
              notification: {
                channelId: 'daily_reminder',
                icon: 'ic_launcher',
                color: '#2563eb',
              },
            },
            webpush: {
              notification: {
                icon: '/icons/icon-192x192.png',
              },
              fcmOptions: { link: '/' },
            },
          });
        } catch (err: any) {
          if (
            err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered'
          ) {
            await storage.unregisterFcmToken(record.token);
          } else {
            console.error('[FCM Cron] Send error:', err.message);
          }
        }
      }
    } catch (err) {
      console.error('[FCM Cron] Error:', err);
    }
  });

  console.log('[FCM Cron] Notification cron started');
}
