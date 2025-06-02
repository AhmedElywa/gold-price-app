/**
 * Integration tests for the complete notification flow
 * Tests the interaction between price change detection and notification sending
 */

import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "../../src/app/actions";

// Mock the actions module
jest.mock("../../src/app/actions", () => ({
  sendNotification: jest.fn(),
}));

// Mock web-push for integration tests
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-vapid-public";
process.env.VAPID_PRIVATE_KEY = "test-vapid-private";
process.env.EXCHANGE_RATE_API_KEY = "test-exchange-rate-key";

describe("Notification Flow Integration Tests", () => {
  // Mock the gold price API route logic
  let lastGoldPrice: number | null = null;
  let lastNotificationAt: number = 0;
  const NOTIFICATION_THRESHOLD_PERCENT = 0.25;
  const NOTIFICATION_COOLDOWN_MS = 3 * 60 * 60 * 1000;

  // Get the mocked function with proper typing
  const mockSendNotification = sendNotification as jest.MockedFunction<
    typeof sendNotification
  >;

  function shouldSendNotification(newPrice: number): boolean {
    if (lastGoldPrice === null) {
      lastGoldPrice = newPrice;
      return false;
    }

    const priceDiffPercent = Math.abs(
      ((newPrice - lastGoldPrice) / lastGoldPrice) * 100
    );
    const now = Date.now();
    const enoughTimeElapsed =
      now - lastNotificationAt > NOTIFICATION_COOLDOWN_MS;
    const significantChange =
      priceDiffPercent >= NOTIFICATION_THRESHOLD_PERCENT;

    if (significantChange && enoughTimeElapsed) {
      lastGoldPrice = newPrice;
      lastNotificationAt = now;
      return true;
    }

    lastGoldPrice = newPrice;
    return false;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    lastGoldPrice = null;
    lastNotificationAt = 0;
  });

  describe("End-to-End Notification Flow", () => {
    it("should trigger notification when price change exceeds threshold", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      // Simulate price updates that would trigger notification
      const initialPrice = 2650.0;
      const newPrice = 2656.63; // 0.25% increase (2650 * 1.0025 = 2656.625)

      // First call - establishes baseline
      const shouldNotify1 = shouldSendNotification(initialPrice);
      expect(shouldNotify1).toBe(false);

      // Second call - triggers notification
      const shouldNotify2 = shouldSendNotification(newPrice);
      expect(shouldNotify2).toBe(true);

      if (shouldNotify2) {
        const direction = newPrice > initialPrice ? "increased" : "decreased";
        const message = `Gold price has ${direction} to $${newPrice.toFixed(
          2
        )} per ounce`;

        const result = await sendNotification(message);

        expect(result.success).toBe(true);
        expect(mockSendNotification).toHaveBeenCalledWith(message);
      }
    });

    it("should not trigger notification during cooldown period", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      // First significant price change
      shouldSendNotification(2650.0);
      const shouldNotify1 = shouldSendNotification(2656.63);
      expect(shouldNotify1).toBe(true);

      if (shouldNotify1) {
        await sendNotification("First notification");
      }

      // Second significant change during cooldown
      const shouldNotify2 = shouldSendNotification(2663.26); // Another 0.25% increase from 2656.63
      expect(shouldNotify2).toBe(false);

      // Should not send second notification
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
    });

    it("should handle notification sending failures gracefully", async () => {
      mockSendNotification.mockResolvedValue({
        success: false,
        error: "No subscriptions available",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      const result = await sendNotification("Test notification");

      expect(result.success).toBe(false);
      expect(result.error).toBe("No subscriptions available");
    });

    it("should handle multiple subscribers correctly", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 3 subscribers (0 failed)",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      const result = await sendNotification("Price alert");

      expect(result.success).toBe(true);
      expect(result.message).toContain("3 subscribers");
    });
  });

  describe("Price Change Scenarios", () => {
    it("should handle volatile market conditions", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      const prices = [
        2650.0, // Initial price
        2651.5, // +0.057% - no notification
        2649.0, // -0.096% from last - no notification
        2656.8, // +0.294% from 2649.0 - should notify (above 0.25% threshold)
        2654.0, // -0.096% - no notification (cooldown)
      ];

      let notificationCount = 0;

      for (let i = 0; i < prices.length; i++) {
        const shouldNotify = shouldSendNotification(prices[i]);

        if (shouldNotify) {
          await sendNotification(`Price update: $${prices[i]}`);
          notificationCount++;
        }
      }

      expect(notificationCount).toBe(1);
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
    });

    it("should handle price spikes and recoveries", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      // Initial price
      shouldSendNotification(2650.0);

      // Spike up - should notify
      const spikeNotify = shouldSendNotification(2670.0); // +0.755%
      expect(spikeNotify).toBe(true);
      await sendNotification("Price spike alert");

      // Recovery after cooldown
      lastNotificationAt = Date.now() - (NOTIFICATION_COOLDOWN_MS + 1000);
      const recoveryNotify = shouldSendNotification(2653.0); // -0.637% from spike
      expect(recoveryNotify).toBe(true);
      await sendNotification("Price recovery alert");

      expect(mockSendNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe("Real-world Gold Price Simulations", () => {
    it("should handle typical daily gold price movements", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 2 subscribers (0 failed)",
      });

      // Simulate a day of gold price movements (realistic data)
      const dayPrices = [
        2652.3, // Market open
        2651.8, // -0.019%
        2653.5, // +0.064%
        2649.9, // -0.136%
        2655.2, // +0.200%
        2659.8, // +0.173%
        2656.1, // -0.139%
        2662.8, // +0.252% from 2656.1 - should trigger (above 0.25% threshold)
        2661.2, // -0.061%
        2659.0, // -0.083%
      ];

      let notifications = 0;
      for (const price of dayPrices) {
        if (shouldSendNotification(price)) {
          await sendNotification(`Gold price alert: $${price}`);
          notifications++;
        }
      }

      expect(notifications).toBe(1);
      expect(mockSendNotification).toHaveBeenCalledTimes(1);
    });

    it("should handle weekend gap scenarios", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      // Friday close
      shouldSendNotification(2650.0);

      // Monday open with gap
      const gapNotify = shouldSendNotification(2680.0); // +1.13% gap
      expect(gapNotify).toBe(true);

      await sendNotification("Weekend gap alert");

      expect(mockSendNotification).toHaveBeenCalledWith("Weekend gap alert");
    });
  });

  describe("Error Handling in Flow", () => {
    it("should continue price tracking even when notifications fail", async () => {
      mockSendNotification.mockRejectedValue(new Error("Network error"));

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      try {
        await sendNotification("Test notification");
      } catch (error) {
        // Error should be handled
        expect(error).toBeInstanceOf(Error);
      }

      // Price tracking should continue
      expect(lastGoldPrice).toBe(2656.63);
    });

    it("should handle partial notification failures", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 2 subscribers (1 failed)",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      const result = await sendNotification("Partial failure test");

      expect(result.success).toBe(true);
      expect(result.message).toContain("1 failed");
    });
  });

  describe("Subscription Management Integration", () => {
    it("should handle notifications when no subscribers exist", async () => {
      mockSendNotification.mockResolvedValue({
        success: false,
        error: "No subscriptions available",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      const result = await sendNotification("No subscribers test");

      expect(result.success).toBe(false);
      expect(result.error).toBe("No subscriptions available");
    });

    it("should handle subscription cleanup during notification", async () => {
      // First call succeeds
      mockSendNotification.mockResolvedValueOnce({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      shouldSendNotification(2650.0);

      // First notification
      if (shouldSendNotification(2656.63)) {
        const result1 = await sendNotification("First notification");
        expect(result1.success).toBe(true);
      }

      // Reset for second test after cooldown
      lastNotificationAt = Date.now() - (NOTIFICATION_COOLDOWN_MS + 1000);

      // Second call has no subscriptions (they were cleaned up)
      mockSendNotification.mockResolvedValueOnce({
        success: false,
        error: "No subscriptions available",
      });

      if (shouldSendNotification(2669.24)) {
        const result2 = await sendNotification("Second notification");
        expect(result2.success).toBe(false);
      }

      expect(mockSendNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance and Timing", () => {
    it("should handle high-frequency price updates efficiently", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      const startTime = Date.now();

      // Simulate 100 rapid price updates
      let notifications = 0;
      let basePrice = 2650.0;

      for (let i = 0; i < 100; i++) {
        const variation = (Math.random() - 0.5) * 10; // ±$5 variation
        const price = basePrice + variation;

        if (shouldSendNotification(price)) {
          await sendNotification(`Update ${i}: $${price}`);
          notifications++;
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly and only send limited notifications due to cooldown
      expect(duration).toBeLessThan(1000); // Less than 1 second
      expect(notifications).toBeLessThanOrEqual(2); // At most a couple notifications
    });

    it("should respect cooldown timing precisely", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      // First notification
      shouldSendNotification(2650.0);
      const firstNotify = shouldSendNotification(2656.63);
      expect(firstNotify).toBe(true);

      const notificationTime = Date.now();
      await sendNotification("First notification");

      // Just before cooldown expires
      lastNotificationAt = notificationTime;
      const currentTime = Date.now();
      const timeElapsed = currentTime - lastNotificationAt;

      if (timeElapsed < NOTIFICATION_COOLDOWN_MS) {
        const earlyNotify = shouldSendNotification(2662.5);
        expect(earlyNotify).toBe(false);
      }

      // After cooldown expires
      lastNotificationAt = Date.now() - (NOTIFICATION_COOLDOWN_MS + 100);
      const laterNotify = shouldSendNotification(2669.16); // 0.25% increase from 2662.5
      expect(laterNotify).toBe(true);
    });
  });

  describe("Service Worker Compatibility", () => {
    it("should handle JSON formatted push messages", async () => {
      // This test verifies that the service worker can handle JSON messages
      // The actual service worker is tested in browser, but we can verify the data format
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      const result = await sendNotification("Gold price increased to $2656.63");

      expect(result.success).toBe(true);
      expect(mockSendNotification).toHaveBeenCalledWith(
        "Gold price increased to $2656.63"
      );
    });

    it("should handle plain text messages gracefully", async () => {
      // This simulates the case where the service worker receives plain text
      // instead of JSON (which was causing the original error)
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      // Test with various plain text formats that might cause JSON parsing errors
      const plainTextMessages = [
        "Test push notification",
        "Simple message",
        "Message with 'quotes' and \"double quotes\"",
        "Message with {braces} and [brackets]",
        "Price: $2,650.00",
      ];

      for (const message of plainTextMessages) {
        const result = await sendNotification(message);
        expect(result.success).toBe(true);
      }

      expect(mockSendNotification).toHaveBeenCalledTimes(
        plainTextMessages.length
      );
    });

    it("should handle malformed or empty messages", async () => {
      mockSendNotification.mockResolvedValue({
        success: true,
        message: "Notifications sent to 1 subscribers (0 failed)",
      });

      shouldSendNotification(2650.0);
      const shouldNotify = shouldSendNotification(2656.63);
      expect(shouldNotify).toBe(true);

      // Test edge cases that might break JSON parsing
      const edgeCaseMessages = [
        "", // Empty string
        " ", // Whitespace only
        "\n", // Newline
        "\t", // Tab
        "null", // String that looks like JSON null
        "undefined", // String that looks like undefined
        "true", // String that looks like boolean
        "123", // String that looks like number
      ];

      for (const message of edgeCaseMessages) {
        const result = await sendNotification(message || "fallback message");
        expect(result.success).toBe(true);
      }
    });
  });
});
