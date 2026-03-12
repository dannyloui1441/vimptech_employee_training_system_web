import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { authGuard } from '@/lib/auth';

const userSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    mobileNumber: z.string().min(7).optional(),
    additionalMobileNumber: z.string().optional(),
    role: z.enum(['Admin', 'Trainer', 'Employee']).optional(),
    department: z.string().min(2).optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = userSchema.parse(body);

        const updatedUser = await db.users.update(id, validatedData);

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        revalidatePath('/admin/users');
        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    try {
        const { id } = await params;
        console.log('DELETE request for user ID:', id);

        const success = await db.users.delete(id);

        if (!success) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        revalidatePath('/admin/users');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

// PATCH delegates to the same update logic as PUT
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
    return PUT(request, ctx);
}

