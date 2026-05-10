import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';
import type { User } from '@/lib/db';

const materialUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    type: z.enum(['video', 'pdf', 'audio']).optional(),
    mediaUrl: z.string().min(1).optional(),
});

async function resolveMaterialWithGuard(materialId: string, user: User) {
    const material = await db.materials.findById(materialId);
    if (!material) {
        return { error: NextResponse.json({ error: 'Material not found' }, { status: 404 }) };
    }

    if (user.role === 'Trainer') {
        const module = await db.modules.findById(material.moduleId);
        if (!module) {
            return { error: NextResponse.json({ error: 'Module not found' }, { status: 404 }) };
        }
        const subject = await db.subjects.findById(module.subjectId);
        if (!subject || !subject.assignedTrainerIds.includes(user.id)) {
            const name = subject?.name ?? module.subjectId;
            return {
                error: NextResponse.json(
                    { error: `Forbidden: you are not assigned to subject "${name}".` },
                    { status: 403 }
                ),
            };
        }
    }

    return { material };
}

// ─── GET /api/training-materials/[id] ─────────────────────────────────────────
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id } = await params;
    const resolved = await resolveMaterialWithGuard(id, guard.user);
    if ('error' in resolved) return resolved.error;

    return NextResponse.json(resolved.material);
}

// ─── PATCH /api/training-materials/[id] ───────────────────────────────────────
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id } = await params;
    const resolved = await resolveMaterialWithGuard(id, guard.user);
    if ('error' in resolved) return resolved.error;

    try {
        const body = await request.json();
        const validatedData = materialUpdateSchema.parse(body);

        const updated = await db.materials.update(id, validatedData);
        if (!updated) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
    }
}

// ─── DELETE /api/training-materials/[id] ──────────────────────────────────────
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id } = await params;
    const resolved = await resolveMaterialWithGuard(id, guard.user);
    if ('error' in resolved) return resolved.error;

    try {
        await db.materials.delete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}
