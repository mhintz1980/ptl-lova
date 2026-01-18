import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'

export function DashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 p-2 md:p-4 min-h-[calc(100vh-80px)]"
      data-testid="dashboard-skeleton"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: KPIs Skeleton */}
        <div className="flex items-center gap-2">
          {/* Simulate 3 KPI chips */}
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-lg" />
          ))}
        </div>

        {/* Right: Mode Toggles Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 grid-cols-12 grid-flow-dense auto-rows-min">
        {/* Simulate Overview Layout */}

        {/* Row 1: 4 small charts */}
        {[1, 2, 3].map((i) => (
          <div
            key={`row1-${i}`}
            className="col-span-12 md:col-span-4 h-[450px]"
          >
            <Card className="h-full w-full rounded-3xl border border-border/40 bg-card/50 p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <div className="flex-1 w-full bg-muted/5 rounded-xl flex items-center justify-center overflow-hidden">
                {/* Chart placeholder shape */}
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
            </Card>
          </div>
        ))}

        {/* Row 2: One large chart */}
        <div className="col-span-12 h-[300px]">
          <Card className="h-full w-full rounded-3xl border border-border/40 bg-card/50 p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex-1 w-full flex items-end justify-between gap-2 px-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton
                  key={i}
                  className={`w-full rounded-t-md`}
                  style={{ height: `${Math.random() * 80 + 10}%` }}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
