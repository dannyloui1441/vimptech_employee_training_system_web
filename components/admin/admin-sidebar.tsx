"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, BookOpen, Calendar, Bell, BarChart3, Settings, LogOut, GraduationCap, ClipboardList } from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: BookOpen, label: "Training", href: "/admin/training" },
  { icon: ClipboardList, label: "Assessment", href: "/admin/assessment" },
  { icon: Calendar, label: "Schedules", href: "/admin/schedules" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[280px] border-r border-border bg-card hidden md:flex flex-col">
      <div className="p-6 border-b border-border flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-foreground tracking-tight">Training Admin</h2>
          <p className="text-xs text-muted-foreground">Enterprise Portal</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
