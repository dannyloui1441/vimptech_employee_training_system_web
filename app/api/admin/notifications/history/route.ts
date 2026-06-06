import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

/** GET /api/admin/notifications/history — returns recent manual notifications */
export async function GET(req: NextRequest) {
    const guard = await authGuard(['Admin', 'Trainer'], req);
    if ('response' in guard) return guard.response;

    try {
        const history = await db.notifications.getManualHistory(100);

        // Group by createdAt + title for broadcast display
        const grouped = new Map<string, { title: string; message: string; sentAt: string; recipientCount: number; sentBy: string }>();

        for (const notif of history) {
            const key = `${notif.title}__${notif.createdAt.slice(0, 19)}`;
            if (grouped.has(key)) {
                grouped.get(key)!.recipientCount += 1;
            } else {
                grouped.set(key, {
                    title: notif.title,
                    message: notif.message,
                    sentAt: notif.createdAt,
                    recipientCount: 1,
                    sentBy: notif.metadata?.sentBy ?? 'Unknown',
                });
            }
        }

        return NextResponse.json({ history: Array.from(grouped.values()) });
    } catch (error) {
        console.error('[admin/notifications/history] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
