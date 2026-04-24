"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ClipboardList, BookOpen, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { AssessmentQuestionsManager } from "@/components/admin/assessment-questions-manager"
import type { TrainingSubject, TrainingModule } from "@/lib/models"

export default function AdminAssessmentPage() {
    const [subjects, setSubjects] = useState<TrainingSubject[]>([])
    const [loadingSubjects, setLoadingSubjects] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
    const [modules, setModules] = useState<TrainingModule[]>([])
    const [loadingModules, setLoadingModules] = useState(false)
    const [selectedModuleId, setSelectedModuleId] = useState<string>('')

    // Fetch all subjects on mount
    useEffect(() => {
        fetch('/api/training-subjects')
            .then(r => r.json())
            .then((data: TrainingSubject[]) => {
                setSubjects(data)
                if (data.length > 0) setSelectedSubjectId(data[0].id)
            })
            .catch(() => { })
            .finally(() => setLoadingSubjects(false))
    }, [])

    // Fetch modules whenever selected subject changes
    useEffect(() => {
        if (!selectedSubjectId) { setModules([]); setSelectedModuleId(''); return }
        setLoadingModules(true)
        setModules([])
        setSelectedModuleId('')
        fetch(`/api/training-modules?subjectId=${selectedSubjectId}`)
            .then(r => r.json())
            .then((data: any) => {
                console.log("Modules API response:", data);
                const modulesList = data.modules ?? [];
                const sorted = [...modulesList].sort((a: any, b: any) => a.module - b.module)
                setModules(sorted)
                if (sorted.length > 0) setSelectedModuleId(sorted[0].id)
            })
            .catch(() => { })
            .finally(() => setLoadingModules(false))
    }, [selectedSubjectId])

    const selectedModule = modules.find(m => m.id === selectedModuleId) ?? null
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? null

    if (loadingSubjects) {
        return (
            <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
        )
    }

    if (subjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">
                    No training subjects found. Create one in the Training section.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="font-bold text-3xl flex items-center gap-3">
                    <ClipboardList className="h-8 w-8 text-primary" />
                    Assessment
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage quiz questions for each training module.
                </p>
            </div>

            {/* Two-panel layout */}
            <div className="flex gap-4 items-start">

                {/* ── Left panel: collapsible subject list ──────────────────── */}
                <Card className={cn(
                    "sticky top-4",
                    "flex flex-col shrink-0 transition-all duration-200 overflow-hidden max-h-[calc(100vh-160px)]",
                    sidebarOpen ? "w-64" : "w-12"
                )}>
                    {/* Panel header with toggle button */}
                    <div className={cn(
                        "flex items-center border-b shrink-0 px-2 py-2 gap-2",
                        sidebarOpen ? "justify-between" : "justify-center"
                    )}>
                        {sidebarOpen && (
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                Subjects
                            </p>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => setSidebarOpen(v => !v)}
                            title={sidebarOpen ? "Collapse" : "Expand"}
                        >
                            {sidebarOpen
                                ? <ChevronLeft className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Subject list */}
                    <ScrollArea className="flex-1">
                        <div className={cn("space-y-1", sidebarOpen ? "p-2" : "p-1")}>
                            {subjects.map(subject => (
                                <button
                                    key={subject.id}
                                    onClick={() => setSelectedSubjectId(subject.id)}
                                    title={!sidebarOpen ? subject.name : undefined}
                                    className={cn(
                                        "w-full rounded-md transition-colors",
                                        sidebarOpen
                                            ? "text-left flex items-start gap-2.5 px-3 py-2.5 text-sm"
                                            : "flex items-center justify-center p-2",
                                        selectedSubjectId === subject.id
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    <BookOpen className={cn(
                                        "h-4 w-4 shrink-0",
                                        !sidebarOpen && "h-5 w-5",
                                        selectedSubjectId === subject.id ? "text-primary-foreground" : "text-muted-foreground"
                                    )} />
                                    {sidebarOpen && (
                                        <p className="font-medium leading-snug line-clamp-2 min-w-0">
                                            {subject.name}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* ── Right panel: module selector + question manager ────────── */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* Breadcrumb hint when sidebar collapsed */}
                    {!sidebarOpen && selectedSubject && (
                        <p className="text-sm font-medium text-muted-foreground truncate">
                            {selectedSubject.name}
                        </p>
                    )}

                    {loadingModules ? (
                        <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading modules…
                        </div>
                    ) : modules.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                <BookOpen className="h-8 w-8 opacity-20" />
                                <p className="text-sm">No modules in this subject yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Module selector */}
                            <div className="flex items-center gap-3 shrink-0">
                                <Label className="text-sm text-muted-foreground whitespace-nowrap shrink-0">Module</Label>
                                <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select module…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modules.map(m => (
                                            <SelectItem key={m.id} value={m.id}>Module {m.module}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Question manager — no ScrollArea wrapper; page scrolls naturally */}
                            {selectedModule && (
                                <AssessmentQuestionsManager
                                    moduleId={selectedModule.id}
                                    moduleName={`Module ${selectedModule.module}`}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
