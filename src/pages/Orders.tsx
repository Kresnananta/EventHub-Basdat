import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, FileDown } from "lucide-react"

const orders = [
  { id: "ORD-1234", customer: "Warren Buffet", email: "warren@example.com", event: "Google I/O 2026", tickets: 2, total: "Rp 3,000,000", status: "Completed", date: "Today, 10:24 AM" },
  { id: "ORD-1235", customer: "Rusdi", email: "rusdi@example.com", event: "Google I/O 2026", tickets: 1, total: "Rp 750,000", status: "Pending", date: "Today, 09:15 AM" },
  { id: "ORD-1236", customer: "Jerome Polin", email: "jerome@example.com", event: "Tech Startup Conference", tickets: 4, total: "Rp 3,000,000", status: "Completed", date: "Yesterday" },
  { id: "ORD-1237", customer: "Milea", email: "milea@example.com", event: "Google I/O 2026", tickets: 2, total: "Rp 1,500,000", status: "Completed", date: "Yesterday" },
  { id: "ORD-1238", customer: "Joko Anwar", email: "joko@example.com", event: "Tech Startup Conference", tickets: 5, total: "Rp 2,500,000", status: "Cancelled", date: "23 Apr 2026" },
  { id: "ORD-1239", customer: "Aldi Taher", email: "aldi@example.com", event: "Google I/O 2026", tickets: 2, total: "Rp 1,500,000", status: "Completed", date: "22 Apr 2026" },
]

export function Orders() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Order Management</h2>
          <p className="text-muted-foreground mt-1">Manage order and transaction of your event</p>
        </div>
        <div>
          <Button variant="outline" className="gap-2 bg-white font-medium shadow-sm">
            <FileDown size={16} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Buying Table */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4 border-b border-border/50 mb-4 mx-6 px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>Order history in your system</CardDescription>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search ID, Email, or Name"
                  className="w-full pl-8 bg-slate-50 border-border/50 focus-visible:ring-primary/50"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0 bg-white">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-center">Tickets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="pointer-events-auto">
              {orders.map((order) => (
                <TableRow key={order.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-semibold text-primary cursor-pointer hover:underline">{order.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{order.customer}</div>
                    <div className="text-xs text-muted-foreground">{order.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.event}</TableCell>
                  <TableCell className="text-center font-medium">{order.tickets}</TableCell>
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
                  <TableCell className="text-right font-semibold">{order.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}