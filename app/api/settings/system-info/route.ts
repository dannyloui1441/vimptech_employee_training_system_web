import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        version: '1.2.3',
        dbVersion: '1.0.0',
        status: 'Operational',
        lastUpdated: new Date().toISOString(),
        serverTime: new Date().toISOString()
    });
}
