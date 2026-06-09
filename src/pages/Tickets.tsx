import { useCallback, useEffect, useState } from "react"
import type { FormEvent } from "react"
import { supabase } from "@/lib/supabase-client"
import { useEventContext } from "@/context/EventContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Pencil, Save, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getScopedEventIds } from "@/lib/dashboard-scope"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/errors"

type TicketTierRow = {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  quantity: number
  sold: number
  currency: string
  events: {
    title: string | null
  } | null
}

type TicketForm = {
  eventId: string
  name: string
  description: string
  price: string
  quantity: string
  currency: string
}

type EventOption = {
  id: string
  title: string
}

function formatCurrency(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("id-ID")}`
}

export function Tickets() {
  const [tickets, setTickets] = useState<TicketTierRow[]>([]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketTierRow | null>(null)
  const [formData, setFormData] = useState<TicketForm>({
    eventId: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
    currency: "IDR",
  })
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const { selectedEventId, selectedEventName } = useEventContext();
  const { profile, user } = useAuth()

  const fetchTickets = useCallback(async () => {
    setLoading(true)

    const scopedEventIds = await getScopedEventIds({
      role: profile?.role,
      selectedEventId,
      userId: user?.id,
    })

    if (scopedEventIds?.length === 0) {
      setTickets([])
      setEventOptions([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('ticket_tiers')
      .select(`
        id, event_id, name, description, price, quantity, sold, currency,
        events ( title )
      `)
      .order('created_at', { ascending: false })

    if (scopedEventIds) {
      query = query.in('event_id', scopedEventIds)
    }

    let eventsQuery = supabase
      .from("events")
      .select("id, title")
      .order("title")

    if (scopedEventIds) {
      eventsQuery = eventsQuery.in("id", scopedEventIds)
    }

    const [ticketResult, eventResult] = await Promise.all([query, eventsQuery])
    const { data, error } = ticketResult

    if (error) {
      console.error("Error fetching tickets:", error)
      setTickets([])
      setLoading(false)
      return
    }

    if (eventResult.error) {
      console.error("Error fetching ticket events:", eventResult.error)
      setEventOptions([])
    } else {
      setEventOptions(eventResult.data ?? [])
    }

    setTickets((data ?? []) as unknown as TicketTierRow[])
    setLoading(false)
  }, [profile?.role, selectedEventId, user?.id])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  function getDefaultEventId() {
    if (selectedEventId && eventOptions.some((event) => event.id === selectedEventId)) {
      return selectedEventId
    }

    if (eventOptions.length === 1) return eventOptions[0].id

    return ""
  }

  function openCreateDialog() {
    setCreatingTicket(true)
    setEditingTicket(null)
    setFormData({
      eventId: getDefaultEventId(),
      name: "",
      description: "",
      price: "",
      quantity: "",
      currency: "IDR",
    })
    setErrorMessage("")
    setSuccessMessage("")
  }

  function openEditDialog(ticket: TicketTierRow) {
    setCreatingTicket(false)
    setEditingTicket(ticket)
    setFormData({
      eventId: ticket.event_id,
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price.toString(),
      quantity: ticket.quantity.toString(),
      currency: ticket.currency,
    })
    setErrorMessage("")
    setSuccessMessage("")
  }

  function closeEditDialog() {
    setCreatingTicket(false)
    setEditingTicket(null)
    setErrorMessage("")
    setSuccessMessage("")
  }

  function updateField(field: keyof TicketForm, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  async function handleSaveTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const eventId = formData.eventId
    const name = formData.name.trim()
    const price = Number(formData.price)
    const quantity = Number(formData.quantity)
    const currency = formData.currency.trim().toUpperCase() || "IDR"

    setErrorMessage("")
    setSuccessMessage("")

    if (!editingTicket && !eventId) {
      setErrorMessage("Choose an event before creating a ticket tier.")
      return
    }

    if (!name) {
      setErrorMessage("Ticket name is required.")
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage("Ticket price must be a valid positive number.")
      return
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setErrorMessage("Ticket capacity must be a valid whole number.")
      return
    }

    if (editingTicket && quantity < editingTicket.sold) {
      setErrorMessage(
        `Ticket capacity cannot be lower than ${editingTicket.sold.toLocaleString("id-ID")} tickets already sold.`
      )
      return
    }

    setSaving(true)

    const ticketValues = {
      name,
      description: formData.description.trim() || null,
      price,
      quantity,
      currency,
      updated_at: new Date().toISOString(),
    }

    const { error } = editingTicket
      ? await supabase
        .from("ticket_tiers")
        .update(ticketValues)
        .eq("id", editingTicket.id)
      : await supabase
        .from("ticket_tiers")
        .insert({
          ...ticketValues,
          event_id: eventId,
          sold: 0,
        })

    if (error) {
      setErrorMessage(getErrorMessage(error, "Ticket tier could not be saved."))
    } else {
      setSuccessMessage(editingTicket ? "Ticket tier updated successfully." : "Ticket tier created successfully.")
      await fetchTickets()
      setCreatingTicket(false)
      setEditingTicket(null)
    }

    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Ticket Management</h2>
          <p className="text-muted-foreground mt-1">Manage ticket tiers and sales of your event</p>
        </div>
        <Button className="gap-2 shadow-sm font-medium" onClick={openCreateDialog} disabled={loading || eventOptions.length === 0}>
          <Plus size={16} />
          Create New Ticket
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Ticket Categories: {selectedEventName === "All Event" ? "Your Events" : selectedEventName}</CardTitle>
          <CardDescription>Manage ticket tiers and sales of your event</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Ticket Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-center">Sold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length > 0 ? tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">{ticket.name}</TableCell>

                    {/* title hasil dari foreign key (JOIN) di supabase */}
                    <TableCell className="text-muted-foreground">
                      {ticket.events?.title || "Unknown"}
                    </TableCell>

                    <TableCell>
                      {formatCurrency(ticket.currency, ticket.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      {ticket.quantity}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      {ticket.sold}
                    </TableCell>
                    <TableCell>
                      {ticket.sold >= ticket.quantity ? (
                        <Badge variant="destructive" className="shadow-none">Sold Out</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(ticket)}
                        aria-label={`Edit ${ticket.name}`}
                      >
                        <Pencil size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {eventOptions.length === 0 ? "No managed events are available for ticket tiers." : "No ticket tiers have been created yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(creatingTicket || editingTicket) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-background shadow-xl">
            <form onSubmit={handleSaveTicket}>
              <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {editingTicket ? "Edit Ticket Tier" : "Create Ticket Tier"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {editingTicket?.events?.title || "Add a ticket category to one of your managed events."}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closeEditDialog} aria-label="Close edit ticket dialog">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 p-5">
                {errorMessage && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="ticketEvent">Event</Label>
                  {editingTicket ? (
                    <div className="flex h-8 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                      {editingTicket.events?.title || "Unknown Event"}
                    </div>
                  ) : (
                    <select
                      id="ticketEvent"
                      value={formData.eventId}
                      onChange={(event) => updateField("eventId", event.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      required
                    >
                      <option value="">Choose event</option>
                      {eventOptions.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ticketName">Ticket name</Label>
                  <Input
                    id="ticketName"
                    value={formData.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ticketDescription">Description</Label>
                  <Input
                    id="ticketDescription"
                    value={formData.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Benefits or ticket notes"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <div className="grid gap-2">
                    <Label htmlFor="ticketPrice">Price</Label>
                    <Input
                      id="ticketPrice"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(event) => updateField("price", event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ticketCurrency">Currency</Label>
                    <Input
                      id="ticketCurrency"
                      value={formData.currency}
                      onChange={(event) => updateField("currency", event.target.value)}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ticketQuantity">Capacity</Label>
                    <Input
                      id="ticketQuantity"
                      type="number"
                      min={editingTicket?.sold ?? 0}
                      value={formData.quantity}
                      onChange={(event) => updateField("quantity", event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Sold</Label>
                    <div className="flex h-8 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                      {(editingTicket?.sold ?? 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border p-5">
                <Button type="button" variant="outline" onClick={closeEditDialog} disabled={saving}>
                  Cancel
                </Button>
                <Button className="gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
