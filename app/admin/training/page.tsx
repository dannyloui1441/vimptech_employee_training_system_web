import { TrainingSubjectsGrid } from "@/components/admin/training-subjects-grid"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TrainingPage() {
  const currentUser = await getCurrentUser()
  const isTrainer = currentUser?.role === "Trainer"

  const allSubjects = await db.subjects.findAll()
  const modules = await db.modules.findAll()

  // Trainers only see subjects they are assigned to
  const subjects = isTrainer
    ? allSubjects.filter(p => p.assignedTrainerIds.includes(currentUser!.id))
    : allSubjects

  // Build module count map for display
  const moduleCountMap: Record<string, number> = {}
  for (const module of modules) {
    moduleCountMap[module.subjectId] = (moduleCountMap[module.subjectId] || 0) + 1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            {isTrainer ? "My Subjects" : "Training Subjects"}
          </h1>
          <p className="text-muted-foreground">
            {isTrainer
              ? "Manage modules for your assigned subjects"
              : "Create and manage training subjects"}
          </p>
        </div>

        {/* Only Admins can create new subjects */}
        {!isTrainer && (
          <Button asChild size="lg">
            <Link href="/admin/training/new">
              <Plus className="mr-2 h-5 w-5" />
              New Subject
            </Link>
          </Button>
        )}
      </div>

      <TrainingSubjectsGrid
        subjects={subjects}
        moduleCountMap={moduleCountMap}
        isTrainer={isTrainer}
      />
    </div>
  )
}