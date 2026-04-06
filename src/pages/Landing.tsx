import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react"

interface Event {
  id: string
  name: string
  description: string
  date: string
  location: string
  image: string
  attendees: number
  ticketsSold: number
}

const events: Event[] = [
  {
    id: "E-001",
    name: "Google I/O 2026",
    description: "Join us for the largest and most exciting developer conference where we showcase new innovations and technologies.",
    date: "May 24-26, 2026",
    location: "Mountain View, California",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
    attendees: 12500,
    ticketsSold: 505
  },
  {
    id: "E-002",
    name: "Tech Startup Conference",
    description: "Network with innovative startup founders, investors, and tech entrepreneurs from around the world.",
    date: "June 10-11, 2026",
    location: "San Francisco, California",
    image: "https://images.unsplash.com/photo-1540575467063-178f50002cfe?w=500&h=300&fit=crop",
    attendees: 5000,
    ticketsSold: 248
  },
  {
    id: "E-003",
    name: "Web Design Summit",
    description: "Learn the latest web design trends and best practices from industry experts.",
    date: "July 5-7, 2026",
    location: "New York, New York",
    image: "https://images.unsplash.com/photo-1578762336691-f8e9c6d5b5c6?w=500&h=300&fit=crop",
    attendees: 3000,
    ticketsSold: 156
  },
  {
    id: "E-004",
    name: "AI & Machine Learning Expo",
    description: "Explore cutting-edge AI technologies and their real-world applications.",
    date: "August 15-17, 2026",
    location: "Boston, Massachusetts",
    image: "https://images.unsplash.com/photo-1591453089816-0fbb47977e18?w=500&h=300&fit=crop",
    attendees: 8000,
    ticketsSold: 420
  },
]

export function Landing() {
  const navigate = useNavigate()

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-in fade-in duration-500">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Discover Amazing Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore and book tickets for the most exciting events happening around the world.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-100">
          {events.map((event) => (
            <Card 
              key={event.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleEventClick(event.id)}
            >
              {/* Event Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <img 
                  src={event.image} 
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Event Info */}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {event.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Event Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} className="shrink-0" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={16} className="shrink-0" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} className="shrink-0" />
                    <span>{event.ticketsSold} tickets sold out of {event.attendees} total</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  className="w-full gap-2 font-medium shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEventClick(event.id)
                  }}
                >
                  View Details & Book
                  <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}