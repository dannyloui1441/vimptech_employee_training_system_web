import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
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
        const validatedData = userSchema.parse(body);
        const password = generatePassword();

        const newUser = await db.users.create({
            id: crypto.randomUUID(),
            ...validatedData,
            password,
            progress: 0,
            avatar: `https://i.pravatar.cc/150?u=${validatedData.email}`,
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
