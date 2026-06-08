import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Building2, CalendarClock, Check, ChevronsUpDown, Loader2, MapPin, Plus, Save, Search, Send, Ticket, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { getEventBannerValidationError, uploadEventBanner } from "@/lib/event-banners"
import { getErrorMessage } from "@/lib/errors"

type TicketTierForm = {
  name: string
  description: string
  price: string
  quantity: string
}

type VenueOption = {
  id: string
  name: string
  address: string | null
  city: string | null
  capacity: number | null
}

const emptyTicketTier = (): TicketTierForm => ({
  name: "",
  description: "",
  price: "",
  quantity: "",
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function toTimestamp(value: string) {
  return new Date(value).toISOString()
}

export function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryName, setCategoryName] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [venues, setVenues] = useState<VenueOption[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState("")
  const [venueSearch, setVenueSearch] = useState("")
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false)
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [venueLoadError, setVenueLoadError] = useState("")
  const [ticketTiers, setTicketTiers] = useState<TicketTierForm[]>([
    { name: "Regular", description: "", price: "", quantity: "" },
  ])
  const [submittingStatus, setSubmittingStatus] = useState<"draft" | "published" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const totalCapacity = useMemo(() => {
    return ticketTiers.reduce((total, tier) => total + (Number(tier.quantity) || 0), 0)
  }, [ticketTiers])

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [venues, selectedVenueId]
  )

  const filteredVenues = useMemo(() => {
    const query = venueSearch.trim().toLowerCase()
    if (!query) return venues

    return venues.filter((venue) =>
      [venue.name, venue.city, venue.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    )
  }, [venues, venueSearch])

  const exceedsVenueCapacity =
    selectedVenue?.capacity !== null &&
    selectedVenue?.capacity !== undefined &&
    totalCapacity > selectedVenue.capacity

  const canSubmit = Boolean(
    title.trim() &&
    startsAt &&
    selectedVenueId &&
    ticketTiers.some((tier) => tier.name.trim()) &&
    !exceedsVenueCapacity
  )

  useEffect(() => {
    async function fetchVenues() {
      setVenuesLoading(true)
      setVenueLoadError("")
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, address, city, capacity")
        .order("name")

      if (error) {
        console.error("Failed to load venues:", error)
        setVenueLoadError(
          "Venue data could not be loaded. Check the SELECT policy for public.venues in Supabase."
        )
        setVenues([])
      } else {
        setVenues(data ?? [])
      }

      setVenuesLoading(false)
    }

    void fetchVenues()
  }, [])

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl("")
      return
    }

    const objectUrl = URL.createObjectURL(bannerFile)
    setBannerPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [bannerFile])

  function handleBannerFileChange(file: File | null) {
    setErrorMessage("")

    if (!file) {
      setBannerFile(null)
      return
    }

    const validationError = getEventBannerValidationError(file)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setBannerFile(file)
  }

  function updateTicketTier(index: number, field: keyof TicketTierForm, value: string) {
    setTicketTiers((current) =>
      current.map((tier, tierIndex) => (tierIndex === index ? { ...tier, [field]: value } : tier))
    )
  }

  function addTicketTier() {
    setTicketTiers((current) => [...current, emptyTicketTier()])
  }

  function removeTicketTier(index: number) {
    setTicketTiers((current) => {
      if (current.length === 1) return current
      return current.filter((_, tierIndex) => tierIndex !== index)
    })
  }

  async function resolveCategoryId() {
    const normalizedName = categoryName.trim()
    if (!normalizedName) return null

    const categorySlug = slugify(normalizedName)
    if (!categorySlug) return null

    const { data: existingCategory, error: existingError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle()

    if (existingError) throw existingError
    if (existingCategory) return existingCategory.id

    const { data: insertedCategory, error: insertError } = await supabase
      .from("categories")
      .insert({
        name: normalizedName,
        slug: categorySlug,
      })
      .select("id")
      .single()

    if (insertError) throw insertError
    return insertedCategory.id
  }

  async function saveEvent(status: "draft" | "published") {
    setErrorMessage("")

    if (!user) {
      setErrorMessage("Your session has expired. Please log in again.")
      return
    }

    if (!title.trim()) {
      setErrorMessage("Event title is required.")
      return
    }

    if (!startsAt) {
      setErrorMessage("Event start date is required.")
      return
    }

    if (!selectedVenue) {
      setErrorMessage("Choose a venue managed by EventHub before saving the event.")
      return
    }

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setErrorMessage("Event end date must be later than the start date.")
      return
    }

    const validTicketTiers = ticketTiers
      .map((tier) => ({
        name: tier.name.trim(),
        description: tier.description.trim(),
        price: Number(tier.price) || 0,
        quantity: Number(tier.quantity) || 0,
      }))
      .filter((tier) => tier.name)

    if (validTicketTiers.length === 0) {
      setErrorMessage("At least one ticket type is required.")
      return
    }

    if (validTicketTiers.some((tier) => tier.price < 0 || tier.quantity < 0)) {
      setErrorMessage("Ticket price and quantity cannot be negative.")
      return
    }

    const requestedCapacity = validTicketTiers.reduce((total, tier) => total + tier.quantity, 0)
    if (selectedVenue.capacity !== null && requestedCapacity > selectedVenue.capacity) {
      setErrorMessage(
        `Total ticket capacity (${requestedCapacity.toLocaleString("id-ID")}) exceeds ${selectedVenue.name}'s capacity (${selectedVenue.capacity.toLocaleString("id-ID")}).`
      )
      return
    }

    setSubmittingStatus(status)

    try {
      const categoryId = await resolveCategoryId()
      const eventSlug = `${slugify(title) || "event"}-${Date.now().toString(36)}`

      const { data: createdEvent, error: eventError } = await supabase
        .from("events")
        .insert({
          organizer_id: user.id,
          category_id: categoryId,
          venue_id: selectedVenue.id,
          title: title.trim(),
          description: description.trim() || null,
          banner_url: null, // update habis file diupload
          starts_at: toTimestamp(startsAt),
          ends_at: endsAt ? toTimestamp(endsAt) : null,
          status,
          slug: eventSlug,
        })
        .select("id")
        .single()

      if (eventError) throw new Error(getErrorMessage(eventError, "Event failed to be saved."))

      if (bannerFile) {
        const uploadedBanner = await uploadEventBanner({
          eventId: createdEvent.id,
          file: bannerFile,
          organizerId: user.id,
        })

        const { error: bannerUpdateError } = await supabase
          .from("events")
          .update({
            banner_url: uploadedBanner.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", createdEvent.id)

        if (bannerUpdateError) {
          throw new Error(getErrorMessage(bannerUpdateError, "Banner URL failed to be saved."))
        }
      }

      const { data: createdTiers, error: ticketError } = await supabase.from("ticket_tiers").insert(
        validTicketTiers.map((tier) => ({
          event_id: createdEvent.id,
          name: tier.name,
          description: tier.description || null,
          price: tier.price,
          quantity: tier.quantity,
          currency: "IDR",
        }))
      ).select("id")

      if (ticketError) throw new Error(getErrorMessage(ticketError, "Ticket tiers failed to be saved."))

      for (const tier of createdTiers ?? []) {
        const { error: seatingError } = await supabase.rpc("create_ticket_tier_seating", {
          p_tier_id: tier.id,
        })

        if (seatingError) {
          throw new Error(getErrorMessage(seatingError, "Ticket seating failed to be generated."))
        }
      }

      navigate(status === "published" ? `/event/${createdEvent.id}` : "/dashboard")
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Event failed to be saved."))
    } finally {
      setSubmittingStatus(null)
    }
  }

  function handleDraftSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveEvent("draft")
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" className="mb-3 gap-2 px-0 hover:bg-transparent" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} />
            Back to dashboard
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Event</h2>
          <p className="mt-1 text-muted-foreground">
            Complete the information that will appear on the user page and ticket booking page.
          </p>
        </div>
        <Badge variant="outline" className="h-7 px-3">
          {totalCapacity.toLocaleString("id-ID")} total seats
        </Badge>
      </div>

      <form className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleDraftSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Identity</CardTitle>
              <CardDescription>Key information displayed on the landing page and event details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="title">Event title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="contoh: Jakarta Tech Conference 2026"
                  className="h-10"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ceritakan ringkas tentang event, pembicara, agenda, atau benefit peserta."
                  rows={6}
                  className="min-h-32 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Technology, Music, Business"
                  className="h-10"
                />
              </div>

              <div className="grid gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label htmlFor="bannerUpload">Upload banner</Label>
                    <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP. Max 5MB.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="gap-2" asChild>
                      <label htmlFor="bannerUpload" className="cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Choose image
                      </label>
                    </Button>
                    {bannerFile && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setBannerFile(null)} aria-label="Remove selected banner">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  id="bannerUpload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => handleBannerFileChange(event.target.files?.[0] ?? null)}
                />
                {bannerPreviewUrl ? (
                  <img
                    src={bannerPreviewUrl}
                    alt="Event banner preview"
                    className="aspect-video w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                    No banner selected
                  </div>
                )}
                {bannerFile && (
                  <p className="truncate text-xs text-muted-foreground">
                    Selected: {bannerFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={cn("overflow-visible", venueDropdownOpen && "relative z-20")}>
            <CardHeader>
              <CardTitle>Schedule & Location</CardTitle>
              <CardDescription>Date and location information used by users before purchasing tickets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Starts at</Label>
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                      className="h-10 pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endsAt">Ends at</Label>
                  <div className="relative">
                    <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="endsAt"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(event) => setEndsAt(event.target.value)}
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="venueSearch">Venue</Label>
                <div className="relative">
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => setVenueDropdownOpen((open) => !open)}
                    aria-expanded={venueDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span className={selectedVenue ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                      {selectedVenue
                        ? `${selectedVenue.name}${selectedVenue.city ? `, ${selectedVenue.city}` : ""}`
                        : venuesLoading
                          ? "Loading venues..."
                          : "Choose a venue"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>

                  {venueDropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full rounded-lg border border-border bg-background p-2 shadow-lg">
                      <div className="relative mb-2">
                        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="venueSearch"
                          value={venueSearch}
                          onChange={(event) => setVenueSearch(event.target.value)}
                          placeholder="Search venue, city, or address..."
                          className="pl-8"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto" role="listbox">
                        {filteredVenues.length > 0 ? (
                          filteredVenues.map((venue) => (
                            <button
                              key={venue.id}
                              type="button"
                              role="option"
                              aria-selected={venue.id === selectedVenueId}
                              className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => {
                                setSelectedVenueId(venue.id)
                                setVenueSearch("")
                                setVenueDropdownOpen(false)
                              }}
                            >
                              <span>
                                <span className="block font-medium text-foreground">{venue.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {[venue.city, venue.address].filter(Boolean).join(" - ") || "Address not provided"}
                                </span>
                              </span>
                              {venue.id === selectedVenueId && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                            {venuesLoading
                              ? "Loading venues..."
                              : venueLoadError
                                ? "Unable to load venues."
                                : venues.length === 0
                                  ? "No venues are available."
                                  : "No matching venue found."}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedVenue ? (
                  <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{selectedVenue.name}</p>
                        <p className="text-muted-foreground">
                          {[selectedVenue.address, selectedVenue.city].filter(Boolean).join(", ") || "Address not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Venue capacity</p>
                        <p className={exceedsVenueCapacity ? "text-destructive" : "text-muted-foreground"}>
                          {selectedVenue.capacity === null
                            ? "Not specified"
                            : `${selectedVenue.capacity.toLocaleString("id-ID")} people`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {venueLoadError || (
                      venues.length === 0 && !venuesLoading
                        ? "No venue records are currently available to this account."
                        : "Venues are created and maintained by EventHub administrators."
                    )}
                  </p>
                )}

                {exceedsVenueCapacity && selectedVenue?.capacity !== null && (
                  <p className="text-sm text-destructive">
                    Total ticket capacity exceeds this venue by {(totalCapacity - selectedVenue.capacity).toLocaleString("id-ID")} seats.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <CardTitle>Ticket Tiers</CardTitle>
                <CardDescription>The ticket types that will be available for purchase.</CardDescription>
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={addTicketTier}>
                <Plus size={16} />
                Add ticket
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticketTiers.map((tier, index) => (
                <div key={index} className="rounded-lg border border-border/70 bg-background p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Ticket className="h-4 w-4 text-primary" />
                      Ticket {index + 1}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTicketTier(index)}
                      disabled={ticketTiers.length === 1}
                      aria-label={`Remove ticket ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`ticketName-${index}`}>Ticket name</Label>
                      <Input
                        id={`ticketName-${index}`}
                        value={tier.name}
                        onChange={(event) => updateTicketTier(index, "name", event.target.value)}
                        placeholder="Regular, VIP, Early Bird"
                        className="h-10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`ticketQuantity-${index}`}>Quantity</Label>
                      <Input
                        id={`ticketQuantity-${index}`}
                        type="number"
                        min="0"
                        value={tier.quantity}
                        onChange={(event) => updateTicketTier(index, "quantity", event.target.value)}
                        placeholder="100"
                        className="h-10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`ticketPrice-${index}`}>Price (IDR)</Label>
                      <Input
                        id={`ticketPrice-${index}`}
                        type="number"
                        min="0"
                        value={tier.price}
                        onChange={(event) => updateTicketTier(index, "price", event.target.value)}
                        placeholder="250000"
                        className="h-10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`ticketDescription-${index}`}>Ticket description</Label>
                      <Input
                        id={`ticketDescription-${index}`}
                        value={tier.description}
                        onChange={(event) => updateTicketTier(index, "description", event.target.value)}
                        placeholder="Benefit atau catatan tiket"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Publish Control</CardTitle>
              <CardDescription>Save as draft or directly display to users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status after save</span>
                  <Badge variant="secondary">Draft / Published</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Ticket tiers</span>
                  <span className="font-medium">{ticketTiers.length}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Total seats</span>
                  <span className="font-medium">{totalCapacity.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="grid gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  className="h-10 gap-2"
                  disabled={!canSubmit || submittingStatus !== null}
                >
                  {submittingStatus === "draft" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Save Draft
                </Button>
                <Button
                  type="button"
                  className="h-10 gap-2"
                  disabled={!canSubmit || submittingStatus !== null}
                  onClick={() => saveEvent("published")}
                >
                  {submittingStatus === "published" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Publish Event
                </Button>
              </div>

              <p className={cn("text-xs text-muted-foreground", !canSubmit && "text-destructive")}>
                Event title, start date, venue, and at least one ticket name are required. Ticket capacity cannot exceed venue capacity.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  )
}