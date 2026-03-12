"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShieldCheck, Lock, Fingerprint, Monitor, Eye, History } from "lucide-react"

export function SecuritySettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()
                setSettings(data.security)
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
                body: JSON.stringify({ security: settings })
            })
            if (response.ok) {
                toast({ title: "Success", description: "Security settings updated successfully" })
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
                        <Lock className="h-5 w-5 text-primary" />
                        <CardTitle>Password Policy</CardTitle>
                    </div>
                    <CardDescription>Enforce strong passwords to protect user accounts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="minPassLen">Min Length</Label>
                            <Input
                                id="minPassLen"
                                type="number"
                                value={settings.passwordPolicy.minLength}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="historyCount">Password History</Label>
                            <Input
                                id="historyCount"
                                type="number"
                                value={settings.passwordPolicy.historyCount}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, historyCount: parseInt(e.target.value) }
                                })}
                            />
                            <p className="text-xs text-muted-foreground">Prevent reuse of last X passwords.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="passExpiry">Expiry (Days)</Label>
                            <Input
                                id="passExpiry"
                                type="number"
                                value={settings.passwordPolicy.expiryDays}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, expiryDays: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label className="text-sm font-medium">Require Uppercase</Label>
                            <Switch
                                checked={settings.passwordPolicy.requireUppercase}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, requireUppercase: val }
                                })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label className="text-sm font-medium">Require Numbers</Label>
                            <Switch
                                checked={settings.passwordPolicy.requireNumbers}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, requireNumbers: val }
                                })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label className="text-sm font-medium">Special Characters</Label>
                            <Switch
                                checked={settings.passwordPolicy.requireSpecialChars}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, requireSpecialChars: val }
                                })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-primary" />
                            <CardTitle>Session Management</CardTitle>
                        </div>
                        <CardDescription>Control user session behavior.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="timeout">Inactivity Timeout (Min)</Label>
                            <Input
                                id="timeout"
                                type="number"
                                value={settings.session.timeout}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    session: { ...settings.session, timeout: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="concurrent">Max Concurrent Sessions</Label>
                            <Input
                                id="concurrent"
                                type="number"
                                value={settings.session.maxConcurrentSessions}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    session: { ...settings.session, maxConcurrentSessions: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label className="text-sm font-medium">Force Logout on PW Change</Label>
                            <Switch
                                checked={settings.session.forceLogoutOnPasswordChange}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    session: { ...settings.session, forceLogoutOnPasswordChange: val }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle>Access Control</CardTitle>
                        </div>
                        <CardDescription>Restrict and monitor system access.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="attempts">Login Attempt Limit</Label>
                            <Input
                                id="attempts"
                                type="number"
                                value={settings.accessControl.loginAttemptLimit}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    accessControl: { ...settings.accessControl, loginAttemptLimit: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lockout">Lockout Duration (Min)</Label>
                            <Input
                                id="lockout"
                                type="number"
                                value={settings.accessControl.lockoutDuration}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    accessControl: { ...settings.accessControl, lockoutDuration: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <Label className="text-sm font-medium">Allow Multiple Devices</Label>
                            <Switch
                                checked={settings.accessControl.allowMultipleDevices}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    accessControl: { ...settings.accessControl, allowMultipleDevices: val }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Fingerprint className="h-5 w-5 text-primary" />
                        <CardTitle>Multi-Factor Authentication</CardTitle>
                    </div>
                    <CardDescription>Add an extra layer of security to account logins.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/5">
                            <div className="space-y-0.5">
                                <Label className="text-base">Global 2FA Requirement</Label>
                                <p className="text-sm text-muted-foreground">Force 2FA for ALL users.</p>
                            </div>
                            <Switch
                                checked={settings.twoFactor.enabledForAll}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    twoFactor: { ...settings.twoFactor, enabledForAll: val }
                                })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/5">
                            <div className="space-y-0.5">
                                <Label className="text-base">MFA for Admins</Label>
                                <p className="text-sm text-muted-foreground">Require for administrative accounts.</p>
                            </div>
                            <Switch
                                checked={settings.twoFactor.requiredForAdmins}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    twoFactor: { ...settings.twoFactor, requiredForAdmins: val }
                                })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="mfaMethod">Default MFA Method</Label>
                        <Select value={settings.twoFactor.method} onValueChange={(val) => setSettings({ ...settings, twoFactor: { ...settings.twoFactor, method: val } })}>
                            <SelectTrigger id="mfaMethod">
                                <SelectValue placeholder="Select MFA method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="app">Authenticator App (Recommended)</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        <CardTitle>Audit Logging</CardTitle>
                    </div>
                    <CardDescription>Track sensitive actions and retain logs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Activity Logs</Label>
                            <p className="text-sm text-muted-foreground">Log logins, data exports, and settings changes.</p>
                        </div>
                        <Switch
                            checked={settings.audit.enableLogs}
                            onCheckedChange={(val) => setSettings({
                                ...settings,
                                audit: { ...settings.audit, enableLogs: val }
                            })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="retention">Log Retention Period (Days)</Label>
                        <Select value={settings.audit.retentionDays.toString()} onValueChange={(val) => setSettings({ ...settings, audit: { ...settings.audit, retentionDays: parseInt(val) } })}>
                            <SelectTrigger id="retention">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="60">60 Days</SelectItem>
                                <SelectItem value="90">90 Days</SelectItem>
                                <SelectItem value="180">180 Days</SelectItem>
                                <SelectItem value="365">1 Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Security Configuration
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
