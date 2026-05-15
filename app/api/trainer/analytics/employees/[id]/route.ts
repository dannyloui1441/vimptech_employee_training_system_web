import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';
import { safeAvg, computeAvgCompletionTimeHours, computeLastActivity } from '@/lib/analytics';

// ─── GET /api/trainer/analytics/employees/[id] ────────────────────────────────
// Trainer-scoped employee detail analytics.
// Returns data ONLY if the employee is assigned to a subject the trainer manages.
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Trainer'], req);
    if ('response' in guard) return guard.response;
    const trainerId = guard.user.id;

    const { id: employeeId } = await params;

    try {
        // ── Validate employee ─────────────────────────────────────────────
        const employee = await db.users.findById(employeeId);
        if (!employee || employee.role !== 'Employee') {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // ── Verify trainer scope ──────────────────────────────────────────
        const allSubjects = await db.subjects.findAll();
        const trainerSubjectIds = new Set(
            allSubjects.filter(s => s.assignedTrainerIds.includes(trainerId)).map(s => s.id)
        );

        const employeeAssignments = await db.assignments.getByEmployee(employeeId);
        const scopedAssignments = employeeAssignments.filter(
            a => trainerSubjectIds.has(a.subjectId)
        );

        // If employee has NO assignments to trainer's subjects → not in scope
        if (scopedAssignments.length === 0) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // ── Fetch employee data in parallel ───────────────────────────────
        const [allProgress, allAttempts] = await Promise.all([
            db.moduleProgress.findByUser(employeeId),
            db.assessments.attempts.findByEmployee(employeeId),
        ]);

        // Pre-index lookups
        const subjectMap = new Map(allSubjects.map(s => [s.id, s]));
        const progressByModule = new Map(allProgress.map(p => [p.moduleId, p]));
        const attemptsByModule = new Map<string, typeof allAttempts>();
        for (const a of allAttempts) {
            if (!attemptsByModule.has(a.moduleId)) attemptsByModule.set(a.moduleId, []);
            attemptsByModule.get(a.moduleId)!.push(a);
        }

        // Fetch modules ONLY for trainer-scoped subjects
        const scopedSubjectIds = scopedAssignments.map(a => a.subjectId);
        const modulesPerSubject = await Promise.all(
            scopedSubjectIds.map(sid => db.modules.findBySubjectId(sid))
        );

        const allModules = scopedSubjectIds.flatMap((subjectId, i) =>
            modulesPerSubject[i].map(m => ({ ...m, subjectId }))
        );

        // Scope progress and attempts to only trainer-visible modules
        const scopedModuleIds = new Set(allModules.map(m => m.id));
        const scopedProgress = allProgress.filter(p => scopedModuleIds.has(p.moduleId));
        const scopedAttempts = allAttempts.filter(a => scopedModuleIds.has(a.moduleId));

        // ── Overview metrics (scoped) ─────────────────────────────────────
        const overview = {
            averageAssessmentScore: safeAvg(scopedAttempts.map(a => a.score)),
            averageCompletionPercent: safeAvg(scopedProgress.map(p => p.contentProgressPercent)),
            completedModules: scopedProgress.filter(p => p.completedAt !== null).length,
            averageCompletionTimeHours: computeAvgCompletionTimeHours(scopedProgress),
            subjectsAssigned: scopedAssignments.length,
            lastActivity: computeLastActivity(scopedProgress),
        };

        // ── Subject analytics (scoped) ────────────────────────────────────
        const subjects = scopedAssignments.map((assignment, aIndex) => {
            const subject = subjectMap.get(assignment.subjectId);
            const subjectModules = modulesPerSubject[aIndex] ?? [];

            const subjectProgress = subjectModules
                .map(m => progressByModule.get(m.id))
                .filter((p): p is NonNullable<typeof p> => p !== undefined);

            const subjectAttempts = subjectModules.flatMap(
                m => attemptsByModule.get(m.id) ?? []
            );

            const completionPercent = subjectModules.length > 0
                ? Math.round((subjectProgress.reduce((s, p) => s + p.contentProgressPercent, 0) / subjectModules.length) * 10) / 10
                : 0;

            return {
                subjectId: assignment.subjectId,
                subjectName: subject?.name ?? 'Unknown Subject',
                completionPercent,
                completedModules: subjectProgress.filter(p => p.completedAt !== null).length,
                averageAssessmentScore: safeAvg(subjectAttempts.map(a => a.score)),
                assignedAt: assignment.assignedAt ?? null,
            };
        });

        // ── Module history (scoped) ───────────────────────────────────────
        const modules = allModules.map(mod => {
            const progress = progressByModule.get(mod.id);
            const subject = subjectMap.get(mod.subjectId);

            const contentProgressPercent = progress?.contentProgressPercent ?? 0;
            const assessmentPassed = progress?.assessmentPassed ?? false;
            const startedAt = progress?.startedAt ?? null;
            const completedAt = progress?.completedAt ?? null;

            let status: 'Not Started' | 'In Progress' | 'Completed';
            if (completedAt !== null) status = 'Completed';
            else if (contentProgressPercent > 0) status = 'In Progress';
            else status = 'Not Started';

            let durationHours: number | null = null;
            if (startedAt && completedAt) {
                const ms = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
                durationHours = Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
            }

            return {
                moduleId: mod.id,
                subjectId: mod.subjectId,
                subjectName: subject?.name ?? 'Unknown Subject',
                moduleOrder: mod.module,
                startedAt,
                completedAt,
                durationHours,
                contentProgressPercent,
                assessmentPassed,
                status,
            };
        }).sort((a, b) => {
            if (a.subjectId !== b.subjectId) return a.subjectName.localeCompare(b.subjectName);
            return a.moduleOrder - b.moduleOrder;
        });

        // ── Assessment history (scoped) ───────────────────────────────────
        const assessments = scopedAttempts
            .map(a => ({
                assessmentId: a.id,
                moduleId: a.moduleId,
                score: a.score,
                passed: a.passed,
                attemptNumber: a.attemptNumber,
                submittedAt: a.submittedAt,
            }))
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

        return NextResponse.json({
            success: true,
            employee: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                department: employee.department ?? null,
                role: employee.role,
            },
            overview,
            subjects,
            modules,
            assessments,
        });
    } catch (error) {
        console.error(`[trainer/analytics/employees/${employeeId}] Error:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch employee analytics' },
            { status: 500 }
        );
    }
}
