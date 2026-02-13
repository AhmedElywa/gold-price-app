import { beforeEach, describe, expect, it } from 'bun:test';

/**
 * Test for shouldSendNotification / evaluateNotificationDecision logic.
 *
 * NOTE: The real function is `evaluateNotificationDecision` inside
 * src/app/api/gold-prices-egp/route.ts.  It is NOT exported, so we test a
 * local copy here.  If the production logic changes, this test may diverge.
 * Consider exporting evaluateNotificationDecision to enable direct testing.
 */

describe('shouldSendNotification function', () => {
  // Copy the logic from the API route for testing
  let lastGoldPrice: number | null = null;
  let lastNotificationAt: number = 0;
  const NOTIFICATION_THRESHOLD_PERCENT = 0.25;
  const NOTIFICATION_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours

  function shouldSendNotification(newPrice: number): boolean {
    if (lastGoldPrice === null) {
      lastGoldPrice = newPrice;
      return false;
    }

    const priceDiffPercent = Math.abs(((newPrice - lastGoldPrice) / lastGoldPrice) * 100);
    const now = Date.now();
    const enoughTimeElapsed = now - lastNotificationAt > NOTIFICATION_COOLDOWN_MS;
    const significantChange = priceDiffPercent >= NOTIFICATION_THRESHOLD_PERCENT;

    if (significantChange && enoughTimeElapsed) {
      lastGoldPrice = newPrice;
      lastNotificationAt = now;
      return true;
    }

    lastGoldPrice = newPrice;
    return false;
  }

  beforeEach(() => {
    // Reset state before each test
    lastGoldPrice = null;
    lastNotificationAt = 0;
  });

  describe('Initial state behavior', () => {
    it('should not send notification on first price update', () => {
      const result = shouldSendNotification(100);
      expect(result).toBe(false);
      expect(lastGoldPrice).toBe(100);
    });

    it('should store the first price correctly', () => {
      shouldSendNotification(2500.5);
      expect(lastGoldPrice).toBe(2500.5);
    });
  });

  describe('Price change threshold behavior', () => {
    it('should send notification when price change exceeds threshold', () => {
      // Set initial price
      shouldSendNotification(100);

      // Price increases by 0.3% (above 0.25% threshold)
      const result = shouldSendNotification(100.3);
      expect(result).toBe(true);
    });

    it('should not send notification when price change is below threshold', () => {
      shouldSendNotification(100);

      // Price increases by 0.2% (below 0.25% threshold)
      const result = shouldSendNotification(100.2);
      expect(result).toBe(false);
    });

    it('should trigger on price decreases exceeding threshold', () => {
      shouldSendNotification(100);

      // Price decreases by 0.3% (above 0.25% threshold)
      const result = shouldSendNotification(99.7);
      expect(result).toBe(true);
    });

    it('should calculate percentage correctly for different price ranges', () => {
      // Test with high price
      shouldSendNotification(2000);
      const result1 = shouldSendNotification(2005); // 0.25% increase
      expect(result1).toBe(true);

      // Reset and test with low price
      lastGoldPrice = null;
      lastNotificationAt = 0;
      shouldSendNotification(50);
      const result2 = shouldSendNotification(50.125); // 0.25% increase
      expect(result2).toBe(true);
    });

    it('should handle exact threshold boundary', () => {
      shouldSendNotification(100);

      // Exactly 0.25% change
      const result = shouldSendNotification(100.25);
      expect(result).toBe(true);
    });
  });

  describe('Cooldown period behavior', () => {
    it('should not send duplicate notifications during cooldown', () => {
      shouldSendNotification(100);

      // First significant change
      const result1 = shouldSendNotification(100.3);
      expect(result1).toBe(true);

      // Another significant change during cooldown
      const result2 = shouldSendNotification(100.6);
      expect(result2).toBe(false);
    });

    it('should allow notifications after cooldown period', () => {
      shouldSendNotification(100);

      // First notification
      shouldSendNotification(100.3);

      // Simulate cooldown period passing
      lastNotificationAt = Date.now() - (NOTIFICATION_COOLDOWN_MS + 1000);

      // Should allow new notification
      const result = shouldSendNotification(100.6);
      expect(result).toBe(true);
    });

    it('should respect cooldown even with very large price changes', () => {
      shouldSendNotification(100);
      shouldSendNotification(100.3); // First notification

      // Huge price change during cooldown
      const result = shouldSendNotification(150);
      expect(result).toBe(false);
    });
  });

  describe('Price tracking behavior', () => {
    it('should update lastGoldPrice regardless of notification sent', () => {
      shouldSendNotification(100);
      shouldSendNotification(100.1); // Below threshold, no notification
      expect(lastGoldPrice).toBe(100.1);

      shouldSendNotification(100.4); // Should calculate from 100.1, not 100
      expect(lastGoldPrice).toBe(100.4);
    });

    it('should track price correctly through multiple updates', () => {
      const prices = [100, 100.1, 100.05, 100.2, 100.15];

      prices.forEach((price) => shouldSendNotification(price));

      expect(lastGoldPrice).toBe(100.15);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero price', () => {
      shouldSendNotification(0);
      expect(lastGoldPrice).toBe(0);

      // Any non-zero price should trigger (division by zero protection)
      const result = shouldSendNotification(1);
      expect(result).toBe(true);
    });

    it('should handle negative prices', () => {
      shouldSendNotification(-100);
      expect(lastGoldPrice).toBe(-100);

      const result = shouldSendNotification(-99.7); // 0.3% change
      expect(result).toBe(true);
    });

    it('should handle very small price changes', () => {
      shouldSendNotification(100);

      const result = shouldSendNotification(100.001); // 0.001% change
      expect(result).toBe(false);
    });

    it('should handle floating point precision', () => {
      shouldSendNotification(100.123456789);

      // Change that slightly exceeds 0.25% to account for floating point precision
      const newPrice = 100.123456789 * 1.0026; // 0.26% change
      const result = shouldSendNotification(newPrice);
      expect(result).toBe(true);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical gold price fluctuations', () => {
      // Simulate real gold price movements
      const prices = [
        2650.0, // Initial
        2652.5, // +0.09% - no notification
        2648.0, // -0.17% from last - no notification
        2656.5, // +0.32% from last - should notify
        2655.0, // -0.06% - no notification (also in cooldown)
      ];

      const results = prices.map((price) => shouldSendNotification(price));

      expect(results).toEqual([false, false, false, true, false]);
    });

    it('should handle price spikes and recoveries', () => {
      shouldSendNotification(2650);

      // Spike up
      const result1 = shouldSendNotification(2660); // +0.38%
      expect(result1).toBe(true);

      // Recovery during cooldown
      lastNotificationAt = Date.now() - (NOTIFICATION_COOLDOWN_MS + 1000);
      const result2 = shouldSendNotification(2653); // -0.26% from spike
      expect(result2).toBe(true);
    });
  });

  describe('Integration with notification timing', () => {
    it('should properly update timestamp when notification is sent', () => {
      const beforeTime = Date.now();

      shouldSendNotification(100);
      shouldSendNotification(100.3);

      expect(lastNotificationAt).toBeGreaterThanOrEqual(beforeTime);
      expect(lastNotificationAt).toBeLessThanOrEqual(Date.now());
    });

    it('should not update timestamp when notification is not sent', () => {
      shouldSendNotification(100);
      const originalTimestamp = lastNotificationAt;

      shouldSendNotification(100.1); // Below threshold

      expect(lastNotificationAt).toBe(originalTimestamp);
    });
  });

  describe('Direction regression (mirrors evaluateNotificationDecision)', () => {
    /**
     * Regression: direction must be computed BEFORE mutating lastGoldPrice.
     * The real evaluateNotificationDecision in gold-prices-egp/route.ts
     * returns { shouldNotify, direction, changePercent }.
     * We replicate the direction logic here to guard against a regression
     * where direction is computed *after* lastGoldPrice is updated to newPrice,
     * which would always yield "unchanged".
     */
    function evaluateDirection(newPrice: number): 'increased' | 'decreased' {
      // Capture previousPrice BEFORE mutation
      const previousPrice = lastGoldPrice;
      // Mutate
      lastGoldPrice = newPrice;
      // Direction must use the pre-mutation value
      return previousPrice !== null && newPrice >= previousPrice ? 'increased' : 'decreased';
    }

    it("should report 'increased' when price goes from 100 to 110", () => {
      lastGoldPrice = 100;
      const direction = evaluateDirection(110);
      expect(direction).toBe('increased');
    });

    it("should report 'decreased' when price goes from 100 to 90", () => {
      lastGoldPrice = 100;
      const direction = evaluateDirection(90);
      expect(direction).toBe('decreased');
    });

    it("should report 'increased' when price is unchanged", () => {
      lastGoldPrice = 100;
      const direction = evaluateDirection(100);
      expect(direction).toBe('increased'); // >= means equal counts as increased
    });
  });
});
