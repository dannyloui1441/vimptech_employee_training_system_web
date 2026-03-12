import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const history = [
  {
    title: "Module Reminder",
    sent: "2 hours ago",
    recipients: 45,
    status: "Delivered",
  },
  {
    title: "Assessment Due",
    sent: "5 hours ago",
    recipients: 32,
    status: "Delivered",
  },
  {
    title: "New Module Available",
    sent: "1 day ago",
    recipients: 124,
    status: "Delivered",
  },
  {
    title: "Completion Reminder",
    sent: "2 days ago",
    recipients: 18,
    status: "Delivered",
  },
]

export function NotificationHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((item, index) => (
            <div key={index} className="p-3 border-2 border-border bg-background space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm">{item.title}</p>
                <Badge className="bg-chart-4 text-background text-xs">{item.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.recipients} recipients</p>
              <p className="text-xs text-muted-foreground">{item.sent}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
