import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { EmployeeDetail } from "@/components/shared/employee-detail"
import type { TrainingSubject, EmployeeSubjectAssignment } from "@/lib/models"

export const dynamic = 'force-dynamic'

interface EnrichedAssignment extends EmployeeSubjectAssignment {
    subject: TrainingSubject | null
}

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const viewer = await getCurrentUser()
    if (!viewer) redirect('/login')

    const { id } = await params

    // Hard separation: Trainers must use their own route
    if (viewer.role === 'Trainer') redirect(`/trainer/employees/${id}`)

    // From here onwards, only Admins proceed
    if (viewer.role !== 'Admin') redirect('/admin/dashboard')
    const [user, assignments, allSubjects] = await Promise.all([
        db.users.findById(id),
        db.assignments.getByEmployee(id),
        db.subjects.findAll(),
    ])

    if (!user) notFound()

    const subjectMap = new Map(allSubjects.map(s => [s.id, s]))
    const enriched: EnrichedAssignment[] = assignments.map(a => ({
        ...a,
        subject: subjectMap.get(a.subjectId) ?? null,
    }))

    return (
        <EmployeeDetail
            user={user}
            assignments={enriched}
            allSubjects={allSubjects}
            viewerRole="Admin"
        />
    )
}
