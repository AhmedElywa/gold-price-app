const { TextEncoder, TextDecoder } = require("util");

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require("@testing-library/jest-dom");

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-vapid-public-key";
process.env.VAPID_PRIVATE_KEY = "test-vapid-private-key";
process.env.EXCHANGE_RATE_API_KEY = "test-exchange-rate-api-key";

// Mock browser APIs
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
        subscribe: jest.fn(),
        getSubscription: jest.fn().mockResolvedValue(null),
      },
    }),
  },
  writable: true,
  configurable: true,
});

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
