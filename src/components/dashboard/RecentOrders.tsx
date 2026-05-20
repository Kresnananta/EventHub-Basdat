import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Loader2 } from "lucide-react"

type RecentOrderRow = {
  id: string
  status: string
  total_amount: number
  currency: string
  created_at: string
  profiles: {
    full_name: string | null
  } | null
}

type TicketRow = {
  order_id: string
}

type RuntimeTableQuery<T> = {
  select: (columns: string) => RuntimeTableQuery<T>
  in: (column: string, values: string[]) => Promise<{ data: T[] | null; error: unknown }>
}

type RuntimeSupabase = {
  from: <T>(table: string) => RuntimeTableQuery<T>
}

type RecentOrder = {
  id: string
  rawId: string
  customer: string
  tickets: number | "-"
  total: string
  status: string
  date: string
}

const runtimeSupabase = supabase as unknown as RuntimeSupabase

function formatOrderId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusBadgeClass(status: string) {
  if (status === "Completed" || status === "Paid") {
    return "bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-none"
  }

  if (status === "Pending") {
    return "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-none border-none"
  }

  return "bg-red-100 text-red-800 hover:bg-red-200 shadow-none border-none"
}

export function RecentOrders() {
  const { selectedEventId } = useEventContext()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<RecentOrder[]>([])

  useEffect(() => {
    async function fetchRecentOrders() {
      setLoading(true)

      let query = supabase
        .from("orders")
        .select(`
          id, status, total_amount, currency, created_at,
          profiles ( full_name )
        `)
        .order("created_at", { ascending: false })
        .limit(6)

      if (selectedEventId) {
        query = query.eq("event_id", selectedEventId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load recent orders:", error)
        setOrders([])
        setLoading(false)
        return
      }

      const orderRows = (data ?? []) as unknown as RecentOrderRow[]
      const orderIds = orderRows.map((order) => order.id)
      const ticketsRes = orderIds.length
        ? await runtimeSupabase.from<TicketRow>("tickets").select("order_id").in("order_id", orderIds)
        : { data: [] as TicketRow[], error: null }

      if (ticketsRes.error) {
        console.error("Failed to load recent order tickets:", ticketsRes.error)
      }

      const ticketCounts = new Map<string, number>()

      ;(ticketsRes.data ?? []).forEach((ticket) => {
        ticketCounts.set(ticket.order_id, (ticketCounts.get(ticket.order_id) ?? 0) + 1)
      })

      const formattedOrders = orderRows.map((order) => ({
        id: formatOrderId(order.id),
        rawId: order.id,
        customer: order.profiles?.full_name || "Unknown Buyer",
        tickets: ticketCounts.get(order.id) ?? ("-" as const),
        total: `${order.currency} ${order.total_amount.toLocaleString("id-ID")}`,
        status: formatStatus(order.status),
        date: formatDate(order.created_at),
      }))

      setOrders(formattedOrders)
      setLoading(false)
    }

    fetchRecentOrders()
  }, [selectedEventId])

  return (
    <Card className="col-span-1 shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Orders</CardTitle>
        <CardDescription>Latest ticket purchases across your events.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.rawId} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-medium text-primary cursor-pointer hover:underline">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">{order.date}</div>
                    </TableCell>
                    <TableCell className="text-center">{order.tickets}</TableCell>
                    <TableCell>
                      <Badge
                        variant={order.status === "Completed" || order.status === "Paid" ? "default" : order.status === "Pending" ? "secondary" : "destructive"}
                        className={getStatusBadgeClass(order.status)}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{order.total}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium">
                    Belum ada pesanan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
