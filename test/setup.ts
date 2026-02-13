import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";
import "@testing-library/jest-dom/vitest";

// Register happy-dom for DOM APIs (client tests)
GlobalRegistrator.register();

// Mock next/navigation
mock.module("next/navigation", () => ({
	useRouter: () => ({
		push: () => {},
		replace: () => {},
		back: () => {},
		refresh: () => {},
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
		requestPermission: mock(() => Promise.resolve("granted" as const)),
	},
	writable: true,
	configurable: true,
});

Object.defineProperty(navigator, "serviceWorker", {
	value: {
		register: mock(() =>
			Promise.resolve({
				scope: "http://localhost/",
				addEventListener: () => {},
				waiting: null,
			}),
		),
		ready: Promise.resolve({
			pushManager: {
				subscribe: mock(() => Promise.resolve()),
				getSubscription: mock(() => Promise.resolve(null)),
			},
		}),
	},
	writable: true,
	configurable: true,
});

// Mock console methods to keep test output clean
global.console = {
	...console,
	log: mock(() => {}),
	error: mock(() => {}),
	warn: mock(() => {}),
};

// Mock fetch globally
global.fetch = mock(() => Promise.resolve(new Response())) as typeof fetch;
