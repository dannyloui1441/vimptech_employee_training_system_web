"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { TrainingSubject, TrainingModule, TrainingMaterial } from "@/lib/models"
import { SubjectHeader } from "@/components/admin/subject-header"
import { ModulesList } from "@/components/admin/modules-list"
import { AddModuleDialog } from "@/components/admin/add-module-dialog"
import { SubjectEmployeesPanel } from "@/components/admin/subject-employees-panel"
import { AssessmentTab } from "@/components/trainer/assessment-tab"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ShieldOff, Layers, BookOpenCheck, Users } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Tab = 'modules' | 'assessment' | 'employees'

export default function SubjectDetailsPage() {
  const params = useParams()
  const { toast } = useToast()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<TrainingSubject | null>(null)
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [materials, setMaterials] = useState<TrainingMaterial[]>([])
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [isTrainer, setIsTrainer] = useState(false)

  // Tab + module picker for Assessment tab
  const [activeTab, setActiveTab] = useState<Tab>('modules')
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const searchParams = useSearchParams()

  // Read ?tab= query param on first render
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && ['modules', 'assessment', 'employees'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      try {
        const [subjectRes, modulesRes, meRes, usersRes] = await Promise.all([
          fetch(`/api/training-subjects/${subjectId}`),
          fetch(`/api/training-modules?subjectId=${subjectId}`),
          fetch("/api/auth/me"),
          fetch("/api/users"),
        ])

        if (subjectRes.status === 403) {
          setForbidden(true)
          setLoading(false)
          return
        }

        if (subjectRes.ok) {
          setSubject(await subjectRes.json())
        }

        let fetchedModules: TrainingModule[] = []
        if (modulesRes.ok) {
          const data = await modulesRes.json()
          console.log("Modules API response:", data);
          fetchedModules = data.modules ?? []
          const sorted = [...fetchedModules].sort((a, b) => a.module - b.module)
          setModules(sorted)
          if (sorted.length > 0) setSelectedModuleId(sorted[0].id)
        }

        if (meRes.ok) {
          const me = await meRes.json()
          setIsTrainer(me.role === "Trainer")
        }

        if (usersRes.ok) {
          const users = await usersRes.json()
          setTrainers(
            users
              .filter((u: any) => u.role === "Trainer")
              .map((u: any) => ({ id: u.id, name: u.name }))
          )
        }

        if (fetchedModules.length > 0) {
          const allMatRes = await fetch(`/api/training-materials`)
          if (allMatRes.ok) {
            const allMats: TrainingMaterial[] = await allMatRes.json()
            const moduleIds = new Set(fetchedModules.map(m => m.id))
            setMaterials(allMats.filter(mat => moduleIds.has(mat.moduleId)))
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [subjectId])

  // ─── Subject handlers ─────────────────────────────────────────────────────

  const handleUpdateSubject = async (updates: Partial<TrainingSubject>) => {
    if (!subject) return
    try {
      const response = await fetch(`/api/training-subjects/${subjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        const updated = await response.json()
        setSubject(updated)
        toast({ title: "Subject Updated", description: "Changes have been saved." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update subject", variant: "destructive" })
    }
  }

  // ─── Module handlers ──────────────────────────────────────────────────────

  const handleAddModule = async (newModule: TrainingModule) => {
    try {
      const response = await fetch('/api/training-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule),
      })
      if (response.ok) {
        const created = await response.json()
        setModules(prev => [...prev, created].sort((a, b) => a.module - b.module))
        if (!selectedModuleId) setSelectedModuleId(created.id)
        toast({ title: "Module Added", description: `Module ${created.module} has been created.` })
      } else {
        const err = await response.json()
        toast({ title: "Error", description: err.error ?? "Failed to add module", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to add module", variant: "destructive" })
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/training-modules/${moduleId}`, { method: 'DELETE' })
      if (response.ok) {
        setModules(prev => prev.filter(m => m.id !== moduleId))
        setMaterials(prev => prev.filter(mat => mat.moduleId !== moduleId))
        if (selectedModuleId === moduleId) {
          const remaining = modules.filter(m => m.id !== moduleId)
          setSelectedModuleId(remaining[0]?.id ?? '')
        }
        toast({ title: "Module Deleted", description: "The module has been removed." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete module", variant: "destructive" })
    }
  }

  const handleEditModule = async (moduleId: string, updates: Partial<TrainingModule>) => {
    try {
      const response = await fetch(`/api/training-modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        const updated = await response.json()
        setModules(prev => prev.map(m => (m.id === moduleId ? updated : m)))
        toast({ title: "Module Updated", description: "Changes have been saved." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update module", variant: "destructive" })
    }
  }

  // ─── Material handlers ────────────────────────────────────────────────────

  const handleAddMaterial = async (newMaterial: TrainingMaterial) => {
    try {
      const response = await fetch('/api/training-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial),
      })
      if (response.ok) {
        const created = await response.json()
        setMaterials(prev => [...prev, created])
        toast({ title: "Material Added", description: `"${created.title}" has been added.` })
      } else {
        const err = await response.json()
        toast({ title: "Error", description: err.error ?? "Failed to add material", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to add material", variant: "destructive" })
    }
  }

  const handleEditMaterial = async (materialId: string, updates: Partial<TrainingMaterial>) => {
    try {
      const response = await fetch(`/api/training-materials/${materialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        const updated = await response.json()
        setMaterials(prev => prev.map(mat => (mat.id === materialId ? updated : mat)))
        toast({ title: "Material Updated", description: "Changes have been saved." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update material", variant: "destructive" })
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const response = await fetch(`/api/training-materials/${materialId}`, { method: 'DELETE' })
      if (response.ok) {
        setMaterials(prev => prev.filter(mat => mat.id !== materialId))
        toast({ title: "Material Deleted", description: "The material has been removed." })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" })
    }
  }

  // ─── States ───────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading subject…</div>
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10">
          <ShieldOff className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="font-bold text-2xl">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">
          You are not assigned to this training subject. Contact an Admin to request access.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/training">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Link>
        </Button>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Subject not found</p>
        <Button asChild>
          <Link href="/admin/training">Back to Subjects</Link>
        </Button>
      </div>
    )
  }

  const existingDays = modules.map(m => m.module)
  const selectedModule = modules.find(m => m.id === selectedModuleId) ?? null

  // ─── Main view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back nav + title */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/training">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl">{subject.name}</h1>
          {isTrainer && (
            <p className="text-sm text-muted-foreground mt-0.5">
              You are managing modules for this subject.
            </p>
          )}
        </div>
      </div>

      {/* Subject header — readOnly for Trainers hides edit/delete/assign-trainers */}
      <SubjectHeader
        subject={subject}
        onUpdate={handleUpdateSubject}
        readOnly={isTrainer}
        trainers={trainers}
      />

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b">
        <TabButton
          active={activeTab === 'modules'}
          onClick={() => setActiveTab('modules')}
          icon={<Layers className="h-4 w-4" />}
          label="Modules"
        />
        <TabButton
          active={activeTab === 'assessment'}
          onClick={() => setActiveTab('assessment')}
          icon={<BookOpenCheck className="h-4 w-4" />}
          label="Assessment"
        />
        <TabButton
          active={activeTab === 'employees'}
          onClick={() => setActiveTab('employees')}
          icon={<Users className="h-4 w-4" />}
          label="Assigned Employees"
        />
      </div>

      {/* ── Modules tab ───────────────────────────────────────────────────── */}
      {activeTab === 'modules' && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Training Modules</CardTitle>
                <CardDescription>
                  {isTrainer
                    ? "Add, edit, or remove modules and materials for this subject"
                    : "Manage modules and materials for this subject"}
                </CardDescription>
              </div>
              <AddModuleDialog
                subjectId={subjectId}
                subjectMode={subject.mode ?? "sequential"}
                existingDays={existingDays}
                onAdd={handleAddModule}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ModulesList
              modules={modules}
              materials={materials}
              subjectMode={subject.mode ?? "sequential"}
              onDelete={handleDeleteModule}
              onEdit={handleEditModule}
              onAddMaterial={handleAddMaterial}
              onEditMaterial={handleEditMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Assessment tab ────────────────────────────────────────────────── */}
      {activeTab === 'assessment' && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Assessment Questions</CardTitle>
                <CardDescription>
                  Manage quiz questions per module. Minimum 20 questions recommended.
                </CardDescription>
              </div>
              {modules.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap shrink-0">Module</Label>
                  <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                    <SelectTrigger className="w-[160px] text-sm">
                      <SelectValue placeholder="Pick a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(m => (
                        <SelectItem key={m.id} value={m.id}>Module {m.module}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Add at least one module before managing assessment questions.
              </div>
            ) : selectedModule ? (
              <AssessmentTab moduleId={selectedModule.id} moduleName={`Module ${selectedModule.module}`} />
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* ── Assigned Employees tab ────────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Assigned Employees</CardTitle>
            <CardDescription>
              Employees currently enrolled in this subject. You can assign or remove employees below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectEmployeesPanel subjectId={subjectId} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Tab button helper ─────────────────────────────────────────────────────────
function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
