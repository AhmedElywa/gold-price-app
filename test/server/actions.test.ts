import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { SerializablePushSubscription } from "../../src/app/actions";

class MockWebPushError extends Error {
	public statusCode: number;
	public headers: Record<string, string>;
	public body: string;

	constructor(message: string, statusCode: number, headers: Record<string, string>, body: string) {
		super(message);
		this.name = "WebPushError";
		this.statusCode = statusCode;
		this.headers = headers;
		this.body = body;
	}
}

// In-memory file store for mocking filesystem
let fileStore: Record<string, string> = {};

mock.module("node:fs/promises", () => ({
	readFile: async (filePath: string) => {
		if (filePath in fileStore) {
			return fileStore[filePath];
		}
		const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`) as NodeJS.ErrnoException;
		err.code = "ENOENT";
		throw err;
	},
	writeFile: async (filePath: string, data: string) => {
		fileStore[filePath] = data;
	},
	mkdir: async () => {},
}));

// Use mock() functions directly so they're shared with the actions module
const mockSetVapidDetails = mock(() => {});
const mockSendNotification = mock(() =>
	Promise.resolve({ statusCode: 201, body: "Success", headers: {} }),
);

mock.module("web-push", () => ({
	default: {
		setVapidDetails: mockSetVapidDetails,
		sendNotification: mockSendNotification,
		WebPushError: MockWebPushError,
	},
	setVapidDetails: mockSetVapidDetails,
	sendNotification: mockSendNotification,
	WebPushError: MockWebPushError,
}));

// Import after mocking
const { sendNotification, subscribeUser, unsubscribeUser } = await import("../../src/app/actions");

// Mock console for server tests
const mockConsole = {
	log: mock(() => {}),
	error: mock(() => {}),
	warn: mock(() => {}),
};

Object.defineProperty(global, "console", {
	value: { ...console, ...mockConsole },
	writable: true,
});

const TEST_CRON_SECRET = "test-cron-secret";

describe("Notification Actions", () => {
	const mockSubscription: SerializablePushSubscription = {
		endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
		keys: {
			p256dh: "test-p256dh-key",
			auth: "test-auth-key",
		},
	};

	async function clearAllSubscriptions() {
		await unsubscribeUser(mockSubscription.endpoint);
		await unsubscribeUser("https://fcm.googleapis.com/fcm/send/test-endpoint-2");
	}

	beforeEach(async () => {
		// Reset in-memory file store
		fileStore = {};

		// Reset environment variables
		process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-vapid-public";
		process.env.VAPID_PRIVATE_KEY = "test-vapid-private";
		process.env.CRON_SECRET = TEST_CRON_SECRET;
		process.env.NODE_ENV = "test";

		// Clear any existing subscriptions
		await clearAllSubscriptions();

		// Reset mock call tracking
		mockSetVapidDetails.mockClear();
		mockSendNotification.mockClear();
		mockSendNotification.mockImplementation(() =>
			Promise.resolve({ statusCode: 201, body: "Success", headers: {} }),
		);

		mockConsole.log.mockClear();
		mockConsole.error.mockClear();
		mockConsole.warn.mockClear();
	});

	describe("subscribeUser", () => {
		it("should successfully subscribe a new user", async () => {
			const result = await subscribeUser(mockSubscription);

			expect(mockSetVapidDetails).toHaveBeenCalledWith(
				expect.stringContaining("mailto:"),
				"test-vapid-public",
				"test-vapid-private",
			);
			expect(result).toEqual({ success: true });
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Subscription stored:",
				mockSubscription.endpoint,
			);
		});

		it("should not add duplicate subscriptions", async () => {
			await subscribeUser(mockSubscription);
			mockConsole.log.mockClear();

			const result = await subscribeUser(mockSubscription);

			expect(result).toEqual({ success: true });
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Subscription already stored:",
				mockSubscription.endpoint,
			);
		});

		it("should handle multiple different subscriptions", async () => {
			const subscription2: SerializablePushSubscription = {
				...mockSubscription,
				endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint-2",
			};

			await subscribeUser(mockSubscription);
			const result = await subscribeUser(subscription2);

			expect(result).toEqual({ success: true });
		});
	});

	describe("unsubscribeUser", () => {
		it("should successfully unsubscribe a user", async () => {
			await subscribeUser(mockSubscription);
			mockConsole.log.mockClear();

			const result = await unsubscribeUser(mockSubscription.endpoint);

			expect(result).toEqual({ success: true });
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Subscription removed:",
				mockSubscription.endpoint,
			);
		});

		it("should handle unsubscribing non-existent subscription", async () => {
			const result = await unsubscribeUser("non-existent-endpoint");

			expect(result).toEqual({ success: true });
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Subscription removed:",
				"non-existent-endpoint",
			);
		});
	});

	describe("sendNotification", () => {
		const testMessage = "Test notification message";

		it("should return Unauthorized when called without secret in non-development mode", async () => {
			const originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			const result = await sendNotification(testMessage);

			expect(result).toEqual({
				success: false,
				error: "Unauthorized",
			});

			process.env.NODE_ENV = originalNodeEnv;
		});

		it("should return Unauthorized when called with wrong secret", async () => {
			const result = await sendNotification(testMessage, "wrong-secret");

			expect(result).toEqual({
				success: false,
				error: "Unauthorized",
			});
		});

		it("should return error when no subscriptions available", async () => {
			const result = await sendNotification(testMessage, TEST_CRON_SECRET);

			expect(result).toEqual({
				success: false,
				error: "No subscriptions available",
			});
			expect(mockSendNotification).not.toHaveBeenCalled();
		});

		it("should successfully send notification to single subscriber", async () => {
			await subscribeUser(mockSubscription);

			const result = await sendNotification(testMessage, TEST_CRON_SECRET);

			expect(mockSendNotification).toHaveBeenCalledWith(
				mockSubscription,
				JSON.stringify({
					title: "Gold Price Update",
					body: testMessage,
					icon: "/icons/icon-192x192.png",
				}),
			);
			expect(result).toEqual({
				success: true,
				message: "Notifications sent to 1 subscribers (0 failed)",
			});
		});

		it("should send notification to multiple subscribers", async () => {
			const subscription2: SerializablePushSubscription = {
				...mockSubscription,
				endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint-2",
			};

			await subscribeUser(mockSubscription);
			await subscribeUser(subscription2);

			const result = await sendNotification(testMessage, TEST_CRON_SECRET);

			expect(mockSendNotification).toHaveBeenCalledTimes(2);
			expect(result).toEqual({
				success: true,
				message: "Notifications sent to 2 subscribers (0 failed)",
			});
		});

		it("should handle send failures gracefully", async () => {
			mockSendNotification.mockImplementation(() => Promise.reject(new Error("Network error")));

			await subscribeUser(mockSubscription);

			const result = await sendNotification(testMessage, TEST_CRON_SECRET);

			expect(result).toEqual({
				success: false,
				message: "Notifications sent to 0 subscribers (1 failed)",
			});
			expect(mockConsole.error).toHaveBeenCalledWith(
				"Error sending push notification:",
				expect.any(Error),
			);
		});

		it("should remove invalid subscriptions on 410 error", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.reject(new MockWebPushError("Gone", 410, {}, "Subscription expired")),
			);

			await subscribeUser(mockSubscription);

			const result1 = await sendNotification(testMessage, TEST_CRON_SECRET);
			expect(result1.success).toBe(false);
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Invalid subscription removed:",
				mockSubscription.endpoint,
			);

			mockSendNotification.mockImplementation(() =>
				Promise.resolve({ statusCode: 201, body: "Success", headers: {} }),
			);

			const result2 = await sendNotification(testMessage, TEST_CRON_SECRET);
			expect(result2).toEqual({
				success: false,
				error: "No subscriptions available",
			});
		});

		it("should remove invalid subscriptions on 404 error", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.reject(new MockWebPushError("Not Found", 404, {}, "Subscription not found")),
			);

			await subscribeUser(mockSubscription);

			const result = await sendNotification(testMessage, TEST_CRON_SECRET);

			expect(result.success).toBe(false);
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Invalid subscription removed:",
				mockSubscription.endpoint,
			);
		});

		it("should not remove subscriptions on other errors", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.reject(new MockWebPushError("Server Error", 500, {}, "Internal server error")),
			);

			await subscribeUser(mockSubscription);

			const result1 = await sendNotification(testMessage, TEST_CRON_SECRET);
			expect(result1.success).toBe(false);

			mockSendNotification.mockImplementation(() =>
				Promise.resolve({ statusCode: 201, body: "Success", headers: {} }),
			);

			const result2 = await sendNotification(testMessage, TEST_CRON_SECRET);
			expect(result2.success).toBe(true);
		});

		it("should handle mixed success and failure scenarios", async () => {
			const subscription2: SerializablePushSubscription = {
				...mockSubscription,
				endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint-2",
			};

			await subscribeUser(mockSubscription);
			await subscribeUser(subscription2);

			let callCount = 0;
			mockSendNotification.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						statusCode: 201,
						body: "Success",
						headers: {},
					});
				}
				return Promise.reject(new Error("Network error"));
			});

			const result = await sendNotification(testMessage, TEST_CRON_SECRET);

			expect(result).toEqual({
				success: true,
				message: "Notifications sent to 1 subscribers (1 failed)",
			});
		});
	});

	describe("webpush configuration", () => {
		it("should configure webpush with correct VAPID details", async () => {
			await subscribeUser(mockSubscription);

			expect(mockSetVapidDetails).toHaveBeenCalledWith(
				expect.stringContaining("mailto:"),
				"test-vapid-public",
				"test-vapid-private",
			);
		});

		it("should configure webpush for each action", async () => {
			await subscribeUser(mockSubscription);
			await sendNotification("test", TEST_CRON_SECRET);
			await unsubscribeUser(mockSubscription.endpoint);

			expect(mockSetVapidDetails).toHaveBeenCalledTimes(3);
		});
	});
});
