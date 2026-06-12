import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { notifyModuleUnlocked } from '@/lib/notifications';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
} as const;

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization');

        const token = authHeader.replace('Bearer ', '');

        let employeeId: string;

        if (token.startsWith('emp_')) {
            // Legacy employee token
            employeeId = token.replace('emp_', '');
        } else {
            // JWT token
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
                employeeId = decoded.userId;
            } catch (err) {
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 401, headers: CORS_HEADERS }
                );
            }
        }

        console.log('AUTH TOKEN:', token);
        console.log('RESOLVED EMPLOYEE ID:', employeeId);

        // ── Batch-fetch all module progress for this user (single DB call) ──
        const allProgress = await db.moduleProgress.findByUser(employeeId);
        const progressMap = new Map(allProgress.map(p => [p.moduleId, p]));

        const assignments = await db.assignments.getByEmployee(employeeId);
        const activeAssignments = assignments.filter(a => a.status === 'active');

        const subjects = await Promise.all(
            activeAssignments.map(async (assignment) => {
                const subject = await db.subjects.findById(assignment.subjectId);
                if (!subject) return null;

                const modules = await db.modules.findBySubjectId(subject.id);
                const sortedModules = [...modules].sort((a, b) => a.module - b.module);

                // 1. Precompute cumulative scheduled timing synchronously
                let cumulativeGapDays = 0;
                const modulesWithTimings = sortedModules.map((mod, index) => {
                    if (index === 0) {
                        cumulativeGapDays = 0;
                    } else {
                        // gapUnit is ignored entirely, all gaps treated as DAYS only
                        const safeGap = Math.max(0, mod.gapValue ?? 0);
                        cumulativeGapDays += safeGap;
                    }
                    return {
                        ...mod,
                        cumulativeGapDays,
                        scheduledDay: cumulativeGapDays + 1
                    };
                });

                // 2. Compute progress + materials
                const enrichedModules = await Promise.all(
                    modulesWithTimings.map(async (mod) => {
                        const materials = await db.materials.findByModuleId(mod.id);

                        const progress = progressMap.get(mod.id);
                        const contentProgressPercent = progress?.contentProgressPercent ?? 0;
                        const assessmentPassed = progress?.assessmentPassed ?? false;
                        const startedAt = progress?.startedAt ?? null;
                        const completedAt = progress?.completedAt ?? null;

                        const overallProgress = Math.round(
                            contentProgressPercent * 0.5 + (assessmentPassed ? 50 : 0)
                        );

                        return {
                            ...mod,
                            materials,
                            contentProgressPercent,
                            assessmentPassed,
                            overallProgress,
                            startedAt,
                            completedAt
                        };
                    })
                );

                // 3. Compute lock state cleanly
                const mode = subject.mode ?? 'sequential';

                const assignedAt = assignment.assignedAt ? new Date(assignment.assignedAt) : new Date();
                assignedAt.setUTCHours(0, 0, 0, 0);

                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);

                const unlockNotifyPromises: Promise<void>[] = [];

                const finalModules = enrichedModules.map((mod, index) => {
                    let isLocked: boolean;
                    let unlockInDays: number | null = null;
                    let unlockDateObj: Date | null = null;

                    if (mode === 'scheduled') {
                        unlockDateObj = new Date(assignedAt);
                        unlockDateObj.setUTCDate(unlockDateObj.getUTCDate() + mod.cumulativeGapDays);
                        unlockDateObj.setUTCHours(0, 0, 0, 0);

                        isLocked = today < unlockDateObj;

                        const diffMs = unlockDateObj.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        unlockInDays = Math.max(0, diffDays);
                    } else {
                        // Sequential
                        if (index === 0) {
                            isLocked = false;
                        } else {
                            const prev = enrichedModules[index - 1];
                            isLocked = prev.overallProgress < 100;
                        }
                    }

                    if (!isLocked) {
                        unlockNotifyPromises.push(
                            notifyModuleUnlocked(employeeId, mod.id, mod.module, subject.id, subject.name)
                        );
                    }

                    const unlockDateIso = unlockDateObj ? unlockDateObj.toISOString() : null;

                    // 4. Return normalized module objects
                    return {
                        id: mod.id,
                        module: mod.module,
                        scheduledDay: mod.scheduledDay,
                        gapValue: mod.gapValue,
                        gapUnit: 'days',
                        content_progress_percent: mod.contentProgressPercent,
                        assessment_passed: mod.assessmentPassed,
                        overall_progress: mod.overallProgress,
                        is_locked: isLocked,
                        unlock_in_days: unlockInDays,
                        unlock_date: unlockDateIso,
                        started_at: mod.startedAt,
                        completed_at: mod.completedAt,
                        materials: mod.materials.map(mat => ({
                            id: mat.id,
                            title: mat.title,
                            type: mat.type,
                            mediaUrl: mat.mediaUrl,
                        })),
                    };
                });

                if (unlockNotifyPromises.length > 0) {
                    await Promise.all(unlockNotifyPromises);
                }

                return {
                    id: subject.id,
                    name: subject.name,
                    description: subject.description,
                    mode: subject.mode,
                    assignedAt: assignment.assignedAt,
                    modules: finalModules,
                };
            })
        );

        const validSubjects = subjects.filter(Boolean);

        return NextResponse.json(
            { subjects: validSubjects },
            { headers: CORS_HEADERS }
        );
    } catch (error) {
        console.error('[employees/me/subjects] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subjects' },
            { status: 500, headers: CORS_HEADERS }
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