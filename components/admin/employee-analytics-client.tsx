"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    ArrowLeft,
    Target,
    TrendingUp,
    CheckCircle,
    Clock,
    BookOpen,
    Activity,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
    id: string
    name: string
    email: string
    department: string | null
    role: string
}

interface Overview {
    averageAssessmentScore: number
    averageCompletionPercent: number
    completedModules: number
    averageCompletionTimeHours: number | null
    subjectsAssigned: number
    lastActivity: string | null
}

interface SubjectAnalytics {
    subjectId: string
    subjectName: string
    completionPercent: number
    completedModules: number
    averageAssessmentScore: number
    assignedAt: string | null
}

interface ModuleHistory {
    moduleId: string
    subjectId: string
    subjectName: string
    moduleOrder: number
    startedAt: string | null
    completedAt: string | null
    durationHours: number | null
    contentProgressPercent: number
    assessmentPassed: boolean
    status: "Not Started" | "In Progress" | "Completed"
}

interface AssessmentHistory {
    assessmentId: string
    moduleId: string
    score: number
    passed: boolean
    attemptNumber: number
    submittedAt: string
}

interface EmployeeAnalyticsClientProps {
    employee: Employee
    overview: Overview
    subjects: SubjectAnalytics[]
    modules: ModuleHistory[]
    assessments: AssessmentHistory[]
    /** Route prefix — "/admin/analytics" or "/trainer/analytics" */
    basePath?: string
}

// ─── Formatters ──────────────────────────────────────────────────────────────

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

function formatDuration(hours: number | null): string {
    if (hours === null || hours === undefined) return "—"
    if (hours < 1) {
        const mins = Math.round(hours * 60)
        return `${mins} mins`
    }
    return `${hours} hrs`
}

function formatDate(iso: string | null): string {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreBadgeClass(score: number): string {
    if (score >= 80) return "bg-emerald-100 text-emerald-700 border-emerald-200"
    if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200"
    return "bg-red-100 text-red-700 border-red-200"
}

function getScoreColor(score: number): string {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-500"
}

function getStatusBadge(status: string) {
    switch (status) {
        case "Completed":
            return (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    Completed
                </Badge>
            )
        case "In Progress":
            return (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    In Progress
                </Badge>
            )
        default:
            return (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                    Not Started
                </Badge>
            )
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmployeeAnalyticsClient({
    employee,
    overview,
    subjects,
    modules,
    assessments,
    basePath = "/admin/analytics",
}: EmployeeAnalyticsClientProps) {
    const router = useRouter()
    const [modulesExpanded, setModulesExpanded] = useState(false)
    const [assessmentsExpanded, setAssessmentsExpanded] = useState(false)

    const visibleModules = modulesExpanded ? modules : modules.slice(0, 5)
    const visibleAssessments = assessmentsExpanded ? assessments : assessments.slice(0, 5)

    const initials = employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)

    // ── Overview cards ────────────────────────────────────────────────────
    const stats = [
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
            icon: Clock,
            label: "Avg Completion Time",
            value: formatDuration(overview.averageCompletionTimeHours),
            subtitle: "Per module",
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
        },
        {
            icon: BookOpen,
            label: "Subjects Assigned",
            value: overview.subjectsAssigned.toString(),
            subtitle: `Last active: ${formatLastActivity(overview.lastActivity)}`,
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400",
        },
    ]

    return (
        <div className="space-y-6">
            {/* ── Employee Header ───────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.push(basePath)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarFallback className="font-semibold text-sm bg-primary/10 text-primary uppercase">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-bold text-2xl tracking-tight">
                            {employee.name}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{employee.email}</span>
                            {employee.department && (
                                <>
                                    <span>•</span>
                                    <span>{employee.department}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Overview Cards ────────────────────────────────────────── */}
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

            {/* ── Subject Performance ──────────────────────────────────── */}
            <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg tracking-tight">
                        Subject Performance
                    </CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-secondary/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[240px] font-semibold">
                                Subject
                            </TableHead>
                            <TableHead className="font-semibold">
                                Completion
                            </TableHead>
                            <TableHead className="font-semibold">
                                Modules
                            </TableHead>
                            <TableHead className="font-semibold">
                                Avg Score
                            </TableHead>
                            <TableHead className="font-semibold">
                                Assigned
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No subjects assigned.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subjects.map((sub) => (
                                <TableRow
                                    key={sub.subjectId}
                                    className="hover:bg-secondary/20 transition-colors"
                                >
                                    <TableCell className="font-medium text-sm">
                                        {sub.subjectName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={sub.completionPercent}
                                                className="h-2 w-20"
                                            />
                                            <span
                                                className={`text-sm font-medium ${getScoreColor(
                                                    sub.completionPercent
                                                )}`}
                                            >
                                                {sub.completionPercent}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <span className="font-medium">
                                            {sub.completedModules}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {" "}
                                            completed
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {sub.averageAssessmentScore > 0 ? (
                                            <Badge
                                                className={getScoreBadgeClass(
                                                    sub.averageAssessmentScore
                                                )}
                                            >
                                                {sub.averageAssessmentScore}%
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(sub.assignedAt)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* ── Module History ───────────────────────────────────────── */}
            <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg tracking-tight">
                        Module History
                    </CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-secondary/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">
                                Module
                            </TableHead>
                            <TableHead className="font-semibold">
                                Subject
                            </TableHead>
                            <TableHead className="font-semibold">
                                Status
                            </TableHead>
                            <TableHead className="font-semibold">
                                Progress
                            </TableHead>
                            <TableHead className="font-semibold">
                                Started
                            </TableHead>
                            <TableHead className="font-semibold">
                                Completed
                            </TableHead>
                            <TableHead className="font-semibold">
                                Duration
                            </TableHead>
                            <TableHead className="font-semibold">
                                Assessment
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {modules.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No module data available.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleModules.map((mod) => (
                                <TableRow
                                    key={mod.moduleId}
                                    className="hover:bg-secondary/20 transition-colors"
                                >
                                    <TableCell className="font-medium text-sm">
                                        Module {mod.moduleOrder}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {mod.subjectName}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(mod.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={
                                                    mod.contentProgressPercent
                                                }
                                                className="h-2 w-16"
                                            />
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {mod.contentProgressPercent}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(mod.startedAt)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(mod.completedAt)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDuration(mod.durationHours)}
                                    </TableCell>
                                    <TableCell>
                                        {mod.status === "Not Started" ? (
                                            <span className="text-sm text-muted-foreground">
                                                —
                                            </span>
                                        ) : mod.assessmentPassed ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                Passed
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                                                Pending
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {modules.length > 5 && (
                    <div className="p-3 border-t border-border flex justify-center bg-secondary/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setModulesExpanded(!modulesExpanded)}
                        >
                            {modulesExpanded ? "Show Less" : "Show More"}
                        </Button>
                    </div>
                )}
            </Card>

            {/* ── Assessment History ───────────────────────────────────── */}
            <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg tracking-tight">
                        Assessment History
                    </CardTitle>
                </CardHeader>
                <Table>
                    <TableHeader className="bg-secondary/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">
                                Module
                            </TableHead>
                            <TableHead className="font-semibold">
                                Score
                            </TableHead>
                            <TableHead className="font-semibold">
                                Result
                            </TableHead>
                            <TableHead className="font-semibold">
                                Attempt
                            </TableHead>
                            <TableHead className="font-semibold">
                                Submitted
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assessments.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No assessment attempts yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleAssessments.map((att) => (
                                <TableRow
                                    key={att.assessmentId}
                                    className="hover:bg-secondary/20 transition-colors"
                                >
                                    <TableCell className="text-sm text-muted-foreground">
                                        {att.moduleId}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={getScoreBadgeClass(
                                                att.score
                                            )}
                                        >
                                            {att.score}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {att.passed ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                Passed
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-700 border-red-200">
                                                Failed
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                        #{att.attemptNumber}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDateTime(att.submittedAt)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {assessments.length > 5 && (
                    <div className="p-3 border-t border-border flex justify-center bg-secondary/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setAssessmentsExpanded(!assessmentsExpanded)}
                        >
                            {assessmentsExpanded ? "Show Less" : "Show More"}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}
