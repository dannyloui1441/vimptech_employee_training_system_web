import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authGuard } from '@/lib/auth'

/**
 * GET /api/trainer/employees
 *
 * Returns subjects assigned to the current trainer, each enriched with
 * the list of employees assigned to that subject (via employeeSubjectAssignments).
 *
 * Shape:
 * [
 *   {
 *     subject: TrainingSubject,
 *     employees: Array<{ user: User, assignment: EmployeeSubjectAssignment }>
 *   }
 * ]
 */
export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer'])
    if ('response' in guard) return guard.response

    const { user: viewer } = guard

    const [allSubjects, allAssignments, allUsers] = await Promise.all([
        db.subjects.findAll(),
        db.assignments.findAll(),
        db.users.findAll(),
    ])

    // Trainer: only subjects they are assigned to
    // Admin: all subjects (useful for testing, but route is intended for trainer use)
    const trainerSubjects = viewer.role === 'Trainer'
        ? allSubjects.filter(s => s.assignedTrainerIds.includes(viewer.id))
        : allSubjects

    const userMap = new Map(allUsers.map(u => [u.id, u]))

    const result = trainerSubjects.map(subject => {
        const subjectAssignments = allAssignments.filter(a => a.subjectId === subject.id)
        const employees = subjectAssignments
            .map(assignment => {
                const user = userMap.get(assignment.employeeId)
                return user ? { user, assignment } : null
            })
            .filter((e): e is NonNullable<typeof e> => e !== null)

        return { subject, employees }
    })

    return NextResponse.json(result)
}
