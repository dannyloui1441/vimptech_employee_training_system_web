"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddUserDialog } from "@/components/admin/add-user-dialog"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { EmployeesTab } from "@/components/admin/employees-tab"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/db"
import type { EmployeeSubjectAssignment } from "@/lib/models"

interface UsersPageClientProps {
    users: User[]
    assignments: EmployeeSubjectAssignment[]
    viewerRole: 'Admin' | 'Trainer'
}

export function UsersPageClient({ users, assignments, viewerRole }: UsersPageClientProps) {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    const employees = users.filter(u => u.role === 'Employee')
    const trainers = users.filter(u => u.role === 'Trainer')
    const admins = users.filter(u => u.role === 'Admin')

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open)
        if (!open) router.refresh()
    }

    const handleEditDialogClose = (open: boolean) => {
        setEditDialogOpen(open)
        if (!open) {
            setEditingUser(null)
            router.refresh()
        }
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setEditDialogOpen(true)
    }

    const isAdmin = viewerRole === 'Admin'

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl tracking-tight">User Management</h1>
                        <p className="text-muted-foreground">Manage employees, trainers, and admins</p>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => setDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add User
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="employees" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="employees">Employees ({employees.length})</TabsTrigger>
                        <TabsTrigger value="trainers">Trainers ({trainers.length})</TabsTrigger>
                        <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="employees">
                        <EmployeesTab
                            users={employees}
                            assignments={assignments}
                            readOnly={!isAdmin}
                            onEdit={handleEdit}
                        />
                    </TabsContent>

                    <TabsContent value="trainers">
                        <EmployeesTab
                            users={trainers}
                            assignments={assignments}
                            readOnly={!isAdmin}
                            onEdit={handleEdit}
                        />
                    </TabsContent>

                    <TabsContent value="admins">
                        <EmployeesTab
                            users={admins}
                            assignments={assignments}
                            readOnly={!isAdmin}
                            onEdit={handleEdit}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <AddUserDialog open={dialogOpen} onOpenChange={handleDialogClose} />
            <EditUserDialog open={editDialogOpen} onOpenChange={handleEditDialogClose} user={editingUser} />
        </>
    )
}
