import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useMemo } from "react";

interface TimelineOrder {
  id: string;
  poNumber: string;
  customer: string;
  model: string;
  startDate: string;
  dueDate: string;
  completed: number;
  quantity: number;
  status: "on-time" | "at-risk" | "late";
}

interface TimelineViewProps {
  orders: TimelineOrder[];
}

export function TimelineView({ orders }: TimelineViewProps) {
  const { minDate, maxDate, dateRange } = useMemo(() => {
    if (orders.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
        dateRange: 90,
      };
    }

    const dates = orders.flatMap((order) => [
      new Date(order.startDate).getTime(),
      new Date(order.dueDate).getTime(),
    ]);

    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const range = (max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24);

    return {
      minDate: min,
      maxDate: max,
      dateRange: range,
    };
  }, [orders]);

  const getBarPosition = (startDate: string) => {
    const start = new Date(startDate).getTime();
    const min = minDate.getTime();
    const position = ((start - min) / (1000 * 60 * 60 * 24) / dateRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const getBarWidth = (startDate: string, dueDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(dueDate).getTime();
    const duration = (end - start) / (1000 * 60 * 60 * 24);
    const width = (duration / dateRange) * 100;
    return Math.max(2, Math.min(100, width));
  };

  const getProgressWidth = (completed: number, quantity: number) => {
    return (completed / quantity) * 100;
  };

  const getStatusColor = (status: TimelineOrder["status"]) => {
    switch (status) {
      case "on-time":
        return "bg-green-600";
      case "at-risk":
        return "bg-yellow-600";
      case "late":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const monthMarkers = useMemo(() => {
    const markers = [];
    const current = new Date(minDate);
    current.setDate(1);
    current.setHours(0, 0, 0, 0);

    while (current <= maxDate) {
      const position = getBarPosition(current.toISOString());
      if (position >= 0 && position <= 100) {
        markers.push({
          date: current.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          position,
        });
      }
      current.setMonth(current.getMonth() + 1);
    }

    return markers;
  }, [minDate, maxDate, dateRange]);

  const today = new Date();
  const todayPosition = getBarPosition(today.toISOString());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
        <CardDescription>Gantt chart showing order schedules and progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline header with month markers */}
          <div className="relative h-8 border-b border-border">
            {monthMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute text-muted-foreground"
                style={{ left: `${marker.position}%`, transform: "translateX(-50%)" }}
              >
                {marker.date}
              </div>
            ))}
          </div>

          {/* Timeline bars */}
          <div className="space-y-3 relative">
            {/* Today marker */}
            {todayPosition >= 0 && todayPosition <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                style={{ left: `${todayPosition}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs whitespace-nowrap">
                  Today
                </div>
              </div>
            )}

            {orders.map((order) => {
              const leftPos = getBarPosition(order.startDate);
              const barWidth = getBarWidth(order.startDate, order.dueDate);
              const progressWidth = getProgressWidth(order.completed, order.quantity);

              return (
                <div key={order.id} className="relative group">
                  <div className="flex items-center gap-3">
                    <div className="w-40 flex-shrink-0">
                      <div className="text-sm">{order.poNumber}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {order.customer}
                      </div>
                    </div>

                    <div className="flex-1 relative h-10">
                      {/* Background track */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-8 bg-muted rounded transition-all"
                        style={{
                          left: `${leftPos}%`,
                          width: `${barWidth}%`,
                        }}
                      >
                        {/* Progress bar */}
                        <div
                          className={`h-full rounded transition-all ${getStatusColor(
                            order.status
                          )}`}
                          style={{
                            width: `${progressWidth}%`,
                          }}
                        />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-popover border border-border rounded-lg p-3 shadow-lg whitespace-nowrap">
                          <div className="space-y-1">
                            <div>
                              <span className="text-muted-foreground">PO: </span>
                              {order.poNumber}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Model: </span>
                              {order.model}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Progress: </span>
                              {order.completed}/{order.quantity} ({progressWidth.toFixed(0)}%)
                            </div>
                            <div>
                              <span className="text-muted-foreground">Start: </span>
                              {new Date(order.startDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Due: </span>
                              {new Date(order.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-20 flex-shrink-0 text-right">
                      <Badge
                        variant={order.status === "on-time" ? "secondary" : "destructive"}
                        className={
                          order.status === "on-time"
                            ? "bg-green-600 text-white"
                            : order.status === "at-risk"
                            ? "bg-yellow-600 text-white"
                            : ""
                        }
                      >
                        {order.status === "on-time"
                          ? "On Time"
                          : order.status === "at-risk"
                          ? "At Risk"
                          : "Late"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders match the current filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
