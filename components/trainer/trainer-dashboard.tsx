"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Layers, Clock, AlertCircle, ArrowRight } from "lucide-react"
import type { TrainingSubject } from "@/lib/models"

interface SubjectStats {
    subject: TrainingSubject
    moduleCount: number
    employeeCount: number
}

interface TrainerDashboardProps {
    trainerName: string
}

export function TrainerDashboard({ trainerName }: TrainerDashboardProps) {
    const [subjects, setSubjects] = useState<SubjectStats[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const [subjectsRes, modulesRes, assignmentsRes] = await Promise.all([
                    fetch("/api/training-subjects"),
                    fetch("/api/training-modules"),
                    fetch("/api/trainer/employees"),
                ])

                if (!subjectsRes.ok) throw new Error("Failed to fetch subjects")

                const subjectList: TrainingSubject[] = await subjectsRes.json()
                const modulesData = modulesRes.ok ? await modulesRes.json() : { modules: [] };
                console.log("Modules API response:", modulesData);
                const modules = modulesData.modules ?? [];

                // Build module count per subjectId
                const moduleCountMap: Record<string, number> = {}
                for (const m of modules) {
                    moduleCountMap[m.subjectId] = (moduleCountMap[m.subjectId] ?? 0) + 1
                }

                // Build employee count per subjectId from assignments
                const employeeCountMap: Record<string, Set<string>> = {}
                if (assignmentsRes.ok) {
                    const assignmentsData = await assignmentsRes.json()
                    // assignmentsData is an array of employees with their assignments
                    for (const emp of assignmentsData) {
                        if (emp.assignments) {
                            for (const a of emp.assignments) {
                                if (a.status === 'active') {
                                    if (!employeeCountMap[a.subjectId]) {
                                        employeeCountMap[a.subjectId] = new Set()
                                    }
                                    employeeCountMap[a.subjectId].add(emp.id)
                                }
                            }
                        }
                    }
                }

                // Also fetch subject-level assignments directly
                const subjectEmployeeCounts: Record<string, number> = {}
                await Promise.all(
                    subjectList.map(async (s) => {
                        try {
                            const res = await fetch(`/api/training-subjects/${s.id}/assignments`)
                            if (res.ok) {
                                const data = await res.json()
                                subjectEmployeeCounts[s.id] = Array.isArray(data)
                                    ? data.filter((a: any) => a.status === 'active').length
                                    : 0
                            }
                        } catch { /* ignore per-subject errors */ }
                    })
                )

                setSubjects(
                    subjectList.map((s) => ({
                        subject: s,
                        moduleCount: moduleCountMap[s.id] ?? 0,
                        employeeCount: subjectEmployeeCounts[s.id] ?? 0,
                    }))
                )
            } catch (err: any) {
                setError(err.message ?? "Something went wrong")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const totalModules = subjects.reduce((acc, s) => acc + s.moduleCount, 0)
    const totalEmployees = subjects.reduce((acc, s) => acc + s.employeeCount, 0)

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Loading your assigned subjects…</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden shadow-sm border-border animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 w-24 bg-muted rounded mb-3" />
                                <div className="h-8 w-16 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // ─── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive opacity-70" />
                <h2 className="font-bold text-xl">Could not load subjects</h2>
                <p className="text-muted-foreground max-w-sm">{error}</p>
            </div>
        )
    }

    // ─── Stats row ────────────────────────────────────────────────────────────
    const statCards = [
        {
            icon: BookOpen,
            label: "Assigned Subjects",
            value: subjects.length.toString(),
            sub: "subjects under your management",
            color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400",
        },
        {
            icon: Layers,
            label: "Total Modules",
            value: totalModules.toString(),
            sub: "across all your subjects",
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
        },
        {
            icon: Users,
            label: "Enrolled Employees",
            value: totalEmployees.toString(),
            sub: "actively assigned learners",
            color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400",
        },
        {
            icon: Clock,
            label: "Avg. Modules / Subject",
            value: subjects.length > 0 ? (totalModules / subjects.length).toFixed(1) : "—",
            sub: "module coverage per subject",
            color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400",
        },
    ]

    // ─── Empty state ──────────────────────────────────────────────────────────
    if (subjects.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome, {trainerName}. No subjects assigned yet.</p>
                </div>
                <Card className="border-dashed border-2 shadow-none py-16 flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                    <h3 className="font-semibold text-lg mb-2">No subjects assigned</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Ask an Admin to assign you to a training subject so you can start managing its modules.
                    </p>
                </Card>
            </div>
        )
    }

    // ─── Full dashboard ───────────────────────────────────────────────────────
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, <span className="font-medium text-foreground">{trainerName}</span>. Here are your assigned training subjects.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.label} className="overflow-hidden shadow-sm border-border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                                        <h3 className="font-bold text-2xl tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`p-2.5 rounded-full ${stat.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground">{stat.sub}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Subject cards */}
            <div>
                <h2 className="font-semibold text-xl mb-4">Your Subjects</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subjects.map(({ subject, moduleCount, employeeCount }) => (
                        <Card
                            key={subject.id}
                            className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-lg leading-tight line-clamp-1">{subject.name}</h3>
                                    {subject.duration && (
                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                            {subject.duration}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Layers className="h-4 w-4 shrink-0" />
                                        <span className="font-medium text-foreground">
                                            {moduleCount} {moduleCount === 1 ? "Module" : "Modules"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4 shrink-0" />
                                        <span className="font-medium text-foreground">
                                            {employeeCount} {employeeCount === 1 ? "Employee" : "Employees"} assigned
                                        </span>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-0">
                                <Button asChild className="w-full gap-1.5">
                                    {/* Use trainer-specific subject detail — no admin UI elements */}
                                    <Link href={`/trainer/subjects/${subject.id}`}>
                                        View Details
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
