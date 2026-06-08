import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Loader2, Mail, Phone, Search, ShieldCheck, UserCog, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import type { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase-client"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileRole = "buyer" | "organizer" | "admin"
type RoleFilter = ProfileRole | "all"

const roleOptions: Array<{ value: ProfileRole; label: string; description: string }> = [
  { value: "buyer", label: "Buyer", description: "Can browse events and buy tickets." },
  { value: "organizer", label: "Organizer", description: "Can manage events and event operations." },
  { value: "admin", label: "Admin", description: "Can manage platform data and user roles." },
]

const roleLabels: Record<ProfileRole, string> = {
  buyer: "Buyer",
  organizer: "Organizer",
  admin: "Admin",
}

function normalizeRole(role: string): ProfileRole {
  return roleOptions.some((option) => option.value === role) ? role as ProfileRole : "buyer"
}

function formatDate(value: string | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function RoleBadge({ role }: { role: string }) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === "admin") {
    return <Badge className="bg-violet-600 text-white hover:bg-violet-600">Admin</Badge>
  }

  if (normalizedRole === "organizer") {
    return <Badge variant="secondary">Organizer</Badge>
  }

  return <Badge variant="outline">Buyer</Badge>
}

export function RoleManagement() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function fetchProfiles() {
    setLoading(true)
    setErrorMessage("")

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load profiles:", error)
      setErrorMessage(error.message)
      setProfiles([])
    } else {
      setProfiles(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void fetchProfiles()
  }, [])

  const roleCounts = useMemo(() => {
    return profiles.reduce(
      (counts, profile) => {
        const role = normalizeRole(profile.role)
        counts[role] += 1
        return counts
      },
      { admin: 0, organizer: 0, buyer: 0 } as Record<ProfileRole, number>
    )
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return profiles.filter((profile) => {
      const role = normalizeRole(profile.role)
      const matchesRole = roleFilter === "all" || role === roleFilter

      if (!matchesRole) return false
      if (!query) return true

      return [
        profile.full_name,
        profile.email,
        profile.phone,
        roleLabels[role],
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [profiles, roleFilter, searchQuery])

  async function updateRole(profile: ProfileRow, nextRole: ProfileRole) {
    const currentRole = normalizeRole(profile.role)
    if (currentRole === nextRole) return

    setErrorMessage("")
    setSuccessMessage("")

    if (profile.id === user?.id) {
      setErrorMessage("You cannot change your own admin role from this page.")
      return
    }

    if (currentRole === "admin" && nextRole !== "admin" && roleCounts.admin <= 1) {
      setErrorMessage("At least one admin account must remain active.")
      return
    }

    const confirmed = window.confirm(
      `Change ${profile.full_name || profile.email || "this user"} from ${roleLabels[currentRole]} to ${roleLabels[nextRole]}?`
    )
    if (!confirmed) return

    setUpdatingId(profile.id)

    const { data, error } = await supabase.rpc("admin_update_profile_role", {
      p_profile_id: profile.id,
      p_role: nextRole,
    })

    if (error) {
      setErrorMessage(error.message)
    } else {
      const updatedProfile = data ?? {
        ...profile,
        role: nextRole,
        updated_at: new Date().toISOString(),
      }

      setProfiles((current) =>
        current.map((item) => item.id === profile.id ? updatedProfile : item)
      )
      setSuccessMessage("User role updated successfully.")
    }

    setUpdatingId(null)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Role Management</h2>
          <p className="mt-1 text-muted-foreground">
            Manage EventHub user access for buyers, organizers, and platform admins.
          </p>
        </div>
        <Badge variant="outline" className="h-7 px-3">
          {profiles.length.toLocaleString("id-ID")} users
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{roleCounts.admin.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organizers</CardTitle>
            <UserCog className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{roleCounts.organizer.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buyers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{roleCounts.buyer.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Search users and assign the correct platform role.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between sm:w-44">
                  {roleFilter === "all" ? "All roles" : roleLabels[roleFilter]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Filter Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRoleFilter("all")}>All roles</DropdownMenuItem>
                {roleOptions.map((role) => (
                  <DropdownMenuItem key={role.value} onClick={() => setRoleFilter(role.value)}>
                    {role.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, email, or phone..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((profile) => {
                      const currentRole = normalizeRole(profile.role)
                      const isCurrentUser = profile.id === user?.id
                      const isUpdating = updatingId === profile.id

                      return (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="font-semibold text-foreground">
                              {profile.full_name || "Unnamed user"}
                            </div>
                            <div className="text-xs text-muted-foreground">{profile.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                {profile.email || "-"}
                              </span>
                              <span className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                {profile.phone || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <RoleBadge role={profile.role} />
                              {isCurrentUser && <span className="text-xs text-muted-foreground">You</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarDays className="h-4 w-4" />
                              {formatDate(profile.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled={isUpdating || isCurrentUser}>
                                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Change role"}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel>Assign Role</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {roleOptions.map((role) => (
                                  <DropdownMenuItem
                                    key={role.value}
                                    disabled={role.value === currentRole}
                                    onClick={() => void updateRole(profile, role.value)}
                                    className="flex-col items-start gap-0.5"
                                  >
                                    <span className="font-medium">{role.label}</span>
                                    <span className="text-xs text-muted-foreground">{role.description}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No users match the current filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
