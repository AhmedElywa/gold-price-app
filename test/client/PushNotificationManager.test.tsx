import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Toaster } from '../../src/components/ui/toaster';

type MutableWindowForFeatureChecks = Window & {
  Notification?: typeof Notification;
  PushManager?: typeof PushManager;
};

type MutableNavigatorForFeatureChecks = Navigator & {
  serviceWorker?: ServiceWorkerContainer;
};

// Mock the actions module
mock.module('../../src/app/actions', () => ({
  subscribeUser: mock(() => Promise.resolve({ success: true })),
  unsubscribeUser: mock(() => Promise.resolve({ success: true })),
  sendNotification: mock(() => Promise.resolve({ success: true, message: '' })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BNnmELjdtI6cTVq1sD3gHhI9YZsKKPfB5cF6H3dA9FKN8yXgKQ72s2LB9M1nPNm6K4sTvLaQ';

// Mock PushSubscription
const mockPushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  toJSON: () => ({
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  }),
  unsubscribe: mock(() => Promise.resolve(true)),
};

type PushNotificationManagerComponent =
  (typeof import('../../src/app/components/PwaComponents'))['PushNotificationManager'];

let PushNotificationManager: PushNotificationManagerComponent;
let mockSubscribeUser: ReturnType<typeof mock>;
let mockUnsubscribeUser: ReturnType<typeof mock>;

// Helper function to convert string to Uint8Array (used in component)
function _urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function renderManager() {
  const utils = render(<PushNotificationManager />);
  render(<Toaster />);
  return utils;
}

describe('PushNotificationManager', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    const actionsModule = await import('../../src/app/actions');
    const componentsModule = await import('../../src/app/components/PwaComponents');
    PushNotificationManager = componentsModule.PushNotificationManager;
    mockSubscribeUser = actionsModule.subscribeUser as ReturnType<typeof mock>;
    mockUnsubscribeUser = actionsModule.unsubscribeUser as ReturnType<typeof mock>;

    mockSubscribeUser.mockClear();
    mockUnsubscribeUser.mockClear();

    // Reset global mocks
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: mock(() => Promise.resolve('granted' as const)),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mock(() =>
          Promise.resolve({
            scope: 'http://localhost/',
            addEventListener: mock(() => {}),
            waiting: null,
          }),
        ),
        ready: Promise.resolve({
          pushManager: {
            subscribe: mock(() => Promise.resolve(mockPushSubscription)),
            getSubscription: mock(() => Promise.resolve(null)),
          },
        }),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.atob for base64 decoding
    Object.defineProperty(window, 'atob', {
      value: mock((str: string) => {
        return Buffer.from(str, 'base64').toString('binary');
      }),
      writable: true,
      configurable: true,
    });

    // Mock PushManager
    Object.defineProperty(window, 'PushManager', {
      value: class MockPushManager {},
      writable: true,
      configurable: true,
    });
  });

  describe('Feature Support Detection', () => {
    it('should not render when notifications are not supported', () => {
      // Mock missing Notification API
      const mutableWindow = window as MutableWindowForFeatureChecks;
      Reflect.deleteProperty(mutableWindow, 'Notification');

      const { container } = renderManager();
      expect(container.firstChild).toBeNull();
    });

    it('should not render when service workers are not supported', () => {
      const mutableNavigator = navigator as MutableNavigatorForFeatureChecks;
      Reflect.deleteProperty(mutableNavigator, 'serviceWorker');

      const { container } = renderManager();
      expect(container.firstChild).toBeNull();
    });

    it('should not render when push manager is not supported', () => {
      const mutableWindow = window as MutableWindowForFeatureChecks;
      Reflect.deleteProperty(mutableWindow, 'PushManager');

      const { container } = renderManager();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Initial State', () => {
    it('should render enable button when permission is default', async () => {
      renderManager();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable price alerts/i })).toBeInTheDocument();
      });
    });

    it('should disable button when permission is denied', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        writable: true,
      });

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('title', expect.stringContaining('Notifications blocked'));
      });
    });
  });

  describe('Permission Request Flow', () => {
    it('should request permission and subscribe when button is clicked', async () => {
      const mockRequestPermission = mock(() => Promise.resolve('granted' as const));
      Object.defineProperty(window.Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true,
      });

      mockSubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    it('should handle permission request failure', async () => {
      const mockRequestPermission = mock(() => Promise.resolve('denied' as const));
      Object.defineProperty(window.Notification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true,
      });

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });

      // Should not attempt to subscribe if permission denied
      expect(mockSubscribeUser).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Flow', () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });
    });

    it('should successfully subscribe to push notifications', async () => {
      mockSubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockSubscribeUser).toHaveBeenCalledWith({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        });
      });
    });

    it('should handle subscription failure', async () => {
      const mockSubscribe = mock(() => Promise.reject(new Error('Subscription failed')));

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: mockSubscribe,
              getSubscription: mock(() => Promise.resolve(null)),
            },
          }),
        },
        writable: true,
      });

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      // Should not call subscribeUser if push subscription fails
      expect(mockSubscribeUser).not.toHaveBeenCalled();
    });

    it('should handle server subscription failure', async () => {
      mockSubscribeUser.mockImplementation(() =>
        Promise.resolve({
          success: false,
        }),
      );

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockSubscribeUser).toHaveBeenCalled();
      });
    });
  });

  describe('Unsubscription Flow', () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });
    });

    it('should hide the button when already subscribed', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: mock(() => Promise.resolve(mockPushSubscription)),
              getSubscription: mock(() => Promise.resolve(mockPushSubscription)),
            },
          }),
        },
        writable: true,
      });

      mockSubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));
      mockUnsubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));

      renderManager();

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /disable price alerts/i })).not.toBeInTheDocument();
      });
    });

    it('should not attempt to unsubscribe when no button is present', async () => {
      const mockUnsubscribe = mock(() => Promise.resolve(false));
      const mockSubscriptionWithFailure = {
        ...mockPushSubscription,
        unsubscribe: mockUnsubscribe,
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: mock(() => Promise.resolve(mockSubscriptionWithFailure)),
              getSubscription: mock(() => Promise.resolve(mockSubscriptionWithFailure)),
            },
          }),
        },
        writable: true,
      });

      mockSubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));
      mockUnsubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));

      renderManager();

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /disable price alerts/i })).not.toBeInTheDocument();
      });

      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('Existing Subscription Detection', () => {
    it('should detect and sync existing subscription on mount', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: mock(() => Promise.resolve(mockPushSubscription)),
            },
          }),
        },
        writable: true,
      });

      mockSubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));

      renderManager();

      await waitFor(() => {
        expect(mockSubscribeUser).toHaveBeenCalledWith({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        });
      });
    });

    it('should handle existing subscription sync failure', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: true,
      });

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: mock(() => Promise.resolve(mockPushSubscription)),
            },
          }),
        },
        writable: true,
      });

      mockSubscribeUser.mockImplementation(() => Promise.reject(new Error('Sync failed')));

      renderManager();

      await waitFor(() => {
        expect(mockSubscribeUser).toHaveBeenCalled();
      });

      // Component should hide the button even if sync fails
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /disable price alerts/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('UI State Management', () => {
    it('should show correct button text based on subscription state', async () => {
      renderManager();

      // Initially should show enable button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable price alerts/i })).toBeInTheDocument();
      });

      // After enabling, button should be hidden
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: mock(() => Promise.resolve(mockPushSubscription)),
              getSubscription: mock(() => Promise.resolve(null)),
            },
          }),
        },
        writable: true,
      });

      mockSubscribeUser.mockImplementation(() => Promise.resolve({ success: true }));

      const enableButton = screen.getByRole('button', {
        name: /enable price alerts/i,
      });
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /disable price alerts/i })).not.toBeInTheDocument();
      });
    });

    it('should show toast messages', async () => {
      // Mock missing VAPID key to trigger toast
      const originalVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        const matches = screen.getAllByText(/vapid key missing/i);
        expect(matches.length).toBeGreaterThan(0);
      });

      // Restore the environment variable
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalVapidKey;
    });
  });

  describe('Error Handling', () => {
    it('should handle service worker registration errors', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.reject(new Error('SW registration failed')),
        },
        writable: true,
      });

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      // Should not crash and button should remain enabled
      expect(screen.getByRole('button', { name: /enable price alerts/i })).toBeInTheDocument();
    });

    it('should handle VAPID key conversion errors', async () => {
      // Mock atob to throw an error
      Object.defineProperty(window, 'atob', {
        value: mock(() => {
          throw new Error('Invalid base64');
        }),
        writable: true,
      });

      renderManager();

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      // Should handle the error gracefully
      expect(screen.getByRole('button', { name: /enable price alerts/i })).toBeInTheDocument();
    });
  });
});
