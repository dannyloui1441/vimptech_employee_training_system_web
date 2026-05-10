import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        const roles = await db.roles.findAll();
        return NextResponse.json(roles);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    try {
        const body = await request.json();
        const role = await db.roles.create(body);
        return NextResponse.json(role);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const guard = await authGuard('Admin');
    if ('response' in guard) return guard.response;

    try {
        const body = await request.json();
        const { id, ...updates } = body;
        const role = await db.roles.update(id, updates);
        return NextResponse.json(role);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}
