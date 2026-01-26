/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert');

let lastGoldPrice = null;
let lastNotificationAt = 0;
const THRESHOLD = 0.25;
const COOLDOWN = 3 * 60 * 60 * 1000;

function shouldSendNotification(newPrice) {
  if (lastGoldPrice === null) {
    lastGoldPrice = newPrice;
    return false;
  }
  const priceDiffPercent = Math.abs(((newPrice - lastGoldPrice) / lastGoldPrice) * 100);
  const now = Date.now();
  const enoughTimeElapsed = now - lastNotificationAt > COOLDOWN;
  const significantChange = priceDiffPercent >= THRESHOLD;
  if (significantChange && enoughTimeElapsed) {
    lastGoldPrice = newPrice;
    lastNotificationAt = now;
    return true;
  }
  lastGoldPrice = newPrice;
  return false;
}

(() => {
  lastGoldPrice = null;
  lastNotificationAt = 0;
  let sent = shouldSendNotification(100);
  assert.strictEqual(sent, false, 'first call should not send');
  sent = shouldSendNotification(100.3);
  assert.strictEqual(sent, true, 'second call sends');
  sent = shouldSendNotification(100.3);
  assert.strictEqual(sent, false, 'no duplicate');
  console.log('OK');
})();
