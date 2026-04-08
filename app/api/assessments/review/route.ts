import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

const reviewSchema = z.object({
    employeeId: z.string(),
    moduleId: z.string(),
});

// ─── POST /api/assessments/review ─────────────────────────────────────────────
// Returns graded questions with the employee's selected answer and correct answer.
export async function POST(req: NextRequest) {
    const guard = await authGuard(['Admin', 'Trainer', 'Employee'], req);
    if ('response' in guard) return guard.response;

    try {
        const body = await req.json();
        const { employeeId, moduleId } = reviewSchema.parse(body);

        // Get the latest attempt for this employee + module
        const attempts = await db.assessments.attempts.findByEmployeeAndModule(employeeId, moduleId);
        if (attempts.length === 0) {
            return NextResponse.json(
                { error: 'No attempts found for this module' },
                { status: 404 }
            );
        }

        // Sort by submittedAt descending, take the latest
        const latestAttempt = attempts.sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )[0];

        // Load all questions for this module
        const questions = await db.assessments.questions.findByModule(moduleId);

        // Map each question with the user's selected answer and the correct answer
        const result = questions.map((q) => ({
            id: q.id,
            text: q.text,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            selectedAnswer: latestAttempt.answers[q.id] ?? null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
        }));

        return NextResponse.json({
            questions: result,
            score: latestAttempt.score,
            passed: latestAttempt.passed,
            attemptNumber: latestAttempt.attemptNumber,
            submittedAt: latestAttempt.submittedAt,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
    }
}
