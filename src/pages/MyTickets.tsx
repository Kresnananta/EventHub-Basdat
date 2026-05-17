import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Loader2, Ticket, Download, QrCode, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { useNavigate } from 'react-router-dom'

interface TicketData {
  id: string
  ticket_code: string
  status: string
  checked_in_at: string | null
  event_title: string
  event_date: string
  tier_name: string
  tier_price: number
  organizer_name: string
  location: string
  created_at: string
}

export function MyTickets() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all')

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login')
      return
    }

    if (session?.user?.id) {
      fetchTickets()
    }
  }, [session, authLoading, navigate])

  const fetchTickets = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_code,
          status,
          checked_in_at,
          created_at,
          order_id,
          tier_id,
          ticket_tiers (
            name,
            price,
            event_id
          ),
          orders (
            event_id,
            events (
              title,
              starts_at,
              location,
              organizer_id,
              profiles (
                full_name
              )
            )
          )
        `)
        .eq('buyer_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formatted = (data || []).map((ticket: any) => ({
        id: ticket.id,
        ticket_code: ticket.ticket_code,
        status: ticket.status,
        checked_in_at: ticket.checked_in_at,
        event_title: ticket.orders?.events?.title || 'Unknown Event',
        event_date: ticket.orders?.events?.starts_at || '',
        tier_name: ticket.ticket_tiers?.name || 'Standard',
        tier_price: ticket.ticket_tiers?.price || 0,
        organizer_name: ticket.orders?.events?.profiles?.full_name || 'Unknown',
        location: ticket.orders?.events?.location || 'TBA',
        created_at: ticket.created_at
      }))

      setTickets(formatted)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!authLoading && !session) {
    return null
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'active') return ticket.status === 'active' && !ticket.checked_in_at
    if (filter === 'used') return ticket.checked_in_at !== null
    if (filter === 'expired') return ticket.status === 'expired'
    return true
  })

  const getStatusBadge = (ticket: TicketData) => {
    if (ticket.checked_in_at) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 size={14} className="mr-1" />
          Used
        </Badge>
      )
    }
    if (ticket.status === 'active') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Ticket size={14} className="mr-1" />
          Active
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket size={32} />
            My Tickets
          </h1>
          <p className="text-muted-foreground mt-2">View and manage your event tickets</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'active', 'used', 'expired'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'all' ? 'All Tickets' : f === 'active' ? 'Active' : f === 'used' ? 'Used' : 'Expired'}
            </Button>
          ))}
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Ticket size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'all'
                  ? "You haven't purchased any tickets yet."
                  : `No ${filter} tickets at the moment.`}
              </p>
              <Button onClick={() => navigate('/')}>
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/ticket/${ticket.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/ticket/${ticket.id}`)
                  }
                }}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.event_title}</CardTitle>
                      <CardDescription className="text-xs">
                        by {ticket.organizer_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(ticket)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={16} />
                      {new Date(ticket.event_date).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">{ticket.tier_name}</span>
                      <span className="text-muted-foreground"> • </span>
                      <span className="text-primary font-semibold">
                        Rp {ticket.tier_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Code */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Ticket Code</p>
                    <p className="font-mono font-bold text-foreground break-all">{ticket.ticket_code}</p>
                  </div>

                  {/* Check-in Status */}
                  {ticket.checked_in_at && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold text-green-700 mb-1">Checked In</p>
                      <p className="text-sm text-green-700">
                        {new Date(ticket.checked_in_at).toLocaleDateString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/ticket/${ticket.id}`)
                      }}
                    >
                      <QrCode size={16} />
                      <span className="hidden sm:inline">Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/ticket/${ticket.id}`)
                      }}
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-end text-xs font-medium text-primary">
                    View ticket
                    <ArrowRight size={14} className="ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
