'use client'

import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import AuthGuard from "@/components/shared/auth-guard"

/**
 * Client portion of the admin layout.
 * Provides the sidebar/header shell + client-side AuthGuard (UX layer).
 * Server-side auth check happens in layout.tsx before this renders.
 */
export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard allowedRoles={['Admin']}>
            <div className="flex min-h-screen bg-background">
                <AdminSidebar />
                <div className="flex-1 flex flex-col">
                    <AdminHeader />
                    <main className="flex-1 p-6 md:p-8">{children}</main>
                </div>
            </div>
        </AuthGuard>
    )
}
