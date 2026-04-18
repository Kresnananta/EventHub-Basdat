import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react"
// Data Dummy Pengunjung
// const dummyAttendees = [
//   { id: "ATT-001", name: "Natasha Romanoff", email: "nat@avengers.com", ticketType: "VIP Seating", event: "Google I/O 2026", checkedIn: true, time: "08:30 AM" },
//   { id: "ATT-002", name: "Tony Stark", email: "tony@stark.com", ticketType: "VIP Seating", event: "Google I/O 2026", checkedIn: true, time: "08:45 AM" },
//   { id: "ATT-003", name: "Steve Rogers", email: "steve@brooklyn.com", ticketType: "Reguler", event: "Google I/O 2026", checkedIn: false, time: "-" },
//   { id: "ATT-004", name: "Bruce Banner", email: "bruce@science.com", ticketType: "Early Bird", event: "Tech Startup Conference", checkedIn: false, time: "-" },
//   { id: "ATT-005", name: "Peter Parker", email: "peter@dailybugle.com", ticketType: "Festival (Standing)", event: "Google I/O 2026", checkedIn: true, time: "09:05 AM" },
// ]

export function Attendees() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [attendees, setAttendees] = useState<any[]>([])
  const { selectedEventId } = useEventContext()

  async function fetchAttendees() {
    setLoading(true)

    let query = supabase
      .from('tickets')
      .select(`
      id, ticket_code, status, checked_in_at,
      profiles ( full_name, phone ),
      ticket_tiers( name, event_id, events( title ) )
    `)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (data) {
      let rawData = data;

      if (selectedEventId) {
        rawData = rawData.filter((item: any) => item.ticket_tiers?.event_id === selectedEventId)
      }
      const formattedAttendees = rawData.map((item: any) => ({
        id: item.ticket_code,
        rawId: item.id,
        name: item.profiles?.full_name || "Unknown Attendee",
        contact: item.profiles?.phone || "-",
        event: item.ticket_tiers?.events?.title || "-",
        ticketType: item.ticket_tiers?.name || "-",
        checkedIn: item.status?.toLowerCase() === 'used',
        time: item.checked_in_at ? new Date(item.checked_in_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-"
      }))
      setAttendees(formattedAttendees)
    }
    setLoading(false)
  }
  useEffect(() => {
    fetchAttendees()
  }, [selectedEventId])

  const handleCheckIn = async (ticketId: string) => {
    // Tembak perintah Update ke Supabase
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', ticketId)

    if (!error) {
      fetchAttendees()
    } else {
      alert("Check-in failed, try again");
    }
  }

  const filteredAttendees = attendees.filter((att) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      att.name?.toLowerCase().includes(query) ||
      att.contact?.toLowerCase().includes(query) ||
      att.id?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Attende List</h2>
          <p className="text-muted-foreground mt-1">List of all Attendees in your event</p>
        </div>
      </div>

      {/* Check-in Portal */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4 border-b border-border/50 mb-4 mx-6 px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Check-in Portal</CardTitle>
              <CardDescription>Search attendees name or ID manualy</CardDescription>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Name, Email, or ID ticket"
                  className="w-full pl-8 bg-slate-50 border-border/50 focus-visible:ring-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} // simpan user typing ke react state
                />
              </div>
            </div>
          </div>
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
                  <TableHead>Attendee ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Ticket Type</TableHead>
                  <TableHead>Time Check-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="pointer-events-auto">
                {/* Conditional Rendering: Tampilkan tabel JIKA data yang difilter ditemukan */}
                {filteredAttendees.length > 0 ? (
                  filteredAttendees.map((att) => (
                    <TableRow key={att.rawId} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-primary">{att.id}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{att.name}</div>
                        <div className="text-xs text-muted-foreground">{att.contact}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{att.event}</TableCell>
                      <TableCell>{att.ticketType}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">{att.time}</TableCell>
                      <TableCell>
                        {/* Lencana (Badge) Biru Hijau vs Abu abu */}
                        {att.checkedIn ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1.5 py-1">
                            <CheckCircle2 size={14} /> In
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 py-1">
                            <XCircle size={14} /> Not In
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!att.checkedIn && (
                          <Button size="sm"
                            className="h-8 font-medium shadow-sm cursor-pointer"
                            onClick={() => handleCheckIn(att.rawId)}
                          >
                            Manual Check-In
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  /* Tampilan kalau ketikan pencarian meleset / data kosong */
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium">
                      Attendee "{searchQuery}" not found
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