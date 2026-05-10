import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

const assignments = [
  {
    employee: "John Doe",
    program: "Onboarding",
    startDate: "Jan 15, 2025",
    status: "Upcoming",
  },
  {
    employee: "Sarah Smith",
    program: "Safety Training",
    startDate: "Jan 10, 2025",
    status: "Active",
  },
  {
    employee: "Mike Johnson",
    program: "Customer Service",
    startDate: "Jan 8, 2025",
    status: "Active",
  },
]

export function AssignmentsList() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <div key={index} className="p-3 border-2 border-border bg-background space-y-2">
              <p className="font-bold text-sm">{assignment.employee}</p>
              <p className="text-xs text-muted-foreground">{assignment.program}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{assignment.startDate}</span>
                <Badge variant={assignment.status === "Active" ? "default" : "secondary"} className="text-xs">
                  {assignment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
