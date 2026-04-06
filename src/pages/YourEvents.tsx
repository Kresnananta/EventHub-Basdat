import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { getBookings, deleteBooking, type BookingItem } from "@/lib/bookings"
import { Trash2, Calendar, Mail, Phone, User, DollarSign } from "lucide-react"

export function YourEvents() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const data = getBookings()
    setBookings(data)
    setLoading(false)
  }, [])

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      if (deleteBooking(id)) {
        setBookings(bookings.filter(b => b.id !== id))
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 animate-in fade-in duration-500">
          <h1 className="text-4xl font-bold text-foreground mb-2">Your Event Bookings</h1>
          <p className="text-lg text-muted-foreground">
            Manage and view all your ticket bookings
          </p>
        </div>

        {/* Bookings Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                You don't have any event bookings yet.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {bookings.map((booking) => (
              <Card 
                key={booking.id}
                className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 flex flex-col"
              >
                {/* Header */}
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{booking.eventName}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Booking ID: {booking.id}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="default"
                      className={
                        booking.status === 'confirmed' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : booking.status === 'pending'
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="pt-4 space-y-3 flex-1">
                  {/* Ticket Info */}
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      {booking.ticketName}
                    </h4>
                    <div className="text-2xl font-bold text-primary">
                      Rp {booking.totalPrice.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''} × Rp {booking.ticketPrice.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User size={16} />
                      <span>{booking.firstName} {booking.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail size={16} />
                      <span className="truncate">{booking.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={16} />
                      <span>{booking.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={16} />
                      <span className="text-xs">{formatDate(booking.bookingDate)}</span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer */}
                <div className="border-t border-border/50 p-3 flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <DollarSign size={16} />
                    View Invoice
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(booking.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
