"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

interface ProgressChartProps {
  data?: Array<{ name: string; completed: number; started: number }>;
}

export function ProgressChart({ data }: ProgressChartProps) {
  const chartData = data || [
    { name: "Mon", completed: 0, started: 0 },
    { name: "Tue", completed: 0, started: 0 },
    { name: "Wed", completed: 0, started: 0 },
    { name: "Thu", completed: 0, started: 0 },
    { name: "Fri", completed: 0, started: 0 },
    { name: "Sat", completed: 0, started: 0 },
    { name: "Sun", completed: 0, started: 0 },
  ]

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>Weekly Training Activity</CardTitle>
        <CardDescription>Modules started vs completed over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar
                dataKey="started"
                name="Started"
                fill="hsl(var(--primary)/0.3)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
