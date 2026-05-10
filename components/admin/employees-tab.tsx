"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { User } from "@/lib/db"
import type { EmployeeSubjectAssignment } from "@/lib/models"

interface EmployeesTabProps {
    users: User[]
    assignments: EmployeeSubjectAssignment[]
    /** If true, only show View Details — no edit or delete actions */
    readOnly?: boolean
    /** Called when user clicks Edit on a row */
    onEdit?: (user: User) => void
}

export function EmployeesTab({ users, assignments, readOnly, onEdit }: EmployeesTabProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [search, setSearch] = useState("")
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    // Count active assignments per employee
    const assignmentCount = useMemo(() => {
        const map = new Map<string, number>()
        for (const a of assignments) {
            if (a.status === 'active') {
                map.set(a.employeeId, (map.get(a.employeeId) ?? 0) + 1)
            }
        }
        return map
    }, [assignments])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return users
        return users.filter(
            u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        )
    }, [users, search])

    const confirmDelete = (user: User) => {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    const executeDelete = async () => {
        if (!userToDelete) return
        setDeleteDialogOpen(false)

        try {
            const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')

            toast({
                title: "User deleted",
                description: `${userToDelete.name} has been removed successfully.`,
            })
            router.refresh()
        } catch {
            toast({
                title: "Error",
                description: "Failed to delete user. Please try again.",
                variant: "destructive",
            })
        } finally {
            setUserToDelete(null)
        }
    }

    return (
        <>
            <div className="space-y-4">
                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email…"
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <Card className="border-border shadow-sm">
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[260px] font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Email</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Assigned Subjects</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {search ? "No users match your search." : "No users found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map(user => (
                                    <TableRow key={user.id} className="hover:bg-secondary/20 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border">
                                                    <AvatarFallback className="font-medium text-xs bg-primary/10 text-primary uppercase">
                                                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm text-foreground">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                user.status === 'Active'
                                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                                    : "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200"
                                            }>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {assignmentCount.get(user.id) ?? 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5 text-primary hover:text-primary"
                                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                                {!readOnly && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1.5"
                                                            onClick={() => onEdit?.(user)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => confirmDelete(user)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        <span className="font-medium text-foreground"> {userToDelete?.name}</span>&apos;s account
                        and remove their data from our servers.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-2 mt-4">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Account
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
