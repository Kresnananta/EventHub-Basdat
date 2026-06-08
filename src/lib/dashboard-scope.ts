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
  if (selectedEventId) return [selectedEventId]
  if (role === "admin") return null
  if (!userId) return []

  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", userId)

  if (error) {
    console.error("Failed to resolve dashboard event scope:", error)
    return []
  }

  return (data ?? []).map((event) => event.id)
}
