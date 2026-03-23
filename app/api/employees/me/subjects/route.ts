import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

export async function GET(req: Request) {
    console.log('AUTH HEADER:', req.headers.get('Authorization') ?? req.headers.get('authorization') ?? 'NONE');
    const guard = await authGuard(['Employee'], req);
    if ('response' in guard) return guard.response;

    const { user } = guard;

    try {
        const assignments = await db.assignments.getByEmployee(user.id);
        const activeAssignments = assignments.filter(a => a.status === 'active');

        const subjects = await Promise.all(
            activeAssignments.map(async (assignment) => {
                const subject = await db.subjects.findById(assignment.subjectId);
                if (!subject) return null;

                const modules = await db.modules.findBySubjectId(subject.id);
                const sortedModules = modules.sort((a, b) => a.day - b.day);

                const modulesWithMaterials = await Promise.all(
                    sortedModules.map(async (module) => {
                        const materials = await db.materials.findByModuleId(module.id);
                        return {
                            id: module.id,
                            day: module.day,
                            gapValue: module.gapValue,
                            gapUnit: module.gapUnit,
                            materials: materials.map(mat => ({
                                id: mat.id,
                                title: mat.title,
                                type: mat.type,
                                mediaUrl: mat.mediaUrl,
                            })),
                        };
                    })
                );

                return {
                    id: subject.id,
                    name: subject.name,
                    description: subject.description,
                    mode: subject.mode,
                    assignedAt: assignment.assignedAt,
                    modules: modulesWithMaterials,
                };
            })
        );

        const validSubjects = subjects.filter(Boolean);

        return NextResponse.json({ subjects: validSubjects });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }
}
