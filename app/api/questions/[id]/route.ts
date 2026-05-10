import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { authGuard } from '@/lib/auth';

const updateSchema = z.object({
    text: z.string().min(1).optional(),
    optionA: z.string().min(1).optional(),
    optionB: z.string().min(1).optional(),
    optionC: z.string().min(1).optional(),
    optionD: z.string().min(1).optional(),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
    explanation: z.string().optional(),
});

/** Shared helper: verify caller has access to the question's module's subject. */
async function assertQuestionAccess(questionId: string, userId: string, role: string) {
    const question = await db.assessments.questions.findById(questionId);
    if (!question) return { error: 'Question not found', status: 404 as const };

    if (role !== 'Admin') {
        const module = await db.modules.findById(question.moduleId);
        if (!module) return { error: 'Module not found', status: 404 as const };
        const subject = await db.subjects.findById(module.subjectId);
        if (!subject || !subject.assignedTrainerIds.includes(userId)) {
            return { error: 'Forbidden', status: 403 as const };
        }
    }
    return { question };
}

// ─── PATCH /api/questions/[id] ────────────────────────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    const { id } = await params;

    const access = await assertQuestionAccess(id, user.id, user.role);
    if ('error' in access) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    try {
        const body = await req.json();
        const parsed = updateSchema.parse(body);
        const updated = await db.assessments.questions.update(id, parsed);
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

// ─── DELETE /api/questions/[id] ───────────────────────────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    const { id } = await params;

    const access = await assertQuestionAccess(id, user.id, user.role);
    if ('error' in access) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    try {
        await db.assessments.questions.delete(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
