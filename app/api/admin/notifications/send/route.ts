import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';
import { z } from 'zod';

const sendSchema = z.object({
    recipientType: z.enum(['all', 'subject', 'individual']),
    targetId: z.string().optional(),
    title: z.string().min(1),
    message: z.string().min(1),
});

/** POST /api/admin/notifications/send — send manual notification */
export async function POST(req: NextRequest) {
    const guard = await authGuard(['Admin', 'Trainer'], req);
    if ('response' in guard) return guard.response;

    try {
        const body = await req.json();
        const { recipientType, targetId, title, message } = sendSchema.parse(body);

        let recipientIds: string[] = [];

        if (recipientType === 'all') {
            const users = await db.users.findAll();
            recipientIds = users
                .filter(u => u.role === 'Employee' && u.status === 'Active')
                .map(u => u.id);
        } else if (recipientType === 'individual') {
            if (!targetId) {
                return NextResponse.json({ error: 'targetId required for individual notification' }, { status: 400 });
            }
            recipientIds = [targetId];
        } else if (recipientType === 'subject') {
            if (!targetId) {
                return NextResponse.json({ error: 'targetId required for subject notification' }, { status: 400 });
            }
            const assignments = await db.assignments.getBySubject(targetId);
            recipientIds = assignments
                .filter(a => a.status === 'active')
                .map(a => a.employeeId);
        }

        if (recipientIds.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
        }

        const notifications = recipientIds.map(recipientId => ({
            recipientId,
            title,
            message,
            type: 'admin_manual' as const,
            eventType: 'general_broadcast' as const,
            metadata: { recipientType, targetId: targetId ?? null, sentBy: guard.user.id },
        }));

        const count = await db.notifications.createMany(notifications);

        return NextResponse.json({ success: true, recipientCount: count }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('[admin/notifications/send] Error:', error);
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }
}
