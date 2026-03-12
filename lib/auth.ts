/**
 * Mock Authentication Module
 *
 * Simulates a session-based auth system without a real login flow.
 *
 * HOW IT WORKS NOW:
 *   - getCurrentUser() reads the DB and returns the first user whose
 *     role matches SIMULATED_ROLE. Change SIMULATED_ROLE to switch
 *     which "session" is active (Admin | Trainer | Employee).
 *
 * HOW TO REPLACE LATER:
 *   - Swap getCurrentUser() to read from a real JWT/session cookie.
 *   - Everything else (requireRole, authGuard) stays the same.
 */

import { NextResponse } from 'next/server';
import { db, type User } from '@/lib/db';

// ─── Simulated session ────────────────────────────────────────────────────
// Change this value to simulate being logged in as a different role.
const SIMULATED_ROLE: User['role'] = 'Admin';

// ─── getCurrentUser ───────────────────────────────────────────────────────
/**
 * Returns the "currently logged-in" user.
 * In this mock: returns the first DB user that matches SIMULATED_ROLE.
 * Returns null if no matching user exists (triggers 401 in API routes).
 */
export async function getCurrentUser(): Promise<User | null> {
    const users = await db.users.findAll();
    return users.find(u => u.role === SIMULATED_ROLE) ?? null;
}

// ─── requireRole ──────────────────────────────────────────────────────────
/**
 * Throws an AuthError if the provided user's role does not match
 * one of the allowed roles.
 *
 * Usage (inside an API route, after getCurrentUser):
 *   requireRole(user, 'Admin');
 *   requireRole(user, ['Admin', 'Trainer']);
 */
export function requireRole(
    user: User,
    allowed: User['role'] | User['role'][]
): void {
    const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
    if (!allowedRoles.includes(user.role)) {
        throw new AuthError(
            `Role '${user.role}' is not permitted. Required: ${allowedRoles.join(' | ')}`,
            403
        );
    }
}

// ─── authGuard ────────────────────────────────────────────────────────────
/**
 * Convenience wrapper that combines getCurrentUser() + requireRole().
 *
 * Returns either:
 *   { user }          — auth passed, proceed normally
 *   { response }      — auth failed, return this NextResponse immediately
 *
 * Usage (inside an API route):
 *   const guard = await authGuard(['Admin', 'Trainer']);
 *   if ('response' in guard) return guard.response;
 *   const { user } = guard; // fully typed User
 */
export async function authGuard(
    allowed: User['role'] | User['role'][]
): Promise<{ user: User } | { response: NextResponse }> {
    const user = await getCurrentUser();

    if (!user) {
        return {
            response: NextResponse.json(
                { error: 'Unauthorized: no active session.' },
                { status: 401 }
            ),
        };
    }

    try {
        requireRole(user, allowed);
    } catch (err) {
        if (err instanceof AuthError) {
            return {
                response: NextResponse.json(
                    { error: err.message },
                    { status: err.statusCode }
                ),
            };
        }
        throw err;
    }

    return { user };
}

// ─── AuthError ────────────────────────────────────────────────────────────
export class AuthError extends Error {
    constructor(message: string, public readonly statusCode: 401 | 403 = 403) {
        super(message);
        this.name = 'AuthError';
    }
}
