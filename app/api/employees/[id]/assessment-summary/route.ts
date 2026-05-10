import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

// ─── GET /api/employees/[id]/assessment-summary ───────────────────────────────
// Returns per-module assessment summary for a given employee.
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id: employeeId } = await params;

    try {
        const attempts = await db.assessments.attempts.findByEmployee(employeeId);

        // Group by moduleId
        const byModule = new Map<string, typeof attempts>();
        for (const attempt of attempts) {
            if (!byModule.has(attempt.moduleId)) {
                byModule.set(attempt.moduleId, []);
            }
            byModule.get(attempt.moduleId)!.push(attempt);
        }

        const summary = Array.from(byModule.entries()).map(([moduleId, moduleAttempts]) => {
            const bestScore = Math.max(...moduleAttempts.map(a => a.score));
            const passed = moduleAttempts.some(a => a.passed);
            return {
                moduleId,
                attempts: moduleAttempts.length,
                bestScore,
                passed,
                latestAttempt: moduleAttempts.sort(
                    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                )[0],
            };
        });

        return NextResponse.json(summary);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch assessment summary' }, { status: 500 });
    }
}
