"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, Check, Plus, BookOpen, Calendar, Activity, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/db"
import type { TrainingSubject, EmployeeSubjectAssignment } from "@/lib/models"

interface EnrichedAssignment extends EmployeeSubjectAssignment {
    subject: TrainingSubject | null
}

interface EmployeeDetailProps {
    user: User
    assignments: EnrichedAssignment[]
    allSubjects: TrainingSubject[]
    viewerRole: 'Admin' | 'Trainer'
}

function StatusBadge({ status }: { status: EmployeeSubjectAssignment['status'] }) {
    const styles = {
        active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        paused: "bg-amber-100 text-amber-700 border-amber-200",
        completed: "bg-blue-100 text-blue-700 border-blue-200",
    }
    return <Badge className={`${styles[status]} hover:${styles[status]}`}>{status}</Badge>
}

export function EmployeeDetail({
    user,
    assignments: initialAssignments,
    allSubjects,
    viewerRole,
}: EmployeeDetailProps) {
    const router = useRouter()
    const { toast } = useToast()

    const [assignments, setAssignments] = useState<EnrichedAssignment[]>(initialAssignments)
    const [copiedPwd, setCopiedPwd] = useState(false)
    const [assignOpen, setAssignOpen] = useState(false)
    const [selectedSubjectId, setSelectedSubjectId] = useState("")
    const [assigning, setAssigning] = useState(false)

    // Assign button is only shown for Admin viewing an Employee profile
    const canAssign = viewerRole === 'Admin' && user.role === 'Employee'
    // Password is hidden from Trainers
    const showPassword = viewerRole === 'Admin'

    const copyPassword = async () => {
        if (!user.password) return
        await navigator.clipboard.writeText(user.password)
        setCopiedPwd(true)
        setTimeout(() => setCopiedPwd(false), 2000)
    }

    const handleAssign = async () => {
        if (!selectedSubjectId) return
        setAssigning(true)
        try {
            const res = await fetch(`/api/users/${user.id}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subjectId: selectedSubjectId }),
            })

            const data = await res.json()

            if (data.status === 'already_active') {
                toast({ title: "Already assigned", description: "This subject is already actively assigned to this employee." })
            } else if (data.status === 'reactivated') {
                toast({ title: "Reactivated", description: "The previously paused assignment has been reactivated." })
            } else {
                toast({ title: "Subject assigned", description: "The training subject has been assigned successfully." })
            }

            // Refresh local assignments from server
            const refreshed = await fetch(`/api/users/${user.id}/assignments`)
            if (refreshed.ok) {
                setAssignments(await refreshed.json())
            }

            setAssignOpen(false)
            setSelectedSubjectId("")
        } catch {
            toast({ title: "Error", description: "Failed to assign subject. Please try again.", variant: "destructive" })
        } finally {
            setAssigning(false)
        }
    }

    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    const activeAssignments = assignments.filter(a => a.status === 'active')

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Users
            </Button>

            {/* ── SECTION 1 — Basic Info ─────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        <Avatar className="h-16 w-16 border-2 border-border">
                            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Full Name</Label>
                                <p className="font-semibold text-foreground mt-0.5">{user.name}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <p className="text-sm text-foreground mt-0.5">{user.email}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Role</Label>
                                <div className="mt-1"><Badge variant="outline">{user.role}</Badge></div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <div className="mt-1">
                                    <Badge className={
                                        user.status === 'Active'
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200"
                                    }>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* Password — Admin only */}
                            {showPassword && (
                                <div className="sm:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Generated Password</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 rounded-md border bg-secondary px-3 py-2 font-mono text-sm tracking-widest">
                                            {user.password ?? "—"}
                                        </code>
                                        {user.password && (
                                            <Button variant="outline" size="icon" onClick={copyPassword} className="shrink-0">
                                                {copiedPwd ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Employee: show assigned subject names inline */}
                            {user.role === 'Employee' && activeAssignments.length > 0 && (
                                <div className="sm:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Assigned Subjects</Label>
                                    <ul className="mt-1.5 space-y-1">
                                        {activeAssignments.map(a => (
                                            <li key={a.id} className="flex items-center gap-2 text-sm">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                {a.subject?.name ?? <span className="italic text-muted-foreground">Unknown subject</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Trainer: show subject count */}
                            {user.role === 'Trainer' && (
                                <div className="sm:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Assigned Subjects Count</Label>
                                    <p className="mt-0.5 font-semibold text-foreground">{assignments.length}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── SECTION 2 — Assigned Subjects (cards) — only for Employees ── */}
            {user.role === 'Employee' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Assigned Subjects</h2>
                        {canAssign && (
                            <Button size="sm" className="gap-1.5" onClick={() => setAssignOpen(v => !v)}>
                                <Plus className="h-4 w-4" />
                                Assign Training Subject
                            </Button>
                        )}
                    </div>

                    {/* Inline assignment panel */}
                    {assignOpen && canAssign && (
                        <Card className="border-dashed border-2">
                            <CardContent className="pt-4">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-1.5">
                                        <Label>Select Subject</Label>
                                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                            <SelectTrigger><SelectValue placeholder="Choose a training subject…" /></SelectTrigger>
                                            <SelectContent>
                                                {allSubjects.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAssign} disabled={!selectedSubjectId || assigning}>
                                        {assigning ? "Assigning…" : "Assign"}
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setAssignOpen(false); setSelectedSubjectId("") }}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Subject cards */}
                    {assignments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                                <BookOpen className="h-10 w-10 opacity-30" />
                                <p>No subjects assigned.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignments.map(a => (
                                <Card key={a.id} className="border-border hover:border-primary/40 transition-colors">
                                    <CardContent className="pt-5">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div>
                                                <p className="font-semibold text-base">
                                                    {a.subject?.name ?? <span className="italic text-muted-foreground">Unknown subject</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {a.subject?.description ?? ""}
                                                </p>
                                            </div>
                                            <StatusBadge status={a.status} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                <span>Assigned {new Date(a.assignedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Activity className="h-3.5 w-3.5 shrink-0" />
                                                <span>Last activity —</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Overall progress</span>
                                                <span className="ml-2 font-medium text-foreground">—</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Assessment avg</span>
                                                <span className="ml-2 font-medium text-foreground">—</span>
                                            </div>
                                            {/* Last Completed Module — placeholder until progress backend exists */}
                                            <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-border/60">
                                                <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span className="text-muted-foreground">Last completed module:</span>
                                                <span className="font-medium text-foreground">
                                                    {a.status === 'completed'
                                                        ? 'All modules completed'
                                                        : 'Not started'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
