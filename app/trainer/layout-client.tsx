'use client'

import type React from "react"
import { TrainerSidebar } from "@/components/trainer/trainer-sidebar"
import { TrainerHeader } from "@/components/trainer/trainer-header"
import AuthGuard from "@/components/shared/auth-guard"

/**
 * Client portion of the trainer layout.
 * Provides sidebar/header shell + client-side AuthGuard (UX layer).
 * Server-side auth check happens in layout.tsx before this renders.
 */
export default function TrainerLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard allowedRoles={['Admin', 'Trainer']}>
            <div className="flex min-h-screen bg-background">
                <TrainerSidebar />
                <div className="flex-1 flex flex-col">
                    <TrainerHeader />
                    <main className="flex-1 p-6 md:p-8">{children}</main>
                </div>
            </div>
        </AuthGuard>
    )
}
