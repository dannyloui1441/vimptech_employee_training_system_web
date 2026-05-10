import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/auth/me
 *
 * Returns the currently simulated user's public profile.
 * Used by client components to determine role-based UI branching
 * without needing a full session system.
 *
 * Returns 401 if no user is active (e.g. SIMULATED_ROLE has no match).
 */
export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json(
            { error: 'No active session. Check SIMULATED_ROLE in lib/auth.ts.' },
            { status: 401 }
        );
    }

    // Return only the fields safe to expose to the client
    return NextResponse.json({
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department,
    });
}
