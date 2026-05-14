import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

// ─── GET /api/admin/analytics/overview ────────────────────────────────────────
// Aggregates existing training-performance data into a dashboard-ready response.
// No new tables, no caching — lightweight queries against existing data.
export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        // Batch-fetch all required data in parallel
        const [allUsers, allAssignments, allAttempts, allProgress] = await Promise.all([
            db.users.findAll(),
            db.assignments.findAll(),
            fetchAllAttemptScores(),
            fetchAllModuleProgress(),
        ]);

        // ── totalEmployees ────────────────────────────────────────────────
        const employees = allUsers.filter(u => u.role === 'Employee');
        const totalEmployees = employees.length;

        // ── totalSubjectsAssigned ──────────────────────────────────────────
        const totalSubjectsAssigned = allAssignments.length;

        // ── averageAssessmentScore ─────────────────────────────────────────
        const averageAssessmentScore = allAttempts.length > 0
            ? Math.round(
                (allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length) * 10
              ) / 10
            : 0;

        // ── averageCompletionPercent ───────────────────────────────────────
        const averageCompletionPercent = allProgress.length > 0
            ? Math.round(
                (allProgress.reduce((sum, p) => sum + p.contentProgressPercent, 0) / allProgress.length) * 10
              ) / 10
            : 0;

        // ── completedModules ──────────────────────────────────────────────
        const completedModules = allProgress.filter(p => p.completedAt !== null).length;

        // ── activeLearners ────────────────────────────────────────────────
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const employeeIds = new Set(employees.map(e => e.id));
        const activeUserIds = new Set<string>();

        for (const p of allProgress) {
            if (
                p.updatedAt &&
                employeeIds.has(p.userId) &&
                new Date(p.updatedAt) >= sevenDaysAgo
            ) {
                activeUserIds.add(p.userId);
            }
        }

        const activeLearners = activeUserIds.size;

        return NextResponse.json({
            success: true,
            overview: {
                totalEmployees,
                totalSubjectsAssigned,
                averageAssessmentScore,
                averageCompletionPercent,
                completedModules,
                activeLearners,
            },
        });
    } catch (error) {
        console.error('[admin/analytics/overview] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics overview' },
            { status: 500 }
        );
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// These use the existing db.* methods to avoid adding new DB surface area.

/**
 * Fetches all assessment attempt scores.
 * Uses db.assessments.attempts pattern — fetches all employees' attempts.
 */
async function fetchAllAttemptScores() {
    // No db.assessments.attempts.findAll() exists, so we fetch via users
    const users = await db.users.findAll();
    const employees = users.filter(u => u.role === 'Employee');

    const allAttempts = await Promise.all(
        employees.map(e => db.assessments.attempts.findByEmployee(e.id))
    );

    return allAttempts.flat();
}

/**
 * Fetches all module_progress rows.
 * Uses db.moduleProgress.findByUser() for each employee.
 */
async function fetchAllModuleProgress() {
    const users = await db.users.findAll();
    const employees = users.filter(u => u.role === 'Employee');

    const allProgress = await Promise.all(
        employees.map(e => db.moduleProgress.findByUser(e.id))
    );

    return allProgress.flat();
}
