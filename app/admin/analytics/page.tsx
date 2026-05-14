import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { AnalyticsDashboardClient } from "@/components/admin/analytics-dashboard-client"

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.role !== 'Admin') redirect('/admin/dashboard')

    // ── Fetch all required data in parallel (same pattern as dashboard/users pages) ──
    const [allUsers, allAssignments] = await Promise.all([
        db.users.findAll(),
        db.assignments.findAll(),
    ])

    const employees = allUsers.filter(u => u.role === 'Employee')

    // Fetch per-employee data in parallel
    const [perEmployeeAttempts, perEmployeeProgress] = await Promise.all([
        Promise.all(employees.map(e => db.assessments.attempts.findByEmployee(e.id))),
        Promise.all(employees.map(e => db.moduleProgress.findByUser(e.id))),
    ])

    const allAttempts = perEmployeeAttempts.flat()
    const allProgress = perEmployeeProgress.flat()

    // ── Build overview metrics ────────────────────────────────────────────────
    const assignmentsByEmployee = new Map<string, number>()
    for (const a of allAssignments) {
        assignmentsByEmployee.set(a.employeeId, (assignmentsByEmployee.get(a.employeeId) ?? 0) + 1)
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const employeeIds = new Set(employees.map(e => e.id))
    const activeUserIds = new Set<string>()
    for (const p of allProgress) {
        if (p.updatedAt && employeeIds.has(p.userId) && new Date(p.updatedAt) >= sevenDaysAgo) {
            activeUserIds.add(p.userId)
        }
    }

    const overview = {
        totalEmployees: employees.length,
        totalSubjectsAssigned: allAssignments.length,
        averageAssessmentScore: allAttempts.length > 0
            ? Math.round((allAttempts.reduce((s, a) => s + a.score, 0) / allAttempts.length) * 10) / 10
            : 0,
        averageCompletionPercent: allProgress.length > 0
            ? Math.round((allProgress.reduce((s, p) => s + p.contentProgressPercent, 0) / allProgress.length) * 10) / 10
            : 0,
        completedModules: allProgress.filter(p => p.completedAt !== null).length,
        activeLearners: activeUserIds.size,
    }

    // ── Build per-employee rows ───────────────────────────────────────────────
    const employeeRows = employees.map((emp, index) => {
        const attempts = perEmployeeAttempts[index]
        const progressRows = perEmployeeProgress[index]

        const avgScore = attempts.length > 0
            ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / attempts.length) * 10) / 10
            : 0

        const avgCompletion = progressRows.length > 0
            ? Math.round((progressRows.reduce((s, p) => s + p.contentProgressPercent, 0) / progressRows.length) * 10) / 10
            : 0

        const completedModules = progressRows.filter(p => p.completedAt !== null).length

        const completedWithTimestamps = progressRows.filter(p => p.startedAt && p.completedAt)
        let averageCompletionTimeHours: number | null = null
        if (completedWithTimestamps.length > 0) {
            const totalMs = completedWithTimestamps.reduce((sum, p) => {
                return sum + Math.max(0, new Date(p.completedAt!).getTime() - new Date(p.startedAt!).getTime())
            }, 0)
            averageCompletionTimeHours = Math.round((totalMs / completedWithTimestamps.length / (1000 * 60 * 60)) * 10) / 10
        }

        let lastActivity: string | null = null
        if (progressRows.length > 0) {
            const sorted = progressRows.filter(p => p.updatedAt).sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
            lastActivity = sorted.length > 0 ? sorted[0].updatedAt : null
        }

        return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            department: emp.department ?? null,
            subjectsAssigned: assignmentsByEmployee.get(emp.id) ?? 0,
            averageAssessmentScore: avgScore,
            averageCompletionPercent: avgCompletion,
            completedModules,
            averageCompletionTimeHours,
            lastActivity,
        }
    })

    // Sort by average score DESC
    employeeRows.sort((a, b) => b.averageAssessmentScore - a.averageAssessmentScore)

    return (
        <AnalyticsDashboardClient
            overview={overview}
            employees={employeeRows}
        />
    )
}
