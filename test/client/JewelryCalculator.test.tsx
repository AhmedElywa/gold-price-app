import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

// Mock the hooks used by JewelryCalculator
mock.module("../../src/hooks/useGoldData", () => ({
	useGoldData: mock(() => ({
		data: null,
		loading: true,
		error: null,
		lastUpdated: null,
		refresh: mock(() => Promise.resolve()),
	})),
}));

mock.module("../../src/hooks/useSelectedCurrency", () => ({
	useSelectedCurrency: mock(() => "EGP"),
}));

mock.module("../../src/hooks/useTranslation", () => ({
	useTranslation: mock(() => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"gold.karats.24k": "24 Karat",
				"gold.karats.22k": "22 Karat",
				"gold.karats.21k": "21 Karat",
				"gold.karats.18k": "18 Karat",
				"common.loading": "Loading...",
			};
			return translations[key] ?? key;
		},
		locale: "en",
	})),
}));

// Must import after mock.module calls
import { useGoldData } from "../../src/hooks/useGoldData";
import { JewelryCalculator } from "../../src/components/jewelry-calculator";

const mockUseGoldData = useGoldData as ReturnType<typeof mock>;

describe("JewelryCalculator", () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		mockUseGoldData.mockImplementation(() => ({
			data: null,
			loading: true,
			error: null,
			lastUpdated: null,
			refresh: mock(() => Promise.resolve()),
		}));
	});

	it("should render without crashing when data is loading", () => {
		render(<JewelryCalculator />);

		expect(screen.getByText("Jewelry Price Calculator")).toBeInTheDocument();
		// Weight input has default value "10"
		expect(screen.getByDisplayValue("10")).toBeInTheDocument();
		// Should show Loading... for price per gram when loading
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("should render price calculations when data is available", () => {
		mockUseGoldData.mockImplementation(() => ({
			data: mockApiData,
			loading: false,
			error: null,
			lastUpdated: new Date(),
			refresh: mock(() => Promise.resolve()),
		}));

		render(<JewelryCalculator />);

		// Should display calculation summary
		expect(screen.getByText(/Calculation Summary/)).toBeInTheDocument();
		// Should show estimated total
		expect(screen.getByText("Estimated total")).toBeInTheDocument();
		// Should show price per gram
		expect(screen.getByText(/Price per gram/)).toBeInTheDocument();
		// Should NOT show Loading... since data is loaded
		expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
	});

	it("should update calculation when weight input changes", () => {
		mockUseGoldData.mockImplementation(() => ({
			data: mockApiData,
			loading: false,
			error: null,
			lastUpdated: new Date(),
			refresh: mock(() => Promise.resolve()),
		}));

		render(<JewelryCalculator />);

		const weightInput = screen.getByDisplayValue("10");
		expect(weightInput).toBeInTheDocument();

		// Change weight
		fireEvent.change(weightInput, { target: { value: "20" } });
		expect(weightInput).toHaveValue(20);
	});

	it("should update karat selection and change price", () => {
		mockUseGoldData.mockImplementation(() => ({
			data: mockApiData,
			loading: false,
			error: null,
			lastUpdated: new Date(),
			refresh: mock(() => Promise.resolve()),
		}));

		const { container } = render(<JewelryCalculator />);

		const karatSelect = container.querySelector("select") as HTMLSelectElement;
		expect(karatSelect).not.toBeNull();
		expect(karatSelect.value).toBe("21k");

		// Change karat to 24k
		fireEvent.change(karatSelect, { target: { value: "24k" } });
		expect(karatSelect.value).toBe("24k");
	});

	it("should update making charge percentage", () => {
		mockUseGoldData.mockImplementation(() => ({
			data: mockApiData,
			loading: false,
			error: null,
			lastUpdated: new Date(),
			refresh: mock(() => Promise.resolve()),
		}));

		render(<JewelryCalculator />);

		const makingInput = screen.getByDisplayValue("12");
		expect(makingInput).toBeInTheDocument();

		fireEvent.change(makingInput, { target: { value: "15" } });
		expect(makingInput).toHaveValue(15);
	});

	it("should display all four karat options", () => {
		const { container } = render(<JewelryCalculator />);

		const karatSelect = container.querySelector("select") as HTMLSelectElement;
		const options = karatSelect.querySelectorAll("option");

		expect(options.length).toBe(4);
		expect(options[0]?.value).toBe("24k");
		expect(options[1]?.value).toBe("22k");
		expect(options[2]?.value).toBe("21k");
		expect(options[3]?.value).toBe("18k");
	});
});
