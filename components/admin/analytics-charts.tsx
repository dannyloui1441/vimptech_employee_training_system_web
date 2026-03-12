"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", completed: 65, enrolled: 80, active: 75 },
  { month: "Feb", completed: 75, enrolled: 95, active: 85 },
  { month: "Mar", completed: 85, enrolled: 110, active: 98 },
  { month: "Apr", completed: 95, enrolled: 120, active: 110 },
  { month: "May", completed: 105, enrolled: 135, active: 125 },
  { month: "Jun", completed: 115, enrolled: 145, active: 135 },
]

export function AnalyticsCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            completed: {
              label: "Completed",
              color: "hsl(var(--chart-1))",
            },
            enrolled: {
              label: "Enrolled",
              color: "hsl(var(--chart-3))",
            },
            active: {
              label: "Active",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-[350px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--color-completed)"
                strokeWidth={3}
                dot={{ strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="enrolled"
                stroke="var(--color-enrolled)"
                strokeWidth={3}
                dot={{ strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="active"
                stroke="var(--color-active)"
                strokeWidth={3}
                dot={{ strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
