import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';
import { z } from 'zod';

const assignSchema = z.object({
    subjectId: z.string().min(1),
});

/** GET /api/users/[id]/assignments — returns assignments enriched with subject name */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id: employeeId } = await params;

    const [assignments, subjects] = await Promise.all([
        db.assignments.getByEmployee(employeeId),
        db.subjects.findAll(),
    ]);

    const subjectMap = new Map(subjects.map(s => [s.id, s]));

    const enriched = assignments.map(a => ({
        ...a,
        subject: subjectMap.get(a.subjectId) ?? null,
    }));

    return NextResponse.json(enriched);
}

/** POST /api/users/[id]/assignments — assign (or reactivate) a subject for an employee */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    const { id: employeeId } = await params;

    try {
        const body = await request.json();
        const { subjectId } = assignSchema.parse(body);

        // Check for an existing assignment
        const existing = (await db.assignments.getByEmployee(employeeId))
            .find(a => a.subjectId === subjectId);

        if (existing?.status === 'active') {
            return NextResponse.json(
                { status: 'already_active', assignment: existing },
                { status: 200 }
            );
        }

        const assignment = await db.assignments.assign(employeeId, subjectId);

        const wasReactivated = existing?.status === 'paused';
        return NextResponse.json(
            { status: wasReactivated ? 'reactivated' : 'created', assignment },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to assign subject' }, { status: 500 });
    }
}
