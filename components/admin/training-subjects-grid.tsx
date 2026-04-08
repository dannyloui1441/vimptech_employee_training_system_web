"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { BookOpen, Edit, Trash2, Pencil, AlertCircle, Users, ClipboardList } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { TrainerPicker } from "@/components/admin/trainer-picker"
import { AssessmentQuestionsManager } from "@/components/admin/assessment-questions-manager"
import type { TrainingSubject, TrainingModule } from "@/lib/models"

interface TrainingSubjectsGridProps {
    subjects?: TrainingSubject[]
    moduleCountMap?: Record<string, number>
    /** When true, hides destructive actions (delete/edit subject). */
    isTrainer?: boolean
}

interface Trainer { id: string; name: string }

// ── Edit Subject Dialog ───────────────────────────────────────────────────────
interface EditDialogProps {
    subject: TrainingSubject
    open: boolean
    onClose: () => void
    onSaved: (updated: TrainingSubject) => void
}

function EditSubjectDialog({ subject, open, onClose, onSaved }: EditDialogProps) {
    const { toast } = useToast()
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [trainersLoaded, setTrainersLoaded] = useState(false)

    const [form, setForm] = useState({
        name: subject.name,
        description: subject.description,
        duration: subject.duration ?? "",
        assignedTrainerIds: subject.assignedTrainerIds,
    })
    const [saving, setSaving] = useState(false)

    // Fetch trainers lazily when dialog opens
    const handleOpenChange = async (isOpen: boolean) => {
        if (!isOpen) { onClose(); return }
        if (!trainersLoaded) {
            try {
                const res = await fetch("/api/users")
                if (res.ok) {
                    const users = await res.json()
                    setTrainers(
                        users
                            .filter((u: any) => u.role === "Trainer")
                            .map((u: any) => ({ id: u.id, name: u.name }))
                    )
                    setTrainersLoaded(true)
                }
            } catch { /* silent — picker just won't show */ }
        }
    }

    const canSave =
        form.name.trim().length >= 3 &&
        form.description.trim().length >= 10

    const handleSave = async () => {
        if (!canSave) return
        setSaving(true)
        try {
            const res = await fetch(`/api/training-subjects/${subject.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    description: form.description.trim(),
                    duration: form.duration.trim() || undefined,
                    assignedTrainerIds: form.assignedTrainerIds,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error ?? "Failed to save")
            }
            const updated: TrainingSubject = await res.json()
            onSaved(updated)
            toast({ title: "Subject updated", description: `"${updated.name}" has been saved.` })
            onClose()
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Subject</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label>Subject Name</Label>
                        <Input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Corporate Compliance 2025"
                        />
                        {form.name.trim().length > 0 && form.name.trim().length < 3 && (
                            <p className="flex items-center gap-1 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" /> At least 3 characters required
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3}
                            placeholder="Describe what employees will learn…"
                        />
                        {form.description.trim().length > 0 && form.description.trim().length < 10 && (
                            <p className="flex items-center gap-1 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" /> At least 10 characters required
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-1.5">
                        <Label>Duration <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                        <Input
                            value={form.duration}
                            onChange={e => setForm({ ...form, duration: e.target.value })}
                            placeholder="e.g. 4 weeks, 30 days"
                        />
                    </div>

                    {/* Assigned Trainers */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Assigned Trainers
                        </Label>
                        <TrainerPicker
                            trainers={trainers}
                            value={form.assignedTrainerIds}
                            onChange={ids => setForm({ ...form, assignedTrainerIds: ids })}
                        />
                        {!trainersLoaded && (
                            <p className="text-xs text-muted-foreground">Loading trainers…</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!canSave || saving}>
                        {saving ? "Saving…" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ── Assessment Quick-Access Dialog ────────────────────────────────────────────
interface AssessmentDialogProps {
    subject: TrainingSubject
    open: boolean
    onClose: () => void
}

function AssessmentDialog({ subject, open, onClose }: AssessmentDialogProps) {
    const [modules, setModules] = useState<TrainingModule[]>([])
    const [selectedModuleId, setSelectedModuleId] = useState('')
    const [loadingModules, setLoadingModules] = useState(false)

    useEffect(() => {
        if (!open) return
        setLoadingModules(true)
        fetch(`/api/training-modules?subjectId=${subject.id}`)
            .then(r => r.json())
            .then((data: TrainingModule[]) => {
                const sorted = [...data].sort((a, b) => a.module - b.module)
                setModules(sorted)
                if (sorted.length > 0) setSelectedModuleId(sorted[0].id)
            })
            .catch(() => { /* silent */ })
            .finally(() => setLoadingModules(false))
    }, [open, subject.id])

    const selectedModule = modules.find(m => m.id === selectedModuleId) ?? null

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-amber-600" />
                        Assessment — {subject.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Module selector */}
                {!loadingModules && modules.length > 1 && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap shrink-0">Module</Label>
                        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                            <SelectTrigger className="w-[180px] text-sm">
                                <SelectValue placeholder="Select module…" />
                            </SelectTrigger>
                            <SelectContent>
                                {modules.map(m => (
                                    <SelectItem key={m.id} value={m.id}>Module {m.module}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto pr-1">
                    {loadingModules ? (
                        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                            Loading modules…
                        </div>
                    ) : modules.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                            No modules found. Add modules to this subject first.
                        </div>
                    ) : selectedModule ? (
                        <AssessmentQuestionsManager
                            moduleId={selectedModule.id}
                            moduleName={`Module ${selectedModule.module}`}
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ── Main grid ─────────────────────────────────────────────────────────────────
export function TrainingSubjectsGrid({ subjects, moduleCountMap, isTrainer }: TrainingSubjectsGridProps) {
    const displaySubjects = subjects || []
    const { toast } = useToast()
    const router = useRouter()

    // Local state allows instant card updates after edit without full page reload
    const [localSubjects, setLocalSubjects] = useState<TrainingSubject[]>(displaySubjects)
    const [editingSubject, setEditingSubject] = useState<TrainingSubject | null>(null)
    const [assessmentSubject, setAssessmentSubject] = useState<TrainingSubject | null>(null)

    const handleDelete = async (id: string, name: string) => {
        try {
            await fetch(`/api/training-subjects/${id}`, { method: "DELETE" })
            toast({ title: "Subject deleted", description: `${name} has been removed.` })
            setLocalSubjects(prev => prev.filter(s => s.id !== id))
            router.refresh()
        } catch {
            toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" })
        }
    }

    const handleSaved = (updated: TrainingSubject) => {
        setLocalSubjects(prev => prev.map(s => (s.id === updated.id ? updated : s)))
        router.refresh()
    }

    if (localSubjects.length === 0) {
        return (
            <Card className="border-dashed border-2 shadow-none py-12 flex flex-col items-center justify-center text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-1">
                    {isTrainer ? "No subjects assigned" : "No training subjects yet"}
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                    {isTrainer
                        ? "Ask an Admin to assign you to a training subject."
                        : "Get started by creating your first training subject for employees."}
                </p>
                {!isTrainer && (
                    <Button asChild>
                        <Link href="/admin/training/new">Create Subject</Link>
                    </Button>
                )}
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {localSubjects.map(subject => (
                    <Card key={subject.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-lg leading-tight line-clamp-1">{subject.name}</h3>
                                {/* Edit button — Admin only */}
                                {!isTrainer && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingSubject(subject)}
                                        title="Edit subject"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                            {subject.duration && (
                                <p className="text-xs text-muted-foreground mt-1">⏱ {subject.duration}</p>
                            )}
                        </CardHeader>

                        <CardContent className="flex-1">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="font-medium text-foreground">
                                        {moduleCountMap?.[subject.id] ?? 0} Modules
                                    </span>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex gap-2 pt-0">
                            <Button asChild variant="outline" className="flex-1">
                                <Link href={`/admin/training/${subject.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {isTrainer ? "Manage Modules" : "Manage"}
                                </Link>
                            </Button>

                            {/* Assessment quick-access button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20"
                                title="Manage assessment questions"
                                onClick={e => { e.preventDefault(); setAssessmentSubject(subject) }}
                            >
                                <ClipboardList className="h-4 w-4" />
                            </Button>

                            {/* Delete — Admin only */}
                            {!isTrainer && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete &quot;{subject.name}&quot;? This action cannot be undone.
                                        </AlertDialogDescription>
                                        <div className="flex justify-end gap-2">
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(subject.id, subject.name)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </div>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Edit dialog — rendered once, outside the map */}
            {editingSubject && (
                <EditSubjectDialog
                    subject={editingSubject}
                    open={!!editingSubject}
                    onClose={() => setEditingSubject(null)}
                    onSaved={handleSaved}
                />
            )}

            {/* Assessment dialog — rendered once, outside the map */}
            {assessmentSubject && (
                <AssessmentDialog
                    subject={assessmentSubject}
                    open={!!assessmentSubject}
                    onClose={() => setAssessmentSubject(null)}
                />
            )}
        </>
    )
}
