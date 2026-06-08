import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  Ticket,
  User,
} from "lucide-react"

interface TicketDetailData {
  id: string
  ticket_code: string
  status: string
  checked_in_at: string | null
  created_at: string
  order_id: string
  order_status: string
  order_total: number
  order_created_at: string
  seat_number: string | null
  event_title: string
  event_description: string
  event_date: string
  location: string
  organizer_name: string
  tier_name: string
  tier_price: number
}

export function TicketDetail() {
  const navigate = useNavigate()
  const { ticketId } = useParams<{ ticketId: string }>()
  const { session, loading: authLoading } = useAuth()
  const [ticket, setTicket] = useState<TicketDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login')
      return
    }

    if (session?.user?.id && ticketId) {
      void fetchTicketDetail()
    }
  }, [session, authLoading, ticketId, navigate])

  const fetchTicketDetail = async () => {
    if (!session?.user?.id || !ticketId) return

    setLoading(true)
    try {
      const { data, error } = await (supabase as any)
        .from('tickets')
        .select(`
          id,
          ticket_code,
          status,
          checked_in_at,
          created_at,
          order_id,
          tier_id,
          seat_id,
          ticket_tiers (
            name,
            price
          ),
          orders (
            id,
            status,
            total_amount,
            created_at,
            events (
              title,
              description,
              starts_at,
              venue:venues!events_venue_id_fkey (
                name,
                city
              ),
              profiles (
                full_name
              )
            )
          )
        `)
        .eq('id', ticketId)
        .eq('buyer_id', session.user.id)
        .single()

      if (error) throw error

      const { data: seatRows, error: seatError } = await supabase.rpc('get_my_ticket_seats', {
        p_ticket_ids: [data.id],
      })

      if (seatError) {
        console.error('Error fetching ticket seat:', seatError)
      }

      const seatNumber = seatRows?.[0]?.seat_number || null

      setTicket({
        id: data.id,
        ticket_code: data.ticket_code,
        status: data.status,
        checked_in_at: data.checked_in_at,
        created_at: data.created_at,
        order_id: data.order_id,
        order_status: data.orders?.status || 'unknown',
        order_total: data.orders?.total_amount || 0,
        order_created_at: data.orders?.created_at || data.created_at,
        seat_number: seatNumber,
        event_title: data.orders?.events?.title || 'Unknown Event',
        event_description: data.orders?.events?.description || '',
        event_date: data.orders?.events?.starts_at || '',
        location: data.orders?.events?.venue
          ? [data.orders.events.venue.name, data.orders.events.venue.city].filter(Boolean).join(', ')
          : 'TBA',
        organizer_name: data.orders?.events?.profiles?.full_name || 'Unknown',
        tier_name: data.ticket_tiers?.name || 'Standard',
        tier_price: data.ticket_tiers?.price || 0,
      })
    } catch (error) {
      console.error('Error fetching ticket detail:', error)
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'TBA'

    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = () => {
    if (!ticket) return null

    if (ticket.checked_in_at) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 size={14} className="mr-1" />
          Used
        </Badge>
      )
    }

    if (ticket.order_status === 'pending') {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <Clock size={14} className="mr-1" />
          Pending
        </Badge>
      )
    }

    if (ticket.order_status === 'paid' && ticket.status === 'active') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Ticket size={14} className="mr-1" />
          Paid
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        <AlertCircle size={14} className="mr-1" />
        {ticket.status}
      </Badge>
    )
  }

  const handleDownload = () => {
    window.print()
  }

  const getQrImageUrl = (value: string) => {
    const encodedValue = encodeURIComponent(value)
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodedValue}`
  }

  if (!authLoading && !session) {
    return null
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Ticket Not Found</CardTitle>
              <CardDescription>This ticket does not exist or does not belong to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/my-tickets')} className="w-full gap-2">
                <ArrowLeft size={16} />
                Back to My Tickets
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate('/my-tickets')}
        >
          <ArrowLeft size={16} />
          My Tickets
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{ticket.event_title}</h1>
                <p className="text-muted-foreground mt-2">Ticket details and entry information</p>
              </div>
              {getStatusBadge()}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
                <CardDescription>{ticket.event_description || 'No event description available.'}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium text-foreground">{formatDateTime(ticket.event_date)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">{ticket.location}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                    <p className="font-medium text-foreground">{ticket.organizer_name}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchased At</p>
                    <p className="font-medium text-foreground">{formatDateTime(ticket.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Ticket Type" value={ticket.tier_name} />
                <DetailItem label="Seat Number" value={ticket.seat_number || "-"} />
                <DetailItem label="Ticket Price" value={`Rp ${ticket.tier_price.toLocaleString('id-ID')}`} />
                <DetailItem label="Ticket ID" value={ticket.id} mono />
                <DetailItem label="Order ID" value={ticket.order_id} mono />
                <DetailItem label="Order Status" value={ticket.order_status} />
                <DetailItem label="Order Total" value={`Rp ${ticket.order_total.toLocaleString('id-ID')}`} />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="lg:sticky lg:top-24">
              {ticket.order_status === 'pending' ? (
                <>
                  <CardHeader className="text-center">
                    <CardTitle>Payment Pending</CardTitle>
                    <CardDescription>Complete payment before this ticket can be used.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
                      QR code will be available after payment is confirmed.
                    </div>
                    <Button onClick={() => navigate(`/payment/${ticket.order_id}`)} className="w-full">
                      Continue Payment
                    </Button>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="text-center">
                    <CardTitle>Entry Pass</CardTitle>
                    <CardDescription>Show this code at the venue entrance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="aspect-square rounded-lg border border-border bg-white p-5 shadow-sm">
                      <img
                        src={getQrImageUrl(ticket.ticket_code)}
                        alt={`QR code for ticket ${ticket.ticket_code}`}
                        className="h-full w-full object-contain"
                        loading="eager"
                      />
                    </div>

                    <div className="rounded-lg border border-border bg-muted/40 p-4 text-center">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Ticket Code</p>
                      <p className="font-mono text-lg font-bold text-foreground break-all">{ticket.ticket_code}</p>
                    </div>

                    {ticket.checked_in_at && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        Checked in at {formatDateTime(ticket.checked_in_at)}
                      </div>
                    )}

                    <Button onClick={handleDownload} className="w-full gap-2">
                      <Download size={16} />
                      Download Ticket
                    </Button>
                  </CardContent>
                </>
              )}
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={mono ? "font-mono text-sm font-medium text-foreground break-all" : "font-medium text-foreground"}>
        {value}
      </p>
    </div>
  )
}
