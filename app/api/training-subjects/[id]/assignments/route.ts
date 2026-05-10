import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

const assignSchema = z.object({
    employeeId: z.string().min(1),
});

/** Enforce that a Trainer is assigned to this subject. Admins always pass. */
async function assertSubjectAccess(subjectId: string, userId: string, role: string) {
    const subject = await db.subjects.findById(subjectId);
    if (!subject) return { error: 'Subject not found', status: 404 as const };
    if (role !== 'Admin' && !subject.assignedTrainerIds.includes(userId)) {
        return { error: 'Forbidden: not assigned to this subject', status: 403 as const };
    }
    return { subject };
}

// ─── GET /api/training-subjects/[id]/assignments ──────────────────────────────
// Returns all assignments for this subject, enriched with user data.
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    const { id: subjectId } = await params;

    const access = await assertSubjectAccess(subjectId, user.id, user.role);
    if ('error' in access) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    try {
        const assignments = await db.assignments.getBySubject(subjectId);
        const allUsers = await db.users.findAll();
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        const enriched = assignments.map(a => ({
            ...a,
            employee: userMap.get(a.employeeId) ?? null,
        }));

        return NextResponse.json(enriched);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// ─── POST /api/training-subjects/[id]/assignments ─────────────────────────────
// Assigns an employee to this subject.
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    const { id: subjectId } = await params;

    const access = await assertSubjectAccess(subjectId, user.id, user.role);
    if ('error' in access) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    try {
        const body = await req.json();
        const { employeeId } = assignSchema.parse(body);

        // Validate employee exists and is an Employee role
        const employee = await db.users.findById(employeeId);
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        if (employee.role !== 'Employee') {
            return NextResponse.json({ error: 'Only Employee-role users can be assigned' }, { status: 400 });
        }

        const assignment = await db.assignments.assign(employeeId, subjectId);
        return NextResponse.json(assignment, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to assign employee' }, { status: 500 });
    }
}
