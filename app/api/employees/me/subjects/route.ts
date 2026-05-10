import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

                const mode = subject.mode ?? 'sequential';

                // ── Anchor date for scheduled subjects ──────────────────────────
                // assigned_at is used as day-0 reference; fall back to now if missing.
                const assignedAt = assignment.assignedAt
                    ? new Date(assignment.assignedAt)
                    : new Date();
                // Strip time component so comparisons are day-accurate (UTC midnight)
                assignedAt.setUTCHours(0, 0, 0, 0);

                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);

                // ── Pass 1: compute scheduledDay, overallProgress, and materials ─
                // We need overallProgress of each module before we can determine
                // sequential locks, so we build the full enriched list first.
                let cumulativeGapDays = 0; // tracks cumulative gap for scheduled day
                const enriched = await Promise.all(
                    sortedModules.map(async (mod, index) => {
                        // gap_value treated as DAYS ONLY — gap_unit is intentionally ignored
                        if (index > 0) {
                            const safeGap = Math.max(0, mod.gapValue ?? 0);
                            cumulativeGapDays += safeGap;
                        }

                        // scheduledDay is 1-based: module 1 = day 1
                        const scheduledDay = 1 + cumulativeGapDays;

                        const materials = await db.materials.findByModuleId(mod.id);

                        const progress = progressMap.get(mod.id);
                        const contentProgressPercent = progress?.contentProgressPercent ?? 0;
                        const assessmentPassed = progress?.assessmentPassed ?? false;

                        // overall_progress formula:
                        //   content half = contentProgressPercent * 0.5   (0–50)
                        //   assessment half = assessmentPassed ? 50 : 0
                        //   total = 0–100
                        const overallProgress = Math.round(
                            contentProgressPercent * 0.5 + (assessmentPassed ? 50 : 0)
                        );

                        console.log("MODULE:", {
                            id: mod.id,
                            content: contentProgressPercent,
                            passed: assessmentPassed,
                            overall: overallProgress,
                        });

                        return {
                            mod,
                            index,
                            scheduledDay,
                            cumulativeGapDays,
                            contentProgressPercent,
                            assessmentPassed,
                            overallProgress,
                            materials,
                        };
                    })
                );

                // ── Pass 2: compute lock state per module ───────────────────────
                const modulesWithSchedule = enriched.map((entry, index) => {
                    const { mod, scheduledDay, cumulativeGapDays, contentProgressPercent, assessmentPassed, overallProgress, materials } = entry;

                    let isLocked: boolean;
                    let unlockInDays: number | null = null;
                    let unlockDate: string | null = null;

                    if (mode === 'scheduled') {
                        // Unlock date = assignedAt + cumulative gap days (time-based only)
                        const unlockDateObj = new Date(assignedAt);
                        unlockDateObj.setUTCDate(unlockDateObj.getUTCDate() + cumulativeGapDays);

                        unlockDate = unlockDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
                        const diffMs = unlockDateObj.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                        isLocked = today < unlockDateObj;
                        unlockInDays = isLocked ? diffDays : 0;

                        console.log('[scheduled unlock]', {
                            moduleId: mod.id,
                            mode,
                            scheduledDay,
                            unlockDate,
                            isLocked,
                            unlockInDays,
                        });
                    } else {
                        // SEQUENTIAL: first module always unlocked;
                        // subsequent modules unlock only when previous module overallProgress >= 100
                        if (index === 0) {
                            isLocked = false;
                        } else {
                            const prev = enriched[index - 1];
                            isLocked = prev.overallProgress < 100;
                        }
                        // Sequential modules don't have calendar-based unlock dates
                        unlockInDays = null;
                        unlockDate = null;
                    }

                    return {
                        id: mod.id,
                        module: mod.module,
                        scheduledDay,
                        gapValue: mod.gapValue,
                        gapUnit: mod.gapUnit,
                        content_progress_percent: contentProgressPercent,
                        assessment_passed: assessmentPassed,
                        overall_progress: overallProgress,
                        is_locked: isLocked,
                        unlock_in_days: unlockInDays,
                        unlock_date: unlockDate,
                        materials: materials.map((mat: any) => ({
                            id: mat.id,
                            title: mat.title,
                            type: mat.type,
                            mediaUrl: mat.mediaUrl,
                        })),
                    };
                });

                return {
                    id: subject.id,
                    name: subject.name,
                    description: subject.description,
                    mode,
                    assignedAt: assignment.assignedAt,
                    modules: modulesWithSchedule,
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