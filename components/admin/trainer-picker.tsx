"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface Trainer {
    id: string
    name: string
}

interface TrainerPickerProps {
    trainers: Trainer[]
    /** Currently selected trainer IDs */
    value: string[]
    onChange: (ids: string[]) => void
}

export function TrainerPicker({ trainers, value, onChange }: TrainerPickerProps) {
    const [open, setOpen] = useState(false)

    function toggle(id: string) {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id))
        } else {
            onChange([...value, id])
        }
    }

    const label =
        value.length === 0
            ? "Select trainers…"
            : value.length === 1
                ? trainers.find(t => t.id === value[0])?.name ?? "1 trainer"
                : `${value.length} trainers selected`

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={cn(value.length === 0 && "text-muted-foreground")}>
                            {label}
                        </span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search trainers…" />
                    <CommandList>
                        <CommandEmpty>No trainers found.</CommandEmpty>
                        <CommandGroup>
                            {trainers.map(trainer => (
                                <CommandItem
                                    key={trainer.id}
                                    value={trainer.name}
                                    onSelect={() => toggle(trainer.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value.includes(trainer.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {trainer.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
