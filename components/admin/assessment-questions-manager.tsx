"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, X, BookOpenCheck, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssessmentQuestion } from "@/lib/models"

interface AssessmentQuestionsManagerProps {
    moduleId: string
    moduleName: string
}

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'] as const
const READY_THRESHOLD = 10

const emptyForm = {
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '' as 'A' | 'B' | 'C' | 'D' | '',
    explanation: '',
}

type FormState = typeof emptyForm

export function AssessmentQuestionsManager({ moduleId, moduleName }: AssessmentQuestionsManagerProps) {
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [form, setForm] = useState<FormState>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeNavIdx, setActiveNavIdx] = useState(0)

    // Refs for each question card so we can scroll to them
    const questionRefs = useRef<(HTMLDivElement | null)[]>([])

    // ── fetch ──────────────────────────────────────────────────────────────────
    const fetchQuestions = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/modules/${moduleId}/questions`)
            if (!res.ok) throw new Error('Failed to load questions')
            setQuestions(await res.json())
        } catch {
            setError('Failed to load questions. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [moduleId])

    useEffect(() => { fetchQuestions() }, [fetchQuestions])

    // Reset nav index when module changes
    useEffect(() => { setActiveNavIdx(0) }, [moduleId])

    // ── IntersectionObserver: highlight nav button for visible question ─────────
    useEffect(() => {
        if (questions.length === 0) return

        const observers: IntersectionObserver[] = []

        questions.forEach((_, idx) => {
            const el = questionRefs.current[idx]
            if (!el) return

            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveNavIdx(idx)
                    }
                },
                // Trigger when question crosses 30% into the viewport
                { threshold: 0.3 }
            )
            obs.observe(el)
            observers.push(obs)
        })

        return () => { observers.forEach(o => o.disconnect()) }
    }, [questions])

    // ── add ────────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        if (!form.text.trim() || !form.optionA.trim() || !form.optionB.trim() ||
            !form.optionC.trim() || !form.optionD.trim()) {
            setError('Please fill in the question text and all four options.')
            return
        }
        if (!form.correctAnswer) {
            setError('Please select the correct answer.')
            return
        }
        setError(null)
        setSaving(true)
        try {
            const res = await fetch(`/api/modules/${moduleId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: form.text,
                    optionA: form.optionA,
                    optionB: form.optionB,
                    optionC: form.optionC,
                    optionD: form.optionD,
                    correctAnswer: form.correctAnswer,
                    explanation: form.explanation || undefined,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error ?? 'Failed to add question')
            }
            const created: AssessmentQuestion = await res.json()
            setQuestions(prev => [...prev, created])
            setForm(emptyForm)
            setShowAddForm(false)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    // ── delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        setDeletingId(id)
        setError(null)
        try {
            const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete question')
            setQuestions(prev => {
                const next = prev.filter(q => q.id !== id)
                // Clamp active nav index if needed
                setActiveNavIdx(i => Math.min(i, Math.max(0, next.length - 1)))
                return next
            })
        } catch {
            setError('Failed to delete question. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    // ── scroll to question (window-level scroll via scrollIntoView) ──────────────
    const scrollToQuestion = (idx: number) => {
        setActiveNavIdx(idx)
        // scrollIntoView scrolls the nearest scrollable ancestor — which must be
        // the window/page, not a trapped inner div. The page files must NOT wrap
        // this component in a <ScrollArea> or overflow container.
        questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const count = questions.length
    const isReady = count >= READY_THRESHOLD
    const set = (key: keyof FormState) => (val: string) => setForm(f => ({ ...f, [key]: val }))

    const optionText = (q: AssessmentQuestion, letter: 'A' | 'B' | 'C' | 'D') =>
        ({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD })[letter]

    // ── loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading questions…
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <BookOpenCheck className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">{moduleName}</p>
                        <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'question' : 'questions'}</p>
                    </div>
                    {isReady ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Ready
                        </Badge>
                    ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 shrink-0">
                            <AlertTriangle className="h-3 w-3" />
                            {count}/{READY_THRESHOLD}
                        </Badge>
                    )}
                </div>

                <Button
                    size="sm"
                    variant={showAddForm ? "outline" : "default"}
                    className="gap-1.5"
                    onClick={() => { setShowAddForm(v => !v); setForm(emptyForm); setError(null) }}
                >
                    {showAddForm
                        ? <><X className="h-4 w-4" /> Cancel</>
                        : <><Plus className="h-4 w-4" /> Add Question</>}
                </Button>
            </div>

            {/* ── Warning notice ───────────────────────────────────────────────── */}
            {!isReady && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>⚠ Add at least {READY_THRESHOLD} questions so assessments can be randomized properly.</span>
                </div>
            )}

            {/* ── Inline error ─────────────────────────────────────────────────── */}
            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* ── Question navigation buttons ──────────────────────────────────── */}
            {count > 0 && (
                <div className={cn(
                    "flex gap-1.5",
                    count > 20
                        ? "overflow-x-auto flex-nowrap pb-1 scrollbar-thin"
                        : "flex-wrap"
                )}>
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => scrollToQuestion(idx)}
                            className={cn(
                                "inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors shrink-0",
                                "w-8 h-8 border",
                                activeNavIdx === idx
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Add form ─────────────────────────────────────────────────────── */}
            {showAddForm && (
                <Card className="border-dashed border-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            New Question
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Question text */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Question Text <span className="text-destructive">*</span></Label>
                            <Textarea
                                placeholder="Enter the question…"
                                value={form.text}
                                onChange={e => set('text')(e.target.value)}
                                rows={2}
                                className="text-sm"
                            />
                        </div>

                        {/* Options A–D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ANSWER_OPTIONS.map(letter => (
                                <div key={letter} className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">
                                        Option {letter} <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        placeholder={`Option ${letter}`}
                                        value={form[`option${letter}` as keyof FormState]}
                                        onChange={e => set(`option${letter}` as keyof FormState)(e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Correct answer */}
                        <div className="space-y-1.5 max-w-[200px]">
                            <Label className="text-xs text-muted-foreground">
                                Correct Answer <span className="text-destructive">*</span>
                            </Label>
                            <Select value={form.correctAnswer} onValueChange={v => set('correctAnswer')(v)}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ANSWER_OPTIONS.map(l => (
                                        <SelectItem key={l} value={l}>Option {l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Explanation <span className="italic">(optional)</span></Label>
                            <Textarea
                                placeholder="Explain why this answer is correct..."
                                value={form.explanation}
                                onChange={e => set('explanation')(e.target.value)}
                                rows={2}
                                className="text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-1">
                            <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setError(null) }}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleAdd} disabled={saving} className="gap-1.5">
                                {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : 'Save'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Question list ────────────────────────────────────────────────── */}
            {questions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                        <BookOpenCheck className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No questions yet. Add your first question above.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {questions.map((q, idx) => (
                        <div
                            key={q.id}
                            ref={el => { questionRefs.current[idx] = el }}
                        >
                            <Card className="overflow-hidden">
                                {/* Row header */}
                                <div className="flex items-start gap-3 px-4 py-3">
                                    <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-snug mb-2">{q.text}</p>
                                        {/* Options */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                            {ANSWER_OPTIONS.map(letter => {
                                                const isCorrect = q.correctAnswer === letter
                                                return (
                                                    <div
                                                        key={letter}
                                                        className={cn(
                                                            "flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs",
                                                            isCorrect
                                                                ? "bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                                                                : "bg-muted/50 border border-border"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0 mt-0.5",
                                                            isCorrect ? "bg-emerald-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                                                        )}>
                                                            {letter}
                                                        </span>
                                                        <span>{optionText(q, letter)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {/* Explanation */}
                                        {q.explanation && (
                                            <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                                                <span className="font-semibold">Explanation: </span>{q.explanation}
                                            </div>
                                        )}
                                    </div>
                                    {/* Delete button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(q.id)}
                                        disabled={deletingId === q.id}
                                    >
                                        {deletingId === q.id
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Trash2 className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
