'use server'

import webpush from 'web-push';

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  'mailto:ahmed.elywa@icloud.com', // Replace with your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Define a serializable subscription type
export type SerializablePushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

// In a production app, this would be stored in a database
let subscriptions: SerializablePushSubscription[] = [];

export async function subscribeUser(subscription: SerializablePushSubscription) {
  // In a production app, save to database
  const exists = subscriptions.some((sub) => sub.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
    console.log('Subscription stored:', subscription.endpoint);
  } else {
    console.log('Subscription already stored:', subscription.endpoint);
  }
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  // In a production app, remove from database
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  console.log('Subscription removed:', endpoint);
  return { success: true };
}

export async function sendNotification(message: string) {
  if (subscriptions.length === 0) {
    return { success: false, error: 'No subscriptions available' };
  }

  let successCount = 0;
  let failureCount = 0;

  // Send notification to all subscribers
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription as webpush.PushSubscription, // Properly type cast instead of using 'any'
        JSON.stringify({
          title: 'Gold Price Update',
          body: message,
          icon: '/icons/icon-192x192.png',
        })
      );
      successCount++;
    } catch (error) {
      console.error('Error sending push notification:', error);
      failureCount++;
      
      // Check if the error is a WebPushError with status 410 (Gone) or 404 (Not Found)
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        (error.statusCode === 410 || error.statusCode === 404)
      ) {
        // Subscription is no longer valid, remove it
        subscriptions = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
        console.log('Invalid subscription removed:', subscription.endpoint);
      }
    }
  }

  return { 
    success: successCount > 0, 
    message: `Notifications sent to ${successCount} subscribers (${failureCount} failed)` 
  };
} 