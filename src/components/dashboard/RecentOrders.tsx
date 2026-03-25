import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const orders = [
  { id: "ORD-1234", customer: "Warren Buffet", tickets: 2, total: "Rp 300,000", status: "Completed", date: "Today, 10:24 AM" },
  { id: "ORD-1235", customer: "Rusdi", tickets: 1, total: "Rp 150,000", status: "Pending", date: "Today, 09:15 AM" },
  { id: "ORD-1236", customer: "Jerome Polin", tickets: 4, total: "Rp 600,000", status: "Completed", date: "Yesterday" },
  { id: "ORD-1237", customer: "Milea", tickets: 2, total: "Rp 300,000", status: "Completed", date: "Yesterday" },
  { id: "ORD-1238", customer: "Joko Anwar", tickets: 5, total: "Rp 750,000", status: "Cancelled", date: "23 Apr 2026" },
  { id: "ORD-1239", customer: "Aldi Taher", tickets: 2, total: "Rp 300,000", status: "Completed", date: "22 Apr 2026" },
]

export function RecentOrders() {
  return (
    <Card className="col-span-1 shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Orders</CardTitle>
        <CardDescription>Latest ticket purchases across your events.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-center">Tickets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-border/50 hover:bg-muted/30">
                <TableCell className="font-medium text-primary cursor-pointer hover:underline">{order.id}</TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{order.customer}</div>
                  <div className="text-xs text-muted-foreground">{order.date}</div>
                </TableCell>
                <TableCell className="text-center">{order.tickets}</TableCell>
                <TableCell>
                  <Badge
                    variant={order.status === "Completed" ? "default" : order.status === "Pending" ? "secondary" : "destructive"}
                    className={
                      order.status === "Completed" ? "bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-none" :
                        order.status === "Pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-none border-none" :
                          "bg-red-100 text-red-800 hover:bg-red-200 shadow-none border-none"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
