import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"
import AdminLayoutClient from "./layout-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ── Server-side auth guard ────────────────────────────────────────────────
  // Reads the token cookie directly using Next.js cookies() API.
  // This runs before any client code, preventing flicker and providing
  // true server-side protection in addition to the client-side AuthGuard.
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('token')

  let req: Request | undefined
  if (tokenCookie?.value) {
    // Construct a minimal request-like object so getCurrentUser can read the cookie
    req = new Request('http://localhost', {
      headers: { cookie: `token=${tokenCookie.value}` },
    })
  }

  const user = await getCurrentUser(req, { allowFallback: true })

  if (!user) redirect('/login')
  if (user.role !== 'Admin') {
    // Trainer got here via a direct URL — send them to their panel
    if (user.role === 'Trainer') redirect('/trainer/dashboard')
    redirect('/login')
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
