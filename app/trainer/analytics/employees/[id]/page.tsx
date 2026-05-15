import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { EmployeeAnalyticsClient } from "@/components/admin/employee-analytics-client"
import { safeAvg, computeAvgCompletionTimeHours, computeLastActivity } from "@/lib/analytics"

export const dynamic = 'force-dynamic'

export default async function TrainerEmployeeAnalyticsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')
    if (user.role !== 'Trainer' && user.role !== 'Admin') redirect('/login')

    const { id: employeeId } = await params

    // ── Validate employee ─────────────────────────────────────────────────
    const employee = await db.users.findById(employeeId)
    if (!employee || employee.role !== 'Employee') notFound()

    // ── Verify trainer scope ──────────────────────────────────────────────
    const allSubjects = await db.subjects.findAll()
    const trainerSubjectIds = new Set(
        allSubjects.filter(s => s.assignedTrainerIds.includes(user.id)).map(s => s.id)
    )

    const employeeAssignments = await db.assignments.getByEmployee(employeeId)
    const scopedAssignments = employeeAssignments.filter(
        a => trainerSubjectIds.has(a.subjectId)
    )

    // Employee not in trainer's scope
    if (scopedAssignments.length === 0) notFound()

    // ── Fetch employee data ───────────────────────────────────────────────
    const [allProgress, allAttempts] = await Promise.all([
        db.moduleProgress.findByUser(employeeId),
        db.assessments.attempts.findByEmployee(employeeId),
    ])

    const subjectMap = new Map(allSubjects.map(s => [s.id, s]))
    const progressByModule = new Map(allProgress.map(p => [p.moduleId, p]))
    const attemptsByModule = new Map<string, typeof allAttempts>()
    for (const a of allAttempts) {
        if (!attemptsByModule.has(a.moduleId)) attemptsByModule.set(a.moduleId, [])
        attemptsByModule.get(a.moduleId)!.push(a)
    }

    // Modules ONLY for trainer-scoped subjects
    const scopedSubjectIds = scopedAssignments.map(a => a.subjectId)
    const modulesPerSubject = await Promise.all(
        scopedSubjectIds.map(sid => db.modules.findBySubjectId(sid))
    )

    const allModules = scopedSubjectIds.flatMap((subjectId, i) =>
        modulesPerSubject[i].map(m => ({ ...m, subjectId }))
    )

    const scopedModuleIds = new Set(allModules.map(m => m.id))
    const scopedProgress = allProgress.filter(p => scopedModuleIds.has(p.moduleId))
    const scopedAttempts = allAttempts.filter(a => scopedModuleIds.has(a.moduleId))

    // ── Overview ──────────────────────────────────────────────────────────
    const overview = {
        averageAssessmentScore: safeAvg(scopedAttempts.map(a => a.score)),
        averageCompletionPercent: safeAvg(scopedProgress.map(p => p.contentProgressPercent)),
        completedModules: scopedProgress.filter(p => p.completedAt !== null).length,
        averageCompletionTimeHours: computeAvgCompletionTimeHours(scopedProgress),
        subjectsAssigned: scopedAssignments.length,
        lastActivity: computeLastActivity(scopedProgress),
    }

    // ── Subjects ──────────────────────────────────────────────────────────
    const subjects = scopedAssignments.map((assignment, aIndex) => {
        const subject = subjectMap.get(assignment.subjectId)
        const subjectModules = modulesPerSubject[aIndex] ?? []
        const subjectProgress = subjectModules
            .map(m => progressByModule.get(m.id))
            .filter((p): p is NonNullable<typeof p> => p !== undefined)
        const subjectAttempts = subjectModules.flatMap(m => attemptsByModule.get(m.id) ?? [])

        return {
            subjectId: assignment.subjectId,
            subjectName: subject?.name ?? 'Unknown Subject',
            completionPercent: subjectModules.length > 0
                ? Math.round((subjectProgress.reduce((s, p) => s + p.contentProgressPercent, 0) / subjectModules.length) * 10) / 10
                : 0,
            completedModules: subjectProgress.filter(p => p.completedAt !== null).length,
            averageAssessmentScore: safeAvg(subjectAttempts.map(a => a.score)),
            assignedAt: assignment.assignedAt ?? null,
        }
    })

    // ── Modules ───────────────────────────────────────────────────────────
    const modules = allModules.map(mod => {
        const progress = progressByModule.get(mod.id)
        const subject = subjectMap.get(mod.subjectId)
        const contentProgressPercent = progress?.contentProgressPercent ?? 0
        const assessmentPassed = progress?.assessmentPassed ?? false
        const startedAt = progress?.startedAt ?? null
        const completedAt = progress?.completedAt ?? null

        let status: 'Not Started' | 'In Progress' | 'Completed'
        if (completedAt !== null) status = 'Completed'
        else if (contentProgressPercent > 0) status = 'In Progress'
        else status = 'Not Started'

        let durationHours: number | null = null
        if (startedAt && completedAt) {
            const ms = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())
            durationHours = Math.round((ms / (1000 * 60 * 60)) * 10) / 10
        }

        return {
            moduleId: mod.id, subjectId: mod.subjectId,
            subjectName: subject?.name ?? 'Unknown Subject',
            moduleOrder: mod.module,
            startedAt, completedAt, durationHours,
            contentProgressPercent, assessmentPassed, status,
        }
    }).sort((a, b) => {
        if (a.subjectId !== b.subjectId) return a.subjectName.localeCompare(b.subjectName)
        return a.moduleOrder - b.moduleOrder
    })

    // ── Assessments ───────────────────────────────────────────────────────
    const assessments = scopedAttempts
        .map(a => ({
            assessmentId: a.id, moduleId: a.moduleId,
            score: a.score, passed: a.passed,
            attemptNumber: a.attemptNumber, submittedAt: a.submittedAt,
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
            overview={overview}
            subjects={subjects}
            modules={modules}
            assessments={assessments}
            basePath="/trainer/analytics"
        />
    )
}
