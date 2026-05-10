import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TrainingOverviewProps {
  programs?: Array<{
    id: string;
    title: string;
    status: string;
    // Mocking enrolled/progress for now until we have real relation data
    enrolled?: number;
    progress?: number;
  }>;
}

export function TrainingOverview({ programs }: TrainingOverviewProps) {
  // If no programs passed, show empty state or fallback
  const displayPrograms = programs || [];

  return (
    <Card className="shadow-sm border-border flex flex-col">
      <CardHeader>
        <CardTitle>Training Programs Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-6">
            {displayPrograms.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No active programs found.
              </div>
            )}
            {displayPrograms.map((program) => {
              // Mock random values for demo if not provided
              const enrolled = program.enrolled || Math.floor(Math.random() * 50) + 10;
              const progress = program.progress || Math.floor(Math.random() * 80) + 10;

              return (
                <div key={program.id} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer">{program.title}</p>
                      <p className="text-xs text-muted-foreground">{enrolled} enrolled • {program.status}</p>
                    </div>
                    <span className="font-medium text-sm bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
