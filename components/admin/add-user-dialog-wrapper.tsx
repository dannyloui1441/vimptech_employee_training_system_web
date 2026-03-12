"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddUserDialog } from "@/components/admin/add-user-dialog"

export function AddUserDialogWrapper() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
            </Button>
            <AddUserDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </>
    )
}
