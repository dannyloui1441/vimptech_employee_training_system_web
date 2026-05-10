/**
 * Authentication Module
 *
 * Supports three auth modes (checked in order):
 *
 * 1. JWT token (Admin / Trainer — web panel):
 *    Authorization: Bearer <jwt>
 *    Verified with JWT_SECRET, extracts userId, looks up user in DB.
 *
 * 2. Legacy emp_ token (Employee — Flutter mobile app):
 *    Authorization: Bearer emp_<userId>
 *    Extracts userId, looks up user in DB, returns them directly.
 *
 * 3. Simulated session (web admin panel dev mode):
 *    If no Bearer token is present AND allowFallback is true (default),
 *    falls back to SIMULATED_ROLE.
 *
 *    ⚠️  Employee-only routes MUST pass { allowFallback: false } to
 *    authGuard/getCurrentUser so they never silently pick up a web-admin
 *    user and expose a confusing 403 instead of a proper 401.
 *
 * HOW TO REPLACE LATER:
 *    Once all roles use JWT, remove the emp_ block and simulated session.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { db, type User } from '@/lib/db';
import jwt from 'jsonwebtoken';

// ─── Simulated session (web panel only — dev mode) ────────────────────────
const SIMULATED_ROLE: User['role'] = 'Admin';

// ─── Shared CORS headers ──────────────────────────────────────────────────
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

// ─── JWT payload shape ────────────────────────────────────────────────────
interface JwtPayload {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
}

// ─── getCurrentUser ───────────────────────────────────────────────────────
/**
 * Resolves the current user from the request context.
 *
 * Priority:
 *   1. JWT token       → verify with JWT_SECRET → look up user by decoded userId
 *   2. emp_ token      → look up user by ID (legacy Flutter flow)
 *   3. allowFallback   → fall back to SIMULATED_ROLE (dev mode web panel)
 *   4. Otherwise       → return null (401 scenario)
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
        // ── Extract token from headers ─────────────────────────────────
        let token: string | null = null;

        const authHeader =
            req.headers.get('Authorization') ??
            req.headers.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        }


        // Fallback: cookie header (set by client on login)
        // Uses regex to safely extract the token value without fragile string splits.
        if (!token) {
            const cookieHeader = req.headers.get('cookie');
            if (cookieHeader) {
                const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
                if (match?.[1]) token = match[1].trim();
            }
        }

        if (token) {
            // ── 1) Try JWT verification first ──────────────────────────
            if (!token.startsWith('emp_')) {
                const secret = process.env.JWT_SECRET;
                if (secret) {
                    try {
                        const decoded = jwt.verify(token, secret) as JwtPayload;
                        if (decoded?.userId) {
                            // Always fetch from DB — role from DB is authoritative.
                            // The JWT payload role is used for routing UX only (client-side);
                            // the server always re-reads role from the database.
                            const user = await db.users.findById(decoded.userId);
                            return user ?? null;
                        }
                    } catch {
                        // JWT verification failed — do NOT fall back.
                        // Invalid/expired JWT = unauthorized (return null).
                        return null;
                    }
                }
                // If JWT_SECRET is not set, we can't verify JWT tokens.
                // In development, fall through to simulated role if allowed.
                // In production, this should never happen.
            }

            // ── 2) Legacy emp_ token (Employee / Flutter) ──────────────
            if (token.startsWith('emp_')) {
                const userId = token.slice(4);
                const user = await db.users.findById(userId);
                return user ?? null;
            }

            // Token present but unrecognised format — do NOT fall back.
            return null;
        }

        // A request was supplied but no token was found at all.
        // Only fall back to SIMULATED_ROLE if the caller explicitly allows it.
        if (!allowFallback) return null;
    }

    // ── 3) Fall back to simulated role (web panel dev mode) ────────────
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
