import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardFiltersProps {
  customers: string[];
  purchaseOrders: string[];
  models: string[];
  selectedCustomers: string[];
  selectedPOs: string[];
  selectedModels: string[];
  selectedStatuses: string[];
  progressRange: [number, number];
  dueDateRange: DateRange;
  dateRange: DateRange;
  onCustomerChange: (customers: string[]) => void;
  onPOChange: (pos: string[]) => void;
  onModelChange: (models: string[]) => void;
  onStatusChange: (statuses: string[]) => void;
  onProgressRangeChange: (range: [number, number]) => void;
  onDueDateRangeChange: (range: DateRange) => void;
  onDateRangeChange: (range: DateRange) => void;
}

const statusOptions = ["on-time", "at-risk", "late"];

export function DashboardFilters({
  customers,
  purchaseOrders,
  models,
  selectedCustomers,
  selectedPOs,
  selectedModels,
  selectedStatuses,
  progressRange,
  dueDateRange,
  dateRange,
  onCustomerChange,
  onPOChange,
  onModelChange,
  onStatusChange,
  onProgressRangeChange,
  onDueDateRangeChange,
  onDateRangeChange,
}: DashboardFiltersProps) {
  const [tempCustomer, setTempCustomer] = useState<string>("");
  const [tempPO, setTempPO] = useState<string>("");
  const [tempModel, setTempModel] = useState<string>("");
  const [tempStatus, setTempStatus] = useState<string>("");

  const handleAddCustomer = (value: string) => {
    if (value && !selectedCustomers.includes(value)) {
      onCustomerChange([...selectedCustomers, value]);
    }
    setTempCustomer("");
  };

  const handleAddPO = (value: string) => {
    if (value && !selectedPOs.includes(value)) {
      onPOChange([...selectedPOs, value]);
    }
    setTempPO("");
  };

  const handleAddModel = (value: string) => {
    if (value && !selectedModels.includes(value)) {
      onModelChange([...selectedModels, value]);
    }
    setTempModel("");
  };

  const handleAddStatus = (value: string) => {
    if (value && !selectedStatuses.includes(value)) {
      onStatusChange([...selectedStatuses, value]);
    }
    setTempStatus("");
  };

  const handleRemoveCustomer = (
    e: React.MouseEvent,
    customer: string,
  ) => {
    e.stopPropagation();
    onCustomerChange(
      selectedCustomers.filter((c) => c !== customer),
    );
  };

  const handleRemovePO = (e: React.MouseEvent, po: string) => {
    e.stopPropagation();
    onPOChange(selectedPOs.filter((p) => p !== po));
  };

  const handleRemoveModel = (
    e: React.MouseEvent,
    model: string,
  ) => {
    e.stopPropagation();
    onModelChange(selectedModels.filter((m) => m !== model));
  };

  const handleRemoveStatus = (
    e: React.MouseEvent,
    status: string,
  ) => {
    e.stopPropagation();
    onStatusChange(
      selectedStatuses.filter((s) => s !== status),
    );
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from && !range.to) return "Select date range";
    if (range.from && !range.to) {
      return range.from.toLocaleDateString();
    }
    if (range.from && range.to) {
      return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;
    }
    return "Select date range";
  };

  const formatStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "on-time": "On Time",
      "at-risk": "At Risk",
      late: "Late",
    };
    return labels[status] || status;
  };

  const hasActiveFilters =
    selectedCustomers.length > 0 ||
    selectedPOs.length > 0 ||
    selectedModels.length > 0 ||
    selectedStatuses.length > 0 ||
    progressRange[0] !== 0 ||
    progressRange[1] !== 100 ||
    dueDateRange.from ||
    dateRange.from;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Filter */}
        <div>
          <label className="block mb-2">Customers</label>
          <Select
            value={tempCustomer}
            onValueChange={handleAddCustomer}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customers" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer} value={customer}>
                  {customer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Purchase Order Filter */}
        <div>
          <label className="block mb-2">Purchase Orders</label>
          <Select value={tempPO} onValueChange={handleAddPO}>
            <SelectTrigger>
              <SelectValue placeholder="Select POs" />
            </SelectTrigger>
            <SelectContent>
              {purchaseOrders.map((po) => (
                <SelectItem key={po} value={po}>
                  {po}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Filter */}
        <div>
          <label className="block mb-2">Models</label>
          <Select
            value={tempModel}
            onValueChange={handleAddModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select models" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block mb-2">Status</label>
          <Select
            value={tempStatus}
            onValueChange={handleAddStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress Range Filter */}
        <div>
          <label className="block mb-2">
            Progress: {progressRange[0]}% - {progressRange[1]}%
          </label>
          <div className="pt-2">
            <Slider
              value={progressRange}
              onValueChange={(value) =>
                onProgressRangeChange(value as [number, number])
              }
              min={0}
              max={100}
              step={5}
              minStepsBetweenThumbs={1}
            />
          </div>
        </div>

        {/* Due Date Range Filter */}
        <div>
          <label className="block mb-2">Due Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange(dueDateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
            >
              <Calendar
                mode="range"
                selected={{
                  from: dueDateRange.from,
                  to: dueDateRange.to,
                }}
                onSelect={(range) => {
                  onDueDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block mb-2">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange(dateRange)}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
            >
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-muted-foreground">
            Active filters:
          </span>
          {selectedCustomers.map((customer) => (
            <Badge
              key={customer}
              variant="secondary"
              className="gap-1"
            >
              {customer}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) =>
                  handleRemoveCustomer(e, customer)
                }
              />
            </Badge>
          ))}
          {selectedPOs.map((po) => (
            <Badge
              key={po}
              variant="secondary"
              className="gap-1"
            >
              {po}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => handleRemovePO(e, po)}
              />
            </Badge>
          ))}
          {selectedModels.map((model) => (
            <Badge
              key={model}
              variant="secondary"
              className="gap-1"
            >
              {model}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => handleRemoveModel(e, model)}
              />
            </Badge>
          ))}
          {selectedStatuses.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="gap-1"
            >
              {formatStatusLabel(status)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => handleRemoveStatus(e, status)}
              />
            </Badge>
          ))}
          {(progressRange[0] !== 0 ||
            progressRange[1] !== 100) && (
            <Badge variant="secondary" className="gap-1">
              Progress: {progressRange[0]}%-{progressRange[1]}%
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onProgressRangeChange([0, 100]);
                }}
              />
            </Badge>
          )}
          {dueDateRange.from && (
            <Badge variant="secondary" className="gap-1">
              Due: {formatDateRange(dueDateRange)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDueDateRangeChange({
                    from: undefined,
                    to: undefined,
                  });
                }}
              />
            </Badge>
          )}
          {dateRange.from && (
            <Badge variant="secondary" className="gap-1">
              Date: {formatDateRange(dateRange)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDateRangeChange({
                    from: undefined,
                    to: undefined,
                  });
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}