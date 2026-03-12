"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Trash2, Users } from "lucide-react"
import type { User } from "@/lib/db"
import type { EmployeeSubjectAssignment } from "@/lib/models"

interface EnrichedAssignment extends EmployeeSubjectAssignment {
    employee: User | null
}

interface SubjectEmployeesPanelProps {
    subjectId: string
}

export function SubjectEmployeesPanel({ subjectId }: SubjectEmployeesPanelProps) {
    const { toast } = useToast()

    const [assignments, setAssignments] = useState<EnrichedAssignment[]>([])
    const [allEmployees, setAllEmployees] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
    const [assigning, setAssigning] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchAssignments = useCallback(async () => {
        try {
            const [assignRes, usersRes] = await Promise.all([
                fetch(`/api/training-subjects/${subjectId}/assignments`),
                fetch(`/api/users`),
            ])

            if (assignRes.ok) setAssignments(await assignRes.json())

            if (usersRes.ok) {
                const users: User[] = await usersRes.json()
                setAllEmployees(users.filter(u => u.role === 'Employee'))
            }
        } catch {
            toast({ title: "Error", description: "Failed to load employee assignments", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [subjectId, toast])

    useEffect(() => { fetchAssignments() }, [fetchAssignments])

    // ── Employees not yet actively assigned ────────────────────────────────────
    const activeEmployeeIds = new Set(
        assignments.filter(a => a.status === 'active').map(a => a.employeeId)
    )
    const availableToAssign = allEmployees.filter(e => !activeEmployeeIds.has(e.id))

    // ── Assign ─────────────────────────────────────────────────────────────────
    const handleAssign = async () => {
        if (!selectedEmployeeId) return
        setAssigning(true)
        try {
            const res = await fetch(`/api/training-subjects/${subjectId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: selectedEmployeeId }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error ?? 'Failed to assign')
            }
            setSelectedEmployeeId("")
            await fetchAssignments()
            toast({ title: "Employee assigned", description: "Employee has been added to this subject." })
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        } finally {
            setAssigning(false)
        }
    }

    // ── Remove ─────────────────────────────────────────────────────────────────
    const handleRemove = async (assignmentId: string) => {
        setRemovingId(assignmentId)
        try {
            const res = await fetch(
                `/api/training-subjects/${subjectId}/assignments/${assignmentId}`,
                { method: 'DELETE' }
            )
            if (!res.ok) throw new Error('Failed to remove')
            setAssignments(prev => prev.filter(a => a.id !== assignmentId))
            toast({ title: "Removed", description: "Employee removed from this subject." })
        } catch {
            toast({ title: "Error", description: "Failed to remove assignment", variant: "destructive" })
        } finally {
            setRemovingId(null)
        }
    }

    const activeAssignments = assignments.filter(a => a.status === 'active')

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">
                Loading employees…
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Assign row */}
            <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger className="w-[220px] text-sm">
                        <SelectValue placeholder="Select an employee…" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableToAssign.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">All employees assigned</div>
                        ) : (
                            availableToAssign.map(e => (
                                <SelectItem key={e.id} value={e.id}>
                                    {e.name}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={handleAssign}
                    disabled={!selectedEmployeeId || assigning}
                >
                    <UserPlus className="h-4 w-4" />
                    {assigning ? "Assigning…" : "Assign"}
                </Button>
            </div>

            {/* Employee table */}
            {activeAssignments.length === 0 ? (
                <Card className="border-dashed border-2">
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No employees assigned to this subject yet.</p>
                    </div>
                </Card>
            ) : (
                <Card className="border-border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold">Employee</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Assigned</TableHead>
                                <TableHead className="text-right font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeAssignments.map(a => {
                                const emp = a.employee
                                if (!emp) return null
                                const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                return (
                                    <TableRow key={a.id} className="hover:bg-secondary/20 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-border">
                                                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm">{emp.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{emp.email}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                emp.status === 'Active'
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                            }>
                                                {emp.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(a.assignedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemove(a.id)}
                                                disabled={removingId === a.id}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                {removingId === a.id ? "Removing…" : "Remove"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    )
}
