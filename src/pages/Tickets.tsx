import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Loader2 } from "lucide-react"

// const ticketTiers = [
//     { id: "T-001", eventName: "Google I/O 2026", name: "VIP Seating", price: "Rp 1,500K", capacity: 100, sold: 85, status: "Selling Fast" },
//     { id: "T-002", eventName: "Google I/O 2026", name: "Festival (Standing)", price: "Rp 750K", capacity: 500, sold: 420, status: "Available" },
//     { id: "T-003", eventName: "Tech Startup Conference", name: "Early Bird", price: "Rp 500K", capacity: 200, sold: 200, status: "Sold Out" },
//     { id: "T-004", eventName: "Tech Startup Conference", name: "Reguler", price: "Rp 750K", capacity: 500, sold: 48, status: "Available" },
// ]

export function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedEventId, selectedEventName } = useEventContext();

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)

      let query = supabase
        .from('ticket_tiers')
        .select(`
                    id, name, price, quantity, sold, currency,
                    events ( title )
                `)
        .order('created_at', { ascending: false })
      if (selectedEventId) {
        query = query.eq('event_id', selectedEventId)
      }

      const { data, error } = await query
      if (data) setTickets(data)
      setLoading(false)
    }
    fetchTickets()
  }, [selectedEventId])
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Ticket Management</h2>
          <p className="text-muted-foreground mt-1">Manage ticket tiers and sales of your event</p>
        </div>
        <Button className="gap-2 shadow-sm font-medium">
          <Plus size={16} />
          Create New Ticket
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Ticket Categories: {selectedEventName === "All Event" ? "Seluruh Event" : selectedEventName}</CardTitle>
          <CardDescription>Manage ticket tiers and sales of your event</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Ticket Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-center">Sold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">{ticket.name}</TableCell>

                    {/* title hasil dari foreign key (JOIN) di supabase */}
                    <TableCell className="text-muted-foreground">
                      {ticket.events?.title || "Unknown"}
                    </TableCell>

                    <TableCell>
                      {ticket.currency} {ticket.price.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-center">
                      {ticket.quantity}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      {ticket.sold}
                    </TableCell>
                    <TableCell>
                      {ticket.sold >= ticket.quantity ? (
                        <Badge variant="destructive" className="shadow-none">Sold Out</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Choose the event first or make new Ticket Tier from Table Editor in Supabase.
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