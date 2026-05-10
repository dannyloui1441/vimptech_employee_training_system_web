"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Smartphone, Palette, ShieldCheck, AlertCircle } from "lucide-react"

export function MobileAppSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()
                setSettings(data.mobileApp)
                setLoading(false)
            } catch (error) {
                toast({ title: "Error", description: "Failed to load mobile settings", variant: "destructive" })
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
                body: JSON.stringify({ mobileApp: settings })
            })
            if (response.ok) {
                toast({ title: "Success", description: "Mobile settings updated successfully" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <CardTitle>App Information</CardTitle>
                        </div>
                        <CardDescription>Basic configuration for the Flutter mobile app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="appName">App Display Name</Label>
                            <Input
                                id="appName"
                                value={settings.appName}
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="appVersion">Current Version</Label>
                                <Input
                                    id="appVersion"
                                    value={settings.appVersion}
                                    onChange={(e) => setSettings({ ...settings, appVersion: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="minVersion">Min. Supported</Label>
                                <Input
                                    id="minVersion"
                                    value={settings.minimumSupportedVersion}
                                    onChange={(e) => setSettings({ ...settings, minimumSupportedVersion: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-base">Force Update</Label>
                                <p className="text-sm text-muted-foreground">Require users to update to the latest version.</p>
                            </div>
                            <Switch
                                checked={settings.forceUpdate}
                                onCheckedChange={(val) => setSettings({ ...settings, forceUpdate: val })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            <CardTitle>Branding & Theme</CardTitle>
                        </div>
                        <CardDescription>Visual styles for the mobile experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={settings.theme.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, primaryColor: e.target.value } })}
                                />
                                <Input
                                    value={settings.theme.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, primaryColor: e.target.value } })}
                                    className="font-mono"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={settings.theme.secondaryColor}
                                    onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, secondaryColor: e.target.value } })}
                                />
                                <Input
                                    value={settings.theme.secondaryColor}
                                    onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, secondaryColor: e.target.value } })}
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <CardTitle>Features Toggle</CardTitle>
                    </div>
                    <CardDescription>Enable or disable specific features available in the mobile app.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label>Offline Mode</Label>
                        <Switch
                            checked={settings.features.offlineMode}
                            onCheckedChange={(val) => setSettings({ ...settings, features: { ...settings.features, offlineMode: val } })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label>Dark Mode Support</Label>
                        <Switch
                            checked={settings.features.darkMode}
                            onCheckedChange={(val) => setSettings({ ...settings, features: { ...settings.features, darkMode: val } })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label>Biometric Auth</Label>
                        <Switch
                            checked={settings.features.biometricAuth}
                            onCheckedChange={(val) => setSettings({ ...settings, features: { ...settings.features, biometricAuth: val } })}
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <Label>Push Notifications</Label>
                        <Switch
                            checked={settings.features.pushNotifications}
                            onCheckedChange={(val) => setSettings({ ...settings, features: { ...settings.features, pushNotifications: val } })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-warning/50 bg-warning/5">
                <CardHeader>
                    <div className="flex items-center gap-2 text-warning-foreground">
                        <AlertCircle className="h-5 w-5" />
                        <CardTitle>Maintenance Mode</CardTitle>
                    </div>
                    <CardDescription>Restrict mobile app access during updates or repairs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Mobile Maintenance</Label>
                            <p className="text-sm text-muted-foreground">Users will see a maintenance message instead of the login screen.</p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode}
                            onCheckedChange={(val) => setSettings({ ...settings, maintenanceMode: val })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mMessage">Maintenance Message</Label>
                        <Input
                            id="mMessage"
                            value={settings.maintenanceMessage}
                            onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                            placeholder="App is under maintenance..."
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-warning/10 p-6">
                    <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Mobile Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
