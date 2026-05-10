"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Globe, Clock, Calendar, Palette } from "lucide-react"

export function GeneralSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()
                setSettings(data.general)
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
                body: JSON.stringify({ general: settings })
            })
            if (response.ok) {
                toast({ title: "Success", description: "General settings updated successfully" })
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
            <Card>
                <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Configure your organization's core information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                            id="orgName"
                            value={settings.organizationName}
                            onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select value={settings.timezone} onValueChange={(val) => setSettings({ ...settings, timezone: val })}>
                                <SelectTrigger id="timezone">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                                    <SelectItem value="EST">Eastern Time (GMT-5)</SelectItem>
                                    <SelectItem value="PST">Pacific Time (GMT-8)</SelectItem>
                                    <SelectItem value="IST">India Standard Time (GMT+5:30)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="language">Language</Label>
                            <Select value={settings.language} onValueChange={(val) => setSettings({ ...settings, language: val })}>
                                <SelectTrigger id="language">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Spanish">Spanish</SelectItem>
                                    <SelectItem value="French">French</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="dateFormat">Date Format</Label>
                            <Select value={settings.dateFormat} onValueChange={(val) => setSettings({ ...settings, dateFormat: val })}>
                                <SelectTrigger id="dateFormat">
                                    <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={settings.currency} onValueChange={(val) => setSettings({ ...settings, currency: val })}>
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        <CardTitle>Branding & Theme</CardTitle>
                    </div>
                    <CardDescription>Customize the visual identity of your admin portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={settings.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                />
                                <Input
                                    value={settings.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={settings.secondaryColor}
                                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                />
                                <Input
                                    value={settings.secondaryColor}
                                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Accent Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    className="w-12 h-10 p-1"
                                    value={settings.accentColor}
                                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                                />
                                <Input
                                    value={settings.accentColor}
                                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                                    className="font-mono text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Training Defaults</CardTitle>
                    <CardDescription>Default values for new training programs and modules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="defDuration">Default Program Duration (Weeks)</Label>
                            <Input
                                id="defDuration"
                                type="number"
                                value={settings.trainingDefaults.defaultDuration}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    trainingDefaults: { ...settings.trainingDefaults, defaultDuration: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="defModDuration">Default Module Duration (Hours)</Label>
                            <Input
                                id="defModDuration"
                                type="number"
                                value={settings.trainingDefaults.defaultModuleDuration}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    trainingDefaults: { ...settings.trainingDefaults, defaultModuleDuration: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="minScore">Min. Passing Score (%)</Label>
                            <Input
                                id="minScore"
                                type="number"
                                value={settings.trainingDefaults.minPassingScore}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    trainingDefaults: { ...settings.trainingDefaults, minPassingScore: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/5">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow Retakes</Label>
                                <p className="text-sm text-muted-foreground">Enable assessment retakes.</p>
                            </div>
                            <Switch
                                checked={settings.trainingDefaults.allowRetakes}
                                onCheckedChange={(val) => setSettings({
                                    ...settings,
                                    trainingDefaults: { ...settings.trainingDefaults, allowRetakes: val }
                                })}
                            />
                        </div>
                        {settings.trainingDefaults.allowRetakes && (
                            <div className="grid gap-2 p-3 border rounded-lg bg-secondary/5">
                                <Label htmlFor="maxAttempts">Max Retake Attempts</Label>
                                <Input
                                    id="maxAttempts"
                                    type="number"
                                    value={settings.trainingDefaults.maxRetakeAttempts}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        trainingDefaults: { ...settings.trainingDefaults, maxRetakeAttempts: parseInt(e.target.value) }
                                    })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
                        <div className="space-y-0.5">
                            <Label className="text-base">Automatic Enrollment</Label>
                            <p className="text-sm text-muted-foreground">Auto-enroll new employees in onboarding programs.</p>
                        </div>
                        <Switch
                            checked={settings.trainingDefaults.autoEnrollNewEmployees}
                            onCheckedChange={(val) => setSettings({
                                ...settings,
                                trainingDefaults: { ...settings.trainingDefaults, autoEnrollNewEmployees: val }
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
                        <div className="space-y-0.5">
                            <Label className="text-base">Completion Certificates</Label>
                            <p className="text-sm text-muted-foreground">Automatically generate certificates for completed programs.</p>
                        </div>
                        <Switch
                            checked={settings.trainingDefaults.autoGenerateCertificates}
                            onCheckedChange={(val) => setSettings({
                                ...settings,
                                trainingDefaults: { ...settings.trainingDefaults, autoGenerateCertificates: val }
                            })}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
