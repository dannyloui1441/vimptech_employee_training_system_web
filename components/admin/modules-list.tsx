"use client"

import { useState, useEffect, useCallback } from "react"
import type { TrainingModule, TrainingMaterial } from "@/lib/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { AddMaterialDialog } from "@/components/admin/add-material-dialog"
import { Edit2, Trash2, Play, FileText, Radio, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModulesListProps {
  modules: TrainingModule[]
  subjectMode?: "sequential" | "scheduled"
  onDelete: (moduleId: string) => void
  onEdit: (moduleId: string, updates: Partial<TrainingModule>) => void
  onAddMaterial: (material: TrainingMaterial) => void
  onEditMaterial: (materialId: string, updates: Partial<TrainingMaterial>) => void
  onDeleteMaterial: (materialId: string) => void
  materials: TrainingMaterial[]
}

function getTypeIcon(type: string) {
  switch (type) {
    case "video": return <Play className="h-3.5 w-3.5" />
    case "pdf": return <FileText className="h-3.5 w-3.5" />
    case "audio": return <Radio className="h-3.5 w-3.5" />
    default: return null
  }
}

function getTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

interface MaterialRowProps {
  material: TrainingMaterial
  onEdit: (id: string, updates: Partial<TrainingMaterial>) => void
  onDelete: (id: string) => void
}

function MaterialRow({ material, onEdit, onDelete }: MaterialRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: material.title,
    type: material.type,
    mediaUrl: material.mediaUrl,
  })

  const handleSave = () => {
    if (!editData.title.trim() || !editData.mediaUrl.trim()) return
    onEdit(material.id, editData)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Title</Label>
            <Input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select
              value={editData.type}
              onValueChange={(v: "video" | "pdf" | "audio") => setEditData({ ...editData, type: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Media URL</Label>
            <Input
              value={editData.mediaUrl}
              onChange={(e) => setEditData({ ...editData, mediaUrl: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 group">
      <span className="text-muted-foreground shrink-0">{getTypeIcon(material.type)}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{material.title}</span>
        <span className="text-xs text-muted-foreground">{getTypeLabel(material.type)}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{material.title}"?
            </AlertDialogDescription>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(material.id)} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

interface DayCardProps {
  module: TrainingModule
  materials: TrainingMaterial[]
  subjectMode: "sequential" | "scheduled"
  onDelete: (moduleId: string) => void
  onEdit: (moduleId: string, updates: Partial<TrainingModule>) => void
  onAddMaterial: (material: TrainingMaterial) => void
  onEditMaterial: (materialId: string, updates: Partial<TrainingMaterial>) => void
  onDeleteMaterial: (materialId: string) => void
}

function DayCard({
  module,
  materials,
  subjectMode,
  onDelete,
  onEdit,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    module: module.module,
    gapValue: module.gapValue,
    gapUnit: module.gapUnit,
  })

  const handleSaveEdit = () => {
    onEdit(module.id, editData)
    setIsEditing(false)
  }

  return (
    <Card className="border-2 overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <span className="font-bold text-base">Module {module.module}</span>
          {subjectMode === "scheduled" && (module.gapValue ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">
              +{module.gapValue} {module.gapUnit}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-1">
            ({materials.length} material{materials.length !== 1 ? "s" : ""})
          </span>
        </button>

        <div className="flex gap-1 shrink-0">
          <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setIsEditing(e => !e)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-7 px-2">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete Module</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete Module {module.module} and all its materials?
              </AlertDialogDescription>
              <div className="flex justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(module.id)} className="bg-destructive">
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Module edit form */}
      {isEditing && (
        <div className="px-4 py-3 border-t border-b bg-muted/10 space-y-3">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <Label className="text-xs">Day Number</Label>
              <Input
                type="number"
                min="1"
                value={editData.module}
                onChange={(e) => setEditData({ ...editData, module: Number.parseInt(e.target.value) || 1 })}
                className="h-8 w-24 text-sm"
              />
            </div>
            {subjectMode === "scheduled" && (
              <>
                <div>
                  <Label className="text-xs">Gap Value</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editData.gapValue}
                    onChange={(e) => setEditData({ ...editData, gapValue: Math.max(0, Number.parseInt(e.target.value) || 0) })}
                    className="h-8 w-20 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Select
                    value={editData.gapUnit}
                    onValueChange={(v: "days" | "weeks") => setEditData({ ...editData, gapUnit: v })}
                  >
                    <SelectTrigger className="h-8 w-24 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs" onClick={handleSaveEdit}>Save</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Materials list */}
      {expanded && (
        <div className="px-4 py-3 space-y-1">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-1">No materials yet.</p>
          ) : (
            materials.map(mat => (
              <MaterialRow
                key={mat.id}
                material={mat}
                onEdit={onEditMaterial}
                onDelete={onDeleteMaterial}
              />
            ))
          )}
          <div className="pt-2">
            <AddMaterialDialog moduleId={module.id} onAdd={onAddMaterial} />
          </div>
        </div>
      )}
    </Card>
  )
}

export function ModulesList({
  modules,
  subjectMode = "sequential",
  onDelete,
  onEdit,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  materials,
}: ModulesListProps) {
  const sortedModules = [...modules].sort((a, b) => a.module - b.module)

  if (modules.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No modules yet. Add one to get started.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {sortedModules.map((module) => (
        <DayCard
          key={module.id}
          module={module}
          materials={materials.filter(m => m.moduleId === module.id)}
          subjectMode={subjectMode}
          onDelete={onDelete}
          onEdit={onEdit}
          onAddMaterial={onAddMaterial}
          onEditMaterial={onEditMaterial}
          onDeleteMaterial={onDeleteMaterial}
        />
      ))}
    </div>
  )
}
