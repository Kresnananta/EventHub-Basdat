import { createContext, useContext, useEffect, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase-client"

type AuthContextType = {
    session: Session | null
    user: User | null
    profile: any | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    async function hydrateUser(session: Session | null) {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
            // Tarik data profil publik untuk mengecek ROLE!
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            setProfile(data)
        } else {
            setProfile(null)
        }
        setLoading(false)
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            hydrateUser(session)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setLoading(true)
            hydrateUser(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ session, user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be called from AuthProvider")
    }
    return context
}