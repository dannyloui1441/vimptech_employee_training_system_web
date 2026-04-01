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
 *    If no Bearer token is present AND allowFallback is true (default),
 *    falls back to SIMULATED_ROLE.
 *    Change SIMULATED_ROLE to switch which admin/trainer is active.
 *
 *    ⚠️  Employee-only routes MUST pass { allowFallback: false } to
 *    authGuard/getCurrentUser so they never silently pick up a web-admin
 *    user and expose a confusing 403 instead of a proper 401.
 *
 * HOW TO REPLACE LATER:
 *    Swap the simulated session block with real JWT/session cookie logic.
 *    The Bearer token block stays as-is for mobile.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { db, type User } from '@/lib/db';

// ─── Simulated session (web panel only) ──────────────────────────────────
const SIMULATED_ROLE: User['role'] = 'Admin';

// ─── Shared CORS headers ──────────────────────────────────────────────────
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

// ─── getCurrentUser ───────────────────────────────────────────────────────
/**
 * Resolves the current user from the request context.
 *
 * Priority:
 *   1. Bearer token in Authorization header → look up user by ID
 *   2. No token + allowFallback true  → fall back to SIMULATED_ROLE (web panel)
 *   2. No token + allowFallback false → return null (employee routes)
 *
 * @param req           - The incoming request (optional; skips token check if absent)
 * @param options.allowFallback - When false, never fall back to SIMULATED_ROLE.
 *                                Defaults to true so existing web-admin routes are unaffected.
 */
export async function getCurrentUser(
    req?: NextRequest | Request,
    options: { allowFallback?: boolean } = { allowFallback: true }
): Promise<User | null> {
    const allowFallback = options.allowFallback ?? true;

    if (req) {
        // ── Bearer token extraction (unchanged) ────────────────────────
        let token: string | null = null;

        const authHeader =
            req.headers.get('Authorization') ??
            req.headers.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        }

        // Fallback: try x-auth-token header
        if (!token) {
            const xAuthToken = req.headers.get('x-auth-token');
            if (xAuthToken) token = xAuthToken;
        }

        if (token?.startsWith('emp_')) {
            const userId = token.slice(4);
            const user = await db.users.findById(userId);
            return user ?? null;
        }

        // A request was supplied but no valid Bearer token was found.
        // Only fall back to SIMULATED_ROLE if the caller explicitly allows it.
        if (!allowFallback) return null;
    }

    // Fall back to simulated role (web panel dev mode)
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
 * @param allowed            - Role(s) permitted to access the route.
 * @param req                - The incoming request.
 * @param options.allowFallback - Set to false for employee-only routes so that
 *                               a missing token returns 401 instead of falling
 *                               back to the simulated web-admin user.
 *
 * Returns either:
 *   { user }      — auth passed
 *   { response }  — auth failed, return this NextResponse immediately
 */
export async function authGuard(
    allowed: User['role'] | User['role'][],
    req?: NextRequest | Request,
    options: { allowFallback?: boolean } = { allowFallback: true }
): Promise<{ user: User } | { response: NextResponse }> {
    const user = await getCurrentUser(req, options);

    if (!user) {
        return {
            response: NextResponse.json(
                { error: 'Unauthorized: no active session.' },
                {
                    status: 401,
                    headers: CORS_HEADERS,
                }
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
                    {
                        status: err.statusCode,
                        headers: CORS_HEADERS,
                    }
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
