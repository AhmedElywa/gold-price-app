'use client';

import { useEffect, useState } from 'react';
import { subscribeUser, unsubscribeUser, type SerializablePushSubscription } from '../actions';

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

  useEffect(() => {
    setIsMounted(true);
    setIsDev(process.env.NODE_ENV === 'development');
    
    // Safe to access browser APIs in useEffect
    if ('serviceWorker' in navigator) {
      registerSW();
    }
  }, []);

  async function registerSW() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
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
  }
  
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
      <div className="fixed top-4 left-4 z-50 bg-white bg-opacity-90 p-2 rounded shadow-md text-xs">
        <button 
          onClick={unregisterSW}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
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
      auth: json.keys?.auth ?? ''
    }
  };
}

// Component to handle push notification subscriptions
export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [toast, setToast] = useState('');

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
  }, []);

  async function checkExistingSubscription() {
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
  }

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
        setToast('VAPID key missing');
        setTimeout(() => setToast(''), 3000);
        return;
      }
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      setSubscription(newSubscription);
      
      // Send serialized subscription to server
      await subscribeUser(serializeSubscription(newSubscription));

      setToast('Price alerts enabled');
      setTimeout(() => setToast(''), 3000);
      
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  }

  async function handleUnsubscribe() {
    try {
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeUser(endpoint);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  if (!supported) {
    return null;
  }

  if (permission === 'granted' && subscription) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleUnsubscribe}
          className="bg-red-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-600"
        >
          Disable Price Alerts
        </button>
        {toast && (
          <div className="mt-2 bg-black text-white px-2 py-1 rounded">{toast}</div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleRequestPermission}
        disabled={permission === 'denied'}
        title={permission === 'denied' ? 'Notifications blocked – enable in browser settings.' : undefined}
        className={`bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-600 ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Enable Price Alerts
      </button>
      {toast && (
        <div className="mt-2 bg-black text-white px-2 py-1 rounded">{toast}</div>
      )}
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
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
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
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md border-t border-gray-200 z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">Install Gold Price App</h3>
          <p className="text-sm text-gray-600">
            Install this app on your home screen for a better experience.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Tap the share icon and then &quot;Add to Home Screen&quot;
          </p>
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// Utility function to convert base64 to Uint8Array (for VAPID key)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 