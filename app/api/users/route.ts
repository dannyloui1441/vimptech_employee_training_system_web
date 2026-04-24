import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { authGuard } from '@/lib/auth';
import { generatePassword } from '@/lib/utils';

const userSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    mobileNumber: z.string().min(7),
    additionalMobileNumber: z.string().optional(),
    role: z.enum(['Admin', 'Trainer', 'Employee']),
    department: z.string().min(2),
    status: z.enum(['Active', 'Inactive']),
});

export async function GET(request: Request) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get('role');

        let users = await db.users.findAll();
        if (roleFilter) {
            users = users.filter(u => u.role === roleFilter);
        }

        return NextResponse.json(users);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    try {
        const body = await request.json();

        // Validate required fields
        const { name, email, role, mobileNumber, department, status, additionalMobileNumber } = body;
        if (!name || !email || !role || !mobileNumber || !department || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const validatedData = userSchema.parse(body);

        // Generate and hash password
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Create user — store password_hash only, never plain text
        const newUser = await db.users.createWithHash({
            id: crypto.randomUUID(),
            name: validatedData.name,
            email: validatedData.email,
            role: validatedData.role,
            department: validatedData.department,
            status: validatedData.status,
            mobileNumber: validatedData.mobileNumber,
            additionalMobileNumber: validatedData.additionalMobileNumber,
            passwordHash: hashedPassword,
            progress: 0,
            avatar: `https://i.pravatar.cc/150?u=${validatedData.email}`,
        });

        // Return the plain password ONCE so the admin can share it — it is NOT stored
        return NextResponse.json(
            { ...newUser, password: plainPassword },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }

        // Surface Supabase / DB errors explicitly
        const message = error instanceof Error ? error.message : 'Failed to create user';
        console.error('[POST /api/users]', error);
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
