import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Header } from "./Header"
import { Outlet } from "react-router-dom"
import { EventProvider } from "@/context/EventContext"

export function DashboardLayout() {
  return (
    <EventProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-slate-50">
          <AppSidebar />
          <div className="flex flex-col flex-1 w-full min-w-0">
            <Header />
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </EventProvider>
  )
}
