import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, ClipboardList } from "lucide-react";
import type { Order, OrderStatus } from "@shared/schema";

export default function Archive() {
  const [filterStatus, setFilterStatus] = useState<"completed" | "cancelled" | "all">("all");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter(
    (order) => order.status === "completed" || order.status === "cancelled"
  ).filter(
    (order) => filterStatus === "all" || order.status === filterStatus
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "completed":
        return "bg-gray-500/10 text-gray-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading archived orders...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Archived Orders</h1>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as "completed" | "cancelled" | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Archived</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {filteredOrders?.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-4">
                    <div>
                      Order #{order.id.slice(-6)}
                      <Badge
                        variant="secondary"
                        className={`ml-2 capitalize ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-base font-normal text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {order.phoneNumber}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {order.type === "dine-in"
                      ? `Table ${order.tableNumber}`
                      : `Takeaway - ${order.customerName}`}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            × {item.quantity}
                          </span>
                          {item.specialInstructions && (
                            <p className="text-sm text-muted-foreground">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span>
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div className="font-medium">
                      Total: ${(order.total / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
