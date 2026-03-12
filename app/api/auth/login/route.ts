import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        const users = await db.users.findAll();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

        if (!user) {
            return NextResponse.json({ error: 'email_not_found' }, { status: 401 });
        }

        if (user.role !== 'Employee') {
            return NextResponse.json(
                { error: 'not_employee', message: 'Only employees can log in via the mobile app.' },
                { status: 403 }
            );
        }

        if (user.password !== password) {
            return NextResponse.json({ error: 'incorrect_password' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            token: 'emp_' + user.id,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                department: user.department,
                role: user.role,
                avatar: user.avatar ?? null,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
