import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';
import { buildEmployeeRow } from '@/lib/analytics';

// ─── GET /api/trainer/analytics/employees ─────────────────────────────────────
// Trainer-scoped employee analytics list. Only includes employees assigned to
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
            return NextResponse.json({ success: true, employees: [] });
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

        // Pre-index assignments per employee
        const assignmentsByEmployee = new Map<string, number>();
        for (const a of scopedAssignments) {
            assignmentsByEmployee.set(
                a.employeeId,
                (assignmentsByEmployee.get(a.employeeId) ?? 0) + 1
            );
        }

        // ── Fetch per-employee data ───────────────────────────────────────
        const [perEmployeeAttempts, perEmployeeProgress] = await Promise.all([
            Promise.all(scopedEmployees.map(e => db.assessments.attempts.findByEmployee(e.id))),
            Promise.all(scopedEmployees.map(e => db.moduleProgress.findByUser(e.id))),
        ]);

        const employeeRows = scopedEmployees.map((emp, index) =>
            buildEmployeeRow(
                emp,
                perEmployeeAttempts[index],
                perEmployeeProgress[index],
                assignmentsByEmployee.get(emp.id) ?? 0,
            )
        );

        // Sort by score DESC
        employeeRows.sort((a, b) => b.averageAssessmentScore - a.averageAssessmentScore);

        return NextResponse.json({ success: true, employees: employeeRows });
    } catch (error) {
        console.error('[trainer/analytics/employees] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee analytics' },
            { status: 500 }
        );
    }
}
