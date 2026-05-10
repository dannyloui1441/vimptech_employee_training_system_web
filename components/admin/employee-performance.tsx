import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const employees = [
  {
    name: "John Doe",
    program: "Onboarding",
    progress: 85,
    score: 9.2,
    status: "On Track",
    initials: "JD",
  },
  {
    name: "Sarah Smith",
    program: "Safety Training",
    progress: 72,
    score: 8.8,
    status: "On Track",
    initials: "SS",
  },
  {
    name: "Mike Johnson",
    program: "Customer Service",
    progress: 45,
    score: 7.5,
    status: "Behind",
    initials: "MJ",
  },
  {
    name: "Emily Brown",
    program: "Leadership",
    progress: 90,
    score: 9.5,
    status: "Ahead",
    initials: "EB",
  },
]

export function EmployeePerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Avg. Score</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.name}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border-2 border-border">
                    <AvatarFallback className="font-bold text-xs bg-primary text-primary-foreground">
                      {employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold">{employee.name}</span>
                </div>
              </TableCell>
              <TableCell>{employee.program}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={employee.progress} className="h-2 w-24" />
                  <span className="text-sm font-bold">{employee.progress}%</span>
                </div>
              </TableCell>
              <TableCell className="font-bold">{employee.score}/10</TableCell>
              <TableCell>
                <Badge
                  variant={
                    employee.status === "On Track" ? "default" : employee.status === "Ahead" ? "secondary" : "outline"
                  }
                  className={employee.status === "Ahead" ? "bg-chart-4 text-background" : ""}
                >
                  {employee.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
