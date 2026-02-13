import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock next/server before importing the route handler
mock.module("next/server", () => ({
	NextResponse: {
		json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
			return new Response(JSON.stringify(body), {
				status: init?.status ?? 200,
				headers: { "content-type": "application/json", ...init?.headers },
			});
		},
	},
}));

import { GET } from "../../src/app/api/cron/update-prices/route";

const TEST_CRON_SECRET = "test-cron-secret";

describe("Cron Update Prices Auth", () => {
	beforeEach(() => {
		process.env.CRON_SECRET = TEST_CRON_SECRET;
	});

	it("should return 401 without Authorization header", async () => {
		const request = new Request("http://localhost/api/cron/update-prices");
		const response = await GET(request);

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Unauthorized");
	});

	it("should return 401 with wrong bearer token", async () => {
		const request = new Request("http://localhost/api/cron/update-prices", {
			headers: { Authorization: "Bearer wrong-token" },
		});
		const response = await GET(request);

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Unauthorized");
	});

	it("should return 401 when CRON_SECRET is not set", async () => {
		delete process.env.CRON_SECRET;

		const request = new Request("http://localhost/api/cron/update-prices", {
			headers: { Authorization: "Bearer some-token" },
		});
		const response = await GET(request);

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Unauthorized");
	});

	it("should attempt to fetch gold prices with correct bearer token", async () => {
		const mockGoldPriceData = {
			source_data: {
				gold_price_usd_per_gram: { "24k": 85.0 },
				exchange_rates: { EGP: 50.0 },
				market_data: { current_price: 2650.0 },
			},
			gold_prices_egp_per_gram: { "24k": 4250.0 },
			last_updated: new Date().toISOString(),
		};

		const mockFetch = mock(() =>
			Promise.resolve(
				new Response(JSON.stringify(mockGoldPriceData), {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			),
		);
		global.fetch = mockFetch as typeof fetch;

		const request = new Request("http://localhost/api/cron/update-prices", {
			headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` },
		});
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.success).toBe(true);
		expect(body.message).toBe("Gold price update triggered");
		expect(body.currentPrice).toBe(2650.0);
		expect(mockFetch).toHaveBeenCalledTimes(1);

		// Verify the fetch URL targets the gold-prices-egp endpoint
		const fetchCall = mockFetch.mock.calls[0];
		const fetchUrl = fetchCall?.[0];
		expect(fetchUrl?.toString()).toContain("/api/gold-prices-egp");

		// Restore global fetch
		global.fetch = mock(() => Promise.resolve(new Response())) as typeof fetch;
	});

	it("should return 500 when gold price fetch fails", async () => {
		const mockFetch = mock(() =>
			Promise.resolve(new Response("Internal Server Error", { status: 500 })),
		);
		global.fetch = mockFetch as typeof fetch;

		const request = new Request("http://localhost/api/cron/update-prices", {
			headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` },
		});
		const response = await GET(request);

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toBe("Failed to update gold prices");

		// Restore global fetch
		global.fetch = mock(() => Promise.resolve(new Response())) as typeof fetch;
	});
});
