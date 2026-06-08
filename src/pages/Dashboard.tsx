import { useEffect, useMemo, useState } from "react"
import { StatCards } from "../components/dashboard/StatCards"
import { SalesChart } from "../components/dashboard/SalesChart"
import { RecentOrders } from "../components/dashboard/RecentOrders"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase-client"
import {
  Building2,
  CalendarDays,
  DollarSign,
  ExternalLink,
  Loader2,
  Plus,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

type AdminEventRow = {
  id: string
  title: string
  status: string
  starts_at: string
  ticket_tiers: Array<{
    quantity: number
    sold: number
  }>
  venue: {
    name: string
    city: string | null
  } | null
  profiles: {
    full_name: string | null
  } | null
}

type AdminOrderRow = {
  id: string
  status: string
  total_amount: number
}

type AdminProfileRow = {
  id: string
  role: string
}

type AdminStats = {
  events: number
  venues: number
  users: number
  organizers: number
  orders: number
  revenue: number
  ticketsSold: number
}

function isPaidStatus(status: string) {
  const normalized = status.toLowerCase()
  return normalized === "paid" || normalized === "completed"
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

function statusBadgeVariant(status: string) {
  if (status === "published") return "default" as const
  if (status === "draft") return "secondary" as const
  return "destructive" as const
}

export function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  if (profile?.role === "admin") {
    return <AdminDashboard />
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Event Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your events today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white hover:bg-muted font-medium" onClick={() => navigate("/")}>
            <ExternalLink size={16} />
            View Event Page
          </Button>
          <Button className="gap-2 shadow-sm font-medium" onClick={() => navigate("/dashboard/create-event")}>
            <Plus size={16} />
            Create Event
          </Button>
        </div>
      </div>
      
      <StatCards />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SalesChart />
        <RecentOrders />
      </div>
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<AdminEventRow[]>([])
  const [stats, setStats] = useState<AdminStats>({
    events: 0,
    venues: 0,
    users: 0,
    organizers: 0,
    orders: 0,
    revenue: 0,
    ticketsSold: 0,
  })

  useEffect(() => {
    async function fetchAdminDashboard() {
      setLoading(true)

      const [eventsRes, venuesRes, profilesRes, ordersRes] = await Promise.all([
        supabase
          .from("events")
          .select(`
            id, title, status, starts_at,
            venue:venues!events_venue_id_fkey ( name, city ),
            profiles ( full_name ),
            ticket_tiers ( quantity, sold )
          `)
          .order("starts_at", { ascending: false }),
        supabase.from("venues").select("id"),
        supabase.from("profiles").select("id, role"),
        supabase.from("orders").select("id, status, total_amount"),
      ])

      if (eventsRes.error) console.error("Failed to load admin events:", eventsRes.error)
      if (venuesRes.error) console.error("Failed to load admin venues:", venuesRes.error)
      if (profilesRes.error) console.error("Failed to load admin profiles:", profilesRes.error)
      if (ordersRes.error) console.error("Failed to load admin orders:", ordersRes.error)

      const eventRows = (eventsRes.data ?? []) as AdminEventRow[]
      const profileRows = (profilesRes.data ?? []) as AdminProfileRow[]
      const orderRows = (ordersRes.data ?? []) as AdminOrderRow[]
      const paidOrders = orderRows.filter((order) => isPaidStatus(order.status))

      setEvents(eventRows)
      setStats({
        events: eventRows.length,
        venues: venuesRes.data?.length ?? 0,
        users: profileRows.length,
        organizers: profileRows.filter((profile) => profile.role === "organizer").length,
        orders: orderRows.length,
        revenue: paidOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0),
        ticketsSold: eventRows.reduce(
          (total, event) => total + event.ticket_tiers.reduce((sum, tier) => sum + (tier.sold || 0), 0),
          0
        ),
      })
      setLoading(false)
    }

    void fetchAdminDashboard()
  }, [])

  const recentEvents = useMemo(() => events.slice(0, 6), [events])
  const publishedEvents = events.filter((event) => event.status === "published").length

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Platform overview for EventHub operations, venues, users, and events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white hover:bg-muted font-medium" onClick={() => navigate("/")}>
            <ExternalLink size={16} />
            View Event Page
          </Button>
          <Button className="gap-2 shadow-sm font-medium" onClick={() => navigate("/dashboard/venues")}>
            <Building2 size={16} />
            Manage Venues
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Total Events" value={stats.events.toLocaleString("id-ID")} detail={`${publishedEvents} published`} icon={CalendarDays} loading={loading} />
        <AdminStatCard title="Venues" value={stats.venues.toLocaleString("id-ID")} detail="Managed by EventHub admin" icon={Building2} loading={loading} />
        <AdminStatCard title="Users" value={stats.users.toLocaleString("id-ID")} detail={`${stats.organizers} organizers`} icon={Users} loading={loading} />
        <AdminStatCard title="Orders" value={stats.orders.toLocaleString("id-ID")} detail={`${stats.ticketsSold} tickets sold`} icon={ShoppingBag} loading={loading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Platform Revenue
            </CardTitle>
            <CardDescription>Revenue from paid and completed orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-foreground">{formatRupiah(stats.revenue)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5 text-primary" />
              Ticket Distribution
            </CardTitle>
            <CardDescription>Sold tickets across all published and draft events.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {stats.ticketsSold.toLocaleString("id-ID")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest scheduled events across the platform.</CardDescription>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/dashboard/events")}>
            <CalendarDays size={16} />
            Manage Events
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => {
                    const capacity = event.ticket_tiers.reduce((total, tier) => total + (tier.quantity || 0), 0)
                    const sold = event.ticket_tiers.reduce((total, tier) => total + (tier.sold || 0), 0)

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-semibold text-foreground">{event.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.venue ? [event.venue.name, event.venue.city].filter(Boolean).join(", ") : "-"}
                        </TableCell>
                        <TableCell>{event.profiles?.full_name || "Unknown"}</TableCell>
                        <TableCell>{sold.toLocaleString("id-ID")} / {capacity.toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(event.status)}>{event.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No events available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminStatCard({
  title,
  value,
  detail,
  icon: Icon,
  loading,
}: {
  title: string
  value: string
  detail: string
  icon: typeof CalendarDays
  loading: boolean
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">{title}</CardTitle>
        <div className="rounded-full bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="mt-2 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
