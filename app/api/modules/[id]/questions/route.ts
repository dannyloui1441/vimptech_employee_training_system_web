import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

const questionSchema = z.object({
    text: z.string().min(1, 'Question text is required'),
    optionA: z.string().min(1),
    optionB: z.string().min(1),
    optionC: z.string().min(1),
    optionD: z.string().min(1),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().optional(),
});

// ─── GET /api/modules/[id]/questions ─────────────────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    const { id: moduleId } = await params;

    try {
        const questions = await db.assessments.questions.findByModule(moduleId);
        // Strip correctAnswer + explanation from list (returned only during submit grading)
        return NextResponse.json(questions);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

// ─── POST /api/modules/[id]/questions ────────────────────────────────────────
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    const { id: moduleId } = await params;

    try {
        // Verify the module exists and (for Trainers) the trainer is assigned to its subject
        const module = await db.modules.findById(moduleId);
        if (!module) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        if (user.role === 'Trainer') {
            const subject = await db.subjects.findById(module.subjectId);
            if (!subject || !subject.assignedTrainerIds.includes(user.id)) {
                return NextResponse.json({ error: 'Forbidden: not assigned to this subject' }, { status: 403 });
            }
        }

        const body = await req.json();
        const parsed = questionSchema.parse(body);

        const question = await db.assessments.questions.create({
            id: `aq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            moduleId,
            ...parsed,
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json(question, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}
