"use client"

import { Bell, Menu, ArrowLeftRight, LayoutDashboard, GraduationCap } from "lucide-react"
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

export function TrainerHeader() {
    return (
        <header className="border-b border-border bg-card px-6 py-4 sticky top-0 z-10 w-full transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                    {/* Breadcrumb context pill */}
                    <div className="hidden md:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1">
                        <GraduationCap className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Trainer Panel</span>
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
                            <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                <Link href="/admin/dashboard">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Admin Panel
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2 font-medium text-amber-600" disabled>
                                <GraduationCap className="h-4 w-4" />
                                Trainer Panel
                                <span className="ml-auto text-xs text-muted-foreground">current</span>
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
                            <div className="px-4 py-6 text-center">
                                <p className="text-sm text-muted-foreground">No new notifications</p>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-8 w-[1px] bg-border mx-1" />

                    {/* ── User menu ── */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-secondary/50 rounded-full">
                                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs ring-2 ring-background">
                                    TR
                                </div>
                                <div className="text-left hidden md:block">
                                    <p className="text-sm font-medium leading-none">Trainer</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Subject Manager</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-lg">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive cursor-pointer hover:text-destructive">
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
