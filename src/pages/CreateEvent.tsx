import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CalendarClock, Image, Loader2, MapPin, Plus, Save, Send, Ticket, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase-client"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

type TicketTierForm = {
  name: string
  description: string
  price: string
  quantity: string
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
  const [location, setLocation] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [ticketTiers, setTicketTiers] = useState<TicketTierForm[]>([
    { name: "Regular", description: "", price: "", quantity: "" },
  ])
  const [submittingStatus, setSubmittingStatus] = useState<"draft" | "published" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const totalCapacity = useMemo(() => {
    return ticketTiers.reduce((total, tier) => total + (Number(tier.quantity) || 0), 0)
  }, [ticketTiers])

  const canSubmit = Boolean(title.trim() && startsAt && ticketTiers.some((tier) => tier.name.trim()))

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

    setSubmittingStatus(status)

    try {
      const categoryId = await resolveCategoryId()
      const eventSlug = `${slugify(title) || "event"}-${Date.now().toString(36)}`

      const { data: createdEvent, error: eventError } = await supabase
        .from("events")
        .insert({
          organizer_id: user.id,
          category_id: categoryId,
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          banner_url: bannerUrl.trim() || null,
          starts_at: toTimestamp(startsAt),
          ends_at: endsAt ? toTimestamp(endsAt) : null,
          status,
          slug: eventSlug,
        })
        .select("id")
        .single()

      if (eventError) throw eventError

      const { error: ticketError } = await supabase.from("ticket_tiers").insert(
        validTicketTiers.map((tier) => ({
          event_id: createdEvent.id,
          name: tier.name,
          description: tier.description || null,
          price: tier.price,
          quantity: tier.quantity,
          currency: "IDR",
        }))
      )

      if (ticketError) throw ticketError

      navigate(status === "published" ? `/event/${createdEvent.id}` : "/dashboard")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Event failed to be saved."
      setErrorMessage(message)
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

              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-2">
                  <Label htmlFor="bannerUrl">Banner image URL</Label>
                  <div className="relative">
                    <Image className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="bannerUrl"
                      value={bannerUrl}
                      onChange={(event) => setBannerUrl(event.target.value)}
                      placeholder="https://..."
                      className="h-10 pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="contoh: JCC Senayan, Jakarta"
                    className="h-10 pl-9"
                  />
                </div>
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
                Event title, start date, and at least one ticket name are required.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  )
}
