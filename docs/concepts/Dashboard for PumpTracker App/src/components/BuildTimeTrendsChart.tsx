import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "./ui/button";
import { mockBuildTimeTrends } from "../lib/mockData";

interface BuildTimeTrendsChartProps {
  selectedModels?: string[];
}

export function BuildTimeTrendsChart({ selectedModels = [] }: BuildTimeTrendsChartProps) {
  const [viewMode, setViewMode] = useState<"all" | "individual">("all");

  const chartData = mockBuildTimeTrends.map((trend) => ({
    date: new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Model A": trend.modelA,
    "Model B": trend.modelB,
    "Model C": trend.modelC,
    "Model D": trend.modelD,
    "Model E": trend.modelE,
    Average: trend.average,
  }));

  const modelColors = {
    "Model A": "hsl(var(--chart-1))",
    "Model B": "hsl(var(--chart-2))",
    "Model C": "hsl(var(--chart-3))",
    "Model D": "hsl(var(--chart-4))",
    "Model E": "hsl(var(--chart-5))",
    Average: "hsl(var(--foreground))",
  };

  const visibleModels =
    selectedModels.length > 0
      ? selectedModels
      : ["Model A", "Model B", "Model C", "Model D", "Model E"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Build Time Trends</CardTitle>
            <CardDescription>Average build time per pump over time (in days)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("all")}
            >
              Show Average
            </Button>
            <Button
              variant={viewMode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("individual")}
            >
              By Model
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
            <YAxis
              stroke="hsl(var(--foreground))"
              label={{ value: "Days", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />

            {viewMode === "all" ? (
              <Line
                type="monotone"
                dataKey="Average"
                stroke={modelColors.Average}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ) : (
              <>
                {visibleModels.includes("Model A") && (
                  <Line
                    type="monotone"
                    dataKey="Model A"
                    stroke={modelColors["Model A"]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
                {visibleModels.includes("Model B") && (
                  <Line
                    type="monotone"
                    dataKey="Model B"
                    stroke={modelColors["Model B"]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
                {visibleModels.includes("Model C") && (
                  <Line
                    type="monotone"
                    dataKey="Model C"
                    stroke={modelColors["Model C"]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
                {visibleModels.includes("Model D") && (
                  <Line
                    type="monotone"
                    dataKey="Model D"
                    stroke={modelColors["Model D"]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
                {visibleModels.includes("Model E") && (
                  <Line
                    type="monotone"
                    dataKey="Model E"
                    stroke={modelColors["Model E"]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Summary statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-muted-foreground mb-1">Current Average</p>
            <p>
              {chartData[chartData.length - 1]?.Average.toFixed(1)} days
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Trend</p>
            <p className="text-green-600">
              ↓ {((chartData[0]?.Average - chartData[chartData.length - 1]?.Average) / chartData[0]?.Average * 100).toFixed(1)}% improvement
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Best Model</p>
            <p>Model C (4.8 days avg)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
