/**
 * Notification Helpers
 *
 * Centralized utilities for dispatching in-app notifications.
 * Used by assignment routes, assessment submit, progress, and subjects routes.
 *
 * All notifications are in-app only — no push/FCM/SMS.
 */

import { db } from '@/lib/db';
import type { AppNotification } from '@/lib/models';

// ── Automatic Notification Dispatchers ────────────────────────────────────────

/** Dispatch "Training Assigned" notification */
export async function notifyTrainingAssigned(
    employeeId: string,
    subjectId: string,
    subjectName: string,
): Promise<void> {
    try {
        await db.notifications.create({
            recipientId: employeeId,
            title: 'New Training Assigned',
            message: `You have been assigned to "${subjectName}". Start your training journey now!`,
            type: 'system_automatic',
            eventType: 'subject_assigned',
            metadata: { subjectId, subjectName },
        });
    } catch (err) {
        console.error('[notifyTrainingAssigned] Error:', err);
    }
}

/** Dispatch "Assessment Passed" notification */
export async function notifyAssessmentPassed(
    employeeId: string,
    moduleId: string,
    moduleNumber: number,
    subjectId: string,
    score: number,
): Promise<void> {
    try {
        await db.notifications.create({
            recipientId: employeeId,
            title: 'Assessment Passed!',
            message: `Congratulations! You passed the Module ${moduleNumber} assessment with a score of ${score}%.`,
            type: 'system_automatic',
            eventType: 'assessment_passed',
            metadata: { subjectId, moduleId, moduleNumber: String(moduleNumber), score: String(score) },
        });
    } catch (err) {
        console.error('[notifyAssessmentPassed] Error:', err);
    }
}

/** Dispatch "Subject Completed" notification */
export async function notifySubjectCompleted(
    employeeId: string,
    subjectId: string,
    subjectName: string,
): Promise<void> {
    try {
        // Deduplicate — only send once per subject completion
        const exists = await db.notifications.exists(
            employeeId,
            'subject_completed',
            { subjectId },
        );
        if (exists) return;

        await db.notifications.create({
            recipientId: employeeId,
            title: 'Training Completed!',
            message: `You have completed all modules in "${subjectName}". Well done!`,
            type: 'system_automatic',
            eventType: 'subject_completed',
            metadata: { subjectId, subjectName },
        });
    } catch (err) {
        console.error('[notifySubjectCompleted] Error:', err);
    }
}

/** Dispatch "Scheduled Module Unlocked" notification (lazy strategy — deduped) */
export async function notifyModuleUnlocked(
    employeeId: string,
    moduleId: string,
    moduleNumber: number,
    subjectId: string,
    subjectName: string,
): Promise<void> {
    try {
        // Deduplicate — check if this exact unlock notification already exists
        const exists = await db.notifications.exists(
            employeeId,
            'module_unlocked',
            { moduleId },
        );
        if (exists) return;

        await db.notifications.create({
            recipientId: employeeId,
            title: 'Module Unlocked!',
            message: `Module ${moduleNumber} in "${subjectName}" is now available. Continue your training!`,
            type: 'system_automatic',
            eventType: 'module_unlocked',
            metadata: { subjectId, moduleId, moduleNumber: String(moduleNumber), subjectName },
        });
    } catch (err) {
        console.error('[notifyModuleUnlocked] Error:', err);
    }
}

/**
 * Check if all modules in a subject are completed for an employee.
 * If so, dispatch the subject_completed notification.
 */
export async function checkAndNotifySubjectCompletion(
    employeeId: string,
    subjectId: string,
): Promise<void> {
    try {
        const subject = await db.subjects.findById(subjectId);
        if (!subject) return;

        const modules = await db.modules.findBySubjectId(subjectId);
        if (modules.length === 0) return;

        const allProgress = await db.moduleProgress.findByUser(employeeId);
        const progressMap = new Map(allProgress.map(p => [p.moduleId, p]));

        // Check if every module in this subject is completed (overall_progress >= 100)
        const allCompleted = modules.every(mod => {
            const progress = progressMap.get(mod.id);
            if (!progress) return false;
            const contentPercent = progress.contentProgressPercent ?? 0;
            const assessmentPassed = progress.assessmentPassed ?? false;
            const overall = Math.round(contentPercent * 0.5 + (assessmentPassed ? 50 : 0));
            return overall >= 100;
        });

        if (allCompleted) {
            await notifySubjectCompleted(employeeId, subjectId, subject.name);
        }
    } catch (err) {
        console.error('[checkAndNotifySubjectCompletion] Error:', err);
    }
}
