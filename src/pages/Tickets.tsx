import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal } from "lucide-react"

const ticketTiers = [
    { id: "T-001", eventName: "Google I/O 2026", name: "VIP Seating", price: "Rp 1,500K", capacity: 100, sold: 85, status: "Selling Fast" },
    { id: "T-002", eventName: "Google I/O 2026", name: "Festival (Standing)", price: "Rp 750K", capacity: 500, sold: 420, status: "Available" },
    { id: "T-003", eventName: "Tech Startup Conference", name: "Early Bird", price: "Rp 500K", capacity: 200, sold: 200, status: "Sold Out" },
    { id: "T-004", eventName: "Tech Startup Conference", name: "Reguler", price: "Rp 750K", capacity: 500, sold: 48, status: "Available" },
]

export function Tickets() {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Ticket Management</h2>
                    <p className="text-muted-foreground mt-1">Manage ticket tiers and sales of your event</p>
                </div>
                <Button className="gap-2 shadow-sm font-medium">
                    <Plus />
                    Create New Ticket
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Active Ticket Categories</CardTitle>
                    <CardDescription>Manage ticket tiers and sales of your event</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50">
                                <TableHead>Nama Tiket</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead className="text-center">Kapasitas</TableHead>
                                <TableHead className="text-center">Terjual</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ticketTiers.map((ticket) => (
                                <TableRow key={ticket.id} className="border-border/50 hover:bg-muted/30">
                                    <TableCell className="font-medium text-foreground">{ticket.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{ticket.eventName}</TableCell>
                                    <TableCell>{ticket.price}</TableCell>
                                    <TableCell className="text-center">{ticket.capacity}</TableCell>
                                    <TableCell className="text-center font-semibold text-primary">{ticket.sold}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                ticket.status === "Available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    ticket.status === "Selling Fast" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                        "bg-red-50 text-red-700 border-red-200"
                                            }
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                            <MoreHorizontal size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}