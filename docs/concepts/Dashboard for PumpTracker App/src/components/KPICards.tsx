import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

interface KPICardsProps {
  avgBuildTime: number;
  shopEfficiency: number;
  onTimeOrders: number;
  lateOrders: number;
  totalOrders: number;
}

export function KPICards({
  avgBuildTime,
  shopEfficiency,
  onTimeOrders,
  lateOrders,
  totalOrders,
}: KPICardsProps) {
  const onTimePercentage = totalOrders > 0 ? (onTimeOrders / totalOrders) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Avg Build Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{avgBuildTime.toFixed(1)} days</div>
          <p className="text-muted-foreground mt-1">Per pump average</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Shop Efficiency</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">{shopEfficiency.toFixed(1)}%</div>
          <p className="text-muted-foreground mt-1">Current period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>On-Time Orders</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl">
            {onTimeOrders} <span className="text-muted-foreground">/ {totalOrders}</span>
          </div>
          <p className="text-muted-foreground mt-1">{onTimePercentage.toFixed(1)}% on schedule</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Late Orders</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-destructive">{lateOrders}</div>
          <p className="text-muted-foreground mt-1">Require attention</p>
        </CardContent>
      </Card>
    </div>
  );
}
