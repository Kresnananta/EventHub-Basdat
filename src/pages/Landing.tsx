import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Calendar, MapPin, Users, ArrowRight, Search, Filter, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface Event {
  id: string
  name: string
  description: string
  date: string
  location: string
  image: string
  attendees: number
  ticketsSold: number
  category: string
}

// const events: Event[] = [
//   {
//     id: "E-001",
//     name: "Google I/O 2026",
//     description: "Join us for the largest and most exciting developer conference where we showcase new innovations and technologies.",
//     date: "May 24-26, 2026",
//     location: "Mountain View, California",
//     image: "https://res.cloudinary.com/dslyoqmjx/image/upload/v1775537954/img1_giajpq.jpg",
//     attendees: 12500,
//     ticketsSold: 505,
//     category: "Technology"
//   },
//   {
//     id: "E-002",
//     name: "Tech Startup Conference",
//     description: "Network with innovative startup founders, investors, and tech entrepreneurs from around the world.",
//     date: "June 10-11, 2026",
//     location: "San Francisco, California",
//     image: "https://res.cloudinary.com/dslyoqmjx/image/upload/v1775537961/img2_oum3as.jpg",
//     attendees: 5000,
//     ticketsSold: 248,
//     category: "Business"
//   },
//   {
//     id: "E-003",
//     name: "Web Design Summit",
//     description: "Learn the latest web design trends and best practices from industry experts.",
//     date: "July 5-7, 2026",
//     location: "New York, New York",
//     image: "https://res.cloudinary.com/dslyoqmjx/image/upload/v1775537962/img3_xhenrg.jpg",
//     attendees: 3000,
//     ticketsSold: 156,
//     category: "Design"
//   },
//   {
//     id: "E-004",
//     name: "AI & Machine Learning Expo",
//     description: "Explore cutting-edge AI technologies and their real-world applications.",
//     date: "August 15-17, 2026",
//     location: "Boston, Massachusetts",
//     image: "https://res.cloudinary.com/dslyoqmjx/image/upload/v1775537960/img4_txscyj.jpg",
//     attendees: 8000,
//     ticketsSold: 420,
//     category: "Technology"
//   },
// ]

export function Landing() {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedLocation, setSelectedLocation] = useState("All Locations")

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, title, description, starts_at, location, banner_url,
          categories ( name ),
          ticket_tiers ( quantity, sold )
        `)
      // Opsional: .eq('status', 'published') jika hanya ingin menampilkan yg published

      if (data) {
        const formatted = data.map((e: any) => {
          let totalCapacity = 0
          let totalSold = 0

          if (e.ticket_tiers && Array.isArray(e.ticket_tiers)) {
            e.ticket_tiers.forEach((t: any) => {
              totalCapacity += t.quantity || 0
              totalSold += t.sold || 0
            })
          }

          return {
            id: e.id,
            name: e.title || "Untitled Event",
            description: e.description || "",
            date: new Date(e.starts_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            location: e.location || "TBA",
            image: e.banner_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
            attendees: totalCapacity,
            ticketsSold: totalSold,
            category: e.categories?.name || "General"
          }
        })
        setEvents(formatted)
      }
      setLoading(false)
    }

    fetchEvents()
  }, [])

  const categories = ["All Categories", ...Array.from(new Set(events.map(e => e.category)))]
  const locations = ["All Locations", ...Array.from(new Set(events.map(e => e.location)))]

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All Categories" || event.category === selectedCategory
    const matchesLocation = selectedLocation === "All Locations" || event.location === selectedLocation

    return matchesSearch && matchesCategory && matchesLocation
  })

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col">
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

        {/* Search & Filters */}
        <div className="mb-12 max-w-5xl mx-auto flex flex-col md:flex-row gap-4 animate-in fade-in duration-500 delay-150">
          <div className="relative grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search events by name or description..."
              className="pl-12 h-12 text-base rounded-full border-border/50 shadow-sm bg-background/50 backdrop-blur-sm focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <select
                className="h-12 pl-10 pr-10 py-2 bg-background/50 backdrop-blur-sm border border-border/50 rounded-full shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-position-[right_12px_center] bg-size-[16px_16px] cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:w-56">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <select
                className="h-12 pl-10 pr-10 py-2 bg-background/50 backdrop-blur-sm border border-border/50 rounded-full shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-position-[right_12px_center] bg-size-[16px_16px] cursor-pointer"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-200">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleEventClick(event.id)}
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-background/90 text-[10px] font-bold uppercase tracking-wider rounded-full text-foreground shadow-sm">
                      {event.category}
                    </span>
                  </div>
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
        ) : (
          <div className="text-center py-20 bg-background/50 rounded-2xl border border-dashed border-border/50 animate-in fade-in duration-500 delay-200">
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground">
              We couldn't find any events matching your current filters. Try adjusting your search.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All Categories")
                setSelectedLocation("All Locations")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}