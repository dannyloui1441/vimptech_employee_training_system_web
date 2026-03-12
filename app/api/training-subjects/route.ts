import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

// Schema aligned with shared contract
const subjectSchema = z.object({
    name: z.string().min(3),
    description: z.string().min(10),
    duration: z.string().optional(),
    // [Admin-only] optional on creation; defaults to [] for Admin, [self] for Trainer
    assignedTrainerIds: z.array(z.string()).optional(),
    mode: z.enum(['sequential', 'scheduled']).optional().default('sequential'),
});

export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        const subjects = await db.subjects.findAll();
        const { user } = guard;

        // Trainers only see subjects they are assigned to.
        // Admins see everything.
        const visible = user.role === 'Admin'
            ? subjects
            : subjects.filter(p => p.assignedTrainerIds.includes(user.id));

        return NextResponse.json(visible);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch training subjects' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    // Only Admins can create training subjects
    if (user.role !== 'Admin') {
        return NextResponse.json(
            { error: 'Forbidden: only Admins can create training subjects.' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const validatedData = subjectSchema.parse(body);

        const newSubject = {
            id: crypto.randomUUID(),
            name: validatedData.name,
            description: validatedData.description,
            ...(validatedData.duration ? { duration: validatedData.duration } : {}),
            assignedTrainerIds: validatedData.assignedTrainerIds ?? [],
            mode: validatedData.mode,
        };

        await db.subjects.create(newSubject);
        return NextResponse.json(newSubject, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create training subject' }, { status: 500 });
    }
}
