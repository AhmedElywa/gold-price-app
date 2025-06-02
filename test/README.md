# Notification Testing Suite

This directory contains comprehensive tests for the push notification system in the gold price tracking application.

## Test Structure

### Server-side Tests (`test/server/`)

#### `actions.test.ts`

Tests the core notification server actions:

- **subscribeUser**: User subscription management
- **unsubscribeUser**: User unsubscription handling
- **sendNotification**: Push notification delivery
- **Error handling**: WebPush errors, network failures
- **Subscription cleanup**: Invalid subscription removal

#### `shouldSendNotification.test.ts`

Tests the price change notification logic:

- **Price thresholds**: 0.25% change requirement
- **Cooldown periods**: 3-hour minimum between notifications
- **Edge cases**: Zero prices, negative prices, floating point precision
- **Real-world scenarios**: Market volatility, price spikes

### Client-side Tests (`test/client/`)

#### `PushNotificationManager.test.tsx`

Tests the React component for managing push notifications:

- **Feature detection**: Browser API support
- **Permission flow**: Requesting notification permissions
- **Subscription management**: Subscribe/unsubscribe workflow
- **UI states**: Loading, success, error states
- **SSR compatibility**: Server-side rendering protection

#### `TestNotification.test.tsx`

Tests the development notification testing component:

- **Manual testing**: Send test notifications
- **Input validation**: Message requirements
- **Status feedback**: Success/error messages
- **UI behavior**: Button states, loading indicators

### Integration Tests (`test/integration/`)

#### `notification-flow.test.ts`

End-to-end tests of the complete notification system:

- **Price change detection**: Threshold and cooldown integration
- **Notification delivery**: Complete flow from price change to push
- **Error scenarios**: Network failures, no subscribers
- **Performance**: High-frequency updates, timing precision
- **Real-world simulations**: Daily price movements, market gaps

## Running Tests

### All Tests

```bash
npm test
# or
pnpm test
```

### Watch Mode

```bash
npm run test:watch
# or
pnpm test:watch
```

### Legacy Test (Original)

```bash
npm run test:legacy
# or
pnpm test:legacy
```

### Individual Test Suites

```bash
# Server-side tests only
npx jest test/server

# Client-side tests only
npx jest test/client

# Integration tests only
npx jest test/integration
```

## Test Coverage

The test suite covers:

### ✅ Notification Actions

- [x] User subscription/unsubscription
- [x] Push notification sending
- [x] Error handling and recovery
- [x] Invalid subscription cleanup
- [x] Multiple subscriber scenarios

### ✅ Price Change Logic

- [x] Threshold detection (0.25%)
- [x] Cooldown enforcement (3 hours)
- [x] Price tracking accuracy
- [x] Edge case handling
- [x] Market volatility scenarios

### ✅ UI Components

- [x] Browser compatibility checks
- [x] Permission request flow
- [x] Subscription state management
- [x] User feedback (toasts, errors)
- [x] SSR/hydration safety

### ✅ Integration Flows

- [x] End-to-end notification delivery
- [x] Price change → notification pipeline
- [x] Error propagation and handling
- [x] Performance under load
- [x] Real-world usage patterns

## Test Configuration

### Jest Configuration

- **Environment**: Dual setup (jsdom for client, node for server)
- **Setup**: Global mocks for browser APIs
- **Coverage**: Excludes build files and stories
- **Timeout**: Extended for integration tests

### Mocking Strategy

- **web-push**: Mocked for reliable testing
- **Browser APIs**: Service Worker, Notification, PushManager
- **Environment variables**: Test-specific values
- **Network requests**: Controlled responses

## Key Test Scenarios

### 1. Subscription Management

```typescript
// Test user subscribing to notifications
await subscribeUser(mockSubscription);
expect(result).toEqual({ success: true });

// Test duplicate subscription handling
await subscribeUser(sameSubscription);
expect(console.log).toHaveBeenCalledWith("Subscription already stored");
```

### 2. Price Change Detection

```typescript
// Test threshold triggering
shouldSendNotification(100.0); // baseline
shouldSendNotification(100.25); // 0.25% change → true
shouldSendNotification(100.3); // cooldown → false
```

### 3. Notification Delivery

```typescript
// Test successful delivery
const result = await sendNotification("Price alert");
expect(result.success).toBe(true);
expect(result.message).toContain("subscribers");
```

### 4. Error Scenarios

```typescript
// Test network failure handling
mockWebPush.sendNotification.mockRejectedValue(new Error("Network error"));
const result = await sendNotification("Test");
expect(result.success).toBe(false);
```

## Debugging Tests

### Console Output

Tests mock console methods but capture calls for assertions:

```typescript
expect(console.log).toHaveBeenCalledWith("Subscription stored:", endpoint);
expect(console.error).toHaveBeenCalledWith(
  "Error sending push notification:",
  error
);
```

### Async Testing

Use `waitFor` for async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText(/notification sent/i)).toBeInTheDocument();
});
```

### Mock Inspection

Verify mock calls and arguments:

```typescript
expect(mockSendNotification).toHaveBeenCalledWith(
  expect.objectContaining({
    endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
  }),
  expect.stringContaining("Gold Price Update")
);
```

## Test Data

### Sample Subscription

```typescript
const mockSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
  keys: {
    p256dh: "test-p256dh-key",
    auth: "test-auth-key",
  },
};
```

### Sample Price Data

```typescript
const goldPrices = [
  2650.0, // baseline
  2656.62, // +0.25% trigger
  2663.24, // cooldown test
  2680.0, // large movement
];
```

## Contributing

When adding new notification features:

1. **Add unit tests** for individual functions
2. **Add component tests** for UI changes
3. **Add integration tests** for end-to-end flows
4. **Update this documentation** with new test scenarios
5. **Maintain high coverage** (aim for >90%)

### Test Naming Convention

- `describe('Feature Name')` for major functionality
- `it('should behave correctly when...')` for specific scenarios
- `expect().toBe()` for exact matches
- `expect().toContain()` for partial matches

### Mock Management

- Reset mocks in `beforeEach()`
- Use specific mocks per test when needed
- Clear environment between tests
- Avoid test interdependencies
