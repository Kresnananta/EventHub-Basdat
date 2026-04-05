import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle2, XCircle } from "lucide-react"
// Data Dummy Pengunjung
const dummyAttendees = [
  { id: "ATT-001", name: "Natasha Romanoff", email: "nat@avengers.com", ticketType: "VIP Seating", event: "Google I/O 2026", checkedIn: true, time: "08:30 AM" },
  { id: "ATT-002", name: "Tony Stark", email: "tony@stark.com", ticketType: "VIP Seating", event: "Google I/O 2026", checkedIn: true, time: "08:45 AM" },
  { id: "ATT-003", name: "Steve Rogers", email: "steve@brooklyn.com", ticketType: "Reguler", event: "Google I/O 2026", checkedIn: false, time: "-" },
  { id: "ATT-004", name: "Bruce Banner", email: "bruce@science.com", ticketType: "Early Bird", event: "Tech Startup Conference", checkedIn: false, time: "-" },
  { id: "ATT-005", name: "Peter Parker", email: "peter@dailybugle.com", ticketType: "Festival (Standing)", event: "Google I/O 2026", checkedIn: true, time: "09:05 AM" },
]

export function Attendees() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAttendees = dummyAttendees.filter((att) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      att.name.toLowerCase().includes(query) ||
      att.email.toLowerCase().includes(query) ||
      att.id.toLowerCase().includes(query)
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Check-in Portal</CardTitle>
              <CardDescription>Search attendees name or ID manualy</CardDescription>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
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
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Attendee ID</TableHead>
                <TableHead>Nama & Email</TableHead>
                <TableHead>Asal Event</TableHead>
                <TableHead>Tipe Tiket</TableHead>
                <TableHead>Waktu Masuk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="pointer-events-auto">
              {/* Conditional Rendering: Tampilkan tabel JIKA data yang difilter ditemukan */}
              {filteredAttendees.length > 0 ? (
                filteredAttendees.map((att) => (
                  <TableRow key={att.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-primary">{att.id}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{att.name}</div>
                      <div className="text-xs text-muted-foreground">{att.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{att.event}</TableCell>
                    <TableCell>{att.ticketType}</TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">{att.time}</TableCell>
                    <TableCell>
                      {/* Lencana (Badge) Biru Hijau vs Abu abu */}
                      {att.checkedIn ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1.5 py-1">
                          <CheckCircle2 size={14} /> Hadir
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 py-1">
                          <XCircle size={14} /> Belum Masuk
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!att.checkedIn && (
                        <Button size="sm" className="h-8 font-medium shadow-sm">
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
                    Pengunjung "{searchQuery}" tidak ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}