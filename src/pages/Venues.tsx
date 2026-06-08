import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Building2, Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/database.types"

type Venue = Database["public"]["Tables"]["venues"]["Row"]

export function Venues() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    capacity: "",
  })

  async function fetchVenues() {
    setLoading(true)
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load venues:", error)
      setErrorMessage(error.message)
      setVenues([])
    } else {
      setVenues(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void fetchVenues()
  }, [])

  const filteredVenues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return venues

    return venues.filter((venue) =>
      [venue.name, venue.address, venue.city]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    )
  }, [venues, searchQuery])

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const name = formData.name.trim()
    if (!name) {
      setErrorMessage("Venue name is required.")
      return
    }

    const capacity = formData.capacity ? Number(formData.capacity) : null
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
      setErrorMessage("Venue capacity must be a valid positive number.")
      return
    }

    setSubmitting(true)

    const venueValues = {
      name,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      capacity,
    }

    const { error } = editingVenueId
      ? await supabase.from("venues").update(venueValues).eq("id", editingVenueId)
      : await supabase.from("venues").insert(venueValues)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage(editingVenueId ? "Venue updated successfully." : "Venue created successfully.")
      setEditingVenueId(null)
      setFormData({ name: "", address: "", city: "", capacity: "" })
      await fetchVenues()
    }

    setSubmitting(false)
  }

  function startEditing(venue: Venue) {
    setEditingVenueId(venue.id)
    setFormData({
      name: venue.name,
      address: venue.address || "",
      city: venue.city || "",
      capacity: venue.capacity?.toString() || "",
    })
    setErrorMessage("")
    setSuccessMessage("")
  }

  function cancelEditing() {
    setEditingVenueId(null)
    setFormData({ name: "", address: "", city: "", capacity: "" })
    setErrorMessage("")
  }

  async function deleteVenue(venue: Venue) {
    const confirmed = window.confirm(
      `Delete "${venue.name}"? Venues already used by an event cannot be deleted.`
    )
    if (!confirmed) return

    setDeletingId(venue.id)
    setErrorMessage("")
    setSuccessMessage("")

    const { error } = await supabase.from("venues").delete().eq("id", venue.id)

    if (error) {
      setErrorMessage(error.message)
    } else {
      setSuccessMessage("Venue deleted successfully.")
      if (editingVenueId === venue.id) cancelEditing()
      await fetchVenues()
    }

    setDeletingId(null)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Venue Management</h2>
          <p className="mt-1 text-muted-foreground">
            Admin EventHub manages venue data used by organizers when creating events.
          </p>
        </div>
        <Badge variant="outline" className="h-7 px-3">
          {venues.length.toLocaleString("id-ID")} venues
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingVenueId ? "Edit Venue" : "Add Venue"}
            </CardTitle>
            <CardDescription>
              {editingVenueId
                ? "Update the selected venue record."
                : "Create venue records before organizers publish events."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
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
                <Label htmlFor="venueName">Venue name</Label>
                <Input
                  id="venueName"
                  value={formData.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="JCC Senayan"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="venueAddress">Address</Label>
                <Input
                  id="venueAddress"
                  value={formData.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Jl. Gatot Subroto"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="venueCity">City</Label>
                  <Input
                    id="venueCity"
                    value={formData.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="Jakarta"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venueCapacity">Capacity</Label>
                  <Input
                    id="venueCapacity"
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(event) => updateField("capacity", event.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 gap-2" disabled={submitting}>
                  {submitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : editingVenueId
                      ? <Pencil className="h-4 w-4" />
                      : <Plus className="h-4 w-4" />}
                  {editingVenueId ? "Save Changes" : "Create Venue"}
                </Button>
                {editingVenueId && (
                  <Button type="button" variant="outline" size="icon" onClick={cancelEditing} aria-label="Cancel editing">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Venue List</CardTitle>
              <CardDescription>Search venues by name, city, or address.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search venues..."
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVenues.length > 0 ? (
                    filteredVenues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell className="font-semibold text-foreground">{venue.name}</TableCell>
                        <TableCell>{venue.city || "-"}</TableCell>
                        <TableCell>{venue.capacity?.toLocaleString("id-ID") || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{venue.address || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(venue)}
                              aria-label={`Edit ${venue.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void deleteVenue(venue)}
                              disabled={deletingId === venue.id}
                              aria-label={`Delete ${venue.name}`}
                            >
                              {deletingId === venue.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {searchQuery ? `No venues found for "${searchQuery}".` : "No venues have been created yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
