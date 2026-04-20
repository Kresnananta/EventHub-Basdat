import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { addBooking } from "@/lib/bookings"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from '@/context/AuthContext'

interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  quantity: number
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

      const { data, error } = await supabase
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
        setFormData(prev => ({
          ...prev,
          [name]: Math.min(10, parsedValue)
        }));
      }

    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // error jika user blm terdaftar
    if (!session?.user) {
      alert("Sesi anda habis atau belum login. Silahkan login.")
      navigate('/login')
      return
    }

    if (formData.firstName && formData.lastName && formData.email && formData.phone) {

      setIsSubmitting(true)

      try {
        const qty = Number(formData.quantity) || 1
        const totalAmount = totalPrice * qty

        const { data, error } = await supabase.rpc('book_ticket', {
          p_buyer_id: session.user.id,
          p_event_id: eventId,
          p_tier_id: ticketTypeId,
          p_quantity: qty,
          p_total_amount: totalAmount
        })

        if (error) {
          console.error('Booking Error:', error)
          alert('Gagal memproses tiket:\n' + error.message)
        } else {
          console.log('Success Booking:', data)
          setStep('confirmation')
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
                    onClick={() => navigate('/your-events')}
                    variant="outline"
                    className="flex-1"
                  >
                    View Your Bookings
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

                  <Button
                    type="submit"
                    disabled={isSubmitting}
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
