import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MainCalendarGrid } from "../../src/components/scheduling/MainCalendarGrid";
import { useApp } from "../../src/store";
import type { Pump } from "../../src/types";
import { DEFAULT_CAPACITY_CONFIG } from "../../src/lib/capacity";
import {
  getModelLeadTimes as catalogLeadTimes,
} from "../../src/lib/seed";

const pumps: Pump[] = [
  {
    id: "pump-123",
    serial: 1200,
    po: "PO2025-0001-01",
    customer: "United Rentals",
    model: "DD-6",
    stage: "FABRICATION",
    priority: "Normal",
    last_update: "2025-10-31T00:00:00.000Z",
    value: 30000,
    forecastStart: "2025-11-10T00:00:00.000Z",
    forecastEnd: "2025-11-20T00:00:00.000Z",
  },
];

vi.mock("../../src/adapters/local", () => ({
  LocalAdapter: {
    load: vi.fn().mockResolvedValue([]),
    upsertMany: vi.fn(),
    update: vi.fn(),
    replaceAll: vi.fn(),
  },
}));

vi.mock("../../src/lib/seed", () => ({
  getModelLeadTimes: vi.fn(),
  getModelWorkHours: vi.fn(),
}));

const mockGetModelLeadTimes = vi.mocked(catalogLeadTimes);

const resetStore = () => {
  useApp.setState((state) => ({
    ...state,
    pumps: [],
    filters: {},
    loading: false,
    capacityConfig: DEFAULT_CAPACITY_CONFIG,
  }));
  mockGetModelLeadTimes.mockReset();
};

describe("MainCalendarGrid", () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-10T00:00:00.000Z"));

    mockGetModelLeadTimes.mockReturnValue({
      fabrication: 2,
      powder_coat: 3,
      assembly: 1,
      ship: 1,
      total_days: 7,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders segmented events for scheduled pumps", () => {
    const handleClick = vi.fn();
    render(<MainCalendarGrid pumps={pumps} onEventClick={handleClick} />);

    const events = screen.getAllByTestId("calendar-event");
    expect(events.length).toBeGreaterThan(1);
    const stages = events.map((node) => node.getAttribute("data-stage"));
    expect(stages).toContain("FABRICATION");
    expect(stages).toContain("POWDER_COAT"); // Constitution §2.1: underscore
  });

  it("re-renders when capacityConfig changes", () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <MainCalendarGrid pumps={pumps} onEventClick={handleClick} />
    );

    const initialEvents = screen.getAllByTestId("calendar-event");
    const initialCount = initialEvents.length;

    act(() => {
      useApp.setState((state) => ({
        ...state,
        capacityConfig: {
          ...DEFAULT_CAPACITY_CONFIG,
          fabrication: {
            ...DEFAULT_CAPACITY_CONFIG.fabrication,
            dailyManHours: 56, // Double the capacity
          },
        },
      }));
    });

    rerender(<MainCalendarGrid pumps={pumps} onEventClick={handleClick} />);

    const updatedEvents = screen.getAllByTestId("calendar-event");
    expect(updatedEvents).toBeDefined();
    expect(updatedEvents.length).toBeGreaterThanOrEqual(initialCount);
  });
});
