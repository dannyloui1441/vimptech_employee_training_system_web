"use client"

import { Bell, Menu, Search, ArrowLeftRight, LayoutDashboard, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function AdminHeader() {
  const router = useRouter()

  return (
    <header className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10 w-full transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block relative w-64">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-secondary/50 rounded-md pl-9 pr-4 py-2 text-sm border-0 focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">

          {/* ── Switch Panel dropdown ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-medium">
                <ArrowLeftRight className="h-4 w-4" />
                Switch Panel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Navigate to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2 font-medium text-primary" disabled>
                <LayoutDashboard className="h-4 w-4" />
                Admin Panel
                <span className="ml-auto text-xs text-muted-foreground">current</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href="/trainer/dashboard">
                  <GraduationCap className="h-4 w-4" />
                  Trainer Panel
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Notifications ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <Badge className="absolute top-1.5 right-1.5 h-2 w-2 p-0 rounded-full bg-destructive border-2 border-card" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 rounded-lg shadow-lg border border-border">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm">Notifications</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="px-4 py-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50 last:border-0 transition-colors">
                  <p className="text-sm font-medium text-foreground">New Employee Onboarded</p>
                  <p className="text-xs text-muted-foreground mt-1">John Doe started training module 1</p>
                </div>
                <div className="px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors">
                  <p className="text-sm font-medium text-foreground">Assessment Completed</p>
                  <p className="text-xs text-muted-foreground mt-1">Sarah completed Module 3 assessment</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-8 w-[1px] bg-border mx-1" />

          {/* ── User menu ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-secondary/50 rounded-full">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                  AD
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Administrator</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-lg">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive cursor-pointer group hover:text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
