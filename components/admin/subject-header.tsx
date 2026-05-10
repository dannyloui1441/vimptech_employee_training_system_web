"use client"

import { useState } from "react"
import type { TrainingSubject } from "@/lib/models"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TrainerPicker } from "@/components/admin/trainer-picker"
import { Edit2, Check, X, AlertCircle, Users, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Trainer { id: string; name: string }

interface SubjectHeaderProps {
    subject: TrainingSubject
    onUpdate: (updates: Partial<TrainingSubject>) => void
    /** When true, the edit button is hidden. Used for Trainer role. */
    readOnly?: boolean
    /** All available trainers — shown in picker during edit (Admin only). */
    trainers?: Trainer[]
}

export function SubjectHeader({ subject, onUpdate, readOnly, trainers = [] }: SubjectHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({
        name: subject.name,
        description: subject.description,
        duration: subject.duration ?? '',
        assignedTrainerIds: subject.assignedTrainerIds,
        mode: (subject.mode ?? 'sequential') as 'sequential' | 'scheduled',
    })

    // ── Derived ──────────────────────────────────────────────────────────────
    const canSave =
        editData.name.trim().length >= 3 &&
        editData.description.trim().length >= 10

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSave = () => {
        if (!canSave) return
        onUpdate(editData)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditData({
            name: subject.name,
            description: subject.description,
            duration: subject.duration ?? '',
            assignedTrainerIds: subject.assignedTrainerIds,
            mode: (subject.mode ?? 'sequential') as 'sequential' | 'scheduled',
        })
        setIsEditing(false)
    }

    // ── Edit mode (Admin only) ─────────────────────────────────────────────
    if (isEditing) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <h3 className="font-bold text-lg">Edit Subject</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Subject Name</Label>
                        <Input
                            value={editData.name}
                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            value={editData.description}
                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {/* Validation hint */}
                    {editData.description.trim().length > 0 && editData.description.trim().length < 10 && (
                        <p className="flex items-center gap-1.5 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />Description must be at least 10 characters
                        </p>
                    )}

                    <div className="space-y-1.5">
                        <Label>Duration <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                        <Input
                            placeholder="e.g. 4 weeks, 30 days"
                            value={editData.duration}
                            onChange={e => setEditData({ ...editData, duration: e.target.value })}
                        />
                    </div>

                    {/* Trainer assignment (Admin-only — readOnly never reaches edit mode) */}
                    {trainers.length > 0 && (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Assigned Trainers
                            </Label>
                            <TrainerPicker
                                trainers={trainers}
                                value={editData.assignedTrainerIds}
                                onChange={ids => setEditData({ ...editData, assignedTrainerIds: ids })}
                            />
                        </div>
                    )}

                    {/* Release mode (Admin-only — readOnly never reaches edit mode) */}
                    <div className="space-y-2">
                        <Label>Release Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { value: 'sequential', label: 'Sequential', description: 'Modules unlock one after another', icon: <ArrowRight className="h-4 w-4" /> },
                                { value: 'scheduled', label: 'Scheduled', description: 'Each module unlocks after a set gap', icon: <Clock className="h-4 w-4" /> },
                            ] as const).map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setEditData({ ...editData, mode: opt.value })}
                                    className={cn(
                                        "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                                        editData.mode === opt.value
                                            ? "border-primary bg-primary/5"
                                            : "border-input hover:border-muted-foreground/50"
                                    )}
                                >
                                    <span className={cn("mt-0.5 shrink-0", editData.mode === opt.value ? "text-primary" : "text-muted-foreground")}>
                                        {opt.icon}
                                    </span>
                                    <div>
                                        <p className={cn("font-medium text-sm", editData.mode === opt.value ? "text-primary" : "")}>{opt.label}</p>
                                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button onClick={handleSave} size="sm" disabled={!canSave}>
                            <Check className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline" size="sm">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ── Read-only view ────────────────────────────────────────────────────────
    const assignedTrainerNames = trainers
        .filter(t => subject.assignedTrainerIds.includes(t.id))
        .map(t => t.name)

    return (
        <Card className="border-2">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                        <div>
                            <h2 className="font-bold text-2xl mb-1">{subject.name}</h2>
                            <p className="text-muted-foreground text-sm">{subject.description}</p>
                        </div>

                        {/* Mode badge */}
                        <div className="flex flex-wrap gap-3 text-sm">
                            <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                (subject.mode ?? 'sequential') === 'scheduled'
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                                {(subject.mode ?? 'sequential') === 'scheduled' ? <Clock className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                                {(subject.mode ?? 'sequential') === 'scheduled' ? 'Scheduled' : 'Sequential'}
                            </span>
                        </div>

                        {/* Assigned trainers */}
                        {assignedTrainerNames.length > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Users className="h-4 w-4 shrink-0" />
                                <span>Trainer{assignedTrainerNames.length > 1 ? 's' : ''}: </span>
                                <span className="font-medium text-foreground">{assignedTrainerNames.join(", ")}</span>
                            </div>
                        )}
                    </div>

                    {/* Edit button — hidden for Trainers */}
                    {!readOnly && (
                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
