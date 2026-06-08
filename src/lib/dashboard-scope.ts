import { supabase } from "@/lib/supabase-client"

export async function getScopedEventIds({
  role,
  selectedEventId,
  userId,
}: {
  role: string | null | undefined
  selectedEventId: string | null
  userId: string | null | undefined
}) {
  if (role === "admin") return selectedEventId ? [selectedEventId] : null
  if (!userId) return []

  let query = supabase
    .from("events")
    .select("id")
    .eq("organizer_id", userId)

  if (selectedEventId) {
    query = query.eq("id", selectedEventId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Failed to resolve dashboard event scope:", error)
    return []
  }

  return (data ?? []).map((event) => event.id)
}
