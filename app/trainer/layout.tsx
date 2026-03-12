import type React from "react"
import { TrainerSidebar } from "@/components/trainer/trainer-sidebar"
import { TrainerHeader } from "@/components/trainer/trainer-header"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TrainerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Route guard: only Trainers (and Admins who switch panels) may access /trainer/*
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.role === 'Employee') redirect('/')

    return (
        <div className="flex min-h-screen bg-background">
            <TrainerSidebar />
            <div className="flex-1 flex flex-col">
                <TrainerHeader />
                <main className="flex-1 p-6 md:p-8">{children}</main>
            </div>
        </div>
    )
}
