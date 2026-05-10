"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Globe, Key, Mail, Calendar, MessageSquare, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react"

export function IntegrationsList() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings')
                const data = await response.json()
                setSettings(data.integrations)
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
                body: JSON.stringify({ integrations: settings })
            })
            if (response.ok) {
                toast({ title: "Success", description: "Integration settings updated successfully" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const regenerateKey = () => {
        const newKey = "atp_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        setSettings({ ...settings, api: { ...settings.api, key: newKey } })
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6 pb-12">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <CardTitle>Email Service Provider</CardTitle>
                    </div>
                    <CardDescription>Configure how the system sends automated emails.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select value={settings.email.provider} onValueChange={(val) => setSettings({ ...settings, email: { ...settings.email, provider: val } })}>
                                <SelectTrigger id="provider">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SMTP">SMTP Server</SelectItem>
                                    <SelectItem value="SendGrid">SendGrid API</SelectItem>
                                    <SelectItem value="SES">Amazon SES</SelectItem>
                                    <SelectItem value="Mailgun">Mailgun</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fromEmail">From Email Address</Label>
                            <Input
                                id="fromEmail"
                                value={settings.email.fromEmail}
                                onChange={(e) => setSettings({ ...settings, email: { ...settings.email, fromEmail: e.target.value } })}
                            />
                        </div>
                    </div>

                    {settings.email.provider === 'SMTP' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-secondary/5">
                            <div className="grid gap-2">
                                <Label>Host</Label>
                                <Input placeholder="smtp.mailtrap.io" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Port</Label>
                                <Input placeholder="587" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Encryption</Label>
                                <Select defaultValue="tls">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tls">TLS</SelectItem>
                                        <SelectItem value="ssl">SSL</SelectItem>
                                        <SelectItem value="none">None</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <CardTitle>Single Sign-On (SSO)</CardTitle>
                    </div>
                    <CardDescription>Allow users to log in with corporate credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable SSO Authentication</Label>
                            <p className="text-sm text-muted-foreground">Redirect users to the selected provider for login.</p>
                        </div>
                        <Switch
                            checked={settings.sso.enabled}
                            onCheckedChange={(val) => setSettings({ ...settings, sso: { ...settings.sso, enabled: val } })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>SSO Provider</Label>
                            <Select value={settings.sso.provider} onValueChange={(val) => setSettings({ ...settings, sso: { ...settings.sso, provider: val } })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Google">Google Workspace</SelectItem>
                                    <SelectItem value="Microsoft">Microsoft Azure AD</SelectItem>
                                    <SelectItem value="Okta">Okta</SelectItem>
                                    <SelectItem value="SAML">Custom SAML 2.0</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Client ID</Label>
                            <Input
                                value={settings.sso.clientId}
                                onChange={(e) => setSettings({ ...settings, sso: { ...settings.sso, clientId: e.target.value } })}
                                placeholder="OAuth Client ID"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        <CardTitle>API & Hub Access</CardTitle>
                    </div>
                    <CardDescription>Manage your programmatic access and webhooks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Active API Key</Label>
                        <div className="flex gap-2">
                            <Input value={settings.api.key} readOnly className="font-mono bg-muted text-xs" />
                            <Button variant="outline" size="icon" onClick={regenerateKey} title="Regenerate Key">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">This key grants full programmatic access. Keep it secret.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="webhook">Webhook Endpoint URL</Label>
                        <Input
                            id="webhook"
                            placeholder="https://your-server.com/api/webhooks/atp"
                            value={settings.api.webhookUrl}
                            onChange={(e) => setSettings({ ...settings, api: { ...settings.api, webhookUrl: e.target.value } })}
                        />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Webhook Events</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['user.created', 'user.updated', 'training.assigned', 'training.completed', 'certificate.issued'].map(event => (
                                <div key={event} className="flex items-center space-x-2">
                                    <Switch
                                        id={event}
                                        checked={settings.api.webhookEvents.includes(event)}
                                        onCheckedChange={(checked) => {
                                            const events = checked
                                                ? [...settings.api.webhookEvents, event]
                                                : settings.api.webhookEvents.filter((e: string) => e !== event)
                                            setSettings({ ...settings, api: { ...settings.api, webhookEvents: events } })
                                        }}
                                    />
                                    <Label htmlFor={event} className="text-xs font-normal">{event}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Integration Settings
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
