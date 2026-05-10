/**
 * @deprecated This route has been renamed to /api/training-subjects
 * This file is kept temporarily to avoid 404s from any cached requests.
 * It simply proxies every request to the new route.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.url.replace('/api/training-programs', '/api/training-subjects');
    return NextResponse.redirect(url, 308);
}

export async function POST(request: NextRequest) {
    const url = request.url.replace('/api/training-programs', '/api/training-subjects');
    return NextResponse.redirect(url, 308);
}
