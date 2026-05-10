import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentActivity } from "@/components/admin/recent-activity"
import { ProgressChart } from "@/components/admin/progress-chart"
import { TrainingOverview } from "@/components/admin/training-overview"
import { TrainerDashboard } from "@/components/trainer/trainer-dashboard"
import { AddUserDialogWrapper } from "@/components/admin/add-user-dialog-wrapper"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  // ── Trainer view ────────────────────────────────────────────────────────────
  if (user?.role === 'Trainer') {
    return <TrainerDashboard trainerName={user.name} />
  }

  // ── Admin view (unchanged) ───────────────────────────────────────────────────
  const users = await db.users.findAll()
  const programs = await db.training.findAll()

  const totalEmployees = users.length
  const activePrograms = programs.length

  const usersWithProgress = users.filter(u => u.progress !== undefined)
  const completedCount = usersWithProgress.filter(u => u.progress === 100).length
  const completedModules = completedCount * 4

  const completionRate = usersWithProgress.length > 0
    ? Math.round((completedCount / usersWithProgress.length) * 100)
    : 0

  const metrics = { totalEmployees, activePrograms, completedModules, completionRate }

  const progressData = [
    { name: 'Mon', completed: 12, started: 5 },
    { name: 'Tue', completed: 19, started: 8 },
    { name: 'Wed', completed: 15, started: 10 },
    { name: 'Thu', completed: 25, started: 12 },
    { name: 'Fri', completed: 32, started: 15 },
    { name: 'Sat', completed: 10, started: 5 },
    { name: 'Sun', completed: 5, started: 2 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of training performance and metrics.</p>
        </div>
        <AddUserDialogWrapper />
      </div>

      <DashboardStats metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressChart data={progressData} />
        <TrainingOverview />
      </div>

      <RecentActivity />
    </div>
  )
}
