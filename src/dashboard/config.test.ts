import { describe, expect, it } from "vitest";
import { CHART_REGISTRY, TOPIC_CONFIGS } from "./config";

describe("dashboard config", () => {
  it("maps every topic chartId to a registered chart", () => {
    const chartIds = new Set(Object.keys(CHART_REGISTRY));
    const invalid = TOPIC_CONFIGS.flatMap((topic) =>
      topic.chartIds.filter((id) => !chartIds.has(id))
    );
    expect(invalid).toHaveLength(0);
  });
});
