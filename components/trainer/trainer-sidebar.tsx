"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, LogOut, GraduationCap, Users, ClipboardList } from "lucide-react"

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/trainer/dashboard" },
    { icon: BookOpen, label: "My Subjects", href: "/trainer/subjects" },
    { icon: ClipboardList, label: "Assessment", href: "/trainer/assessment" },
    { icon: Users, label: "My Employees", href: "/trainer/employees" },
]


export function TrainerSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-[280px] border-r border-border bg-card hidden md:flex flex-col">
            <div className="p-6 border-b border-border flex items-center gap-2">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                    <h2 className="font-semibold text-lg text-foreground tracking-tight">Trainer Panel</h2>
                    <p className="text-xs text-muted-foreground">Subject Management</p>
                </div>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    // Match exact or prefix (e.g. /trainer/subjects/[id])
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
