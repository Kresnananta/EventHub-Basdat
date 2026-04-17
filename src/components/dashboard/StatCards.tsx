import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Ticket, ShoppingBag, Eye, Loader2 } from "lucide-react"

export function StatCards() {
  const { selectedEventId } = useEventContext()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    sales: 0,
    orders: 0,
    ticketsSold: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)

      let ordersQuery = supabase.from('orders').select('total_amount, status, event_id')
      let ticketsQuery = supabase.from('tickets').select('sold, event_id')

      if (selectedEventId) {
        ordersQuery = ordersQuery.eq('event_id', selectedEventId)
        ticketsQuery = ticketsQuery.eq('event_id', selectedEventId)
      }

      const [ordersRes, ticketRes] = await Promise.all([ordersQuery, ticketsQuery])

      let totalSales = 0
      let totalOrders = 0
      if (ordersRes.data) {
        ordersRes.data.forEach((o) => {
          if (o.status?.toLowerCase() === 'paid' || o.status?.toLowerCase() === 'completed') {
            totalSales += Number(o.total_amount || 0)
            totalOrders++
          }
        })
      }

      let soldTickets = 0
      if (ticketRes.data) {
        ticketRes.data.forEach((t) => {
          soldTickets += Number(t.sold || 0)
        })
      }

      setStats({
        sales: totalOrders,
        orders: totalOrders,
        ticketsSold: soldTickets
      })

      setLoading(false)
    }
    fetchStats()
  }, [selectedEventId])
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

      {/* total revenue */}
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Sales Volume</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2" /> : (
            <>
              <div className="text-3xl font-bold text-foreground mt-2">Rp {(stats.sales / 1000).toLocaleString('id-ID')}K</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5">+--%</span>
                from last month
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Total Orders */}
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Total Orders</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2" /> : (
            <>
              <div className="text-3xl font-bold text-foreground mt-2">{stats.orders}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5">+--%</span>
                from last month
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tickets Sold */}
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Tickets Sold</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <Ticket className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2" /> : (
            <>
              <div className="text-3xl font-bold text-foreground mt-2">{stats.ticketsSold}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5">+--%</span>
                from last month
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Event Views */}
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Event Views</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-2" /> : (
            <>
              <div className="text-3xl font-bold text-foreground mt-2">2,845</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-red-600 font-medium bg-red-100 px-1.5 py-0.5 rounded mr-1.5">---%</span>
                from last month
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
