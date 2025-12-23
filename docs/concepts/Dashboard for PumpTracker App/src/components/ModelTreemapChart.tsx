import { useState, useMemo } from "react";
import { DrilldownTreemapChart, TreemapSegment } from "./DrilldownTreemapChart";
import { PurchaseOrder } from "../lib/mockData";

interface ModelTreemapChartProps {
  orders: PurchaseOrder[];
}

const MODEL_COLORS: Record<string, string> = {
  "Model A": "#3b82f6",
  "Model B": "#8b5cf6",
  "Model C": "#ec4899",
  "Model D": "#f59e0b",
  "Model E": "#10b981",
};

const STATUS_COLORS: Record<string, string> = {
  "on-time": "#10b981",
  "at-risk": "#f59e0b",
  late: "#ef4444",
};

export function ModelTreemapChart({ orders }: ModelTreemapChartProps) {
  const [drilldownPath, setDrilldownPath] = useState<string[]>([]);

  // Group data by model
  const modelData = useMemo(() => {
    const modelMap = new Map<
      string,
      { orders: PurchaseOrder[]; total: number; customers: Set<string> }
    >();

    orders.forEach((order) => {
      if (!modelMap.has(order.model)) {
        modelMap.set(order.model, {
          orders: [],
          total: 0,
          customers: new Set(),
        });
      }
      const data = modelMap.get(order.model)!;
      data.orders.push(order);
      data.total += order.quantity - order.completed;
      data.customers.add(order.customer);
    });

    return Array.from(modelMap.entries())
      .map(([model, data]) => ({
        model,
        orders: data.orders,
        total: data.total,
        customerCount: data.customers.size,
        color: MODEL_COLORS[model] || "#64748b",
      }))
      .sort((a, b) => b.total - a.total);
  }, [orders]);

  // Get current view data based on drilldown path
  const currentData = useMemo((): TreemapSegment[] => {
    if (drilldownPath.length === 0) {
      // Top level - show models
      return modelData.map((data) => ({
        id: data.model,
        label: data.model,
        value: data.total,
        color: data.color,
        sublabel: `${data.orders.length} orders across ${data.customerCount} customers`,
      }));
    } else if (drilldownPath.length === 1) {
      // Second level - show customers for selected model
      const selectedModel = drilldownPath[0];
      const modelInfo = modelData.find((m) => m.model === selectedModel);

      if (!modelInfo) return [];

      const customerMap = new Map<string, { orders: PurchaseOrder[]; total: number }>();
      modelInfo.orders.forEach((order) => {
        if (!customerMap.has(order.customer)) {
          customerMap.set(order.customer, { orders: [], total: 0 });
        }
        const data = customerMap.get(order.customer)!;
        data.orders.push(order);
        data.total += order.quantity - order.completed;
      });

      return Array.from(customerMap.entries())
        .map(([customer, data]) => ({
          id: customer,
          label: customer,
          value: data.total,
          color: modelInfo.color,
          sublabel: `${data.orders.length} ${data.orders.length === 1 ? "order" : "orders"}`,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (drilldownPath.length === 2) {
      // Third level - show order status breakdown for selected customer and model
      const selectedModel = drilldownPath[0];
      const selectedCustomer = drilldownPath[1];
      const modelInfo = modelData.find((m) => m.model === selectedModel);
      const customerOrders = modelInfo?.orders.filter(
        (o) => o.customer === selectedCustomer
      );

      if (!customerOrders) return [];

      // Group by status
      const statusMap = new Map<string, number>();
      customerOrders.forEach((order) => {
        const remaining = order.quantity - order.completed;
        statusMap.set(order.status, (statusMap.get(order.status) || 0) + remaining);
      });

      return Array.from(statusMap.entries()).map(([status, value]) => ({
        id: status,
        label: status === "on-time" ? "On Time" : status === "at-risk" ? "At Risk" : "Late",
        value,
        color: STATUS_COLORS[status] || "#64748b",
        sublabel: `${customerOrders.filter((o) => o.status === status).length} orders`,
      }));
    }

    return [];
  }, [drilldownPath, modelData]);

  const handleSegmentClick = (segment: TreemapSegment) => {
    if (drilldownPath.length < 2) {
      setDrilldownPath([...drilldownPath, segment.id]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setDrilldownPath([]);
    } else {
      setDrilldownPath(drilldownPath.slice(0, index));
    }
  };

  const getTitle = () => {
    if (drilldownPath.length === 0) return "Model Distribution";
    if (drilldownPath.length === 1) return `${drilldownPath[0]} by Customer`;
    if (drilldownPath.length === 2)
      return `${drilldownPath[0]} Status for ${drilldownPath[1]}`;
    return "Model Analysis";
  };

  return (
    <DrilldownTreemapChart
      data={currentData}
      title={getTitle()}
      onSegmentClick={drilldownPath.length < 2 ? handleSegmentClick : undefined}
      breadcrumbs={drilldownPath}
      onBreadcrumbClick={handleBreadcrumbClick}
      valueFormatter={(v) => `${v} pumps`}
    />
  );
}
