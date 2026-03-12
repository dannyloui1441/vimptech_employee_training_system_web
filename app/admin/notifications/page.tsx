import { NotificationCenter } from "@/components/admin/notification-center"
import { NotificationHistory } from "@/components/admin/notification-history"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-4xl mb-2">Notifications</h1>
        <p className="text-muted-foreground text-lg">Send and manage push notifications</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotificationCenter />
        </div>
        <div>
          <NotificationHistory />
        </div>
      </div>
    </div>
  )
}
