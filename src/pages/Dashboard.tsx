import { StatCards } from "../components/dashboard/StatCards"
import { SalesChart } from "../components/dashboard/SalesChart"
import { RecentOrders } from "../components/dashboard/RecentOrders"
import { Button } from "@/components/ui/button"
import { ExternalLink, Plus } from "lucide-react"

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Event Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your events today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white hover:bg-muted font-medium">
            <ExternalLink size={16} />
            View Event Page
          </Button>
          <Button className="gap-2 shadow-sm font-medium">
            <Plus size={16} />
            Create Event
          </Button>
        </div>
      </div>
      
      <StatCards />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SalesChart />
        <RecentOrders />
      </div>
    </div>
  )
}
