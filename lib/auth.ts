/**
 * Authentication Module
 *
 * Supports two auth modes:
 *
 * 1. Bearer token (Flutter mobile app):
 *    Flutter sends: Authorization: Bearer emp_<userId>
 *    getCurrentUser() extracts the userId, looks up the user in DB,
 *    and returns them directly.
 *
 * 2. Simulated session (web admin panel):
 *    If no Bearer token is present, falls back to SIMULATED_ROLE.
 *    Change SIMULATED_ROLE to switch which admin/trainer is active.
 *
 * HOW TO REPLACE LATER:
 *    Swap the simulated session block with real JWT/session cookie logic.
 *    The Bearer token block stays as-is for mobile.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { db, type User } from '@/lib/db';

// ─── Simulated session (web panel only) ──────────────────────────────────
const SIMULATED_ROLE: User['role'] = 'Admin';

// ─── getCurrentUser ───────────────────────────────────────────────────────
/**
 * Resolves the current user from the request context.
 *
 * Priority:
 *   1. Bearer token in Authorization header → look up user by ID
 *   2. No token → fall back to SIMULATED_ROLE (web panel dev mode)
 */
export async function getCurrentUser(
    req?: NextRequest | Request
): Promise<User | null> {
    // ── 1. Try Bearer token from Authorization header ──
    if (req) {
        const authHeader =
            req.headers.get('Authorization') ?? req.headers.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7).trim(); // strip "Bearer "

            // Token format: emp_<userId>
            if (token.startsWith('emp_')) {
                const userId = token.slice(4); // strip "emp_"
                const user = await db.users.findById(userId);
                return user ?? null;
            }
        }
    }

    // ── 2. Fall back to simulated role (web panel) ──
    const users = await db.users.findAll();
    return users.find(u => u.role === SIMULATED_ROLE) ?? null;
}

// ─── requireRole ──────────────────────────────────────────────────────────
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
 * Convenience wrapper combining getCurrentUser() + requireRole().
 *
 * Pass the raw Request object so Bearer tokens can be read.
 *
 * Returns either:
 *   { user }      — auth passed
 *   { response }  — auth failed, return this NextResponse immediately
 */
export async function authGuard(
    allowed: User['role'] | User['role'][],
    req?: NextRequest | Request
): Promise<{ user: User } | { response: NextResponse }> {
    const user = await getCurrentUser(req);

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
