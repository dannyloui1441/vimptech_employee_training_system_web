import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { PerformanceMetrics } from "@/components/admin/performance-metrics"
import { EmployeePerformance } from "@/components/admin/employee-performance"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-4xl mb-2">Analytics</h1>
        <p className="text-muted-foreground text-lg">Detailed performance insights and metrics</p>
      </div>

      <PerformanceMetrics />
      <AnalyticsCharts />
      <EmployeePerformance />
    </div>
  )
}
