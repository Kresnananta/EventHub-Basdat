import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Home, LogOut, Search, UserCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase-client"

export function Header() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  const displayName =
    profile?.full_name ||
    session?.user.user_metadata?.full_name ||
    session?.user.email?.split("@")[0] ||
    "User"
  const userEmail = session?.user.email || ""
  const roleLabel = profile?.role === "organizer" ? "Event Organizer" : "Buyer"
  const initials = displayName
    .split(" ")
    .map((name: string) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white shrink-0 sticky top-0 z-10 shadow-sm/50">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:bg-muted" />
        <h1 className="text-lg font-semibold text-foreground/80 hidden sm:block">Event Dashboard</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Mock Search & Notification */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="hover:text-primary transition-colors">
            <Search size={20} />
          </button>
          <button className="relative hover:text-primary transition-colors">
            <Bell size={20} />
            {/* <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-white">
              !
            </span> */}
          </button>
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto gap-3 rounded-full px-2 py-1.5"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground">{displayName}</span>
                <span className="text-xs text-muted-foreground">{roleLabel}</span>
              </div>
              <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Open user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-1">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              {userEmail && (
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {userEmail}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate("/profile")}>
              <UserCircle size={16} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate("/")}>
              <Home size={16} />
              Back to Home
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onSelect={() => void handleLogout()}
            >
              <LogOut size={16} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
