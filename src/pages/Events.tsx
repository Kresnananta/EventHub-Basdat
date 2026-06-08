import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Edit3, Loader2, MapPin, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase-client"

type EventRow = {
  id: string
  title: string
  starts_at: string
  status: string
  organizer_id: string
  venue: {
    name: string
    city: string | null
  } | null
}

export function Events() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<EventRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      if (!user) return

      setLoading(true)
      let query = supabase
        .from("events")
        .select(`
          id, title, starts_at, status, organizer_id,
          venue:venues!events_venue_id_fkey ( name, city )
        `)
        .order("starts_at", { ascending: false })

      if (profile?.role !== "admin") {
        query = query.eq("organizer_id", user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load managed events:", error)
        setEvents([])
      } else {
        setEvents((data ?? []) as EventRow[])
      }

      setLoading(false)
    }

    void fetchEvents()
  }, [profile?.role, user])

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true

    return [
      event.title,
      event.status,
      event.venue?.name,
      event.venue?.city,
    ].some((value) => value?.toLowerCase().includes(query))
  })

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Event Management</h2>
          <p className="mt-1 text-muted-foreground">
            Manage event information, schedule, publication status, and venue assignment.
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/dashboard/create-event")}>
          <Plus size={16} />
          Create Event
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              {profile?.role === "admin" ? "All events on EventHub." : "Events owned by your organizer account."}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search events..."
              className="pl-8"
            />
          </div>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-semibold text-foreground">{event.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>
                            {event.venue
                              ? [event.venue.name, event.venue.city].filter(Boolean).join(", ")
                              : "No venue"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" />
                          {new Date(event.starts_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.status === "published" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/dashboard/events/${event.id}/edit`)}
                        >
                          <Edit3 size={14} />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {searchQuery ? `No events found for "${searchQuery}".` : "No events available."}
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
