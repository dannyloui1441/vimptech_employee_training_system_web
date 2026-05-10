import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersPageClient } from "@/components/admin/users-page-client"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const viewer = await getCurrentUser()
  if (!viewer) redirect('/login')

  // Trainers can view the users list but with restrictions
  if (viewer.role !== 'Admin' && viewer.role !== 'Trainer') {
    redirect('/admin/dashboard')
  }

  const [users, assignments] = await Promise.all([
    db.users.findAll(),
    db.assignments.findAll(),
  ])

  // Trainer visibility: only employees assigned to subjects where trainer is assigned
  let visibleUsers = users
  if (viewer.role === 'Trainer') {
    const trainerSubjects = await db.subjects.findAll().then(
      ss => ss.filter(s => s.assignedTrainerIds.includes(viewer.id)).map(s => s.id)
    )
    const employeeIdsInScope = new Set(
      assignments
        .filter(a => trainerSubjects.includes(a.subjectId))
        .map(a => a.employeeId)
    )
    visibleUsers = users.filter(u => u.role !== 'Employee' || employeeIdsInScope.has(u.id))
  }

  return (
    <UsersPageClient
      users={visibleUsers}
      assignments={assignments}
      viewerRole={viewer.role as 'Admin' | 'Trainer'}
    />
  )
}
