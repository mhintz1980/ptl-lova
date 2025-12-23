import { useState, useMemo } from "react";
import { DrilldownChart3D, DrilldownSegment } from "./DrilldownChart3D";
import { PurchaseOrder } from "../lib/mockData";

interface CustomerDrilldownChartProps {
  orders: PurchaseOrder[];
}

const CUSTOMER_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // green
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
];

export function CustomerDrilldownChart({ orders }: CustomerDrilldownChartProps) {
  const [drilldownPath, setDrilldownPath] = useState<string[]>([]);

  // Group data by customer
  const customerData = useMemo(() => {
    const customerMap = new Map<string, { orders: PurchaseOrder[]; total: number }>();

    orders.forEach((order) => {
      if (!customerMap.has(order.customer)) {
        customerMap.set(order.customer, { orders: [], total: 0 });
      }
      const data = customerMap.get(order.customer)!;
      data.orders.push(order);
      data.total += order.quantity - order.completed;
    });

    return Array.from(customerMap.entries())
      .map(([customer, data], index) => ({
        customer,
        orders: data.orders,
        total: data.total,
        color: CUSTOMER_COLORS[index % CUSTOMER_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [orders]);

  // Get current view data based on drilldown path
  const currentData = useMemo((): DrilldownSegment[] => {
    if (drilldownPath.length === 0) {
      // Top level - show customers
      return customerData.map((data) => ({
        id: data.customer,
        label: data.customer,
        value: data.total,
        color: data.color,
        sublabel: `${data.orders.length} ${data.orders.length === 1 ? "order" : "orders"}`,
      }));
    } else if (drilldownPath.length === 1) {
      // Second level - show POs for selected customer
      const selectedCustomer = drilldownPath[0];
      const customerInfo = customerData.find((c) => c.customer === selectedCustomer);

      if (!customerInfo) return [];

      return customerInfo.orders.map((order) => ({
        id: order.id,
        label: order.poNumber,
        value: order.quantity - order.completed,
        color: customerInfo.color,
        sublabel: `${order.model} • Due: ${new Date(order.dueDate).toLocaleDateString()}`,
      }));
    } else if (drilldownPath.length === 2) {
      // Third level - show details for selected PO
      const selectedCustomer = drilldownPath[0];
      const selectedPO = drilldownPath[1];
      const customerInfo = customerData.find((c) => c.customer === selectedCustomer);
      const order = customerInfo?.orders.find((o) => o.poNumber === selectedPO);

      if (!order) return [];

      return [
        {
          id: "completed",
          label: "Completed",
          value: order.completed,
          color: "#10b981",
          sublabel: `${((order.completed / order.quantity) * 100).toFixed(1)}% done`,
        },
        {
          id: "remaining",
          label: "Remaining",
          value: order.quantity - order.completed,
          color: "#f59e0b",
          sublabel: `${(((order.quantity - order.completed) / order.quantity) * 100).toFixed(1)}% pending`,
        },
      ];
    }

    return [];
  }, [drilldownPath, customerData]);

  const handleSegmentClick = (segment: DrilldownSegment) => {
    if (drilldownPath.length === 0) {
      // Drilling into customer
      setDrilldownPath([segment.id]);
    } else if (drilldownPath.length === 1) {
      // Drilling into PO
      setDrilldownPath([...drilldownPath, segment.id]);
    }
    // At deepest level, no more drilling
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setDrilldownPath([]);
    } else {
      setDrilldownPath(drilldownPath.slice(0, index));
    }
  };

  const getTitle = () => {
    if (drilldownPath.length === 0) return "Customer Workload Analysis";
    if (drilldownPath.length === 1) return `Purchase Orders for ${drilldownPath[0]}`;
    if (drilldownPath.length === 2) return `Order Details: ${drilldownPath[1]}`;
    return "Customer Analysis";
  };

  return (
    <DrilldownChart3D
      data={currentData}
      title={getTitle()}
      onSegmentClick={drilldownPath.length < 2 ? handleSegmentClick : undefined}
      breadcrumbs={drilldownPath}
      onBreadcrumbClick={handleBreadcrumbClick}
      valueFormatter={(v) => `${v} pumps`}
    />
  );
}
