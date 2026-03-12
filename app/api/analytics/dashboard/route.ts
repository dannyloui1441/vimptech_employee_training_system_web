import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        const users = await db.users.findAll();
        const programs = await db.training.findAll();

        // Calculate metrics
        const totalEmployees = users.filter(u => u.role === 'Employee').length;
        const activePrograms = programs.length; // All programs (status not in shared contract)

        // Calculate completion: Users with 100% progress / Total Users with progress > 0 (simplification)
        const usersWithProgress = users.filter(u => u.progress !== undefined);
        const completedCount = usersWithProgress.filter(u => u.progress === 100).length;
        const completionRate = usersWithProgress.length > 0
            ? Math.round((completedCount / usersWithProgress.length) * 100)
            : 0;

        // Avg completion time is mocked for now as we don't have start/end dates in User model yet
        // In a real app, we'd query the junction table

        return NextResponse.json({
            totalEmployees,
            activePrograms,
            completedModules: completedCount * 4, // Approximating 4 modules per completed user
            completionRate,
            weeklyProgress: [ // Mocked for the chart until we have historical data
                { name: 'Mon', completed: 12, started: 5 },
                { name: 'Tue', completed: 19, started: 8 },
                { name: 'Wed', completed: 15, started: 10 },
                { name: 'Thu', completed: 25, started: 12 },
                { name: 'Fri', completed: 32, started: 15 },
                { name: 'Sat', completed: 10, started: 5 },
                { name: 'Sun', completed: 5, started: 2 },
            ]
        });
    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
    }
}
