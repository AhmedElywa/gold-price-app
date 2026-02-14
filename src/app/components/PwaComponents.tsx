'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from '../../hooks/use-toast';
import { useTranslation } from '../../hooks/useTranslation';
import { type SerializablePushSubscription, subscribeUser } from '../actions';

// Add Window interface extension for workbox
declare global {
  interface Window {
    workbox?: unknown;
  }
}

// Component to register service worker
export function ServiceWorkerRegistration() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const registerSW = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/api/sw');
      console.log('Service Worker registered with scope:', registration.scope);
      setIsRegistered(true);

      // Listen for updates and prompt the waiting SW to activate immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && registration.waiting) {
              console.log('New service worker installed. Activating...');
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    setIsDev(process.env.NEXT_PUBLIC_TEST_NOTIFICATIONS === 'true');

    // Safe to access browser APIs in useEffect
    if ('serviceWorker' in navigator) {
      registerSW();
    }
  }, [registerSW]);

  async function unregisterSW() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      window.location.reload();
      console.log('Service Workers unregistered');
    }
  }

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  // Only show the unregister button in development
  if (isDev && isRegistered) {
    return (
      <div className="fixed top-4 start-4 z-50 bg-white bg-opacity-90 p-2 rounded shadow-md text-xs">
        <button onClick={unregisterSW} className="bg-red-500 text-white px-2 py-1 rounded text-xs">
          Unregister SW
        </button>
      </div>
    );
  }

  return null;
}

// Function to convert PushSubscription to a serializable object
function serializeSubscription(subscription: PushSubscription): SerializablePushSubscription {
  const json = subscription.toJSON();

  if (!json.endpoint) {
    throw new Error('PushSubscription endpoint is undefined');
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  };
}

// Component to handle push notification subscriptions
export function PushNotificationManager() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        // Ensure the server knows about this subscription (handles hot reloads / cold starts)
        try {
          await subscribeUser(serializeSubscription(existingSubscription));
        } catch (err) {
          console.error('Failed to sync existing subscription with server:', err);
        }
      }
    } catch (error) {
      console.error('Error checking for existing subscription:', error);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);

    // Safe to check browser features here
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }

    // Get current permission status
    setPermission(Notification.permission);

    // Check for existing subscription
    if (Notification.permission === 'granted') {
      checkExistingSubscription();
    }
  }, [checkExistingSubscription]);

  async function handleRequestPermission() {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Get the VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        toast({ description: 'VAPID key missing' });
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource,
      });

      setSubscription(newSubscription);

      // Send serialized subscription to server
      await subscribeUser(serializeSubscription(newSubscription));

      toast({ description: 'Price alerts enabled' });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  }

  // Don't render during SSR
  if (!isMounted || !supported) {
    return null;
  }

  if (permission === 'granted' && subscription) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-4 end-3 lg:end-4 z-40">
      <button
        onClick={handleRequestPermission}
        disabled={permission === 'denied'}
        title={permission === 'denied' ? t('notifications.blocked') : t('notifications.enable')}
        className={`bg-[#D4AF37] text-[#0A0A0F] font-semibold rounded-full shadow-lg shadow-[#D4AF37]/20 hover:bg-[#C9A96E] transition-colors w-11 h-11 flex items-center justify-center lg:w-auto lg:h-auto lg:px-4 lg:py-2.5 lg:rounded-xl lg:text-sm ${
          permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        <span className="hidden lg:inline">{t('notifications.enable')}</span>
      </button>
    </div>
  );
}

// Component for install prompt (especially helpful for iOS)
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Only run these checks on the client
    if (typeof window !== 'undefined') {
      // Check if this is iOS
      const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

      // Check if app is already installed (in standalone mode)
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((window.navigator as { standalone?: boolean }).standalone);

      // Show prompt only for iOS devices that haven't installed the app
      setShowPrompt(ios && !standalone);
    }
  }, []);

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-16 lg:bottom-0 start-0 end-0 z-50 mx-3 mb-2 rounded-xl bg-[#14141F]/90 backdrop-blur-xl border border-[rgba(212,175,55,0.15)] p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold font-serif text-[#E8E6E3]">Install Gold Price App</h3>
          <p className="text-sm text-[#8A8A8E] mt-0.5">Install this app on your home screen for a better experience.</p>
          <p className="text-xs text-[#8A8A8E]/70 mt-1">Tap the share icon and then &quot;Add to Home Screen&quot;</p>
        </div>
        <button onClick={() => setShowPrompt(false)} className="shrink-0 text-xs text-[#8A8A8E] hover:text-[#D4AF37] transition-colors px-3 py-1.5 rounded-lg border border-[rgba(212,175,55,0.15)] hover:border-[rgba(212,175,55,0.3)]">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// Utility function to convert base64 to Uint8Array (for VAPID key)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
