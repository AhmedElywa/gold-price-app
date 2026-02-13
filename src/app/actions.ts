'use server';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import webpush from 'web-push';

const SUBSCRIPTIONS_FILE =
  process.env.PUSH_SUBSCRIPTIONS_FILE || path.join(process.cwd(), 'data', 'push-subscriptions.json');

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured');
  }

  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || 'mailto:ahmed.elywa@icloud.com',
    publicKey,
    privateKey,
  );
}

// Define a serializable subscription type
export type SerializablePushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

let subscriptionsCache: SerializablePushSubscription[] | null = null;

function isSerializablePushSubscription(value: unknown): value is SerializablePushSubscription {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as SerializablePushSubscription;
  return (
    typeof candidate.endpoint === 'string' &&
    typeof candidate.keys?.p256dh === 'string' &&
    typeof candidate.keys?.auth === 'string'
  );
}

async function readSubscriptionsFromDisk() {
  try {
    const data = await readFile(SUBSCRIPTIONS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [] as SerializablePushSubscription[];
    }

    return parsed.filter(isSerializablePushSubscription);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [] as SerializablePushSubscription[];
    }

    console.error('Failed to read subscriptions from disk:', error);
    return [] as SerializablePushSubscription[];
  }
}

async function getSubscriptions() {
  if (subscriptionsCache) {
    return subscriptionsCache;
  }

  subscriptionsCache = await readSubscriptionsFromDisk();
  return subscriptionsCache;
}

async function saveSubscriptions(subscriptions: SerializablePushSubscription[]) {
  subscriptionsCache = subscriptions;
  await mkdir(path.dirname(SUBSCRIPTIONS_FILE), { recursive: true });
  await writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), 'utf8');
}

function isValidPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') return false;
    const allowedHosts = [
      'fcm.googleapis.com',
      'updates.push.services.mozilla.com',
      'web.push.apple.com',
    ];
    return allowedHosts.some(
      (host) =>
        url.hostname === host ||
        url.hostname.endsWith(`.${host}`) ||
        url.hostname.endsWith('.windows.com') ||
        url.hostname.endsWith('.microsoft.com') ||
        url.hostname.endsWith('.notify.windows.com'),
    );
  } catch {
    return false;
  }
}

const MAX_SUBSCRIPTIONS = 10000;

export async function subscribeUser(subscription: SerializablePushSubscription) {
  if (!isValidPushEndpoint(subscription.endpoint)) {
    return { success: false, error: 'Invalid push endpoint' };
  }

  configureWebPush();
  const subscriptions = await getSubscriptions();

  if (subscriptions.length >= MAX_SUBSCRIPTIONS) {
    return { success: false, error: 'Subscription limit reached' };
  }

  const exists = subscriptions.some((sub) => sub.endpoint === subscription.endpoint);

  if (!exists) {
    const nextSubscriptions = [...subscriptions, subscription];
    await saveSubscriptions(nextSubscriptions);
    console.log('Subscription stored:', subscription.endpoint);
  } else {
    console.log('Subscription already stored:', subscription.endpoint);
  }

  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  configureWebPush();
  const subscriptions = await getSubscriptions();
  const nextSubscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);

  if (nextSubscriptions.length !== subscriptions.length) {
    await saveSubscriptions(nextSubscriptions);
  }

  console.log('Subscription removed:', endpoint);
  return { success: true };
}

export async function sendNotification(message: string, secret?: string) {
  // When called without a secret (e.g. from client components), only allow in development
  if (secret === undefined && process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Unauthorized' };
  }
  // When called with a secret (e.g. from server routes), verify it
  if (secret !== undefined && secret !== process.env.CRON_SECRET) {
    return { success: false, error: 'Unauthorized' };
  }

  configureWebPush();
  const subscriptions = await getSubscriptions();

  if (subscriptions.length === 0) {
    return { success: false, error: 'No subscriptions available' };
  }

  let successCount = 0;
  let failureCount = 0;
  let nextSubscriptions = subscriptions;
  let subscriptionsChanged = false;

  // Send notification to all subscribers
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription as webpush.PushSubscription,
        JSON.stringify({
          title: 'Gold Price Update',
          body: message,
          icon: '/icons/icon-192x192.png',
        }),
      );
      successCount++;
    } catch (error) {
      console.error('Error sending push notification:', error);
      failureCount++;

      // Remove expired or invalid subscriptions.
      if (
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        (error.statusCode === 410 || error.statusCode === 404)
      ) {
        nextSubscriptions = nextSubscriptions.filter((sub) => sub.endpoint !== subscription.endpoint);
        subscriptionsChanged = true;
        console.log('Invalid subscription removed:', subscription.endpoint);
      }
    }
  }

  if (subscriptionsChanged) {
    await saveSubscriptions(nextSubscriptions);
  }

  return {
    success: successCount > 0,
    message: `Notifications sent to ${successCount} subscribers (${failureCount} failed)`,
  };
}
