import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

// ─── GET /api/assessments/review/[moduleId] ───────────────────────────────────
// Persistent assessment review for authenticated employees.
// Returns the latest attempt's answers + graded questions for the given module.
// Comparison is selectedAnswer === correctAnswer (A/B/C/D letters only).
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    // Employee-only — disable fallback so missing token = 401 (not simulated admin)
    const guard = await authGuard(['Employee'], req, { allowFallback: false });
    if ('response' in guard) return guard.response;

    const employeeId = guard.user.id;
    const { moduleId } = await params;

    if (!moduleId) {
        return NextResponse.json(
            { error: 'moduleId is required' },
            { status: 400 }
        );
    }

    try {
        // ── TASK 2: Fetch latest attempt ──────────────────────────────────
        const attempts = await db.assessments.attempts.findByEmployeeAndModule(
            employeeId,
            moduleId
        );

        if (!attempts || attempts.length === 0) {
            return NextResponse.json(
                { error: 'No assessment review found' },
                { status: 404 }
            );
        }

        // Sort by submittedAt DESC, take latest (equivalent to created_at DESC LIMIT 1)
        const latestAttempt = attempts.sort(
            (a, b) =>
                new Date(b.submittedAt).getTime() -
                new Date(a.submittedAt).getTime()
        )[0];

        const answers: Record<string, string> = latestAttempt.answers ?? {};

        // ── TASK 7: Logging ───────────────────────────────────────────────
        console.log('[assessment review]', {
            moduleId,
            employeeId,
            answerCount: Object.keys(answers).length,
        });

        // ── TASK 5: Fetch questions by IDs from answers ───────────────────
        const answeredQuestionIds = Object.keys(answers);

        if (answeredQuestionIds.length === 0) {
            return NextResponse.json(
                { error: 'No assessment review found' },
                { status: 404 }
            );
        }

        // Load all module questions, then filter to only answered ones
        const allQuestions = await db.assessments.questions.findByModule(moduleId);
        const questions = allQuestions.filter((q) =>
            answeredQuestionIds.includes(q.id)
        );

        // ── TASK 3: Build response ────────────────────────────────────────
        // TASK 4: comparison is selectedAnswer === correctAnswer (A/B/C/D)
        const total = questions.length;
        const score = questions.filter(
            (q) => answers[q.id] === q.correctAnswer
        ).length;

        return NextResponse.json({
            score,
            total,
            answers,
            questions: questions.map((q) => ({
                id: q.id,
                question: q.text,
                options: {
                    A: q.optionA,
                    B: q.optionB,
                    C: q.optionC,
                    D: q.optionD,
                },
                correctAnswer: q.correctAnswer,
            })),
        });
    } catch (error) {
        console.error('[assessment review] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessment review' },
            { status: 500 }
        );
    }
}
