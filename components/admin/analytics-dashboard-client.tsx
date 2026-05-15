"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Users,
    Target,
    CheckCircle,
    Activity,
    TrendingUp,
    Search,
    BarChart3,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsOverview {
    totalEmployees: number
    totalSubjectsAssigned: number
    averageAssessmentScore: number
    averageCompletionPercent: number
    completedModules: number
    activeLearners: number
}

interface EmployeeAnalytics {
    id: string
    name: string
    email: string
    department: string | null
    subjectsAssigned: number
    averageAssessmentScore: number
    averageCompletionPercent: number
    completedModules: number
    averageCompletionTimeHours: number | null
    lastActivity: string | null
}

interface AnalyticsDashboardClientProps {
    overview: AnalyticsOverview
    employees: EmployeeAnalytics[]
    /** Route prefix — "/admin/analytics" or "/trainer/analytics" */
    basePath?: string
}

// ─── Date formatter ──────────────────────────────────────────────────────────

function formatLastActivity(iso: string | null): string {
    if (!iso) return "No activity"
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
}

// ─── Score color helper ──────────────────────────────────────────────────────

function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-500"
}

function getScoreBadgeClass(score: number): string {
    if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200"
    if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200"
    return "bg-red-100 text-red-700 border-red-200"
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsDashboardClient({
    overview,
    employees,
    basePath = "/admin/analytics",
}: AnalyticsDashboardClientProps) {
    const router = useRouter()
    const [search, setSearch] = useState("")

    // Client-side search filtering — same useMemo pattern as employees-tab.tsx
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return employees
        return employees.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q) ||
                (e.department ?? "").toLowerCase().includes(q)
        )
    }, [employees, search])

    // ── Overview metric cards ─────────────────────────────────────────────────
    const stats = [
        {
            icon: Users,
            label: "Total Employees",
            value: overview.totalEmployees.toString(),
            subtitle: `${overview.totalSubjectsAssigned} subjects assigned`,
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
        },
        {
            icon: Target,
            label: "Avg Assessment Score",
            value: `${overview.averageAssessmentScore}%`,
            subtitle: "Across all attempts",
            color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400",
        },
        {
            icon: TrendingUp,
            label: "Avg Completion",
            value: `${overview.averageCompletionPercent}%`,
            subtitle: `${overview.completedModules} modules completed`,
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400",
        },
        {
            icon: Activity,
            label: "Active Learners",
            value: overview.activeLearners.toString(),
            subtitle: "In the last 7 days",
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400",
        },
    ]

    return (
        <div className="space-y-6">
            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div>
                <h1 className="font-bold text-3xl tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Training performance insights and employee metrics
                </p>
            </div>

            {/* ── Overview Cards ────────────────────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card
                            key={stat.label}
                            className="overflow-hidden shadow-sm border-border"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            {stat.label}
                                        </p>
                                        <h3 className="font-bold text-2xl tracking-tight">
                                            {stat.value}
                                        </h3>
                                    </div>
                                    <div
                                        className={`p-2.5 rounded-full ${stat.color}`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                                    <span>{stat.subtitle}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* ── Employee Analytics Table ──────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg tracking-tight">
                        Employee Performance
                    </h2>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="border-border shadow-sm">
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[240px] font-semibold">
                                    Employee
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Department
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Avg Score
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Completion
                                </TableHead>
                                <TableHead className="font-semibold">
                                    Last Activity
                                </TableHead>
                                <TableHead className="text-right font-semibold">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        {search
                                            ? "No employees match your search."
                                            : "No employee data available."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((emp) => (
                                    <TableRow
                                        key={emp.id}
                                        className="hover:bg-secondary/20 transition-colors"
                                    >
                                        {/* Employee */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border">
                                                    <AvatarFallback className="font-medium text-xs bg-primary/10 text-primary uppercase">
                                                        {emp.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-foreground">
                                                        {emp.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {emp.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Department */}
                                        <TableCell className="text-sm text-muted-foreground">
                                            {emp.department ?? "—"}
                                        </TableCell>

                                        {/* Avg Score */}
                                        <TableCell>
                                            <Badge
                                                className={getScoreBadgeClass(
                                                    emp.averageAssessmentScore
                                                )}
                                            >
                                                {emp.averageAssessmentScore}%
                                            </Badge>
                                        </TableCell>

                                        {/* Completion % */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress
                                                    value={
                                                        emp.averageCompletionPercent
                                                    }
                                                    className="h-2 w-20"
                                                />
                                                <span
                                                    className={`text-sm font-medium ${getScoreColor(
                                                        emp.averageCompletionPercent
                                                    )}`}
                                                >
                                                    {emp.averageCompletionPercent}%
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* Last Activity */}
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatLastActivity(
                                                emp.lastActivity
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-primary hover:text-primary"
                                                onClick={() =>
                                                    router.push(
                                                        `${basePath}/employees/${emp.id}`
                                                    )
                                                }
                                            >
                                                <BarChart3 className="h-4 w-4" />
                                                View Analytics
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    )
}
