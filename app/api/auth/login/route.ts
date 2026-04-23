/**
 * POST /api/auth/login
 *
 * Authenticates Admin, Trainer, and Employee users.
 *
 * Token strategy (per GEMINI.md):
 *   - Admin / Trainer  → JWT signed with JWT_SECRET
 *   - Employee         → legacy emp_<userId> token (backward-compat with Flutter)
 *
 * Password verification:
 *   - If passwordHash exists → bcrypt.compare (preferred)
 *   - Else fall back to plain-text password field (migration period only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'missing_fields', details: parsed.error.errors },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        const { email, password } = parsed.data;

        // ── Find user by email (single-row lookup) ──────────────────────
        const user = await db.users.findByEmail(email);

        if (!user) {
            return NextResponse.json(
                { error: 'invalid_credentials' },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        // ── Verify password ─────────────────────────────────────────────
        let passwordValid = false;

        if (user.passwordHash) {
            // Preferred: bcrypt comparison against password_hash column
            passwordValid = await bcrypt.compare(password, user.passwordHash);
        } else if (user.password) {
            // Migration fallback: plain-text comparison (temporary)
            passwordValid = user.password === password;
        }

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'invalid_credentials' },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        // ── Build safe user payload (never expose password fields) ──────
        const userPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            role: user.role,
            avatar: user.avatar ?? null,
        };

        // ── Issue token based on role ───────────────────────────────────
        if (user.role === 'Admin' || user.role === 'Trainer') {
            // JWT for Admin / Trainer
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error('[auth/login] JWT_SECRET is not configured');
                return NextResponse.json(
                    { error: 'server_configuration_error' },
                    { status: 500, headers: CORS_HEADERS }
                );
            }

            const token = jwt.sign(
                { userId: user.id, role: user.role },
                secret,
                { expiresIn: '7d' }
            );

            return NextResponse.json(
                { success: true, token, user: userPayload },
                { status: 200, headers: CORS_HEADERS }
            );
        }

        // ── Employee: legacy emp_ token (Flutter backward-compat) ───────
        return NextResponse.json(
            { success: true, token: `emp_${user.id}`, user: userPayload },
            { status: 200, headers: CORS_HEADERS }
        );
    } catch (error) {
        console.error('[auth/login] Unexpected error:', error);
        return NextResponse.json(
            { error: 'internal_server_error' },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
