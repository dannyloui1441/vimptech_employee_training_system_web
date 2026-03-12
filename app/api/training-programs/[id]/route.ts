/**
 * @deprecated This route has been renamed to /api/training-subjects/[id]
 * Permanently redirects to the new route.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return NextResponse.redirect(new URL(`/api/training-subjects/${id}`, request.url), 308);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return NextResponse.redirect(new URL(`/api/training-subjects/${id}`, request.url), 308);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return NextResponse.redirect(new URL(`/api/training-subjects/${id}`, request.url), 308);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return NextResponse.redirect(new URL(`/api/training-subjects/${id}`, request.url), 308);
}
