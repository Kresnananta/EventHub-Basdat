import { Navigate, Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function AdminRoute() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
