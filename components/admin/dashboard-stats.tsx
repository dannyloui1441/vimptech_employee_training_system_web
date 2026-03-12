import { Card, CardContent } from "@/components/ui/card"
import { Users, BookOpen, CheckCircle, Clock } from "lucide-react"

export interface DashboardMetrics {
  totalEmployees: number;
  activePrograms: number;
  completedModules: number;
  completionRate: number;
}

export function DashboardStats({ metrics }: { metrics?: DashboardMetrics }) {
  const stats = [
    {
      icon: Users,
      label: "Total Employees",
      value: metrics?.totalEmployees?.toString() || "0",
      change: "+12 this month",
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      icon: BookOpen,
      label: "Active Programs",
      value: metrics?.activePrograms?.toString() || "0",
      change: "2 in progress",
      color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400",
    },
    {
      icon: CheckCircle,
      label: "Completed Modules",
      value: metrics?.completedModules?.toString() || "0",
      change: "+45 this week",
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    {
      icon: Clock,
      label: "Avg. Completion Rate",
      value: `${metrics?.completionRate || 0}%`,
      change: "+5% from last month",
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <Card key={stat.label} className="overflow-hidden shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className="font-bold text-2xl tracking-tight">{stat.value}</h3>
                </div>
                <div className={`p-2.5 rounded-full ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span className="text-emerald-600 font-medium mr-1">{stat.change.split(' ')[0]}</span>
                <span>{stat.change.substring(stat.change.indexOf(' '))}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
