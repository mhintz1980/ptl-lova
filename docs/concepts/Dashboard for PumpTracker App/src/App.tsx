import { useState, useMemo } from "react";
import { DashboardFilters } from "./components/DashboardFilters";
import { KPICards } from "./components/KPICards";
import { CustomerWorkloadChart } from "./components/CustomerWorkloadChart";
import { ModelDistributionChart } from "./components/ModelDistributionChart";
import { TimelineView } from "./components/TimelineView";
import { BuildTimeTrendsChart } from "./components/BuildTimeTrendsChart";
import { CapacityPlanningView } from "./components/CapacityPlanningView";
import { OrderDetailsTable } from "./components/OrderDetailsTable";
import { CollapsibleSection } from "./components/CollapsibleSection";
import { CustomerDrilldownChart } from "./components/CustomerDrilldownChart";
import { ModelDrilldownChart } from "./components/ModelDrilldownChart";
import { StatusDrilldownChart } from "./components/StatusDrilldownChart";
import { WorkloadDonutChart } from "./components/WorkloadDonutChart";
import { ModelTreemapChart } from "./components/ModelTreemapChart";
import {
  mockPurchaseOrders,
  getUniqueCustomers,
  getUniquePOs,
  getUniqueModels,
  PurchaseOrder,
} from "./lib/mockData";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function App() {
  const [selectedCustomers, setSelectedCustomers] = useState<
    string[]
  >([]);
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<
    string[]
  >([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    string[]
  >([]);
  const [progressRange, setProgressRange] = useState<[number, number]>([0, 100]);
  const [dueDateRange, setDueDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Get all unique values for filters
  const allCustomers = getUniqueCustomers(mockPurchaseOrders);
  const allPOs = getUniquePOs(mockPurchaseOrders);
  const allModels = getUniqueModels(mockPurchaseOrders);

  // Filter purchase orders based on selected filters
  const filteredOrders = useMemo(() => {
    return mockPurchaseOrders.filter((order) => {
      // Customer filter
      if (
        selectedCustomers.length > 0 &&
        !selectedCustomers.includes(order.customer)
      ) {
        return false;
      }

      // PO filter
      if (
        selectedPOs.length > 0 &&
        !selectedPOs.includes(order.poNumber)
      ) {
        return false;
      }

      // Model filter
      if (
        selectedModels.length > 0 &&
        !selectedModels.includes(order.model)
      ) {
        return false;
      }

      // Status filter
      if (
        selectedStatuses.length > 0 &&
        !selectedStatuses.includes(order.status)
      ) {
        return false;
      }

      // Progress filter
      const progress = (order.completed / order.quantity) * 100;
      if (progress < progressRange[0] || progress > progressRange[1]) {
        return false;
      }

      // Due Date range filter
      if (dueDateRange.from || dueDateRange.to) {
        const orderDueDate = new Date(order.dueDate);
        if (dueDateRange.from && orderDueDate < dueDateRange.from) {
          return false;
        }
        if (dueDateRange.to && orderDueDate > dueDateRange.to) {
          return false;
        }
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const orderDate = new Date(order.dueDate);
        if (dateRange.from && orderDate < dateRange.from) {
          return false;
        }
        if (dateRange.to && orderDate > dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }, [
    selectedCustomers,
    selectedPOs,
    selectedModels,
    selectedStatuses,
    progressRange,
    dueDateRange,
    dateRange,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalBuildTime = filteredOrders.reduce(
      (sum, order) =>
        sum + order.buildTimePerPump * order.quantity,
      0,
    );
    const totalPumps = filteredOrders.reduce(
      (sum, order) => sum + order.quantity,
      0,
    );
    const avgBuildTime =
      totalPumps > 0 ? totalBuildTime / totalPumps : 0;

    const completedPumps = filteredOrders.reduce(
      (sum, order) => sum + order.completed,
      0,
    );
    const shopEfficiency =
      totalPumps > 0 ? (completedPumps / totalPumps) * 100 : 0;

    const onTimeOrders = filteredOrders.filter(
      (order) => order.status === "on-time",
    ).length;
    const lateOrders = filteredOrders.filter(
      (order) => order.status === "late",
    ).length;

    return {
      avgBuildTime,
      shopEfficiency,
      onTimeOrders,
      lateOrders,
      totalOrders: filteredOrders.length,
    };
  }, [filteredOrders]);

  // Calculate customer workload data
  const customerWorkloadData = useMemo(() => {
    const customerMap = new Map<string, number>();
    let totalRemaining = 0;

    filteredOrders.forEach((order) => {
      const remaining = order.quantity - order.completed;
      totalRemaining += remaining;
      customerMap.set(
        order.customer,
        (customerMap.get(order.customer) || 0) + remaining,
      );
    });

    return Array.from(customerMap.entries())
      .map(([customer, value]) => ({
        customer,
        value,
        percentage:
          totalRemaining > 0
            ? (value / totalRemaining) * 100
            : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  // Calculate model distribution data
  const modelDistributionData = useMemo(() => {
    const modelMap = new Map<string, number>();
    let totalRemaining = 0;

    filteredOrders.forEach((order) => {
      const remaining = order.quantity - order.completed;
      totalRemaining += remaining;
      modelMap.set(
        order.model,
        (modelMap.get(order.model) || 0) + remaining,
      );
    });

    return Array.from(modelMap.entries())
      .map(([model, count]) => ({
        model,
        count,
        percentage:
          totalRemaining > 0
            ? (count / totalRemaining) * 100
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Prepare order details for table
  const orderDetails = useMemo(() => {
    return filteredOrders.map((order) => ({
      id: order.id,
      poNumber: order.poNumber,
      customer: order.customer,
      model: order.model,
      quantity: order.quantity,
      completed: order.completed,
      dueDate: new Date(order.dueDate).toLocaleDateString(),
      status: order.status,
    }));
  }, [filteredOrders]);

  // Prepare timeline data
  const timelineData = useMemo(() => {
    return filteredOrders.map((order) => ({
      id: order.id,
      poNumber: order.poNumber,
      customer: order.customer,
      model: order.model,
      startDate: order.startDate,
      dueDate: order.dueDate,
      completed: order.completed,
      quantity: order.quantity,
      status: order.status,
    }));
  }, [filteredOrders]);

  // Calculate remaining pumps for capacity planning
  const remainingPumps = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + (order.quantity - order.completed),
      0,
    );
  }, [filteredOrders]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <h1>PumpTracker Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage all open purchase orders
          </p>
        </div>

        {/* Filters - Sticky */}
        <div className="sticky top-0 z-40 bg-background pb-4 pt-2 -mt-2">
          <DashboardFilters
            customers={allCustomers}
            purchaseOrders={allPOs}
            models={allModels}
            selectedCustomers={selectedCustomers}
            selectedPOs={selectedPOs}
            selectedModels={selectedModels}
            selectedStatuses={selectedStatuses}
            progressRange={progressRange}
            dueDateRange={dueDateRange}
            dateRange={dateRange}
            onCustomerChange={setSelectedCustomers}
            onPOChange={setSelectedPOs}
            onModelChange={setSelectedModels}
            onStatusChange={setSelectedStatuses}
            onProgressRangeChange={setProgressRange}
            onDueDateRangeChange={setDueDateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* KPIs */}
        <CollapsibleSection
          title="Key Performance Indicators"
          defaultOpen={true}
        >
          <KPICards
            avgBuildTime={kpis.avgBuildTime}
            shopEfficiency={kpis.shopEfficiency}
            onTimeOrders={kpis.onTimeOrders}
            lateOrders={kpis.lateOrders}
            totalOrders={kpis.totalOrders}
          />
        </CollapsibleSection>

        {/* Charts */}
        <CollapsibleSection
          title="Workload Distribution"
          description="Overview of remaining work by customer and model"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomerWorkloadChart
              data={customerWorkloadData}
            />
            <ModelDistributionChart
              data={modelDistributionData}
            />
          </div>
        </CollapsibleSection>

        {/* 3D Drilldown Charts */}
        <CollapsibleSection
          title="Interactive 3D Drilldown Analysis"
          description="Click on segments to explore detailed breakdowns with animated 3D visualizations"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CustomerDrilldownChart orders={filteredOrders} />
            <ModelDrilldownChart orders={filteredOrders} />
            <StatusDrilldownChart orders={filteredOrders} />
          </div>
        </CollapsibleSection>

        {/* 3D Donut & Treemap Charts */}
        <CollapsibleSection
          title="3D Donut & Treemap Visualizations"
          description="Interactive circular and hierarchical views with multi-level drill-down"
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <WorkloadDonutChart orders={filteredOrders} />
            <ModelTreemapChart orders={filteredOrders} />
          </div>
        </CollapsibleSection>

        {/* Build Time Trends */}
        <CollapsibleSection
          title="Build Time Analysis"
          description="Historical trends and performance metrics"
          defaultOpen={true}
        >
          <BuildTimeTrendsChart
            selectedModels={selectedModels}
          />
        </CollapsibleSection>

        {/* Capacity Planning */}
        <CollapsibleSection
          title="Capacity Planning"
          description="Shop utilization and resource allocation"
          defaultOpen={true}
        >
          <CapacityPlanningView
            remainingPumps={remainingPumps}
            avgBuildTime={kpis.avgBuildTime}
          />
        </CollapsibleSection>

        {/* Timeline View */}
        <CollapsibleSection
          title="Order Timeline"
          description="Gantt view of all active orders"
          defaultOpen={false}
        >
          <TimelineView orders={timelineData} />
        </CollapsibleSection>

        {/* Detailed Table */}
        <CollapsibleSection
          title="Order Details"
          description="Detailed breakdown of all purchase orders"
          defaultOpen={false}
        >
          <OrderDetailsTable orders={orderDetails} />
        </CollapsibleSection>
      </div>
    </div>
  );
}