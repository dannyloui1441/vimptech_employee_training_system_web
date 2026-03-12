import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        const settings = await db.settings.find();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    try {
        const body = await request.json();
        const updatedSettings = await db.settings.update(body);
        return NextResponse.json(updatedSettings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
