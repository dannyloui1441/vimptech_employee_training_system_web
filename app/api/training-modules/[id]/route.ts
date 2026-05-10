import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';
import type { User } from '@/lib/db';

// Schema aligned with new contract — `module` = sequence order, no `day` field
const moduleUpdateSchema = z.object({
    subjectId: z.string().optional(),
    module: z.number().int().min(1).optional(),
    gapValue: z.number().int().min(0).optional(),
    gapUnit: z.enum(['days', 'weeks']).optional(),
});

/**
 * Load module by id and enforce Trainer scope (module's subjectId must be
 * an assigned subject). Admins always pass.
 */
async function resolveModuleWithGuard(
    moduleId: string,
    user: User
) {
    const module = await db.modules.findById(moduleId);
    if (!module) {
        return { error: NextResponse.json({ error: 'Module not found' }, { status: 404 }) };
    }

    if (user.role === 'Trainer') {
        const subject = await db.subjects.findById(module.subjectId);
        if (!subject || !subject.assignedTrainerIds.includes(user.id)) {
            const subjectName = subject?.name ?? module.subjectId;
            return {
                error: NextResponse.json(
                    {
                        error: `Forbidden: you are not assigned to subject "${subjectName}". ` +
                            `Assigned trainers: [${subject?.assignedTrainerIds.join(', ') ?? 'none'}]`,
                    },
                    { status: 403 }
                ),
            };
        }
    }

    return { module };
}

// ─── GET /api/training-modules/[id] ──────────────────────────────────────────
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id } = await params;
    const resolved = await resolveModuleWithGuard(id, guard.user);
    if ('error' in resolved) return resolved.error;

    return NextResponse.json(resolved.module);
}

// ─── PATCH /api/training-modules/[id] ────────────────────────────────────────
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id } = await params;
    const resolved = await resolveModuleWithGuard(id, guard.user);
    if ('error' in resolved) return resolved.error;

    try {
        const body = await request.json();
        const validatedData = moduleUpdateSchema.parse(body);

        // If subjectId is being changed, also validate the new subject is accessible
        if (validatedData.subjectId && guard.user.role === 'Trainer') {
            const newSubject = await db.subjects.findById(validatedData.subjectId);
            if (!newSubject || !newSubject.assignedTrainerIds.includes(guard.user.id)) {
                return NextResponse.json(
                    { error: 'Forbidden: you are not assigned to the target subject.' },
                    { status: 403 }
                );
            }
        }

        const updated = await db.modules.update(id, validatedData);
        if (!updated) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update training module' }, { status: 500 });
    }
}

// ─── DELETE /api/training-modules/[id] ───────────────────────────────────────
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id } = await params;
    const resolved = await resolveModuleWithGuard(id, guard.user);
    if ('error' in resolved) return resolved.error;

    try {
        await db.modules.delete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete training module' }, { status: 500 });
    }
}
