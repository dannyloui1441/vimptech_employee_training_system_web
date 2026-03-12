import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    user: "John Doe",
    action: "Completed Module 2: Safety Training",
    time: "5 minutes ago",
    status: "completed",
    initials: "JD",
  },
  {
    user: "Sarah Smith",
    action: "Started Module 1: Company Introduction",
    time: "15 minutes ago",
    status: "in-progress",
    initials: "SS",
  },
  {
    user: "Mike Johnson",
    action: "Submitted assessment for Module 3",
    time: "1 hour ago",
    status: "pending",
    initials: "MJ",
  },
  {
    user: "Emily Brown",
    action: "Completed Module 4: Customer Service",
    time: "2 hours ago",
    status: "completed",
    initials: "EB",
  },
  {
    user: "David Lee",
    action: "Enrolled in new training program",
    time: "3 hours ago",
    status: "enrolled",
    initials: "DL",
  },
]

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100",
  enrolled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100",
}

export function RecentActivity() {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across the organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((activity, index) => {
            const badgeClass = statusColors[activity.status] || "bg-secondary text-secondary-foreground"
            return (
              <div key={index} className="flex items-start gap-4 p-3 hover:bg-secondary/40 rounded-lg transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="font-medium bg-primary/10 text-primary text-xs">
                    {activity.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <p className="font-medium text-sm text-foreground">{activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 font-normal ${badgeClass}`}>
                    {activity.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
