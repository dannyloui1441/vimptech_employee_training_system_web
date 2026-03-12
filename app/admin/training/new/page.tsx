"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrainerPicker } from "@/components/admin/trainer-picker"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, AlertCircle, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Trainer { id: string; name: string }

export default function NewSubjectPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    assignedTrainerIds: [] as string[],
    mode: "sequential" as "sequential" | "scheduled",
  })

  // Fetch trainer users on mount
  useEffect(() => {
    fetch("/api/users")
      .then(r => r.ok ? r.json() : [])
      .then((users: any[]) =>
        setTrainers(users.filter(u => u.role === "Trainer").map(u => ({ id: u.id, name: u.name })))
      )
      .catch(() => {/* silently ignore — picker just stays empty */ })
  }, [])

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors = {
    name: !formData.name.trim()
      ? "Subject name is required"
      : formData.name.trim().length < 3
        ? "Subject name must be at least 3 characters"
        : null,
    description: !formData.description.trim()
      ? "Description is required"
      : formData.description.trim().length < 10
        ? "Description must be at least 10 characters"
        : null,
    duration: !formData.duration.trim()
      ? "Duration is required (e.g. 4 weeks, 30 days)"
      : null,
  }

  const canSubmit = !errors.name && !errors.description && !errors.duration

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!canSubmit) return

    setLoading(true)
    try {
      const response = await fetch("/api/training-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          assignedTrainerIds: formData.assignedTrainerIds,
          mode: formData.mode,
        }),
      })

      if (!response.ok) throw new Error("Failed to create subject")

      const newSubject = await response.json()
      toast({ title: "Subject Created", description: "Your training subject has been created." })
      router.push(`/admin/training/${newSubject.id}`)
    } catch {
      toast({ title: "Error", description: "Failed to create subject", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-bold text-3xl">Create New Subject</h1>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Subject Details</CardTitle>
          <CardDescription>Create a new training subject and assign trainers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                placeholder="e.g., Advanced Safety Training"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              {submitted && errors.name && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.name}
                </p>
              )}
              {!submitted && formData.name.trim().length > 0 && formData.name.trim().length < 3 && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  At least 3 characters required
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and content of this training subject"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
              {submitted && errors.description && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.description}
                </p>
              )}
              {!submitted && formData.description.trim().length > 0 && formData.description.trim().length < 10 && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  At least 10 characters required
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 4 weeks, 30 days"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
              />
              {submitted && errors.duration && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.duration}
                </p>
              )}
            </div>

            {/* Release mode */}
            <div className="space-y-2">
              <Label>Release Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    value: "sequential",
                    label: "Sequential",
                    description: "Modules unlock one after another",
                    icon: <ArrowRight className="h-4 w-4" />,
                  },
                  {
                    value: "scheduled",
                    label: "Scheduled",
                    description: "Each module unlocks after a set gap",
                    icon: <Clock className="h-4 w-4" />,
                  },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    id={`mode-${opt.value}`}
                    onClick={() => setFormData({ ...formData, mode: opt.value })}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                      formData.mode === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-muted-foreground/50"
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 shrink-0",
                      formData.mode === opt.value ? "text-primary" : "text-muted-foreground"
                    )}>
                      {opt.icon}
                    </span>
                    <div>
                      <p className={cn(
                        "font-medium text-sm",
                        formData.mode === opt.value ? "text-primary" : ""
                      )}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trainer assignment */}
            <div className="space-y-1.5">
              <Label>Assign Trainers <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <TrainerPicker
                trainers={trainers}
                value={formData.assignedTrainerIds}
                onChange={ids => setFormData({ ...formData, assignedTrainerIds: ids })}
              />
              {formData.assignedTrainerIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Selected: {trainers.filter(t => formData.assignedTrainerIds.includes(t.id)).map(t => t.name).join(", ")}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Subject"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/training">Cancel</Link>
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
