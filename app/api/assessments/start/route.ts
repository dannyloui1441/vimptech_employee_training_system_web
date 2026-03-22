import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

const startSchema = z.object({
    moduleId: z.string(),
});

// ─── POST /api/assessments/start ─────────────────────────────────────────────
// Shuffles all questions for a module and returns up to questionsPerAttempt.
// correctAnswer and explanation are stripped from the response.
export async function POST(req: NextRequest) {
    const guard = await authGuard(['Admin', 'Trainer', 'Employee'], req);
    if ('response' in guard) return guard.response;

    try {
        const body = await req.json();
        const { moduleId } = startSchema.parse(body);

        const module = await db.modules.findById(moduleId);
        if (!module) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        const settings = await db.assessments.settings.findByModule(moduleId);
        const questionsPerAttempt = settings?.questionsPerAttempt ?? 10;

        const allQuestions = await db.assessments.questions.findByModule(moduleId);

        if (allQuestions.length === 0) {
            return NextResponse.json({ error: 'No questions available for this module' }, { status: 404 });
        }

        // Fisher-Yates shuffle
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, questionsPerAttempt);

        // Strip answer + explanation — only UI-safe fields are returned
        const safe = selected.map(({ correctAnswer: _ca, explanation: _ex, ...q }) => q);

        return NextResponse.json({
            moduleId,
            questions: safe,
            totalQuestions: allQuestions.length,
            questionsPerAttempt,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to start assessment' }, { status: 500 });
    }
}
