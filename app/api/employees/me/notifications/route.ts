import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

/** GET /api/employees/me/notifications — returns notifications + unreadCount */
export async function GET(req: Request) {
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

        const [notifications, unreadCount] = await Promise.all([
            db.notifications.findByRecipient(employeeId),
            db.notifications.getUnreadCount(employeeId),
        ]);

        return NextResponse.json(
            { notifications, unreadCount },
            { headers: CORS_HEADERS },
        );
    } catch (error) {
        console.error('[employees/me/notifications] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500, headers: CORS_HEADERS },
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
