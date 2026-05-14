import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

const progressSchema = z.object({
    moduleId: z.string(),
    subjectId: z.string(),
    progress: z.number().min(0).max(100),
});

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization' }, { status: 401, headers: CORS_HEADERS });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId: string;

        if (token.startsWith('emp_')) {
            userId = token.replace('emp_', '');
        } else {
            try {
                if (!process.env.JWT_SECRET) {
                    return NextResponse.json(
                        { error: 'Server config error' },
                        { status: 500, headers: CORS_HEADERS }
                    );
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
                userId = decoded.userId;

            } catch (err) {
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 401, headers: CORS_HEADERS }
                );
            }
        }

        const body = await req.json();
        const parsed = progressSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400, headers: CORS_HEADERS });
        }

        const { moduleId, subjectId, progress } = parsed.data;

        console.log(`[modules/progress] Received progress ${progress} for module ${moduleId} user ${userId}`);

        const existing = await db.moduleProgress.findByUserAndModule(userId, moduleId);
        const existingProgress = existing?.contentProgressPercent ?? 0;

        const finalProgress = Math.max(existingProgress, progress);

        console.log(`[modules/progress] Final stored progress will be ${finalProgress}`);

        const upsertPayload: Parameters<typeof db.moduleProgress.upsert>[0] = {
            userId,
            moduleId,
            subjectId,
            contentProgressPercent: finalProgress,
        };

        if (finalProgress === 100 && existingProgress !== 100) {
            upsertPayload.contentCompletedAt = new Date().toISOString();
        }

        if (!existing) {
            upsertPayload.startedAt = new Date().toISOString();
        }

        if (finalProgress === 100 && existing?.assessmentPassed && !existing?.completedAt) {
            upsertPayload.completedAt = new Date().toISOString();
        }

        await db.moduleProgress.upsert(upsertPayload);

        return NextResponse.json({ success: true }, { headers: CORS_HEADERS });

    } catch (error) {
        console.error('[modules/progress] Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500, headers: CORS_HEADERS });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}
