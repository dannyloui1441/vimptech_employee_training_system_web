"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, BellRing, Users, MailPlus } from "lucide-react"

export function NotificationSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()
                setSettings(data.notifications)
                setLoading(false)
            } catch (error) {
                toast({ title: "Error", description: "Failed to load settings", variant: "destructive" })
            }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifications: settings })
            })
            if (response.ok) {
                toast({ title: "Success", description: "Notification settings updated successfully" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6 pb-12">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <CardTitle>Email Notifications</CardTitle>
                    </div>
                    <CardDescription>Control which emails are sent to users and admins.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>Training Assignments</Label>
                                <p className="text-xs text-muted-foreground">Notify users when assigned to a program.</p>
                            </div>
                            <Switch
                                checked={settings.email.trainingAssignment}
                                onCheckedChange={(val) => setSettings({ ...settings, email: { ...settings.email, trainingAssignment: val } })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label>New User Welcome</Label>
                                <p className="text-xs text-muted-foreground">Send welcome email to new employees.</p>
                            </div>
                            <Switch
                                checked={settings.email.welcomeEmail}
                                onCheckedChange={(val) => setSettings({ ...settings, email: { ...settings.email, welcomeEmail: val } })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Deadline Reminders</Label>
                            <p className="text-sm text-muted-foreground">Send automated reminders before training deadlines.</p>
                        </div>
                        <Switch
                            checked={settings.email.deadlineReminders}
                            onCheckedChange={(val) => setSettings({ ...settings, email: { ...settings.email, deadlineReminders: val } })}
                        />
                    </div>

                    <div className="p-4 border rounded-lg bg-secondary/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Weekly Progress Reports</Label>
                                <p className="text-sm text-muted-foreground">Send summary reports to department managers.</p>
                            </div>
                            <Switch
                                checked={settings.email.weeklyReports}
                                onCheckedChange={(val) => setSettings({ ...settings, email: { ...settings.email, weeklyReports: val } })}
                            />
                        </div>
                        {settings.email.weeklyReports && (
                            <div className="flex items-center gap-4">
                                <Label>Select Day</Label>
                                <Select value={settings.email.weeklyReportDay} onValueChange={(val) => setSettings({ ...settings, email: { ...settings.email, weeklyReportDay: val } })}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Monday">Monday</SelectItem>
                                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                                        <SelectItem value="Friday">Friday</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BellRing className="h-5 w-5 text-primary" />
                            <CardTitle>In-App Notifications</CardTitle>
                        </div>
                        <CardDescription>UI alerts and notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-2 border rounded-lg">
                            <Label>Training Updates</Label>
                            <Switch
                                checked={settings.inApp.trainingUpdates}
                                onCheckedChange={(val) => setSettings({ ...settings, inApp: { ...settings.inApp, trainingUpdates: val } })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded-lg">
                            <Label>Achievements</Label>
                            <Switch
                                checked={settings.inApp.achievements}
                                onCheckedChange={(val) => setSettings({ ...settings, inApp: { ...settings.inApp, achievements: val } })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded-lg">
                            <Label>Announcements</Label>
                            <Switch
                                checked={settings.inApp.announcements}
                                onCheckedChange={(val) => setSettings({ ...settings, inApp: { ...settings.inApp, announcements: val } })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle>Notification Recipients</CardTitle>
                        </div>
                        <CardDescription>Default contact for system alerts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="adminEmail">Admin Notifications Email</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                value={settings.recipients.adminEmail}
                                onChange={(e) => setSettings({ ...settings, recipients: { ...settings.recipients, adminEmail: e.target.value } })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="ccEmails">CC Additional Emails (Comma separated)</Label>
                            <Input
                                id="ccEmails"
                                placeholder="manager@corp.com, hr@corp.com"
                                value={settings.recipients.ccEmails.join(', ')}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    recipients: { ...settings.recipients, ccEmails: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <MailPlus className="h-5 w-5 text-primary" />
                        <CardTitle>Email Template Customization</CardTitle>
                    </div>
                    <CardDescription>Preview and edit automated email templates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                        <p className="text-muted-foreground max-w-sm">
                            Advanced template editing using Handlebars variables (e.g., {"{{user_name}}"}).
                        </p>
                        <Button variant="outline">Open Template Editor</Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Notification Preferences
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
