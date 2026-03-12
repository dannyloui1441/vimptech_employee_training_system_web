import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

// Schema for fields a Trainer OR Admin can update
const subjectPatchSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    duration: z.string().optional(),
    // [Admin-only] — Trainers are blocked from sending this field at the handler level
    assignedTrainerIds: z.array(z.string()).optional(),
    mode: z.enum(['sequential', 'scheduled']).optional(),
});

/** Shared helper: load subject and enforce Trainer scope check. */
async function resolveSubjectWithGuard(
    id: string,
    guard: Awaited<ReturnType<typeof authGuard>>
) {
    if ('response' in guard) return { error: guard.response };

    const subject = await db.subjects.findById(id);
    if (!subject) {
        return {
            error: NextResponse.json({ error: 'Subject not found' }, { status: 404 }),
        };
    }

    const { user } = guard;

    // Trainers may only access subjects they are explicitly assigned to.
    if (user.role === 'Trainer' && !subject.assignedTrainerIds.includes(user.id)) {
        return {
            error: NextResponse.json(
                {
                    error: `Forbidden: you are not assigned to this subject. ` +
                        `Assigned trainers: [${subject.assignedTrainerIds.join(', ') || 'none'}]`,
                },
                { status: 403 }
            ),
        };
    }

    return { subject, user };
}

// ─── GET /api/training-subjects/[id] ─────────────────────────────────────────
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    const { id } = await params;
    const resolved = await resolveSubjectWithGuard(id, guard);

    if ('error' in resolved) return resolved.error;

    return NextResponse.json(resolved.subject);
}

// ─── PATCH /api/training-subjects/[id] ───────────────────────────────────────
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    const { id } = await params;
    const resolved = await resolveSubjectWithGuard(id, guard);

    if ('error' in resolved) return resolved.error;

    try {
        const body = await request.json();
        const validatedData = subjectPatchSchema.parse(body);
        const { user } = resolved;

        // Only Admins can reassign trainers.
        // Strip the field entirely if a Trainer somehow sends it.
        if (user.role === 'Trainer' && validatedData.assignedTrainerIds !== undefined) {
            delete validatedData.assignedTrainerIds;
        }

        const updated = await db.subjects.update(id, validatedData);

        if (!updated) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update training subject' }, { status: 500 });
    }
}

// ─── PUT /api/training-subjects/[id] ─────────────────────────────────────────
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Alias to PATCH for backwards compatibility
    return PATCH(request, { params });
}

// ─── DELETE /api/training-subjects/[id] ──────────────────────────────────────
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    // Only Admins can delete training subjects
    if (guard.user.role !== 'Admin') {
        return NextResponse.json(
            { error: 'Forbidden: only Admins can delete training subjects.' },
            { status: 403 }
        );
    }

    const { id } = await params;
    const resolved = await resolveSubjectWithGuard(id, guard);

    if ('error' in resolved) return resolved.error;

    try {
        await db.subjects.delete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete training subject' }, { status: 500 });
    }
}
