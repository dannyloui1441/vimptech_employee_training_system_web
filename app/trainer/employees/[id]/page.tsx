import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { EmployeeDetail } from "@/components/shared/employee-detail"
import type { TrainingSubject, EmployeeSubjectAssignment } from "@/lib/models"

export const dynamic = 'force-dynamic'

interface EnrichedAssignment extends EmployeeSubjectAssignment {
    subject: TrainingSubject | null
}

export default async function TrainerEmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const viewer = await getCurrentUser()
    if (!viewer) redirect('/login')

    // Employees have no access to this panel
    if (viewer.role === 'Employee') redirect('/')

    const { id } = await params

    const [user, assignments, allSubjects] = await Promise.all([
        db.users.findById(id),
        db.assignments.getByEmployee(id),
        db.subjects.findAll(),
    ])

    if (!user) notFound()

    let scopedAssignments = assignments

    if (viewer.role === 'Trainer') {
        // Trainers only see employees in their own subjects
        const trainerSubjectIds = new Set(
            allSubjects
                .filter(s => s.assignedTrainerIds.includes(viewer.id))
                .map(s => s.id)
        )
        const hasAccess = assignments.some(a => trainerSubjectIds.has(a.subjectId))

        if (!hasAccess) {
            // Trainer does not manage this employee — redirect back to their list
            redirect('/trainer/employees')
        }

        scopedAssignments = assignments.filter(a => trainerSubjectIds.has(a.subjectId))
    }
    // Admin visiting trainer panel: sees all assignments, no scoping needed

    const subjectMap = new Map(allSubjects.map(s => [s.id, s]))
    const enriched: EnrichedAssignment[] = scopedAssignments.map(a => ({
        ...a,
        subject: subjectMap.get(a.subjectId) ?? null,
    }))

    return (
        <EmployeeDetail
            user={user}
            assignments={enriched}
            allSubjects={[]} // Trainer view: no subject assignment controls
            viewerRole="Trainer"
        />
    )
}
