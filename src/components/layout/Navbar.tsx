import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { LogOut, Home, Ticket, UserCircle } from "lucide-react"
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

  return (
    <nav className="border-b border-border/50 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EventHub
            </h1>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-1">
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
              <Button
                variant={isActive('/your-events') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => navigate('/your-events')}
              >
                <Ticket size={18} />
                Your Events
              </Button>
            )}
          </div>

          {/* Right side - User info & actions */}
          <div className="flex items-center gap-4">
            {/* {profile?.role === 'organizer' && (
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate('/dashboard')}
              >
                Admin Dashboard
              </Button>
            )} */}

            {session ? (
              <>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">
                    Welcome, {profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}!
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
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
            <Button
              variant={isActive('/your-events') ? 'default' : 'ghost'}
              size="sm"
              className="gap-2 flex-1"
              onClick={() => navigate('/your-events')}
            >
              <Ticket size={16} />
              Your Events
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
