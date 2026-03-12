"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { TrainingModule } from "@/lib/models"
import { Plus, AlertCircle } from "lucide-react"

interface AddModuleDialogProps {
  subjectId: string
  subjectMode?: "sequential" | "scheduled"
  existingDays: number[]
  onAdd: (module: TrainingModule) => void
}

export function AddModuleDialog({
  subjectId,
  subjectMode = "sequential",
  existingDays,
  onAdd,
}: AddModuleDialogProps) {
  const [open, setOpen] = useState(false)
  const nextDay = existingDays.length > 0 ? Math.max(...existingDays) + 1 : 1

  const [formData, setFormData] = useState({
    day: nextDay,
    gapValue: 0,
    gapUnit: "days" as "days" | "weeks",
  })

  // Re-sync auto-day when dialog opens
  useEffect(() => {
    if (open) {
      const next = existingDays.length > 0 ? Math.max(...existingDays) + 1 : 1
      setFormData(prev => ({ ...prev, day: next }))
    }
  }, [open, existingDays])

  const dayConflict = existingDays.includes(formData.day)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dayConflict) return

    const newModule: TrainingModule = {
      id: `mod-${Date.now()}`,
      subjectId,
      day: formData.day,
      gapValue: subjectMode === "scheduled" ? formData.gapValue : 0,
      gapUnit: subjectMode === "scheduled" ? formData.gapUnit : "days",
    }

    onAdd(newModule)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Module
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Module</DialogTitle>
          <DialogDescription>
            Each module represents one training day. Add materials inside the module after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="day">Day Number</Label>
            <Input
              id="day"
              type="number"
              min="1"
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: Number.parseInt(e.target.value) || 1 })}
              className={dayConflict ? "border-destructive" : ""}
            />
            {dayConflict && (
              <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                <AlertCircle className="h-3 w-3" />
                Day {formData.day} already exists for this subject.
              </p>
            )}
          </div>

          {/* Gap fields — only visible for scheduled subjects */}
          {subjectMode === "scheduled" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 space-y-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-400">Scheduled Gap</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gapValue" className="text-xs">Gap Value</Label>
                  <Input
                    id="gapValue"
                    type="number"
                    min="0"
                    value={formData.gapValue}
                    onChange={(e) =>
                      setFormData({ ...formData, gapValue: Math.max(0, Number.parseInt(e.target.value) || 0) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gapUnit" className="text-xs">Unit</Label>
                  <Select
                    value={formData.gapUnit}
                    onValueChange={(value: "days" | "weeks") => setFormData({ ...formData, gapUnit: value })}
                  >
                    <SelectTrigger id="gapUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={dayConflict}>
              Add Module
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
