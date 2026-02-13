import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import * as actions from "../../src/app/actions";
import { TestNotification } from "../../src/app/components/TestNotification";

// Mock the actions module
mock.module("../../src/app/actions", () => ({
	sendNotification: mock(() => Promise.resolve({ success: true, message: "" })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-vapid-public";

describe("TestNotification Component", () => {
	const mockSendNotification = actions.sendNotification as ReturnType<typeof mock>;

	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		mockSendNotification.mockClear();

		// Mock navigator and window APIs
		Object.defineProperty(navigator, "serviceWorker", {
			value: {
				getRegistration: mock(() =>
					Promise.resolve({
						pushManager: {
							getSubscription: mock(() => Promise.resolve(null)),
						},
					}),
				),
			},
			writable: true,
		});

		Object.defineProperty(window, "Notification", {
			value: {
				permission: "granted",
			},
			writable: true,
		});
	});

	describe("Rendering", () => {
		it("should render the test notification interface", async () => {
			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByText(/test push notification/i)).toBeInTheDocument();
			});

			expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /send notification/i })).toBeInTheDocument();
		});

		it("should not render during SSR", () => {
			const ReactDOMServer = require("react-dom/server.node");

			const html = ReactDOMServer.renderToString(<TestNotification />);

			expect(html).toBe("");
		});
	});

	describe("Message Input", () => {
		it("should update message state when typing", async () => {
			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			fireEvent.change(input, { target: { value: "Test message" } });

			expect(input).toHaveValue("Test message");
		});

		it("should clear input after successful send", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.resolve({
					success: true,
					message: "Notification sent successfully",
				}),
			);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test message" } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(mockSendNotification).toHaveBeenCalledWith("Test message");
			});

			await waitFor(() => {
				expect(input).toHaveValue("");
			});
		});
	});

	describe("Send Notification", () => {
		it("should send notification with message when button is clicked", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.resolve({
					success: true,
					message: "Notification sent successfully",
				}),
			);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, {
				target: { value: "Test notification message" },
			});
			fireEvent.click(button);

			await waitFor(() => {
				expect(mockSendNotification).toHaveBeenCalledWith("Test notification message");
			});
		});

		it("should show error when trying to send empty message", async () => {
			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /send notification/i })).toBeInTheDocument();
			});

			const button = screen.getByRole("button", { name: /send notification/i });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText(/please enter a message/i)).toBeInTheDocument();
			});

			expect(mockSendNotification).not.toHaveBeenCalled();
		});

		it("should show error when trying to send whitespace-only message", async () => {
			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "   " } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText(/please enter a message/i)).toBeInTheDocument();
			});

			expect(mockSendNotification).not.toHaveBeenCalled();
		});

		it("should show loading state while sending", async () => {
			let resolvePromise: (value: any) => void;
			const promise = new Promise<any>((resolve) => {
				resolvePromise = resolve;
			});

			mockSendNotification.mockImplementation(() => promise);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test message" } });
			fireEvent.click(button);

			// Should show loading state
			await waitFor(() => {
				expect(screen.getByText(/sending/i)).toBeInTheDocument();
			});

			expect(button).toBeDisabled();

			// Resolve the promise
			resolvePromise!({ success: true, message: "Sent successfully" });

			await waitFor(() => {
				expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
			});
		});
	});

	describe("Status Messages", () => {
		it("should show success message when notification sends successfully", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.resolve({
					success: true,
					message: "Notifications sent to 2 subscribers (0 failed)",
				}),
			);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test success" } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText(/notifications sent to 2 subscribers/i)).toBeInTheDocument();
			});

			// Status should have success styling
			const statusDiv = screen.getByText(/notifications sent to 2 subscribers/i).closest("div");
			expect(statusDiv).toHaveClass("bg-green-100", "text-green-800");
		});

		it("should show error message when notification fails", async () => {
			mockSendNotification.mockImplementation(() =>
				Promise.resolve({
					success: false,
					error: "No subscriptions available",
				}),
			);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test failure" } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText(/no subscriptions available/i)).toBeInTheDocument();
			});

			// Status should have error styling
			const statusDiv = screen.getByText(/no subscriptions available/i).closest("div");
			expect(statusDiv).toHaveClass("bg-red-100", "text-red-800");
		});

		it("should handle promise rejection", async () => {
			mockSendNotification.mockImplementation(() => Promise.reject(new Error("Network error")));

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test error" } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText(/network error/i)).toBeInTheDocument();
			});

			// Status should have error styling
			const statusDiv = screen.getByText(/network error/i).closest("div");
			expect(statusDiv).toHaveClass("bg-red-100", "text-red-800");
		});

		it("should handle unknown error types", async () => {
			mockSendNotification.mockImplementation(() => Promise.reject("Unknown error"));

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test unknown error" } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByText(/unknown error occurred/i)).toBeInTheDocument();
			});
		});
	});

	describe("UI Behavior", () => {
		it("should disable button during loading", async () => {
			let resolvePromise: (value: any) => void;
			const promise = new Promise<any>((resolve) => {
				resolvePromise = resolve;
			});

			mockSendNotification.mockImplementation(() => promise);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			fireEvent.change(input, { target: { value: "Test message" } });
			fireEvent.click(button);

			await waitFor(() => {
				expect(button).toBeDisabled();
			});

			resolvePromise!({ success: true, message: "Success" });

			await waitFor(() => {
				expect(button).not.toBeDisabled();
			});
		});

		it("should show different button styles for loading state", async () => {
			let resolvePromise: (value: any) => void;
			const promise = new Promise<any>((resolve) => {
				resolvePromise = resolve;
			});

			mockSendNotification.mockImplementation(() => promise);

			render(<TestNotification />);

			await waitFor(() => {
				expect(screen.getByPlaceholderText(/enter notification message/i)).toBeInTheDocument();
			});

			const input = screen.getByPlaceholderText(/enter notification message/i);
			const button = screen.getByRole("button", { name: /send notification/i });

			// Initial state
			expect(button).toHaveClass("bg-yellow-500", "hover:bg-yellow-600");

			fireEvent.change(input, { target: { value: "Test message" } });
			fireEvent.click(button);

			// Loading state
			await waitFor(() => {
				expect(button).toHaveClass("bg-gray-400", "cursor-not-allowed");
			});

			resolvePromise!({ success: true, message: "Success" });

			// Back to normal state
			await waitFor(() => {
				expect(button).toHaveClass("bg-yellow-500", "hover:bg-yellow-600");
			});
		});
	});

	describe("Position and Styling", () => {
		it("should render with correct positioning classes", async () => {
			render(<TestNotification />);

			await waitFor(() => {
				const container = document.querySelector(".fixed.top-4.min-w-80.end-4.z-50");
				expect(container).toBeInTheDocument();
			});
		});

		it("should have proper styling for the notification panel", async () => {
			render(<TestNotification />);

			await waitFor(() => {
				const panel = document.querySelector(".bg-white.bg-opacity-90.shadow-lg.rounded-lg");
				expect(panel).toBeInTheDocument();
			});
		});
	});
});
