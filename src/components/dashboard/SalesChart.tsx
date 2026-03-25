import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"

const chartData = [
  { date: "10 Apr", tickets: 12, sales: 1200000 },
  { date: "13 Apr", tickets: 25, sales: 2500000 },
  { date: "16 Apr", tickets: 18, sales: 1800000 },
  { date: "19 Apr", tickets: 35, sales: 3500000 },
  { date: "22 Apr", tickets: 28, sales: 2800000 },
  { date: "25 Apr", tickets: 42, sales: 4200000 },
  { date: "28 Apr", tickets: 55, sales: 5500000 },
]

const chartConfig = {
  sales: {
    label: "Sales Volume (Rp)",
    color: "hsl(var(--chart-1))",
  },
}

export function SalesChart() {
  return (
    <Card className="col-span-1 border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Ticket Sales Volume</CardTitle>
        <CardDescription>Sales performance over the last two weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tickMargin={12}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} 
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
