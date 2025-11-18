import type { DashboardFilters } from "../../dashboard/config";

interface FilterBreadcrumbProps {
  filters: DashboardFilters;
  onClear: (key: keyof DashboardFilters) => void;
}

const FILTER_ENTRIES: Array<{
  key: keyof DashboardFilters;
  label: string;
}> = [
  { key: "stage", label: "Stage" },
  { key: "department", label: "Department" },
  { key: "customerId", label: "Customer" },
  { key: "modelId", label: "Model" },
];

export function FilterBreadcrumb({ filters, onClear }: FilterBreadcrumbProps) {
  const chips = FILTER_ENTRIES.filter(({ key }) => filters[key]);
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          onClick={() => onClear(key)}
        >
          {label}: {String(filters[key])}
        </button>
      ))}
    </div>
  );
}
