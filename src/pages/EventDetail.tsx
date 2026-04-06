import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { ArrowLeft, Calendar, MapPin, Users, Tag } from "lucide-react"

interface EventDetails {
  id: string
  name: string
  description: string
  fullDescription: string
  date: string
  location: string
  image: string
  attendees: number
  ticketsSold: number
  ticketTypes: TicketType[]
}

interface TicketType {
  id: string
  name: string
  price: number
  priceFormatted: string
  capacity: number
  available: number
  status: string
}

// Mock data untuk event details
const eventDetails: Record<string, EventDetails> = {
  "E-001": {
    id: "E-001",
    name: "Google I/O 2026",
    description: "Join us for the largest and most exciting developer conference.",
    fullDescription: "Google I/O 2026 is our annual developer conference where we showcase the latest innovations and technologies from Google. Featuring keynote presentations, hands-on workshops, networking opportunities, and more. This year we're exploring AI, cloud computing, and the future of computing.",
    date: "May 24-26, 2026",
    location: "Mountain View, California",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
    attendees: 12500,
    ticketsSold: 505,
    ticketTypes: [
      { id: "T-001", name: "VIP Seating", price: 1500000, priceFormatted: "Rp 1,500K", capacity: 100, available: 15, status: "Available" },
      { id: "T-002", name: "Festival (Standing)", price: 750000, priceFormatted: "Rp 750K", capacity: 500, available: 80, status: "Available" },
    ]
  },
  "E-002": {
    id: "E-002",
    name: "Tech Startup Conference",
    description: "Network with innovative startup founders, investors, and tech entrepreneurs.",
    fullDescription: "Meet the brightest minds in the startup ecosystem. This conference brings together founders, investors, mentors, and innovators to share experiences, discuss trends, and build connections. Learn from success stories and navigate the challenges of building a startup.",
    date: "June 10-11, 2026",
    location: "San Francisco, California",
    image: "https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=1170&auto=format&fit=crop",
    attendees: 5000,
    ticketsSold: 248,
    ticketTypes: [
      { id: "T-003", name: "Early Bird", price: 500000, priceFormatted: "Rp 500K", capacity: 200, available: 0, status: "Sold Out" },
      { id: "T-004", name: "Regular", price: 750000, priceFormatted: "Rp 750K", capacity: 500, available: 252, status: "Available" },
    ]
  },
  "E-003": {
    id: "E-003",
    name: "Web Design Summit",
    description: "Learn the latest web design trends and best practices from industry experts.",
    fullDescription: "Discover the latest trends in web design, UX/UI principles, and responsive design techniques. Our expert speakers will share insights on creating beautiful, functional, and accessible web experiences that engage users.",
    date: "July 5-7, 2026",
    location: "New York, New York",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1112&auto=format&fit=crop",
    attendees: 3000,
    ticketsSold: 156,
    ticketTypes: [
      { id: "T-005", name: "Standard", price: 600000, priceFormatted: "Rp 600K", capacity: 300, available: 144, status: "Available" },
    ]
  },
  "E-004": {
    id: "E-004",
    name: "AI & Machine Learning Expo",
    description: "Explore cutting-edge AI technologies and their real-world applications.",
    fullDescription: "Experience the future of AI and Machine Learning. This expo features live demonstrations, workshops, and talks from leading AI researchers and industry practitioners. Learn how AI is transforming businesses across different sectors.",
    date: "August 15-17, 2026",
    location: "Boston, Massachusetts",
    image: "https://images.unsplash.com/photo-1582192730841-2a682d7375f9?q=80&w=1074&auto=format&fit=crop",
    attendees: 8000,
    ticketsSold: 420,
    ticketTypes: [
      { id: "T-006", name: "General Admission", price: 800000, priceFormatted: "Rp 800K", capacity: 400, available: 180, status: "Available" },
      { id: "T-007", name: "Premium", price: 1200000, priceFormatted: "Rp 1,200K", capacity: 150, available: 50, status: "Available" },
    ]
  }
}

export function EventDetail() {
  const navigate = useNavigate()
  const { eventId } = useParams<{ eventId: string }>()

  const event = eventId ? eventDetails[eventId] : null

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>The event you're looking for doesn't exist.</CardDescription>
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

  const handleBooking = (ticketTypeId: string) => {
    navigate(`/booking/${eventId}/${ticketTypeId}`)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col animate-in fade-in duration-500">
      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Image */}
        <div className="mb-8 overflow-hidden rounded-lg shadow-lg h-96">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and basic info */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{event.name}</h1>
              <p className="text-lg text-muted-foreground">{event.description}</p>
            </div>

            {/* Event Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">{event.date}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-foreground">{event.location}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Attendees</p>
                    <p className="font-medium text-foreground">{event.attendees.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="pt-6 flex items-center gap-3">
                  <Tag className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets Sold</p>
                    <p className="font-medium text-foreground">{event.ticketsSold} sold</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{event.fullDescription}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Ticket Selection */}
          <div>
            <Card className="border-border/50 sticky top-6">
              <CardHeader>
                <CardTitle>Select Ticket</CardTitle>
                <CardDescription>Choose a ticket type to proceed with booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.ticketTypes.map((ticket) => (
                  <div key={ticket.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{ticket.name}</h3>
                        <p className="text-lg font-bold text-primary mt-1">{ticket.priceFormatted}</p>
                      </div>
                      <Badge
                        variant={ticket.status === "Available" ? "default" : "secondary"}
                        className={ticket.status === "Sold Out" ? "bg-red-100 text-red-800 hover:bg-red-200" : ""}
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {ticket.available} available out of {ticket.capacity}
                    </p>
                    <Button
                      className="w-full"
                      disabled={ticket.status === "Sold Out"}
                      onClick={() => handleBooking(ticket.id)}
                    >
                      {ticket.status === "Sold Out" ? "Sold Out" : "Book Now"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
