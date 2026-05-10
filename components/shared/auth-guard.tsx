'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserFromToken, logout } from '@/lib/auth-client'

/**
 * Client-side auth guard for protected route groups.
 *
 * Checks token validity + expiry on mount.
 * Optionally enforces that the user's role matches allowedRoles.
 *
 * Shows nothing while checking, then either redirects or renders children.
 */
export default function AuthGuard({
    children,
    allowedRoles,
}: {
    children: React.ReactNode
    allowedRoles?: ('Admin' | 'Trainer')[]
}) {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const user = getUserFromToken()

        if (!user) {
            // No valid token or expired → redirect to login
            router.replace('/login')
            return
        }

        // Role check
        if (allowedRoles && !allowedRoles.includes(user.role as 'Admin' | 'Trainer')) {
            // Redirect to the correct panel for their role
            if (user.role === 'Admin') {
                router.replace('/admin/dashboard')
            } else if (user.role === 'Trainer') {
                router.replace('/trainer/dashboard')
            } else {
                logout()
            }
            return
        }

        setAuthorized(true)
    }, [router, allowedRoles])

    if (!authorized) {
        // Render a minimal loading state while checking auth
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return <>{children}</>
}
