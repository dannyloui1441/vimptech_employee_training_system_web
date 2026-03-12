import { ScheduleCalendar } from "@/components/admin/schedule-calendar"
import { AssignmentsList } from "@/components/admin/assignments-list"

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-4xl mb-2">Schedules</h1>
        <p className="text-muted-foreground text-lg">Configure training schedules and assignments</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScheduleCalendar />
        </div>
        <div>
          <AssignmentsList />
        </div>
      </div>
    </div>
  )
}
