import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

const submitSchema = z.object({
    moduleId: z.string(),
    employeeId: z.string(),
    subjectId: z.string(),
    answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
});

// ─── POST /api/assessments/submit ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await authGuard(['Admin', 'Trainer', 'Employee']);
    if ('response' in guard) return guard.response;

    try {
        const body = await req.json();
        const { moduleId, employeeId, subjectId, answers } = submitSchema.parse(body);

        // Block re-attempt if employee has already passed this module
        const priorAttempts = await db.assessments.attempts.findByEmployeeAndModule(employeeId, moduleId);
        const alreadyPassed = priorAttempts.some(a => a.passed);

        if (alreadyPassed) {
            return NextResponse.json(
                { error: 'already_passed', message: 'Employee has already passed this module assessment.' },
                { status: 409 }
            );
        }

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

        return NextResponse.json({ score, passed, passingScore, attempt }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
    }
}
