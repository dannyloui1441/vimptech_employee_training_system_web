import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';
import { buildOverview } from '@/lib/analytics';

// ─── GET /api/trainer/analytics/overview ──────────────────────────────────────
// Trainer-scoped analytics overview. Only includes employees assigned to
// subjects the trainer manages.
export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const viewer = guard.user;

    try {
        // ── Determine trainer scope (same as /api/trainer/employees) ───────
        const allSubjects = await db.subjects.findAll();
        const trainerSubjects = viewer.role === 'Trainer'
            ? allSubjects.filter(s => s.assignedTrainerIds.includes(viewer.id))
            : allSubjects;
        const trainerSubjectIds = trainerSubjects.map(s => s.id);

        if (trainerSubjectIds.length === 0) {
            return NextResponse.json({
                success: true,
                overview: buildOverview([], 0, [], []),
            });
        }

        // ── Scope assignments to trainer subjects ─────────────────────────
        const allAssignments = await db.assignments.findAll();
        const scopedAssignments = allAssignments.filter(
            a => trainerSubjectIds.includes(a.subjectId)
        );

        // Unique employee IDs in scope
        const scopedEmployeeIds = [...new Set(scopedAssignments.map(a => a.employeeId))];

        const allUsers = await db.users.findAll();
        const scopedEmployees = allUsers.filter(
            u => u.role === 'Employee' && scopedEmployeeIds.includes(u.id)
        );

        // ── Fetch per-employee data ───────────────────────────────────────
        const [perEmployeeAttempts, perEmployeeProgress] = await Promise.all([
            Promise.all(scopedEmployees.map(e => db.assessments.attempts.findByEmployee(e.id))),
            Promise.all(scopedEmployees.map(e => db.moduleProgress.findByUser(e.id))),
        ]);

        const allAttempts = perEmployeeAttempts.flat();
        const allProgress = perEmployeeProgress.flat();

        const overview = buildOverview(
            scopedEmployees,
            scopedAssignments.length,
            allAttempts,
            allProgress,
        );

        return NextResponse.json({ success: true, overview });
    } catch (error) {
        console.error('[trainer/analytics/overview] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics overview' },
            { status: 500 }
        );
    }
}
