import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { EmployeeAnalyticsClient } from "@/components/admin/employee-analytics-client"

export const dynamic = 'force-dynamic'

export default async function EmployeeAnalyticsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.role !== 'Admin') redirect('/admin/dashboard')

    const { id: employeeId } = await params

    // ── Validate employee ─────────────────────────────────────────────────
    const employee = await db.users.findById(employeeId)
    if (!employee || employee.role !== 'Employee') notFound()

    // ── Fetch all employee data in parallel ───────────────────────────────
    const [assignments, allProgress, allAttempts, allSubjects] = await Promise.all([
        db.assignments.getByEmployee(employeeId),
        db.moduleProgress.findByUser(employeeId),
        db.assessments.attempts.findByEmployee(employeeId),
        db.subjects.findAll(),
    ])

    // Pre-index lookups
    const subjectMap = new Map(allSubjects.map(s => [s.id, s]))
    const progressByModule = new Map(allProgress.map(p => [p.moduleId, p]))
    const attemptsByModule = new Map<string, typeof allAttempts>()
    for (const a of allAttempts) {
        if (!attemptsByModule.has(a.moduleId)) attemptsByModule.set(a.moduleId, [])
        attemptsByModule.get(a.moduleId)!.push(a)
    }

    // Fetch all modules for assigned subjects in parallel
    const assignedSubjectIds = assignments.map(a => a.subjectId)
    const modulesPerSubject = await Promise.all(
        assignedSubjectIds.map(sid => db.modules.findBySubjectId(sid))
    )

    const allModules = assignedSubjectIds.flatMap((subjectId, i) =>
        modulesPerSubject[i].map(m => ({ ...m, subjectId }))
    )

    // ── Overview metrics ──────────────────────────────────────────────────
    const avgScore = allAttempts.length > 0
        ? Math.round((allAttempts.reduce((s, a) => s + a.score, 0) / allAttempts.length) * 10) / 10
        : 0

    const avgCompletion = allProgress.length > 0
        ? Math.round((allProgress.reduce((s, p) => s + p.contentProgressPercent, 0) / allProgress.length) * 10) / 10
        : 0

    const completedModules = allProgress.filter(p => p.completedAt !== null).length

    const completedWithTimestamps = allProgress.filter(p => p.startedAt && p.completedAt)
    let averageCompletionTimeHours: number | null = null
    if (completedWithTimestamps.length > 0) {
        const totalMs = completedWithTimestamps.reduce((sum, p) =>
            sum + Math.max(0, new Date(p.completedAt!).getTime() - new Date(p.startedAt!).getTime()),
        0)
        averageCompletionTimeHours = Math.round((totalMs / completedWithTimestamps.length / (1000 * 60 * 60)) * 10) / 10
    }

    let lastActivity: string | null = null
    if (allProgress.length > 0) {
        const sorted = allProgress.filter(p => p.updatedAt)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        lastActivity = sorted.length > 0 ? sorted[0].updatedAt : null
    }

    // ── Subject analytics ─────────────────────────────────────────────────
    const subjects = assignments.map((assignment, aIndex) => {
        const subject = subjectMap.get(assignment.subjectId)
        const subjectModules = modulesPerSubject[aIndex] ?? []

        const subjectProgress = subjectModules
            .map(m => progressByModule.get(m.id))
            .filter((p): p is NonNullable<typeof p> => p !== undefined)

        const subjectAttempts = subjectModules.flatMap(m => attemptsByModule.get(m.id) ?? [])

        const completionPercent = subjectModules.length > 0
            ? Math.round((subjectProgress.reduce((s, p) => s + p.contentProgressPercent, 0) / subjectModules.length) * 10) / 10
            : 0

        return {
            subjectId: assignment.subjectId,
            subjectName: subject?.name ?? 'Unknown Subject',
            completionPercent,
            completedModules: subjectProgress.filter(p => p.completedAt !== null).length,
            averageAssessmentScore: subjectAttempts.length > 0
                ? Math.round((subjectAttempts.reduce((s, a) => s + a.score, 0) / subjectAttempts.length) * 10) / 10
                : 0,
            assignedAt: assignment.assignedAt ?? null,
        }
    })

    // ── Module history ────────────────────────────────────────────────────
    const modules = allModules.map(mod => {
        const progress = progressByModule.get(mod.id)
        const subject = subjectMap.get(mod.subjectId)

        const contentProgressPercent = progress?.contentProgressPercent ?? 0
        const assessmentPassed = progress?.assessmentPassed ?? false
        const startedAt = progress?.startedAt ?? null
        const completedAt = progress?.completedAt ?? null

        let status: 'Not Started' | 'In Progress' | 'Completed'
        if (completedAt !== null) {
            status = 'Completed'
        } else if (contentProgressPercent > 0) {
            status = 'In Progress'
        } else {
            status = 'Not Started'
        }

        let durationHours: number | null = null
        if (startedAt && completedAt) {
            const ms = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())
            durationHours = Math.round((ms / (1000 * 60 * 60)) * 10) / 10
        }

        return {
            moduleId: mod.id,
            subjectId: mod.subjectId,
            subjectName: subject?.name ?? 'Unknown Subject',
            moduleOrder: mod.module,
            startedAt,
            completedAt,
            durationHours,
            contentProgressPercent,
            assessmentPassed,
            status,
        }
    }).sort((a, b) => {
        if (a.subjectId !== b.subjectId) return a.subjectName.localeCompare(b.subjectName)
        return a.moduleOrder - b.moduleOrder
    })

    // ── Assessment history ────────────────────────────────────────────────
    const assessments = allAttempts
        .map(a => ({
            assessmentId: a.id,
            moduleId: a.moduleId,
            score: a.score,
            passed: a.passed,
            attemptNumber: a.attemptNumber,
            submittedAt: a.submittedAt,
        }))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return (
        <EmployeeAnalyticsClient
            employee={{
                id: employee.id,
                name: employee.name,
                email: employee.email,
                department: employee.department ?? null,
                role: employee.role,
            }}
            overview={{
                averageAssessmentScore: avgScore,
                averageCompletionPercent: avgCompletion,
                completedModules,
                averageCompletionTimeHours,
                subjectsAssigned: assignments.length,
                lastActivity,
            }}
            subjects={subjects}
            modules={modules}
            assessments={assessments}
        />
    )
}
