"use client"

import { AssessmentQuestionsManager } from "@/components/admin/assessment-questions-manager"

interface AssessmentTabProps {
    moduleId: string
    moduleName?: string
}

export function AssessmentTab({ moduleId, moduleName = 'Module' }: AssessmentTabProps) {
    return <AssessmentQuestionsManager moduleId={moduleId} moduleName={moduleName} />
}
