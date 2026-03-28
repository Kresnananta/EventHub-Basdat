import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Ticket, ShoppingCart, Users, Settings, PieChart, ChevronsUpDown } from "lucide-react"


const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tickets", url: "/dashboard/tickets", icon: Ticket },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
  { title: "Attendees", url: "/dashboard/attendees", icon: Users },
]

const eventTools = [
  { title: "Check-in", url: "#", icon: Users },
  { title: "Surveys", url: "#", icon: PieChart },
  { title: "Widgets", url: "#", icon: Settings },
]

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar variant="sidebar" className="border-r-0 bg-primary! text-primary-foreground dark">
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 px-2 py-2">
          {/* Mock Logo */}
          <div className="bg-white text-primary rounded-md p-1.5 shadow-sm font-bold flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">EventHub</span>
        </div>

        <div className="mt-4 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white font-medium transition-colors border border-white/10">
                <span className="truncate">All Event</span>
                <ChevronsUpDown size={16} className="text-white/60 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            {/* Menu Pilihan yang akan muncul */}
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Choose Event</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Placeholder Data Dummy */}
              <DropdownMenuItem className="font-bold text-primary bg-primary/5 cursor-pointer">
                All Event
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Google I/O 2026
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Tech Startup Conference
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 uppercase text-xs tracking-widest font-semibold mb-2 px-3">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-11 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200 ${isActive
                        ? "bg-white/20 text-white font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span className="font-medium text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 uppercase text-xs tracking-widest font-semibold mb-2 px-3">Event Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {eventTools.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-11 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200 ${isActive
                        ? "bg-white/20 text-white font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span className="font-medium text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
