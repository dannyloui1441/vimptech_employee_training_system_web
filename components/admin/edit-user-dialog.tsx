"use client"

import type React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/db"

interface EditUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
}

const DEPARTMENTS = [
    "Engineering",
    "Marketing",
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
    "Customer Support",
    "Product",
]

const ROLES = ["Employee", "Trainer", "Admin"]
const STATUSES = ["Active", "Inactive"]

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        additionalMobileNumber: "",
        role: "Employee",
        department: "",
        status: "Active",
    })

    // Sync form data when user prop changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name ?? "",
                email: user.email ?? "",
                mobileNumber: user.mobileNumber ?? "",
                additionalMobileNumber: user.additionalMobileNumber ?? "",
                role: user.role ?? "Employee",
                department: user.department ?? "",
                status: user.status ?? "Active",
            })
        }
    }, [user])

    const handleClose = (val: boolean) => {
        onOpenChange(val)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        if (!formData.name || !formData.email || !formData.role || !formData.department) {
            toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    mobileNumber: formData.mobileNumber || undefined,
                    additionalMobileNumber: formData.additionalMobileNumber || undefined,
                    role: formData.role,
                    department: formData.department,
                    status: formData.status,
                }),
            })

            if (!response.ok) throw new Error('Failed to update user')

            toast({ title: "User updated", description: `${formData.name} has been updated successfully.` })
            router.refresh()
            handleClose(false)
        } catch {
            toast({ title: "Error", description: "Failed to update user. Please try again.", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Edit User</DialogTitle>
                    <DialogDescription>
                        Update the details for {user.name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email Address</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="john.doe@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-mobile">Mobile Number</Label>
                                <Input
                                    id="edit-mobile"
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={formData.mobileNumber}
                                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-additionalMobile">Additional Mobile <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Input
                                    id="edit-additionalMobile"
                                    type="tel"
                                    placeholder="+91 12345 67890"
                                    value={formData.additionalMobileNumber}
                                    onChange={(e) => setFormData({ ...formData, additionalMobileNumber: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={loading}>
                                    <SelectTrigger id="edit-role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                    <SelectContent>
                                        {ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })} disabled={loading}>
                                    <SelectTrigger id="edit-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-department">Department</Label>
                            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })} disabled={loading}>
                                <SelectTrigger id="edit-department"><SelectValue placeholder="Select a department" /></SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
