import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface OrderDetail {
  id: string;
  poNumber: string;
  customer: string;
  model: string;
  quantity: number;
  completed: number;
  dueDate: string;
  status: "on-time" | "at-risk" | "late";
}

interface OrderDetailsTableProps {
  orders: OrderDetail[];
}

export function OrderDetailsTable({ orders }: OrderDetailsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: OrderDetail["status"]) => {
    switch (status) {
      case "on-time":
        return <Badge className="bg-green-600">On Time</Badge>;
      case "at-risk":
        return <Badge className="bg-yellow-600">At Risk</Badge>;
      case "late":
        return <Badge variant="destructive">Late</Badge>;
      default:
        return null;
    }
  };

  const getProgress = (completed: number, quantity: number) => {
    return ((completed / quantity) * 100).toFixed(0);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Purchase Order Details</CardTitle>
        <CardDescription>Detailed view of all open orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <>
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(order.id)}
                      className="h-8 w-8 p-0"
                    >
                      {expandedRows.has(order.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{order.poNumber}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.model}</TableCell>
                  <TableCell>
                    {order.completed} / {order.quantity} ({getProgress(order.completed, order.quantity)}%)
                  </TableCell>
                  <TableCell>{order.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                </TableRow>
                {expandedRows.has(order.id) && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-muted-foreground mb-1">Total Quantity</p>
                          <p>{order.quantity} pumps</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Completed</p>
                          <p>{order.completed} pumps</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Remaining</p>
                          <p>{order.quantity - order.completed} pumps</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Estimated Completion</p>
                          <p>
                            {order.status === "late"
                              ? "Overdue"
                              : new Date(
                                  new Date(order.dueDate).getTime() - 7 * 24 * 60 * 60 * 1000
                                ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
