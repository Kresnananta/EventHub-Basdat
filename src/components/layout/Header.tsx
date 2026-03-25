import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search } from "lucide-react"

export function Header() {
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
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-white">
              !
            </span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">Kresna.Co</span>
            <span className="text-xs text-muted-foreground">Premium Plan</span>
          </div>
          <Avatar className="h-9 w-9 border border-primary/20 cursor-pointer">
            <AvatarImage src="https://github.com/shadcn.png" alt="@organiser" />
            <AvatarFallback className="bg-primary/10 text-primary">AO</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
