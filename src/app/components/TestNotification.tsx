'use client';

import { useEffect, useState } from 'react';
import { sendNotification } from '../actions';

export function TestNotification() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    swRegistered: boolean;
    pushSubscribed: boolean;
    notificationPermission: string;
    subscriptionEndpoint?: string;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    checkDebugInfo();
  }, [checkDebugInfo]);

  async function checkDebugInfo() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration ? await registration.pushManager.getSubscription() : null;

      setDebugInfo({
        swRegistered: !!registration,
        pushSubscribed: !!subscription,
        notificationPermission: Notification.permission,
        subscriptionEndpoint: subscription?.endpoint || undefined,
      });
    } catch (error) {
      console.error('Error checking debug info:', error);
    }
  }

  async function handleSendNotification() {
    if (!message.trim()) {
      setStatus({ success: false, message: 'Please enter a message' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const result = await sendNotification(message);
      // Normalize the result to always have a message property
      const normalizedResult = {
        success: result.success,
        message: 'message' in result ? result.message : 'error' in result ? result.error : 'Unknown result',
      };
      setStatus(normalizedResult);
      if (result.success) {
        setMessage(''); // Clear message on success
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  }

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed top-4 min-w-80 end-4 z-50 bg-white bg-opacity-90 shadow-lg rounded-lg p-4 border border-gray-200 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800">Test Push Notification</h3>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          Debug
        </button>
      </div>

      {showDebug && debugInfo && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs space-y-1">
          <div className="flex justify-between">
            <span>SW Registered:</span>
            <span className={debugInfo.swRegistered ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.swRegistered ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Push Subscribed:</span>
            <span className={debugInfo.pushSubscribed ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.pushSubscribed ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Permission:</span>
            <span
              className={
                debugInfo.notificationPermission === 'granted'
                  ? 'text-green-600'
                  : debugInfo.notificationPermission === 'denied'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }
            >
              {debugInfo.notificationPermission}
            </span>
          </div>
          {debugInfo.subscriptionEndpoint && (
            <div className="break-all">
              <span className="block text-gray-600">Endpoint:</span>
              <span className="text-blue-600">{debugInfo.subscriptionEndpoint.substring(0, 50)}...</span>
            </div>
          )}
          <button
            onClick={checkDebugInfo}
            className="w-full mt-1 text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
          >
            Refresh Debug Info
          </button>
        </div>
      )}

      <div className="mb-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message"
          className="w-full text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !loading) {
              handleSendNotification();
            }
          }}
        />
      </div>
      <button
        onClick={handleSendNotification}
        disabled={loading}
        className={`w-full py-2 rounded-md ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
        } text-white font-medium`}
      >
        {loading ? 'Sending...' : 'Send Notification'}
      </button>

      {status && (
        <div
          className={`mt-3 p-2 rounded-md text-sm ${
            status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
