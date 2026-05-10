import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"
import TrainerLayoutClient from "./layout-client"

export default async function TrainerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // ── Server-side auth guard ────────────────────────────────────────────────
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('token')

    let req: Request | undefined
    if (tokenCookie?.value) {
        req = new Request('http://localhost', {
            headers: { cookie: `token=${tokenCookie.value}` },
        })
    }

    const user = await getCurrentUser(req, { allowFallback: true })

    if (!user) redirect('/login')
    if (user.role === 'Employee') redirect('/')

    return <TrainerLayoutClient>{children}</TrainerLayoutClient>
}
