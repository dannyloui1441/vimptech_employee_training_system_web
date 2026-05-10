"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShieldAlert, Plus, Edit2, Save, Trash2 } from "lucide-react"

export function RolesManagement() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [roles, setRoles] = useState<any[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchRoles()
    }, [])

    async function fetchRoles() {
        try {
            const response = await fetch('/api/roles')
            const data = await response.json()
            setRoles(data)
            if (data.length > 0 && !selectedRoleId) {
                setSelectedRoleId(data[0].id)
            }
            setLoading(false)
        } catch (error) {
            toast({ title: "Error", description: "Failed to load roles", variant: "destructive" })
        }
    }

    const selectedRole = roles.find(r => r.id === selectedRoleId)

    const handlePermissionChange = (category: string, permission: string, checked: boolean) => {
        if (!selectedRoleId) return

        const updatedRoles = roles.map(role => {
            if (role.id === selectedRoleId) {
                const updatedPermissions = { ...role.permissions }
                if (checked) {
                    updatedPermissions[category] = [...(updatedPermissions[category] || []), permission]
                } else {
                    updatedPermissions[category] = updatedPermissions[category].filter((p: string) => p !== permission)
                }
                return { ...role, permissions: updatedPermissions }
            }
            return role
        })

        setRoles(updatedRoles)
    }

    const handleSave = async () => {
        if (!selectedRole) return
        setSaving(true)
        try {
            const response = await fetch('/api/roles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedRole)
            })
            if (response.ok) {
                toast({ title: "Success", description: `Permissions for ${selectedRole.name} updated` })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save role", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    const permissionCategories = [
        { id: 'dashboard', label: 'Dashboard', items: ['view', 'analytics', 'export'] },
        { id: 'users', label: 'User Management', items: ['view', 'create', 'edit', 'delete', 'roles', 'passwords'] },
        { id: 'training', label: 'Training Management', items: ['view', 'create', 'edit', 'delete', 'assign', 'track', 'grade'] },
        { id: 'assessment', label: 'Assessment Management', items: ['view', 'create', 'edit', 'delete', 'assign', 'track', 'grade'] },
        { id: 'schedule', label: 'Schedule Management', items: ['view', 'create', 'edit', 'delete'] },
        { id: 'notifications', label: 'Notifications', items: ['send', 'manage'] },
        { id: 'settings', label: 'Settings', items: ['view', 'modify', 'integrations'] },
    ]

    return (
        <div className="space-y-6 pb-12">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>System Roles</CardTitle>
                        <CardDescription>Select a role to manage its granular permissions.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-2" variant="outline" disabled>
                        <Plus className="h-4 w-4" />
                        Add New Role
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow
                                    key={role.id}
                                    className={`cursor-pointer ${selectedRoleId === role.id ? 'bg-secondary/50' : ''}`}
                                    onClick={() => setSelectedRoleId(role.id)}
                                >
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{role.description}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedRole && (
                <Card className="border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Permission Matrix: {selectedRole.name}</CardTitle>
                            <CardDescription>Grant or revoke specific capabilities for this role.</CardDescription>
                        </div>
                        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save {selectedRole.name} Permissions
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-8 py-6">
                        {permissionCategories.map((cat) => (
                            <div key={cat.id} className="space-y-4">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary/70">{cat.label}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {cat.items.map((item) => (
                                        <div key={item} className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/20 transition-colors">
                                            <Checkbox
                                                id={`${cat.id}-${item}`}
                                                checked={selectedRole.permissions[cat.id]?.includes(item)}
                                                onCheckedChange={(checked) => handlePermissionChange(cat.id, item, !!checked)}
                                            />
                                            <Label
                                                htmlFor={`${cat.id}-${item}`}
                                                className="text-sm capitalize cursor-pointer font-normal"
                                            >
                                                {item.replace(/_/g, ' ')}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6 bg-secondary/5">
                        <p className="text-xs text-muted-foreground">
                            Changes will take effect instantly for all users assigned to this role.
                        </p>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" disabled>
                            <Trash2 className="h-4 w-4" />
                            Reset to Default
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
