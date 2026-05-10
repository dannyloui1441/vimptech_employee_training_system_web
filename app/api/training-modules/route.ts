import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';
import type { User } from '@/lib/db';
import type { TrainingModule } from '@/lib/models';

// Schema aligned with new contract — `module` = sequence order, no `day` field
const moduleSchema = z.object({
    id: z.string(),
    subjectId: z.string(),
    module: z.number().int().min(1),
    gapValue: z.number().int().min(0).optional().default(0),
    gapUnit: z.enum(['days', 'weeks']).optional().default('days'),
});

/**
 * Compute scheduledDay dynamically from gap_value / gap_unit.
 * Always sorts by `module` first to guarantee correct ordering.
 * First module always starts at scheduledDay = 1.
 * scheduledDay is NEVER stored in the database.
 */
function computeScheduledDays(modules: TrainingModule[]) {
    const sorted = [...modules].sort((a, b) => a.module - b.module);

    let currentDay = 1;

    return sorted.map((mod, index) => {
        if (index > 0) {
            const gapValue = mod.gapValue ?? 0;
            const gapUnit = mod.gapUnit ?? 'days';
            const safeGapValue = Math.max(0, gapValue);

            const gap =
                gapUnit === 'weeks'
                    ? safeGapValue * 7
                    : safeGapValue;

            currentDay += gap;
        }

        return {
            ...mod,
            scheduledDay: currentDay,
        };
    });
}

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
            return NextResponse.json({ modules: computeScheduledDays(modules) });
        }

        // No subjectId filter — return all for Admin, filter by assignment for Trainer
        const allModules = await db.modules.findAll();

        if (user.role === 'Admin') {
            return NextResponse.json({ modules: computeScheduledDays(allModules) });
        }

        // For Trainers: load assigned subjects and filter modules accordingly
        const subjects = await db.subjects.findAll();
        const assignedSubjectIds = new Set(
            subjects
                .filter(p => p.assignedTrainerIds.includes(user.id))
                .map(p => p.id)
        );
        const visibleModules = allModules.filter(m => assignedSubjectIds.has(m.subjectId));
        return NextResponse.json({ modules: computeScheduledDays(visibleModules) });
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

        // Validate uniqueness: module number must not already exist for this subject
        const existing = await db.modules.findBySubjectId(validatedData.subjectId);
        const moduleExists = existing.some(m => m.module === validatedData.module && m.id !== validatedData.id);
        if (moduleExists) {
            return NextResponse.json(
                { error: `Module ${validatedData.module} already exists for this subject.` },
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
