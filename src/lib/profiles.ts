import type { User } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata?.[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export async function ensureUserProfile(user: User): Promise<Profile | null> {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (selectError) throw selectError
  if (existingProfile) return existingProfile

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: getStringMetadata(user, "full_name"),
      avatar_url: getStringMetadata(user, "avatar_url"),
      role: "buyer",
    })
    .select("*")
    .single()

  if (insertError) throw insertError

  return createdProfile
}
