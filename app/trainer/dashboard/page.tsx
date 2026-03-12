import { TrainerDashboard } from "@/components/trainer/trainer-dashboard"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function TrainerDashboardPage() {
    // Best-effort: use the simulated user's name if available, fallback to generic label
    const user = await getCurrentUser()
    const trainerName = user?.role === "Trainer" ? user.name : "Trainer"

    return <TrainerDashboard trainerName={trainerName} />
}
