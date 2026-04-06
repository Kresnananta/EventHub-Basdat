import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { LogOut, Home, Ticket } from "lucide-react"

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
            <Button
              variant={isActive('/your-events') ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => navigate('/your-events')}
            >
              <Ticket size={18} />
              Your Events
            </Button>
          </div>

          {/* Right side - User info & actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">Welcome, Guest!</p>
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
          <Button
            variant={isActive('/your-events') ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 flex-1"
            onClick={() => navigate('/your-events')}
          >
            <Ticket size={16} />
            Your Events
          </Button>
        </div>
      </div>
    </nav>
  )
}
