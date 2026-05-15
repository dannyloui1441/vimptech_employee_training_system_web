/**
 * Shared Analytics Aggregation Utilities
 *
 * Used by both admin and trainer analytics routes/pages.
 * Extracts common aggregation logic to avoid duplication.
 */

import type { ModuleProgress, AssessmentAttempt } from './models'
import type { User } from './db'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
    totalEmployees: number
    totalSubjectsAssigned: number
    averageAssessmentScore: number
    averageCompletionPercent: number
    completedModules: number
    activeLearners: number
}

export interface EmployeeAnalyticsRow {
    id: string
    name: string
    email: string
    department: string | null
    subjectsAssigned: number
    averageAssessmentScore: number
    averageCompletionPercent: number
    completedModules: number
    averageCompletionTimeHours: number | null
    lastActivity: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function safeAvg(values: number[]): number {
    if (values.length === 0) return 0
    return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
}

export function computeAvgCompletionTimeHours(progressRows: ModuleProgress[]): number | null {
    const withTimestamps = progressRows.filter(p => p.startedAt && p.completedAt)
    if (withTimestamps.length === 0) return null

    const totalMs = withTimestamps.reduce((sum, p) =>
        sum + Math.max(0, new Date(p.completedAt!).getTime() - new Date(p.startedAt!).getTime()),
    0)
    return Math.round((totalMs / withTimestamps.length / (1000 * 60 * 60)) * 10) / 10
}

export function computeLastActivity(progressRows: ModuleProgress[]): string | null {
    if (progressRows.length === 0) return null
    const sorted = progressRows.filter(p => p.updatedAt)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return sorted.length > 0 ? sorted[0].updatedAt : null
}

// ─── Overview Aggregation ────────────────────────────────────────────────────

export function buildOverview(
    employees: User[],
    allAssignmentCount: number,
    allAttempts: AssessmentAttempt[],
    allProgress: ModuleProgress[],
): AnalyticsOverview {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const employeeIds = new Set(employees.map(e => e.id))
    const activeUserIds = new Set<string>()
    for (const p of allProgress) {
        if (p.updatedAt && employeeIds.has(p.userId) && new Date(p.updatedAt) >= sevenDaysAgo) {
            activeUserIds.add(p.userId)
        }
    }

    return {
        totalEmployees: employees.length,
        totalSubjectsAssigned: allAssignmentCount,
        averageAssessmentScore: safeAvg(allAttempts.map(a => a.score)),
        averageCompletionPercent: safeAvg(allProgress.map(p => p.contentProgressPercent)),
        completedModules: allProgress.filter(p => p.completedAt !== null).length,
        activeLearners: activeUserIds.size,
    }
}

// ─── Per-Employee Row Builder ────────────────────────────────────────────────

export function buildEmployeeRow(
    emp: User,
    attempts: AssessmentAttempt[],
    progressRows: ModuleProgress[],
    subjectsAssigned: number,
): EmployeeAnalyticsRow {
    return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department ?? null,
        subjectsAssigned,
        averageAssessmentScore: safeAvg(attempts.map(a => a.score)),
        averageCompletionPercent: safeAvg(progressRows.map(p => p.contentProgressPercent)),
        completedModules: progressRows.filter(p => p.completedAt !== null).length,
        averageCompletionTimeHours: computeAvgCompletionTimeHours(progressRows),
        lastActivity: computeLastActivity(progressRows),
    }
}
