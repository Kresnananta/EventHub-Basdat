import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, LogOut, Home, Ticket, UserCircle } from "lucide-react"
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const { session, profile } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path
  const displayName = profile?.full_name || session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'User'
  const userEmail = session?.user.email || ''
  const initials = displayName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav className="border-b border-border/50 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          {/* Logo */}
          <div
            className="justify-self-start cursor-pointer"
            onClick={() => navigate('/')}
          >
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EventHub
            </h1>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-1 justify-self-center">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => navigate('/')}
            >
              <Home size={18} />
              Home
            </Button>

            {/* kalo user blm login, your event ilang */}
            {session && (
              <>
                <Button
                  variant={isActive('/your-events') ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate('/your-events')}
                >
                  <Ticket size={18} />
                  Your Events
                </Button>
                <Button
                  variant={isActive('/my-tickets') ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate('/my-tickets')}
                >
                  <Ticket size={18} />
                  My Tickets
                </Button>
              </>
            )}
          </div>

          {/* Right side - User info & actions */}
          <div className="flex items-center justify-self-end">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-lg" className="rounded-full">
                    <Avatar className="h-9 w-9 border border-primary/20">
                      <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {initials || 'U'}
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
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate('/profile')}>
                    <UserCircle size={16} />
                    Profile
                  </DropdownMenuItem>
                  {profile?.role === 'organizer' && (
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => navigate('/dashboard')}>
                      <LayoutDashboard size={16} />
                      Dashboard
                    </DropdownMenuItem>
                  )}
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
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/login')}
              >
                <UserCircle size={16} />
                <span className="hidden sm:inline">Login / Register</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-2 pb-4">
          <Button
            variant={isActive('/') ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 flex-1"
            onClick={() => navigate('/')}
          >
            <Home size={16} />
            Home
          </Button>
          {session && (
            <>
              <Button
                variant={isActive('/your-events') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2 flex-1"
                onClick={() => navigate('/your-events')}
              >
                <Ticket size={16} />
                Your Events
              </Button>
              <Button
                variant={isActive('/my-tickets') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2 flex-1"
                onClick={() => navigate('/my-tickets')}
              >
                <Ticket size={16} />
                My Tickets
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
