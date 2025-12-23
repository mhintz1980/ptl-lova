import { useState, useMemo } from "react";
import { DrilldownChart3D, DrilldownSegment } from "./DrilldownChart3D";
import { PurchaseOrder } from "../lib/mockData";

interface StatusDrilldownChartProps {
  orders: PurchaseOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  "on-time": "#10b981",
  "at-risk": "#f59e0b",
  late: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  "on-time": "On Time",
  "at-risk": "At Risk",
  late: "Late",
};

export function StatusDrilldownChart({ orders }: StatusDrilldownChartProps) {
  const [drilldownPath, setDrilldownPath] = useState<string[]>([]);

  // Group data by status
  const statusData = useMemo(() => {
    const statusMap = new Map<
      string,
      { orders: PurchaseOrder[]; total: number; customers: Set<string> }
    >();

    orders.forEach((order) => {
      if (!statusMap.has(order.status)) {
        statusMap.set(order.status, {
          orders: [],
          total: 0,
          customers: new Set(),
        });
      }
      const data = statusMap.get(order.status)!;
      data.orders.push(order);
      data.total += order.quantity - order.completed;
      data.customers.add(order.customer);
    });

    return Array.from(statusMap.entries())
      .map(([status, data]) => ({
        status,
        orders: data.orders,
        total: data.total,
        customerCount: data.customers.size,
        color: STATUS_COLORS[status] || "#64748b",
        label: STATUS_LABELS[status] || status,
      }))
      .sort((a, b) => {
        // Sort by priority: late, at-risk, on-time
        const priority = { late: 0, "at-risk": 1, "on-time": 2 };
        return (
          (priority[a.status as keyof typeof priority] || 3) -
          (priority[b.status as keyof typeof priority] || 3)
        );
      });
  }, [orders]);

  // Get current view data based on drilldown path
  const currentData = useMemo((): DrilldownSegment[] => {
    if (drilldownPath.length === 0) {
      // Top level - show status categories
      return statusData.map((data) => ({
        id: data.status,
        label: data.label,
        value: data.total,
        color: data.color,
        sublabel: `${data.orders.length} ${data.orders.length === 1 ? "order" : "orders"} • ${data.customerCount} ${data.customerCount === 1 ? "customer" : "customers"}`,
      }));
    } else if (drilldownPath.length === 1) {
      // Second level - show customers for selected status
      const selectedStatus = drilldownPath[0];
      const statusInfo = statusData.find((s) => s.status === selectedStatus);

      if (!statusInfo) return [];

      const customerMap = new Map<string, { orders: PurchaseOrder[]; total: number }>();
      statusInfo.orders.forEach((order) => {
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
          color: statusInfo.color,
          sublabel: `${data.orders.length} ${data.orders.length === 1 ? "order" : "orders"}`,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (drilldownPath.length === 2) {
      // Third level - show POs for selected customer and status
      const selectedStatus = drilldownPath[0];
      const selectedCustomer = drilldownPath[1];
      const statusInfo = statusData.find((s) => s.status === selectedStatus);
      const customerOrders = statusInfo?.orders.filter(
        (o) => o.customer === selectedCustomer
      );

      if (!customerOrders) return [];

      return customerOrders.map((order) => ({
        id: order.id,
        label: order.poNumber,
        value: order.quantity - order.completed,
        color: statusInfo?.color || "#64748b",
        sublabel: `${order.model} • Due: ${new Date(order.dueDate).toLocaleDateString()}`,
      }));
    }

    return [];
  }, [drilldownPath, statusData]);

  const handleSegmentClick = (segment: DrilldownSegment) => {
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
    if (drilldownPath.length === 0) return "Order Status Analysis";
    if (drilldownPath.length === 1) {
      const statusInfo = statusData.find((s) => s.status === drilldownPath[0]);
      return `${statusInfo?.label || drilldownPath[0]} Orders by Customer`;
    }
    if (drilldownPath.length === 2) {
      const statusInfo = statusData.find((s) => s.status === drilldownPath[0]);
      return `${statusInfo?.label || drilldownPath[0]} Orders for ${drilldownPath[1]}`;
    }
    return "Status Analysis";
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
