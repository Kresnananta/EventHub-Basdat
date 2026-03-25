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
import { LayoutDashboard, Ticket, ShoppingCart, Users, Settings, PieChart } from "lucide-react"

const menuItems = [
  { title: "Dashboard", url: "#", icon: LayoutDashboard },
  { title: "Tickets", url: "#", icon: Ticket },
  { title: "Orders", url: "#", icon: ShoppingCart },
  { title: "Attendees", url: "#", icon: Users },
]

const eventTools = [
  { title: "Check-in", url: "#", icon: Users },
  { title: "Surveys", url: "#", icon: PieChart },
  { title: "Widgets", url: "#", icon: Settings },
]

export function AppSidebar() {
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
      </SidebarHeader>

      <SidebarContent className="px-2 mt-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 uppercase text-xs tracking-widest font-semibold mb-2 px-3">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200">
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium text-[15px]">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 uppercase text-xs tracking-widest font-semibold mb-2 px-3">Event Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {eventTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors duration-200">
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span className="font-medium text-[15px]">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
