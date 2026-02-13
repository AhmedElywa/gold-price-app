import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
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

// Mock web-push module with plain functions (will be spied on later)
mock.module("web-push", () => ({
	default: {
		setVapidDetails() {},
		sendNotification() {
			return Promise.resolve({ statusCode: 201, body: "Success", headers: {} });
		},
		WebPushError: MockWebPushError,
	},
	setVapidDetails() {},
	sendNotification() {
		return Promise.resolve({ statusCode: 201, body: "Success", headers: {} });
	},
	WebPushError: MockWebPushError,
}));

// Import after mocking
import webpush from "web-push";
import { sendNotification, subscribeUser, unsubscribeUser } from "../../src/app/actions";

// Mock console for server tests
const mockConsole = {
	log: mock(() => {}),
	error: mock(() => {}),
	warn: mock(() => {}),
};

// Replace console in server environment
Object.defineProperty(global, "console", {
	value: { ...console, ...mockConsole },
	writable: true,
});

describe("Notification Actions", () => {
	const mockSubscription: SerializablePushSubscription = {
		endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
		keys: {
			p256dh: "test-p256dh-key",
			auth: "test-auth-key",
		},
	};

	// Spies on the webpush object - created in beforeEach
	let spySetVapidDetails: ReturnType<typeof spyOn>;
	let spySendNotification: ReturnType<typeof spyOn>;

	// Helper to clear subscriptions between tests
	async function clearAllSubscriptions() {
		await unsubscribeUser(mockSubscription.endpoint);
		await unsubscribeUser("https://fcm.googleapis.com/fcm/send/test-endpoint-2");
		await unsubscribeUser("non-existent-endpoint");
	}

	afterEach(() => {
		// Restore spies to prevent accumulation
		spySetVapidDetails?.mockRestore();
		spySendNotification?.mockRestore();
	});

	beforeEach(async () => {
		// Clear any existing subscriptions
		await clearAllSubscriptions();

		// Set up fresh spies on the mocked module
		spySetVapidDetails = spyOn(webpush, "setVapidDetails");
		spySendNotification = spyOn(webpush, "sendNotification").mockReturnValue(
			Promise.resolve({ statusCode: 201, body: "Success", headers: {} }) as any,
		);

		mockConsole.log.mockClear();
		mockConsole.error.mockClear();
		mockConsole.warn.mockClear();

		// Reset environment variables
		process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-vapid-public";
		process.env.VAPID_PRIVATE_KEY = "test-vapid-private";
	});

	describe("subscribeUser", () => {
		it("should successfully subscribe a new user", async () => {
			const result = await subscribeUser(mockSubscription);

			expect(spySetVapidDetails).toHaveBeenCalledWith(
				"mailto:ahmed.elywa@icloud.com",
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
			// First subscription
			await subscribeUser(mockSubscription);
			mockConsole.log.mockClear();

			// Second subscription with same endpoint
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
			expect(mockConsole.log).toHaveBeenCalledTimes(2);
		});
	});

	describe("unsubscribeUser", () => {
		it("should successfully unsubscribe a user", async () => {
			// First subscribe a user
			await subscribeUser(mockSubscription);
			mockConsole.log.mockClear();

			// Then unsubscribe
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

		it("should return error when no subscriptions available", async () => {
			const result = await sendNotification(testMessage);

			expect(result).toEqual({
				success: false,
				error: "No subscriptions available",
			});
			expect(spySendNotification).not.toHaveBeenCalled();
		});

		it("should successfully send notification to single subscriber", async () => {
			spySendNotification.mockReturnValue(
				Promise.resolve({
					statusCode: 201,
					body: "Success",
					headers: {},
				}) as any,
			);

			// Subscribe a user first
			await subscribeUser(mockSubscription);

			const result = await sendNotification(testMessage);

			expect(spySendNotification).toHaveBeenCalledWith(
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

			spySendNotification.mockReturnValue(
				Promise.resolve({
					statusCode: 201,
					body: "Success",
					headers: {},
				}) as any,
			);

			// Subscribe multiple users
			await subscribeUser(mockSubscription);
			await subscribeUser(subscription2);

			const result = await sendNotification(testMessage);

			expect(spySendNotification).toHaveBeenCalledTimes(2);
			expect(result).toEqual({
				success: true,
				message: "Notifications sent to 2 subscribers (0 failed)",
			});
		});

		it("should handle send failures gracefully", async () => {
			spySendNotification.mockReturnValue(Promise.reject(new Error("Network error")) as any);

			await subscribeUser(mockSubscription);

			const result = await sendNotification(testMessage);

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
			const webPushError = new MockWebPushError("Gone", 410, {}, "Subscription expired");
			spySendNotification.mockReturnValue(Promise.reject(webPushError) as any);

			await subscribeUser(mockSubscription);

			// First call should fail and remove subscription
			const result1 = await sendNotification(testMessage);
			expect(result1.success).toBe(false);
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Invalid subscription removed:",
				mockSubscription.endpoint,
			);

			// Second call should return no subscriptions
			const result2 = await sendNotification(testMessage);
			expect(result2).toEqual({
				success: false,
				error: "No subscriptions available",
			});
		});

		it("should remove invalid subscriptions on 404 error", async () => {
			const webPushError = new MockWebPushError(
				"Not Found",
				404,
				{},
				"Subscription not found",
			);
			spySendNotification.mockReturnValue(Promise.reject(webPushError) as any);

			await subscribeUser(mockSubscription);

			const result = await sendNotification(testMessage);

			expect(result.success).toBe(false);
			expect(mockConsole.log).toHaveBeenCalledWith(
				"Invalid subscription removed:",
				mockSubscription.endpoint,
			);
		});

		it("should not remove subscriptions on other errors", async () => {
			const webPushError = new MockWebPushError(
				"Server Error",
				500,
				{},
				"Internal server error",
			);
			spySendNotification.mockReturnValue(Promise.reject(webPushError) as any);

			await subscribeUser(mockSubscription);

			const result1 = await sendNotification(testMessage);
			expect(result1.success).toBe(false);

			// Subscription should still exist
			spySendNotification.mockReturnValue(
				Promise.resolve({
					statusCode: 201,
					body: "Success",
					headers: {},
				}) as any,
			);

			const result2 = await sendNotification(testMessage);
			expect(result2.success).toBe(true);
		});

		it("should handle mixed success and failure scenarios", async () => {
			const subscription2: SerializablePushSubscription = {
				...mockSubscription,
				endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint-2",
			};

			await subscribeUser(mockSubscription);
			await subscribeUser(subscription2);

			// First call succeeds, second fails
			let callCount = 0;
			spySendNotification.mockImplementation(() => {
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

			const result = await sendNotification(testMessage);

			expect(result).toEqual({
				success: true,
				message: "Notifications sent to 1 subscribers (1 failed)",
			});
		});
	});

	describe("webpush configuration", () => {
		it("should configure webpush with correct VAPID details", async () => {
			await subscribeUser(mockSubscription);

			expect(spySetVapidDetails).toHaveBeenCalledWith(
				"mailto:ahmed.elywa@icloud.com",
				"test-vapid-public",
				"test-vapid-private",
			);
		});

		it("should configure webpush for each action", async () => {
			await subscribeUser(mockSubscription);
			await sendNotification("test");
			await unsubscribeUser(mockSubscription.endpoint);

			expect(spySetVapidDetails).toHaveBeenCalledTimes(3);
		});
	});
});
