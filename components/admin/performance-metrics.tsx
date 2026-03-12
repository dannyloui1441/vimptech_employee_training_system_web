import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Award, Target } from "lucide-react"

const metrics = [
  {
    icon: Award,
    label: "Completion Rate",
    value: "87%",
    trend: "+5%",
    isPositive: true,
  },
  {
    icon: Target,
    label: "Assessment Avg.",
    value: "8.4/10",
    trend: "+0.3",
    isPositive: true,
  },
  {
    icon: TrendingUp,
    label: "Engagement Rate",
    value: "92%",
    trend: "+8%",
    isPositive: true,
  },
  {
    icon: TrendingDown,
    label: "Dropout Rate",
    value: "3.2%",
    trend: "-1.5%",
    isPositive: true,
  },
]

export function PerformanceMetrics() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-none border-2 border-border bg-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`text-sm font-bold ${metric.isPositive ? "text-chart-4" : "text-destructive"}`}>
                  {metric.trend}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <h3 className="font-bold text-3xl">{metric.value}</h3>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
