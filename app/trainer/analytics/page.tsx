import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { AnalyticsDashboardClient } from "@/components/admin/analytics-dashboard-client"
import { buildOverview, buildEmployeeRow } from "@/lib/analytics"

export const dynamic = 'force-dynamic'

export default async function TrainerAnalyticsPage() {
    // ── Cookie-forwarding auth (same pattern as trainer layout) ────────────
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('token')
    let req: Request | undefined
    if (tokenCookie?.value) {
        req = new Request('http://localhost', {
            headers: { cookie: `token=${tokenCookie.value}` },
        })
    }

    const user = await getCurrentUser(req, { allowFallback: true })
    if (!user) redirect('/login')
    if (user.role !== 'Trainer' && user.role !== 'Admin') redirect('/login')

    // ── Determine trainer scope (same logic as /api/trainer/employees) ─────
    const allSubjects = await db.subjects.findAll()
    const trainerSubjects = user.role === 'Trainer'
        ? allSubjects.filter(s => s.assignedTrainerIds.includes(user.id))
        : allSubjects

    const trainerSubjectIds = trainerSubjects.map(s => s.id)

    if (trainerSubjectIds.length === 0) {
        return (
            <AnalyticsDashboardClient
                overview={{
                    totalEmployees: 0,
                    totalSubjectsAssigned: 0,
                    averageAssessmentScore: 0,
                    averageCompletionPercent: 0,
                    completedModules: 0,
                    activeLearners: 0,
                }}
                employees={[]}
                basePath="/trainer/analytics"
            />
        )
    }

    // ── Scope assignments to trainer subjects ─────────────────────────────
    const [allUsers, allAssignments] = await Promise.all([
        db.users.findAll(),
        db.assignments.findAll(),
    ])

    const scopedAssignments = allAssignments.filter(
        a => trainerSubjectIds.includes(a.subjectId)
    )

    const scopedEmployeeIds = [...new Set(scopedAssignments.map(a => a.employeeId))]
    const scopedEmployees = allUsers.filter(
        u => u.role === 'Employee' && scopedEmployeeIds.includes(u.id)
    )

    // Pre-index assignments per employee
    const assignmentsByEmployee = new Map<string, number>()
    for (const a of scopedAssignments) {
        assignmentsByEmployee.set(a.employeeId, (assignmentsByEmployee.get(a.employeeId) ?? 0) + 1)
    }

    // ── Fetch per-employee data ───────────────────────────────────────────
    const [perEmployeeAttempts, perEmployeeProgress] = await Promise.all([
        Promise.all(scopedEmployees.map(e => db.assessments.attempts.findByEmployee(e.id))),
        Promise.all(scopedEmployees.map(e => db.moduleProgress.findByUser(e.id))),
    ])

    const allAttempts = perEmployeeAttempts.flat()
    const allProgress = perEmployeeProgress.flat()

    // ── Build overview ────────────────────────────────────────────────────
    const overview = buildOverview(scopedEmployees, scopedAssignments.length, allAttempts, allProgress)

    // ── Build per-employee rows ───────────────────────────────────────────
    const employeeRows = scopedEmployees.map((emp, index) =>
        buildEmployeeRow(
            emp,
            perEmployeeAttempts[index],
            perEmployeeProgress[index],
            assignmentsByEmployee.get(emp.id) ?? 0,
        )
    )

    employeeRows.sort((a, b) => b.averageAssessmentScore - a.averageAssessmentScore)

    return (
        <AnalyticsDashboardClient
            overview={overview}
            employees={employeeRows}
            basePath="/trainer/analytics"
        />
    )
}
