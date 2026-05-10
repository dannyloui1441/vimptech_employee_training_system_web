"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { GeneralSettings } from "@/components/admin/settings/general-settings"
import { NotificationSettings } from "@/components/admin/settings/notification-settings"
import { SecuritySettings } from "@/components/admin/settings/security-settings"
import { RolesManagement } from "@/components/admin/settings/roles-management"
import { IntegrationsList } from "@/components/admin/settings/integrations-list"
import { SystemMaintenance } from "@/components/admin/settings/system-maintenance"
import { MobileAppSettings } from "@/components/admin/settings/mobile-app-settings"
import { Settings, Settings2, Bell, Shield, Users, Globe, Database, Smartphone } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization configurations and system preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 shrink-0">
            <TabsList className="flex flex-row md:flex-col h-auto w-full justify-start gap-1 p-1 bg-transparent border-none">
              <TabsTrigger
                value="general"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Users className="h-4 w-4" />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Globe className="h-4 w-4" />
                Integrations
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Smartphone className="h-4 w-4" />
                Mobile App
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="justify-start gap-2 w-full px-3 py-2 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Database className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
          </aside>

          <div className="flex-1">
            <TabsContent value="general" className="mt-0">
              <GeneralSettings />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>
            <TabsContent value="roles" className="mt-0">
              <RolesManagement />
            </TabsContent>
            <TabsContent value="integrations" className="mt-0">
              <IntegrationsList />
            </TabsContent>
            <TabsContent value="mobile" className="mt-0">
              <MobileAppSettings />
            </TabsContent>
            <TabsContent value="system" className="mt-0">
              <SystemMaintenance />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
