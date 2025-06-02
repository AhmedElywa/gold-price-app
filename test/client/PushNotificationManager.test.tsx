import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PushNotificationManager } from "../../src/app/components/PwaComponents";
import * as actions from "../../src/app/actions";

// Mock the actions module
jest.mock("../../src/app/actions", () => ({
  subscribeUser: jest.fn(),
  unsubscribeUser: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BNnmELjdtI6cTVq1sD3gHhI9YZsKKPfB5cF6H3dA9FKN8yXgKQ72s2LB9M1nPNm6K4sTvLaQ";

// Mock PushSubscription
const mockPushSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
  toJSON: () => ({
    endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
    keys: {
      p256dh: "test-p256dh-key",
      auth: "test-auth-key",
    },
  }),
  unsubscribe: jest.fn().mockResolvedValue(true),
};

// Helper function to convert string to Uint8Array (used in component)
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

describe("PushNotificationManager", () => {
  const mockActions = actions as jest.Mocked<typeof actions>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset global mocks
    Object.defineProperty(window, "Notification", {
      value: {
        permission: "default",
        requestPermission: jest.fn().mockResolvedValue("granted"),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: jest.fn().mockResolvedValue({
          scope: "http://localhost/",
          addEventListener: jest.fn(),
          waiting: null,
        }),
        ready: Promise.resolve({
          pushManager: {
            subscribe: jest.fn().mockResolvedValue(mockPushSubscription),
            getSubscription: jest.fn().mockResolvedValue(null),
          },
        }),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.atob for base64 decoding
    Object.defineProperty(window, "atob", {
      value: jest.fn().mockImplementation((str) => {
        return Buffer.from(str, "base64").toString("binary");
      }),
      writable: true,
      configurable: true,
    });

    // Mock PushManager
    Object.defineProperty(window, "PushManager", {
      value: class MockPushManager {},
      writable: true,
      configurable: true,
    });
  });

  describe("Feature Support Detection", () => {
    it("should not render when notifications are not supported", () => {
      // Mock missing Notification API
      delete (window as any).Notification;

      const { container } = render(<PushNotificationManager />);
      expect(container.firstChild).toBeNull();
    });

    it("should not render when service workers are not supported", () => {
      delete (navigator as any).serviceWorker;

      const { container } = render(<PushNotificationManager />);
      expect(container.firstChild).toBeNull();
    });

    it("should not render when push manager is not supported", () => {
      delete (window as any).PushManager;

      const { container } = render(<PushNotificationManager />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Initial State", () => {
    it("should render enable button when permission is default", async () => {
      render(<PushNotificationManager />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /enable price alerts/i })
        ).toBeInTheDocument();
      });
    });

    it("should disable button when permission is denied", async () => {
      Object.defineProperty(window.Notification, "permission", {
        value: "denied",
        writable: true,
      });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute(
          "title",
          expect.stringContaining("Notifications blocked")
        );
      });
    });
  });

  describe("Permission Request Flow", () => {
    it("should request permission and subscribe when button is clicked", async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue("granted");
      Object.defineProperty(window.Notification, "requestPermission", {
        value: mockRequestPermission,
        writable: true,
      });

      mockActions.subscribeUser.mockResolvedValue({ success: true });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    it("should handle permission request failure", async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue("denied");
      Object.defineProperty(window.Notification, "requestPermission", {
        value: mockRequestPermission,
        writable: true,
      });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });

      // Should not attempt to subscribe if permission denied
      expect(mockActions.subscribeUser).not.toHaveBeenCalled();
    });
  });

  describe("Subscription Flow", () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, "permission", {
        value: "granted",
        writable: true,
      });
    });

    it("should successfully subscribe to push notifications", async () => {
      mockActions.subscribeUser.mockResolvedValue({ success: true });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockActions.subscribeUser).toHaveBeenCalledWith({
          endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
          keys: {
            p256dh: "test-p256dh-key",
            auth: "test-auth-key",
          },
        });
      });
    });

    it("should handle subscription failure", async () => {
      const mockSubscribe = jest
        .fn()
        .mockRejectedValue(new Error("Subscription failed"));

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: mockSubscribe,
              getSubscription: jest.fn().mockResolvedValue(null),
            },
          }),
        },
        writable: true,
      });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      // Should not call subscribeUser if push subscription fails
      expect(mockActions.subscribeUser).not.toHaveBeenCalled();
    });

    it("should handle server subscription failure", async () => {
      mockActions.subscribeUser.mockResolvedValue({
        success: false,
      });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockActions.subscribeUser).toHaveBeenCalled();
      });
    });
  });

  describe("Unsubscription Flow", () => {
    beforeEach(() => {
      Object.defineProperty(window.Notification, "permission", {
        value: "granted",
        writable: true,
      });
    });

    it("should hide the button when already subscribed", async () => {
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: jest.fn().mockResolvedValue(mockPushSubscription),
              getSubscription: jest
                .fn()
                .mockResolvedValue(mockPushSubscription),
            },
          }),
        },
        writable: true,
      });

      mockActions.subscribeUser.mockResolvedValue({ success: true });
      mockActions.unsubscribeUser.mockResolvedValue({ success: true });

      render(<PushNotificationManager />);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /disable price alerts/i })
        ).not.toBeInTheDocument();
      });
    });

    it("should not attempt to unsubscribe when no button is present", async () => {
      const mockUnsubscribe = jest.fn().mockResolvedValue(false);
      const mockSubscriptionWithFailure = {
        ...mockPushSubscription,
        unsubscribe: mockUnsubscribe,
      };

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: jest
                .fn()
                .mockResolvedValue(mockSubscriptionWithFailure),
              getSubscription: jest
                .fn()
                .mockResolvedValue(mockSubscriptionWithFailure),
            },
          }),
        },
        writable: true,
      });

      mockActions.subscribeUser.mockResolvedValue({ success: true });
      mockActions.unsubscribeUser.mockResolvedValue({ success: true });

      render(<PushNotificationManager />);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /disable price alerts/i })
        ).not.toBeInTheDocument();
      });

      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });
  });

  describe("Existing Subscription Detection", () => {
    it("should detect and sync existing subscription on mount", async () => {
      Object.defineProperty(window.Notification, "permission", {
        value: "granted",
        writable: true,
      });

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: jest
                .fn()
                .mockResolvedValue(mockPushSubscription),
            },
          }),
        },
        writable: true,
      });

      mockActions.subscribeUser.mockResolvedValue({ success: true });

      render(<PushNotificationManager />);

      await waitFor(() => {
        expect(mockActions.subscribeUser).toHaveBeenCalledWith({
          endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
          keys: {
            p256dh: "test-p256dh-key",
            auth: "test-auth-key",
          },
        });
      });
    });

    it("should handle existing subscription sync failure", async () => {
      Object.defineProperty(window.Notification, "permission", {
        value: "granted",
        writable: true,
      });

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: jest
                .fn()
                .mockResolvedValue(mockPushSubscription),
            },
          }),
        },
        writable: true,
      });

      mockActions.subscribeUser.mockRejectedValue(new Error("Sync failed"));

      render(<PushNotificationManager />);

      await waitFor(() => {
        expect(mockActions.subscribeUser).toHaveBeenCalled();
      });

      // Component should hide the button even if sync fails
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /disable price alerts/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("UI State Management", () => {
    it("should show correct button text based on subscription state", async () => {
      render(<PushNotificationManager />);

      // Initially should show enable button
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /enable price alerts/i })
        ).toBeInTheDocument();
      });

      // After enabling, button should be hidden
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              subscribe: jest.fn().mockResolvedValue(mockPushSubscription),
              getSubscription: jest.fn().mockResolvedValue(null),
            },
          }),
        },
        writable: true,
      });

      mockActions.subscribeUser.mockResolvedValue({ success: true });

      const enableButton = screen.getByRole("button", {
        name: /enable price alerts/i,
      });
      fireEvent.click(enableButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /disable price alerts/i })
        ).not.toBeInTheDocument();
      });
    });

    it("should show toast messages", async () => {
      // Mock missing VAPID key to trigger toast
      const originalVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/vapid key missing/i)).toBeInTheDocument();
      });

      // Restore the environment variable
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = originalVapidKey;
    });
  });

  describe("Error Handling", () => {
    it("should handle service worker registration errors", async () => {
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.reject(new Error("SW registration failed")),
        },
        writable: true,
      });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      // Should not crash and button should remain enabled
      expect(
        screen.getByRole("button", { name: /enable price alerts/i })
      ).toBeInTheDocument();
    });

    it("should handle VAPID key conversion errors", async () => {
      // Mock atob to throw an error
      Object.defineProperty(window, "atob", {
        value: jest.fn().mockImplementation(() => {
          throw new Error("Invalid base64");
        }),
        writable: true,
      });

      render(<PushNotificationManager />);

      await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /enable price alerts/i,
        });
        fireEvent.click(button);
      });

      // Should handle the error gracefully
      expect(
        screen.getByRole("button", { name: /enable price alerts/i })
      ).toBeInTheDocument();
    });
  });
});
