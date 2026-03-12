"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { BookOpen, Users, Edit, AlertCircle } from "lucide-react"
import type { TrainingSubject } from "@/lib/models"

export default function TrainerSubjectsPage() {
    const [subjects, setSubjects] = useState<TrainingSubject[]>([])
    const [moduleCountMap, setModuleCountMap] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const [subjRes, modRes] = await Promise.all([
                    fetch("/api/training-subjects"),
                    fetch("/api/training-modules"),
                ])

                if (!subjRes.ok) throw new Error("Failed to load subjects")

                const subjectList: TrainingSubject[] = await subjRes.json()
                const mods = modRes.ok ? await modRes.json() : []

                const countMap: Record<string, number> = {}
                for (const m of mods) {
                    countMap[m.subjectId] = (countMap[m.subjectId] ?? 0) + 1
                }

                setSubjects(subjectList)
                setModuleCountMap(countMap)
            } catch (err: any) {
                setError(err.message ?? "Something went wrong")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="font-bold text-3xl tracking-tight">My Subjects</h1>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-5 w-32 bg-muted rounded mb-3" />
                                <div className="h-4 w-full bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-20 gap-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive opacity-70" />
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    if (subjects.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="font-bold text-3xl tracking-tight">My Subjects</h1>
                <Card className="border-dashed border-2 py-16 flex flex-col items-center text-center gap-3">
                    <BookOpen className="h-10 w-10 text-muted-foreground opacity-40" />
                    <p className="font-semibold">No subjects assigned yet</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Ask an Admin to assign you to a training subject.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-bold text-3xl tracking-tight">My Subjects</h1>
                <p className="text-muted-foreground mt-1">Manage modules for your assigned subjects.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map(subject => (
                    <Card key={subject.id} className="flex flex-col border-border shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{subject.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium text-foreground">
                                    {moduleCountMap[subject.id] ?? 0} Modules
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button asChild variant="outline" className="w-full">
                                <Link href={`/trainer/training/${subject.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Manage Modules
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
