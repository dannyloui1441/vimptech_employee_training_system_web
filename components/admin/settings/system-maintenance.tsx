"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Database, Save, RotateCcw, AlertTriangle, Download, Trash2, Info, Timer, HardDrive, ShieldAlert } from "lucide-react"

export function SystemMaintenance() {
    const [loading, setLoading] = useState(true)
    const [systemInfo, setSystemInfo] = useState<any>(null)
    const [settings, setSettings] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchData() {
            try {
                const [settingsResp, infoResp] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/settings/system-info')
                ])
                const settingsData = await settingsResp.json()
                const infoData = await infoResp.json()
                setSettings(settingsData.system)
                setSystemInfo(infoData)
                setLoading(false)
            } catch (error) {
                toast({ title: "Error", description: "Failed to load system data", variant: "destructive" })
            }
        }
        fetchData()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system: settings })
            })
            if (response.ok) {
                toast({ title: "Success", description: "System settings updated successfully" })
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            <CardTitle>Snapshot & Backup</CardTitle>
                        </div>
                        <CardDescription>Secure your data with automated schedules.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
                            <div className="space-y-0.5">
                                <Label className="text-base">Automatic Backup</Label>
                                <p className="text-sm text-muted-foreground">Perform database backups automatically.</p>
                            </div>
                            <Switch
                                checked={settings.backup.enabled}
                                onCheckedChange={(val) => setSettings({ ...settings, backup: { ...settings.backup, enabled: val } })}
                            />
                        </div>

                        <div className="grid gap-4 pt-2">
                            <div className="grid gap-2">
                                <Label>Backup Frequency</Label>
                                <Select value={settings.backup.frequency} onValueChange={(val) => setSettings({ ...settings, backup: { ...settings.backup, frequency: val } })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1 gap-2" variant="outline" size="sm">
                                <Save className="h-4 w-4" />
                                Run Manual Backup
                            </Button>
                            <Button className="flex-1 gap-2" variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                                Export JSON
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Timer className="h-5 w-5 text-primary" />
                            <CardTitle>Data Retention</CardTitle>
                        </div>
                        <CardDescription>Policies for automatic data clearing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Program History Retention (Months)</Label>
                            <Select value={settings.dataRetention.toString()} onValueChange={(val) => setSettings({ ...settings, dataRetention: parseInt(val) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6">6 Months</SelectItem>
                                    <SelectItem value="12">12 Months</SelectItem>
                                    <SelectItem value="24">24 Months</SelectItem>
                                    <SelectItem value="60">5 Years</SelectItem>
                                    <SelectItem value="0">Indefinite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-500/5">
                            <div className="space-y-0.5">
                                <Label className="text-sm">Auto-Purge Inactive Users</Label>
                                <p className="text-xs text-muted-foreground">Delete users inactive for {">"} 3 years.</p>
                            </div>
                            <Switch defaultChecked={false} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-primary" />
                        <CardTitle>System Information</CardTitle>
                    </div>
                    <CardDescription>Current application and environment status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 border rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-semibold">Version</p>
                            <p className="font-bold text-lg">{systemInfo.version}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-semibold">Status</p>
                            <div className="font-bold text-lg text-green-600 flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Healthy
                            </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-semibold">DB Size</p>
                            <p className="font-bold text-lg">{Math.round(systemInfo.dbSize / 1024)} KB</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-semibold">Debug Mode</p>
                            <p className="font-bold text-lg">{settings.debugMode ? 'On' : 'Off'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        <CardTitle>System Security & Danger Zone</CardTitle>
                    </div>
                    <CardDescription>High-impact actions that affect all users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base text-destructive">Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">Redirect all non-admin users to a maintenance landing page.</p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode}
                            onCheckedChange={(val) => setSettings({ ...settings, maintenanceMode: val })}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-destructive/10 rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Reset Application Cache</Label>
                            <p className="text-sm text-muted-foreground">Clear all server-side and client-side cached data.</p>
                        </div>
                        <Button variant="outline" size="sm">Purge Cache</Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-destructive/10 p-6">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply System Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
