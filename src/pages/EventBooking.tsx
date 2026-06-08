import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Armchair, ArrowLeft, Check, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from '@/context/AuthContext'

interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  quantity: number
}

interface SeatOption {
  seat_id: string
  seat_number: string
  status: string
}

function getBookedOrderId(data: unknown): string | null {
  if (typeof data === 'string') return data

  if (Array.isArray(data)) {
    return getBookedOrderId(data[0])
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const orderId = record.order_id || record.orderId || record.id

    if (typeof orderId === 'string') {
      return orderId
    }
  }

  return null
}

function getPaymentExpiry() {
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)
  return expiresAt.toISOString()
}

// const eventData: Record<string, any> = {
//   "E-001": {
//     name: "Google I/O 2026",
//     tickets: {
//       "T-001": { name: "VIP Seating", price: 1500000, priceFormatted: "Rp 1,500K" },
//       "T-002": { name: "Festival (Standing)", price: 750000, priceFormatted: "Rp 750K" }
//     }
//   },
//   "E-002": {
//     name: "Tech Startup Conference",
//     tickets: {
//       "T-003": { name: "Early Bird", price: 500000, priceFormatted: "Rp 500K" },
//       "T-004": { name: "Regular", price: 750000, priceFormatted: "Rp 750K" }
//     }
//   },
//   "E-003": {
//     name: "Web Design Summit",
//     tickets: {
//       "T-005": { name: "Standard", price: 600000, priceFormatted: "Rp 600K" }
//     }
//   },
//   "E-004": {
//     name: "AI & Machine Learning Expo",
//     tickets: {
//       "T-006": { name: "General Admission", price: 800000, priceFormatted: "Rp 800K" },
//       "T-007": { name: "Premium", price: 1200000, priceFormatted: "Rp 1,200K" }
//     }
//   }
// }

export function EventBooking() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { eventId, ticketTypeId } = useParams<{ eventId: string; ticketTypeId: string }>()
  const [step, setStep] = useState<'form' | 'confirmation'>('form')
  const [formData, setFormData] = useState<BookingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    quantity: 1
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [seats, setSeats] = useState<SeatOption[]>([])
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])

  const [event, setEvent] = useState<any>(null)
  const [ticket, setTicket] = useState<any>(null)
useEffect(() => {
  async function fetchUserProfile() {
    if (!session?.user) return

    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', session.user.id)
      .single()

    const nameParts = (data?.full_name || '').trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      email: session.user.email || '',  // email ada di auth.users, bukan di profiles
      phone: data?.phone || ''
    }))
  }

  fetchUserProfile()
}, [session])

  useEffect(() => {
    
    async function fetchBookingData() {
      if (!eventId || !ticketTypeId) return;

      const { data } = await supabase
        .from('events')
        .select(`
          id, title,
          ticket_tiers ( id, name, price, quantity, sold )
        `)
        .eq('id', eventId)
        .single()

      if (data) {
        setEvent({ name: data.title })

        if (data.ticket_tiers) {
          const matchedTicket = data.ticket_tiers.find((t: any) => t.id === ticketTypeId)
          if (matchedTicket) {
            setTicket({
              name: matchedTicket.name,
              price: matchedTicket.price || 0,
              priceFormatted: `Rp ${(matchedTicket.price || 0).toLocaleString('id-ID')}`
            })

            const { data: seatData, error: seatError } = await supabase.rpc('get_ticket_tier_seats', {
              p_tier_id: matchedTicket.id
            })

            if (seatError) {
              console.error('Failed to load seats:', seatError)
              setSeats([])
            } else {
              setSeats((seatData ?? []) as SeatOption[])
            }
          }
        }
      }
      setLoading(false)
    }

    fetchBookingData()
  }, [eventId, ticketTypeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    )
  }

  if (!event || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Invalid Booking</CardTitle>
            <CardDescription>The booking information is invalid.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/')}
              className="w-full gap-2"
            >
              <ArrowLeft size={16} />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPrice = ticket.price * formData.quantity
  const hasSeatSelection = seats.length > 0

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'quantity') {
      if (value === "") {
        setFormData(prev => ({
          ...prev,
          [name]: "" as any
        }));
        return;
      }

      const parsedValue = parseInt(value);
      if (!isNaN(parsedValue)) {
        const normalizedQuantity = Math.min(10, Math.max(1, parsedValue))
        setFormData(prev => ({
          ...prev,
          [name]: normalizedQuantity
        }));
        setSelectedSeatIds(prev => prev.slice(0, normalizedQuantity))
      }

    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const toggleSeat = (seat: SeatOption) => {
    if (seat.status !== 'available') return

    setSelectedSeatIds(prev => {
      if (prev.includes(seat.seat_id)) {
        return prev.filter(id => id !== seat.seat_id)
      }

      if (prev.length >= formData.quantity) {
        return prev
      }

      return [...prev, seat.seat_id]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // error jika user blm terdaftar
    if (!session?.user) {
      alert("Sesi anda habis atau belum login. Silahkan login.")
      navigate('/login')
      return
    }

    if (!eventId || !ticketTypeId) {
      alert("Data event atau tiket tidak valid.")
      return
    }

    if (formData.firstName && formData.lastName && formData.email && formData.phone) {
      if (hasSeatSelection && selectedSeatIds.length !== formData.quantity) {
        alert(`Silakan pilih ${formData.quantity} kursi terlebih dahulu.`)
        return
      }

      setIsSubmitting(true)

      try {
        const qty = Number(formData.quantity) || 1
        const totalAmount = ticket.price * qty

        const { data, error } = await supabase.rpc('book_ticket', {
          p_buyer_id: session.user.id,
          p_event_id: eventId,
          p_tier_id: ticketTypeId,
          p_quantity: qty,
          p_total_amount: totalAmount,
          p_seat_ids: hasSeatSelection ? selectedSeatIds : null
        })

        if (error) {
          console.error('Booking Error:', error)
          alert('Gagal memproses tiket:\n' + error.message)
        } else {
          console.log('Success Booking:', data)
          const orderId = getBookedOrderId(data)

          if (orderId) {
            const { data: paymentSetup, error: paymentSetupError } = await supabase
              .from('orders')
              .update({
                status: 'pending',
                payment_method: null,
                payment_ref: null,
                paid_at: null,
                expires_at: getPaymentExpiry(),
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId)
              .eq('buyer_id', session.user.id)
              .select('id, status, expires_at, payment_method, payment_ref')
              .maybeSingle()

            if (paymentSetupError) {
              console.error('Payment Setup Error:', paymentSetupError)
            } else if (!paymentSetup) {
              console.warn('Payment setup did not update any order. The payment page will use demo-pending mode.', { orderId })
            }

            navigate(`/payment/${orderId}`)
          } else {
            setStep('confirmation')
          }
        }
      } catch (err: any) {
        alert('Connection error:' + err.message)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Content */}
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-border/50">
            <CardContent className="pt-12 text-center space-y-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
                <p className="text-muted-foreground">Your ticket booking has been successfully completed.</p>
              </div>

              {/* Booking Details */}
              <Card className="border-border/50 bg-muted/50 text-left">
                <CardHeader>
                  <CardTitle className="text-lg">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium text-foreground">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground">{formData.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground">{formData.phone}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Event:</span>
                      <span className="font-medium text-foreground">{event.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ticket Type:</span>
                      <span className="font-medium text-foreground">{ticket.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-medium text-foreground">{ticket.priceFormatted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium text-foreground">{formData.quantity} ticket{formData.quantity > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex justify-between items-center bg-primary/5 p-3 rounded-md">
                    <span className="font-semibold text-foreground">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3 pt-6">
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to <strong>{formData.email}</strong>. Please check your inbox for your ticket details.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate('/my-tickets')}
                    variant="outline"
                    className="flex-1"
                  >
                    View My Tickets
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Back to Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Booking</h1>
            <p className="text-muted-foreground">Fill in your details to complete the ticket purchase</p>
          </div>

          {/* Main Card */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Form */}
            <Card className="md:col-span-2 border-border/50 pointer-events-auto">
              <CardHeader>
                <CardTitle>Attendee Information</CardTitle>
                <CardDescription>Please provide your details for the booking</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name *</label>
                      <Input
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name *</label>
                      <Input
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="border-border/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-1">
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="border-border/50 invalid:focus:ring-red-400 peer"
                    />
                    <p className="text-xs text-red-500 invisible peer-[:not(:placeholder-shown):invalid]:visible">
                      Please enter a valid email address
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number *</label>
                    <Input
                      name="phone"
                      placeholder="+62 812-3456-7890"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Number of Tickets *</label>
                    <Input
                      name="quantity"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      className="border-border/50"
                    />
                    <p className="text-xs text-muted-foreground">Maximum 10 tickets per booking</p>
                  </div>

                  {hasSeatSelection && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                          <Armchair size={16} />
                          Select Seats *
                        </label>
                        <span className="text-xs font-medium text-muted-foreground">
                          {selectedSeatIds.length}/{formData.quantity} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                        {seats.map((seat) => {
                          const selected = selectedSeatIds.includes(seat.seat_id)
                          const unavailable = seat.status !== 'available'

                          return (
                            <button
                              key={seat.seat_id}
                              type="button"
                              onClick={() => toggleSeat(seat)}
                              disabled={unavailable}
                              className={`flex h-10 items-center justify-center rounded-md border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                                selected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : unavailable
                                    ? 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60'
                                    : 'border-border bg-white text-foreground hover:border-primary/60 hover:bg-primary/5'
                              }`}
                              aria-pressed={selected}
                            >
                              {seat.seat_number}
                            </button>
                          )
                        })}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-3 w-3 rounded-sm border border-border bg-white" />
                          Available
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-3 w-3 rounded-sm bg-primary" />
                          Selected
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-3 w-3 rounded-sm bg-muted" />
                          Reserved/Paid
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || (hasSeatSelection && selectedSeatIds.length !== formData.quantity)}
                    className="w-full font-medium shadow-sm mt-6 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <div>
              <Card className="border-border/50 sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event</p>
                    <p className="font-semibold text-foreground text-sm">{event.name}</p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Ticket Type</p>
                    <p className="font-semibold text-foreground text-sm">{ticket.name}</p>
                  </div>

                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-medium text-foreground">{ticket.priceFormatted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium text-foreground">{formData.quantity}</span>
                    </div>
                    {hasSeatSelection && (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Seats:</span>
                        <span className="text-right font-medium text-foreground">
                          {selectedSeatIds.length > 0
                            ? selectedSeatIds
                              .map(id => seats.find(seat => seat.seat_id === id)?.seat_number)
                              .filter(Boolean)
                              .join(', ')
                            : '-'}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold text-foreground">Total:</span>
                      <span className="text-lg font-bold text-primary">
                        Rp {totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
