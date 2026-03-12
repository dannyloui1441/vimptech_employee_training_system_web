import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';
import type { User } from '@/lib/db';

// Schema aligned with new contract — modules are pure day containers, no media fields
const moduleSchema = z.object({
    id: z.string(),
    subjectId: z.string(),
    day: z.number().int().min(1),
    gapValue: z.number().int().min(0).optional().default(0),
    gapUnit: z.enum(['days', 'weeks']).optional().default('days'),
});

/**
 * Verifies a Trainer is allowed to act on a given subjectId.
 * Admins always pass. Returns a 403 NextResponse if denied.
 */
async function assertSubjectAccess(
    subjectId: string,
    user: User
): Promise<NextResponse | null> {
    if (user.role === 'Admin') return null;

    const subject = await db.subjects.findById(subjectId);
    if (!subject) {
        return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (!subject.assignedTrainerIds.includes(user.id)) {
        return NextResponse.json(
            {
                error: `Forbidden: you are not assigned to subject "${subject.name}". ` +
                    `Assigned trainers: [${subject.assignedTrainerIds.join(', ') || 'none'}]`,
            },
            { status: 403 }
        );
    }

    return null; // access granted
}

// ─── GET /api/training-modules ────────────────────────────────────────────────
// Supports optional ?subjectId= filter.
// Trainers: if subjectId provided, subject-scope-checked.
//           if no subjectId, only modules for assigned subjects are returned.
// Admins: see all.
export async function GET(request: Request) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    try {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subjectId');

        if (subjectId) {
            // Scope-check before returning modules for this specific subject
            const denied = await assertSubjectAccess(subjectId, user);
            if (denied) return denied;

            const modules = await db.modules.findBySubjectId(subjectId);
            return NextResponse.json(modules);
        }

        // No subjectId filter — return all for Admin, filter by assignment for Trainer
        const allModules = await db.modules.findAll();

        if (user.role === 'Admin') {
            return NextResponse.json(allModules);
        }

        // For Trainers: load assigned subjects and filter modules accordingly
        const subjects = await db.subjects.findAll();
        const assignedSubjectIds = new Set(
            subjects
                .filter(p => p.assignedTrainerIds.includes(user.id))
                .map(p => p.id)
        );
        const visibleModules = allModules.filter(m => assignedSubjectIds.has(m.subjectId));
        return NextResponse.json(visibleModules);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch training modules' }, { status: 500 });
    }
}

// ─── POST /api/training-modules ───────────────────────────────────────────────
export async function POST(request: Request) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    try {
        const body = await request.json();
        const validatedData = moduleSchema.parse(body);

        // Scope-check: Trainer can only add modules to their assigned subjects
        const denied = await assertSubjectAccess(validatedData.subjectId, user);
        if (denied) return denied;

        // Validate uniqueness: day must not already exist for this subject
        const existing = await db.modules.findBySubjectId(validatedData.subjectId);
        const dayExists = existing.some(m => m.day === validatedData.day && m.id !== validatedData.id);
        if (dayExists) {
            return NextResponse.json(
                { error: `Day ${validatedData.day} already exists for this subject.` },
                { status: 409 }
            );
        }

        await db.modules.create(validatedData);
        return NextResponse.json(validatedData, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create training module' }, { status: 500 });
    }
}
