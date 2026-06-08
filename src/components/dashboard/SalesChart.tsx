import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Loader2 } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useAuth } from "@/context/AuthContext"
import { getScopedEventIds } from "@/lib/dashboard-scope"

type SalesPoint = {
  date: string
  sales: number
}

const chartConfig = {
  sales: {
    label: "Sales Volume (Rp)",
    color: "hsl(var(--chart-1))",
  },
}

function isPaidOrder(status: string) {
  const normalizedStatus = status.toLowerCase()
  return normalizedStatus === "paid" || normalizedStatus === "completed"
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatChartDate(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
}

function formatCompactRupiah(value: number) {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
  }

  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`
  }

  return `Rp ${value.toLocaleString("id-ID")}`
}

export function SalesChart() {
  const { selectedEventId } = useEventContext()
  const { profile, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<SalesPoint[]>([])

  useEffect(() => {
    async function fetchSalesVolume() {
      setLoading(true)

      const scopedEventIds = await getScopedEventIds({
        role: profile?.role,
        selectedEventId,
        userId: user?.id,
      })

      if (scopedEventIds?.length === 0) {
        setChartData([])
        setLoading(false)
        return
      }

      let query = supabase
        .from("orders")
        .select("total_amount, status, created_at, event_id")
        .order("created_at", { ascending: true })

      if (scopedEventIds) {
        query = query.in("event_id", scopedEventIds)
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load sales chart:", error)
        setChartData([])
        setLoading(false)
        return
      }

      const paidOrders = (data ?? []).filter((order) => isPaidOrder(order.status))
      const latestOrderDate = paidOrders.length
        ? getStartOfDay(new Date(paidOrders[paidOrders.length - 1].created_at))
        : getStartOfDay(new Date())
      const startDate = addDays(latestOrderDate, -13)
      const salesByDate = new Map<string, number>()

      for (let index = 0; index < 14; index++) {
        const currentDate = addDays(startDate, index)
        salesByDate.set(getDateKey(currentDate), 0)
      }

      paidOrders.forEach((order) => {
        const orderDate = getStartOfDay(new Date(order.created_at))
        const orderDateKey = getDateKey(orderDate)

        if (salesByDate.has(orderDateKey)) {
          salesByDate.set(orderDateKey, (salesByDate.get(orderDateKey) ?? 0) + Number(order.total_amount || 0))
        }
      })

      const nextChartData = Array.from(salesByDate.entries()).map(([dateKey, sales]) => ({
        date: formatChartDate(new Date(dateKey)),
        sales,
      }))

      setChartData(nextChartData)
      setLoading(false)
    }

    fetchSalesVolume()
  }, [profile?.role, selectedEventId, user?.id])

  const hasSalesData = chartData.some((item) => item.sales > 0)

  return (
    <Card className="col-span-1 border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Ticket Sales Volume</CardTitle>
        <CardDescription>Paid and completed orders grouped by date</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative">
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    width={64}
                    tickFormatter={formatCompactRupiah}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        formatter={(value) => (
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {formatCompactRupiah(Number(value))}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            {!hasSalesData && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground">
                Belum ada paid/completed order untuk ditampilkan.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
