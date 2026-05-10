"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, Users, BookOpen, AlertCircle } from "lucide-react"
import type { TrainingSubject, EmployeeSubjectAssignment } from "@/lib/models"
import type { User } from "@/lib/db"

interface SubjectWithEmployees {
    subject: TrainingSubject
    employees: Array<{
        user: User
        assignment: EmployeeSubjectAssignment
    }>
}

export default function TrainerEmployeesPage() {
    const router = useRouter()
    const [data, setData] = useState<SubjectWithEmployees[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/trainer/employees')
            .then(r => {
                if (!r.ok) throw new Error('Failed to load employee data')
                return r.json()
            })
            .then(setData)
            .catch(e => setError(e.message ?? 'Something went wrong'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="font-bold text-3xl tracking-tight">My Employees</h1>
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-5 w-40 bg-muted rounded mb-4" />
                                <div className="h-12 w-full bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-20 gap-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive opacity-70" />
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    const hasAnyEmployees = data.some(d => d.employees.length > 0)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-bold text-3xl tracking-tight">My Employees</h1>
                <p className="text-muted-foreground mt-1">
                    Employees enrolled in subjects you manage.
                </p>
            </div>

            {data.length === 0 || !hasAnyEmployees ? (
                <Card className="border-dashed border-2 py-16 flex flex-col items-center text-center gap-3">
                    <Users className="h-10 w-10 text-muted-foreground opacity-40" />
                    <p className="font-semibold">No employees yet</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Employees will appear here once they are assigned to your subjects.
                    </p>
                </Card>
            ) : (
                <div className="space-y-8">
                    {data.map(({ subject, employees }) => {
                        if (employees.length === 0) return null
                        return (
                            <div key={subject.id} className="space-y-3">
                                {/* Subject heading card */}
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <BookOpen className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg leading-tight">{subject.name}</h2>
                                        {subject.description && (
                                            <p className="text-xs text-muted-foreground">{subject.description}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className="ml-auto">
                                        {employees.length} employee{employees.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>

                                {/* Employee rows */}
                                <Card className="border-border shadow-sm overflow-hidden">
                                    <div className="divide-y divide-border">
                                        {employees.map(({ user, assignment }) => {
                                            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                            return (
                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors"
                                                >
                                                    <Avatar className="h-9 w-9 border border-border shrink-0">
                                                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                    </div>

                                                    <Badge className={
                                                        user.status === 'Active'
                                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0"
                                                            : "bg-slate-100 text-slate-700 border-slate-200 shrink-0"
                                                    }>
                                                        {user.status}
                                                    </Badge>

                                                    <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Progress</p>
                                                            <p className="font-medium">—</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-muted-foreground">Assessment avg</p>
                                                            <p className="font-medium">—</p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1.5 text-primary hover:text-primary shrink-0"
                                                        onClick={() => router.push(`/trainer/employees/${user.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="hidden sm:inline">View Details</span>
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
