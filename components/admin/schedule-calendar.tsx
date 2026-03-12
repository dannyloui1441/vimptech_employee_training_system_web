"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function ScheduleCalendar() {
  const [currentMonth] = useState("January 2025")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Training Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold text-sm min-w-[120px] text-center">{currentMonth}</span>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center font-bold text-sm p-2 bg-muted border-2 border-border">
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => i + 1).map((day) => (
            <div
              key={day}
              className="aspect-square p-2 border-2 border-border hover:bg-muted cursor-pointer transition-colors"
            >
              <span className="font-bold text-sm">{day > 31 ? "" : day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
