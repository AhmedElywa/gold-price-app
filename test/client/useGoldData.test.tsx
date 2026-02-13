import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, renderHook, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ApiResponseData } from "../../src/types/api";

const mockApiData: ApiResponseData = {
	source_data: {
		gold_price_usd_per_gram: {
			"24k": 85.0,
			"22k": 77.92,
			"21k": 74.38,
			"20k": 70.83,
			"18k": 63.75,
			"16k": 56.67,
			"14k": 49.58,
			"10k": 35.42,
		},
		exchange_rates: { EGP: 50.0, USD: 1.0 },
		market_data: {
			current_price: 2650.0,
			open_time: Date.now(),
			exchange: "goldprice.org",
			symbol: "XAUUSD",
		},
	},
	gold_prices_egp_per_gram: {
		"24k": 4250.0,
		"22k": 3895.83,
		"21k": 3718.75,
		"20k": 3541.67,
		"18k": 3187.5,
		"16k": 2833.33,
		"14k": 2479.17,
		"10k": 1770.83,
	},
	last_updated: new Date().toISOString(),
};

describe("useGoldData hook", () => {
	let mockFetch: ReturnType<typeof mock>;
	let originalFetch: typeof global.fetch;

	beforeEach(() => {
		originalFetch = global.fetch;
		mockFetch = mock(() =>
			Promise.resolve(
				new Response(JSON.stringify(mockApiData), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			),
		);
		global.fetch = mockFetch as typeof fetch;
	});

	afterEach(() => {
		cleanup();
		global.fetch = originalFetch;
	});

	it("should return the expected hook interface", async () => {
		const { useGoldData } = await import("../../src/hooks/useGoldData");
		const { result } = renderHook(() => useGoldData());

		expect(result.current).toHaveProperty("data");
		expect(result.current).toHaveProperty("loading");
		expect(result.current).toHaveProperty("error");
		expect(result.current).toHaveProperty("lastUpdated");
		expect(typeof result.current.refresh).toBe("function");
	});

	it("should seed shared state with initialData", async () => {
		const { useGoldData } = await import("../../src/hooks/useGoldData");
		const { result } = renderHook(() => useGoldData(mockApiData));

		// When initialData is provided, loading should be false and data should be present
		await waitFor(() => {
			expect(result.current.data).not.toBeNull();
			expect(result.current.loading).toBe(false);
		});
	});

	it("should trigger fetch for data refresh", async () => {
		const { useGoldData } = await import("../../src/hooks/useGoldData");
		renderHook(() => useGoldData());

		// The hook calls ensureRefreshLoop on subscribe, which calls fetchSharedData
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});
	});

	it("should share state between multiple hook instances", async () => {
		const { useGoldData } = await import("../../src/hooks/useGoldData");
		const { result: result1 } = renderHook(() => useGoldData(mockApiData));
		const { result: result2 } = renderHook(() => useGoldData());

		// Both instances should share the same data
		await waitFor(() => {
			expect(result1.current.data).toEqual(result2.current.data);
		});
	});

	it("should support manual refresh via returned function", async () => {
		const { useGoldData } = await import("../../src/hooks/useGoldData");
		const { result } = renderHook(() => useGoldData(mockApiData));

		// Wait for the initial fetch from ensureRefreshLoop to complete
		await waitFor(() => {
			expect(result.current.lastUpdated).not.toBeNull();
		});

		const callsBefore = mockFetch.mock.calls.length;

		await act(async () => {
			await result.current.refresh();
		});

		// refresh should trigger an additional fetch call
		expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
	});

	it("should handle fetch errors gracefully", async () => {
		// Make fetch fail
		global.fetch = mock(() => Promise.reject(new Error("Network error"))) as typeof fetch;

		const { useGoldData } = await import("../../src/hooks/useGoldData");
		const { result } = renderHook(() => useGoldData());

		await waitFor(() => {
			expect(result.current.error).not.toBeNull();
		});
	});
});
