import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';
import type { User } from '@/lib/db';

const materialSchema = z.object({
    id: z.string(),
    moduleId: z.string(),
    title: z.string().min(1),
    type: z.enum(['video', 'pdf', 'audio']),
    mediaUrl: z.string().min(1),
});

/**
 * Ensures a Trainer has access to the subject that owns the given moduleId.
 * Admins always pass. Returns a 403 NextResponse if denied.
 */
async function assertModuleAccess(moduleId: string, user: User): Promise<NextResponse | null> {
    if (user.role === 'Admin') return null;

    const module = await db.modules.findById(moduleId);
    if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

    const subject = await db.subjects.findById(module.subjectId);
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    if (!subject.assignedTrainerIds.includes(user.id)) {
        return NextResponse.json(
            { error: `Forbidden: you are not assigned to subject "${subject.name}".` },
            { status: 403 }
        );
    }
    return null;
}

// ─── GET /api/training-materials?moduleId= ────────────────────────────────────
export async function GET(request: Request) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    try {
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('moduleId');

        if (moduleId) {
            const denied = await assertModuleAccess(moduleId, user);
            if (denied) return denied;

            const materials = await db.materials.findByModuleId(moduleId);
            return NextResponse.json(materials);
        }

        // No filter — Admins get all, Trainers get materials for assigned subjects only
        const allMaterials = await db.materials.findAll();

        if (user.role === 'Admin') {
            return NextResponse.json(allMaterials);
        }

        // Trainer: filter by assigned subjects
        const subjects = await db.subjects.findAll();
        const assignedSubjectIds = new Set(
            subjects.filter(s => s.assignedTrainerIds.includes(user.id)).map(s => s.id)
        );
        const allModules = await db.modules.findAll();
        const visibleModuleIds = new Set(
            allModules.filter(m => assignedSubjectIds.has(m.subjectId)).map(m => m.id)
        );

        return NextResponse.json(allMaterials.filter(mat => visibleModuleIds.has(mat.moduleId)));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

// ─── POST /api/training-materials ─────────────────────────────────────────────
export async function POST(request: Request) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    try {
        const body = await request.json();
        const validatedData = materialSchema.parse(body);

        const denied = await assertModuleAccess(validatedData.moduleId, user);
        if (denied) return denied;

        await db.materials.create(validatedData);
        return NextResponse.json(validatedData, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
    }
}
