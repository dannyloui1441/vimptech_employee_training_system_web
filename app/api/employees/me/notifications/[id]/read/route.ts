import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

/** POST /api/employees/me/notifications/[id]/read — marks a notification as read */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization' }, { status: 401, headers: CORS_HEADERS });
        }

        const token = authHeader.replace('Bearer ', '');
        let employeeId: string;

        if (token.startsWith('emp_')) {
            employeeId = token.replace('emp_', '');
        } else {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
                employeeId = decoded.userId;
            } catch {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });
            }
        }

        const { id: notificationId } = await params;

        const updated = await db.notifications.markAsRead(notificationId, employeeId);
        if (!updated) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404, headers: CORS_HEADERS });
        }

        return NextResponse.json({ success: true, notification: updated }, { headers: CORS_HEADERS });
    } catch (error) {
        console.error('[notifications/read] Error:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500, headers: CORS_HEADERS },
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
