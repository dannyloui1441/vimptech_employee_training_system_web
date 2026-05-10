import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

// ─── DELETE /api/training-subjects/[id]/assignments/[assignmentId] ────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;
    const { user } = guard;

    const { id: subjectId, assignmentId } = await params;

    // Trainers must be assigned to this subject
    if (user.role !== 'Admin') {
        const subject = await db.subjects.findById(subjectId);
        if (!subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }
        if (!subject.assignedTrainerIds.includes(user.id)) {
            return NextResponse.json({ error: 'Forbidden: not assigned to this subject' }, { status: 403 });
        }
    }

    try {
        const removed = await db.assignments.remove(assignmentId);
        if (!removed) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
    }
}
