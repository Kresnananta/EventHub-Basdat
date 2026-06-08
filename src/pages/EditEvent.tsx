import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Building2, CalendarClock, Check, ChevronsUpDown, Image, Loader2, MapPin, Save, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase-client"

type VenueOption = {
  id: string
  name: string
  address: string | null
  city: string | null
  capacity: number | null
}

type EventRecord = {
  id: string
  organizer_id: string
  title: string
  description: string | null
  banner_url: string | null
  starts_at: string
  ends_at: string | null
  status: string
  venue_id: string
  categories: {
    name: string
  } | null
  ticket_tiers: Array<{
    quantity: number
  }>
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export function EditEvent() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [venues, setVenues] = useState<VenueOption[]>([])
  const [venueSearch, setVenueSearch] = useState("")
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false)
  const [ticketCapacity, setTicketCapacity] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryName, setCategoryName] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [status, setStatus] = useState("draft")
  const [selectedVenueId, setSelectedVenueId] = useState("")

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId, venues]
  )

  const filteredVenues = useMemo(() => {
    const query = venueSearch.trim().toLowerCase()
    if (!query) return venues

    return venues.filter((venue) =>
      [venue.name, venue.city, venue.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    )
  }, [venueSearch, venues])

  const exceedsVenueCapacity =
    selectedVenue?.capacity !== null &&
    selectedVenue?.capacity !== undefined &&
    ticketCapacity > selectedVenue.capacity

  useEffect(() => {
    async function loadForm() {
      if (!eventId || !user) return
      setLoading(true)

      const [venuesResult, eventResult] = await Promise.all([
        supabase
          .from("venues")
          .select("id, name, address, city, capacity")
          .order("name"),
        supabase
          .from("events")
          .select(`
            id, organizer_id, title, description, banner_url, starts_at, ends_at,
            status, venue_id,
            categories ( name ),
            ticket_tiers ( quantity )
          `)
          .eq("id", eventId)
          .single(),
      ])

      if (venuesResult.error || eventResult.error) {
        setErrorMessage(venuesResult.error?.message || eventResult.error?.message || "Event could not be loaded.")
        setLoading(false)
        return
      }

      const event = eventResult.data as EventRecord
      if (profile?.role !== "admin" && event.organizer_id !== user.id) {
        setErrorMessage("You do not have permission to edit this event.")
        setLoading(false)
        return
      }

      setVenues(venuesResult.data ?? [])
      setTitle(event.title)
      setDescription(event.description || "")
      setCategoryName(event.categories?.name || "")
      setBannerUrl(event.banner_url || "")
      setStartsAt(toDateTimeLocal(event.starts_at))
      setEndsAt(toDateTimeLocal(event.ends_at))
      setStatus(event.status)
      setSelectedVenueId(event.venue_id)
      setTicketCapacity(event.ticket_tiers.reduce((total, tier) => total + (tier.quantity || 0), 0))
      setLoading(false)
    }

    void loadForm()
  }, [eventId, profile?.role, user])

  async function resolveCategoryId() {
    const name = categoryName.trim()
    if (!name) return null
    const slug = slugify(name)

    const { data: existing, error: selectError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (selectError) throw selectError
    if (existing) return existing.id

    const { data: created, error: insertError } = await supabase
      .from("categories")
      .insert({ name, slug })
      .select("id")
      .single()

    if (insertError) throw insertError
    return created.id
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")

    if (!eventId || !selectedVenue) {
      setErrorMessage("Choose a valid venue.")
      return
    }

    if (!title.trim() || !startsAt) {
      setErrorMessage("Event title and start date are required.")
      return
    }

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setErrorMessage("Event end date must be later than the start date.")
      return
    }

    if (exceedsVenueCapacity) {
      setErrorMessage(
        `Existing ticket capacity (${ticketCapacity.toLocaleString("id-ID")}) exceeds ${selectedVenue.name}'s capacity (${selectedVenue.capacity?.toLocaleString("id-ID")}).`
      )
      return
    }

    setSaving(true)

    try {
      const categoryId = await resolveCategoryId()
      const { error } = await supabase
        .from("events")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId,
          venue_id: selectedVenue.id,
          banner_url: bannerUrl.trim() || null,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)

      if (error) throw error
      navigate("/dashboard/events")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Event could not be updated.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-4 gap-2 px-0 hover:bg-transparent" onClick={() => navigate("/dashboard/events")}>
        <ArrowLeft size={16} />
        Back to events
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Event</h2>
          <p className="mt-1 text-muted-foreground">Update event information and assign an EventHub venue.</p>
        </div>
        <Badge variant="outline">{ticketCapacity.toLocaleString("id-ID")} ticket capacity</Badge>
      </div>

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>Public event information displayed to buyers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="editTitle">Event title</Label>
                <Input id="editTitle" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDescription">Description</Label>
                <textarea
                  id="editDescription"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="editCategory">Category</Label>
                  <Input id="editCategory" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editBanner">Banner image URL</Label>
                  <div className="relative">
                    <Image className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="editBanner" value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} className="pl-9" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("overflow-visible", venueDropdownOpen && "relative z-20")}>
            <CardHeader>
              <CardTitle>Schedule & Venue</CardTitle>
              <CardDescription>The venue capacity must support all existing ticket tiers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="editStartsAt">Starts at</Label>
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="editStartsAt" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="pl-9" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEndsAt">Ends at</Label>
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="editEndsAt" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Venue</Label>
                <div className="relative">
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => setVenueDropdownOpen((open) => !open)}
                    aria-expanded={venueDropdownOpen}
                  >
                    <span className="truncate">
                      {selectedVenue
                        ? [selectedVenue.name, selectedVenue.city].filter(Boolean).join(", ")
                        : "Choose a venue"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </button>

                  {venueDropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-lg border border-border bg-background p-2 shadow-lg">
                      <div className="relative mb-2">
                        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input value={venueSearch} onChange={(event) => setVenueSearch(event.target.value)} placeholder="Search venue..." className="pl-8" autoFocus />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredVenues.map((venue) => (
                          <button
                            key={venue.id}
                            type="button"
                            className="flex w-full items-start justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setSelectedVenueId(venue.id)
                              setVenueSearch("")
                              setVenueDropdownOpen(false)
                            }}
                          >
                            <span>
                              <span className="block font-medium">{venue.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {[venue.address, venue.city].filter(Boolean).join(", ")}
                              </span>
                            </span>
                            {venue.id === selectedVenueId && <Check className="mt-0.5 h-4 w-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedVenue && (
                  <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                    <div className="flex gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{[selectedVenue.address, selectedVenue.city].filter(Boolean).join(", ")}</span>
                    </div>
                    <div className="flex gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className={exceedsVenueCapacity ? "text-destructive" : ""}>
                        Capacity: {selectedVenue.capacity?.toLocaleString("id-ID") ?? "Not specified"}
                      </span>
                    </div>
                  </div>
                )}
                {exceedsVenueCapacity && (
                  <p className="text-sm text-destructive">This venue is too small for the existing ticket capacity.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Save Changes</CardTitle>
              <CardDescription>Choose the event publication status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="editStatus">Status</Label>
                <select
                  id="editStatus"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <Button className="w-full gap-2" disabled={saving || exceedsVenueCapacity}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  )
}
