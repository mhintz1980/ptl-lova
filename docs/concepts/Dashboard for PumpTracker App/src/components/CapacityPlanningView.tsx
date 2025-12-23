import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
  ReferenceLine,
  Cell,
} from "recharts";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { mockCapacityData } from "../lib/mockData";

interface CapacityPlanningViewProps {
  remainingPumps: number;
  avgBuildTime: number;
}

export function CapacityPlanningView({
  remainingPumps,
  avgBuildTime,
}: CapacityPlanningViewProps) {
  const chartData = mockCapacityData;

  // Calculate capacity metrics
  const metrics = useMemo(() => {
    const currentWeek = chartData[0];
    const nextWeek = chartData[1];
    
    const avgUtilization =
      chartData.slice(0, 3).reduce((sum, week) => sum + week.utilization, 0) / 3;
    
    const overCapacityWeeks = chartData.filter(
      (week) => week.scheduledWork > week.totalCapacity
    ).length;

    const availableCapacity = chartData.reduce(
      (sum, week) => sum + (week.totalCapacity - week.scheduledWork),
      0
    );

    const estimatedWeeksToComplete = avgBuildTime > 0 
      ? Math.ceil(remainingPumps / (currentWeek.totalCapacity / avgBuildTime))
      : 0;

    return {
      avgUtilization,
      overCapacityWeeks,
      availableCapacity,
      estimatedWeeksToComplete,
      currentUtilization: currentWeek.utilization,
      nextWeekCapacity: nextWeek.totalCapacity - nextWeek.scheduledWork,
    };
  }, [chartData, remainingPumps, avgBuildTime]);

  // Calculate model-specific capacity allocation
  const modelAllocation = useMemo(() => {
    const models = [
      { name: "Model A", percentage: 35, pumps: Math.round(remainingPumps * 0.35) },
      { name: "Model B", percentage: 25, pumps: Math.round(remainingPumps * 0.25) },
      { name: "Model C", percentage: 20, pumps: Math.round(remainingPumps * 0.20) },
      { name: "Model D", percentage: 10, pumps: Math.round(remainingPumps * 0.10) },
      { name: "Model E", percentage: 10, pumps: Math.round(remainingPumps * 0.10) },
    ];
    return models;
  }, [remainingPumps]);

  return (
    <div className="space-y-6">
      {/* Alerts for capacity issues */}
      {metrics.overCapacityWeeks > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: {metrics.overCapacityWeeks} week(s) have scheduled work exceeding shop
            capacity. Consider reallocating resources or adjusting timelines.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.avgUtilization.toFixed(1)}%</div>
            <p className="text-muted-foreground mt-1">Last 3 weeks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Available Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.availableCapacity} pumps</div>
            <p className="text-muted-foreground mt-1">Total remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Est. Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{metrics.estimatedWeeksToComplete} weeks</div>
            <p className="text-muted-foreground mt-1">At current pace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Next Week Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">
              {metrics.nextWeekCapacity} pumps
            </div>
            <p className="text-muted-foreground mt-1">Still available</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Capacity vs Scheduled Work</CardTitle>
          <CardDescription>
            Weekly capacity planning showing total capacity, scheduled work, and actual
            completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--foreground))" />
              <YAxis
                stroke="hsl(var(--foreground))"
                label={{ value: "Pumps", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <ReferenceLine
                y={50}
                stroke="hsl(var(--destructive))"
                strokeDasharray="3 3"
                label="Max Capacity"
              />
              <Bar
                dataKey="totalCapacity"
                fill="hsl(var(--muted))"
                name="Total Capacity"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="scheduledWork"
                fill="hsl(var(--chart-1))"
                name="Scheduled Work"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="actualWork"
                fill="hsl(var(--chart-2))"
                name="Actual Work"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                name="Utilization %"
                yAxisId={0}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resource Allocation by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Allocation by Model</CardTitle>
          <CardDescription>
            Distribution of shop resources across pump models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelAllocation} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}% (${props.payload.pumps} pumps)`,
                  "Allocation",
                ]}
              />
              <Legend />
              <Bar dataKey="percentage" fill="hsl(var(--chart-1))" radius={[0, 8, 8, 0]} name="Percentage">
                {modelAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Recommendations */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <h4>Capacity Recommendations</h4>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Current utilization is healthy at {metrics.avgUtilization.toFixed(0)}%</li>
                  <li>
                    Consider front-loading Model A production due to high volume ({modelAllocation[0].pumps} units)
                  </li>
                  {metrics.overCapacityWeeks > 0 && (
                    <li className="text-destructive">
                      Address over-capacity weeks by redistributing work or adding shifts
                    </li>
                  )}
                  {metrics.nextWeekCapacity > 10 && (
                    <li>
                      Next week has {metrics.nextWeekCapacity} pumps of spare capacity - opportunity
                      to accelerate priority orders
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
