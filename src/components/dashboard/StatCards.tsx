import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Ticket, ShoppingBag, Eye } from "lucide-react"

export function StatCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Sales Volume</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mt-2">Rp 12,450K</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <span className="text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5">+20.1%</span> 
            from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Orders</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mt-2">142</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <span className="text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5">+12.0%</span> 
            from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Tickets Sold</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <Ticket className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mt-2">384</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <span className="text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5">+8.4%</span> 
            from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide">Event Views</CardTitle>
          <div className="bg-primary/10 p-2 rounded-full">
            <Eye className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground mt-2">2,845</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <span className="text-red-600 font-medium bg-red-100 px-1.5 py-0.5 rounded mr-1.5">-4.0%</span> 
            from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
