import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';
import { notifyAssessmentPassed, checkAndNotifySubjectCompletion } from '@/lib/notifications';

const submitSchema = z.object({
    moduleId: z.string(),
    employeeId: z.string(),
    subjectId: z.string(),
    answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
});

// ─── POST /api/assessments/submit ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await authGuard(['Admin', 'Trainer', 'Employee'], req);
    if ('response' in guard) return guard.response;

    try {
        const body = await req.json();
        const { moduleId, employeeId, subjectId, answers } = submitSchema.parse(body);

        // Load all prior attempts for attempt_number tracking only
        const priorAttempts = await db.assessments.attempts.findByEmployeeAndModule(employeeId, moduleId);

        // Load questions and grade
        const questions = await db.assessments.questions.findByModule(moduleId);
        if (questions.length === 0) {
            return NextResponse.json({ error: 'No questions found for this module' }, { status: 404 });
        }

        // Only grade questions that were actually answered
        const answeredQuestionIds = Object.keys(answers);
        const gradedQuestions = questions.filter(q => answeredQuestionIds.includes(q.id));

        const correctCount = gradedQuestions.filter(q => answers[q.id] === q.correctAnswer).length;
        const score = gradedQuestions.length > 0
            ? Math.round((correctCount / gradedQuestions.length) * 100)
            : 0;

        const settings = await db.assessments.settings.findByModule(moduleId);
        const passingScore = settings?.passingScore ?? 70;
        const passed = score >= passingScore;

        const attemptNumber = priorAttempts.length + 1;

        // Store every attempt — no 409 block; retries are always allowed
        const attempt = await db.assessments.attempts.create({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            employeeId,
            subjectId,
            moduleId,
            attemptNumber,
            score,
            passed,
            submittedAt: new Date().toISOString(),
            answers,
        });

        // Update module_progress only when the employee passes
        if (passed) {
            const existingProgress = await db.moduleProgress.findByUserAndModule(employeeId, moduleId);

            const upsertPayload: Parameters<typeof db.moduleProgress.upsert>[0] = {
                userId: employeeId,
                subjectId,
                moduleId,
                assessmentPassed: true,
                assessmentPassedAt: new Date().toISOString(),
            };

            if (existingProgress?.contentProgressPercent === 100 && !existingProgress?.completedAt) {
                upsertPayload.completedAt = new Date().toISOString();
            }

            await db.moduleProgress.upsert(upsertPayload);

            // Trigger notifications
            const trainingModule = await db.modules.findById(moduleId);
            const moduleNumber = trainingModule?.module ?? 0;

            await notifyAssessmentPassed(employeeId, moduleId, moduleNumber, subjectId, score);
            await checkAndNotifySubjectCompletion(employeeId, subjectId);
        }

        return NextResponse.json({ score, passed, passingScore, attempt }, { status: 201 });
    } catch (error) {
        console.error('[assessments/submit] Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
    }
}
