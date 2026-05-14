import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

// ─── GET /api/admin/analytics/employees ───────────────────────────────────────
// Returns per-employee analytics rows for a dashboard table.
// Uses existing db.* methods — no new tables, no caching.
export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        // Single fetch of all users, then filter employees
        const allUsers = await db.users.findAll();
        const employees = allUsers.filter(u => u.role === 'Employee');

        // Batch-fetch all per-employee data in parallel
        const [allAssignments, perEmployeeAttempts, perEmployeeProgress] = await Promise.all([
            db.assignments.findAll(),
            Promise.all(employees.map(e => db.assessments.attempts.findByEmployee(e.id))),
            Promise.all(employees.map(e => db.moduleProgress.findByUser(e.id))),
        ]);

        // Pre-index assignments by employee_id for O(1) lookup
        const assignmentsByEmployee = new Map<string, number>();
        for (const a of allAssignments) {
            assignmentsByEmployee.set(
                a.employeeId,
                (assignmentsByEmployee.get(a.employeeId) ?? 0) + 1
            );
        }

        // Build per-employee analytics rows
        const employeeRows = employees.map((emp, index) => {
            const attempts = perEmployeeAttempts[index];
            const progressRows = perEmployeeProgress[index];

            // ── subjectsAssigned ───────────────────────────────────────────
            const subjectsAssigned = assignmentsByEmployee.get(emp.id) ?? 0;

            // ── averageAssessmentScore ─────────────────────────────────────
            const averageAssessmentScore = attempts.length > 0
                ? Math.round(
                    (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) * 10
                  ) / 10
                : 0;

            // ── averageCompletionPercent ───────────────────────────────────
            const averageCompletionPercent = progressRows.length > 0
                ? Math.round(
                    (progressRows.reduce((sum, p) => sum + p.contentProgressPercent, 0) / progressRows.length) * 10
                  ) / 10
                : 0;

            // ── completedModules ──────────────────────────────────────────
            const completedModules = progressRows.filter(p => p.completedAt !== null).length;

            // ── averageCompletionTimeHours ─────────────────────────────────
            const completedWithTimestamps = progressRows.filter(
                p => p.startedAt !== null && p.completedAt !== null
            );

            let averageCompletionTimeHours: number | null = null;
            if (completedWithTimestamps.length > 0) {
                const totalMs = completedWithTimestamps.reduce((sum, p) => {
                    const started = new Date(p.startedAt!).getTime();
                    const completed = new Date(p.completedAt!).getTime();
                    return sum + Math.max(0, completed - started);
                }, 0);

                const avgMs = totalMs / completedWithTimestamps.length;
                averageCompletionTimeHours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;
            }

            // ── lastActivity ──────────────────────────────────────────────
            let lastActivity: string | null = null;
            if (progressRows.length > 0) {
                const sorted = progressRows
                    .filter(p => p.updatedAt)
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                lastActivity = sorted.length > 0 ? sorted[0].updatedAt : null;
            }

            return {
                id: emp.id,
                name: emp.name,
                email: emp.email,
                department: emp.department ?? null,
                subjectsAssigned,
                averageAssessmentScore,
                averageCompletionPercent,
                completedModules,
                averageCompletionTimeHours,
                lastActivity,
            };
        });

        // Sort by averageAssessmentScore DESC (highest-performing first)
        employeeRows.sort((a, b) => b.averageAssessmentScore - a.averageAssessmentScore);

        return NextResponse.json({
            success: true,
            employees: employeeRows,
        });
    } catch (error) {
        console.error('[admin/analytics/employees] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee analytics' },
            { status: 500 }
        );
    }
}
