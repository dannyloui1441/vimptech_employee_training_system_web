"use client"

import type React from "react"
import { useState } from "react"
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
import type { TrainingMaterial } from "@/lib/models"
import { Plus } from "lucide-react"

interface AddMaterialDialogProps {
    moduleId: string
    onAdd: (material: TrainingMaterial) => void
}

export function AddMaterialDialog({ moduleId, onAdd }: AddMaterialDialogProps) {
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        type: "video" as "video" | "pdf" | "audio",
        mediaUrl: "",
    })

    const canSubmit = formData.title.trim().length > 0 && formData.mediaUrl.trim().length > 0

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        const newMaterial: TrainingMaterial = {
            id: `mat-${Date.now()}`,
            moduleId,
            title: formData.title.trim(),
            type: formData.type,
            mediaUrl: formData.mediaUrl.trim(),
        }

        onAdd(newMaterial)
        setFormData({ title: "", type: "video", mediaUrl: "" })
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Material
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Material</DialogTitle>
                    <DialogDescription>Add a video, PDF, or audio resource to this module.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="mat-title">Title</Label>
                        <Input
                            id="mat-title"
                            placeholder="e.g., Introduction to Safety"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="mat-type">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: "video" | "pdf" | "audio") =>
                                setFormData({ ...formData, type: value })
                            }
                        >
                            <SelectTrigger id="mat-type">
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
                        <Label htmlFor="mat-url">Media URL</Label>
                        <Input
                            id="mat-url"
                            placeholder={
                                formData.type === "video"
                                    ? "YouTube URL or embed link"
                                    : formData.type === "pdf"
                                        ? "PDF file URL or path"
                                        : "Audio file URL"
                            }
                            value={formData.mediaUrl}
                            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canSubmit}>
                            Add Material
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
