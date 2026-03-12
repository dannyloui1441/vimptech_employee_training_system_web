"use client"

import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Copy, Check } from "lucide-react"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Customer Support",
  "Product",
]

const ROLES = ["Employee", "Trainer", "Admin"]

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    additionalMobileNumber: "",
    role: "Employee",
    department: "",
  })

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "", mobileNumber: "", additionalMobileNumber: "", role: "Employee", department: "" })
    setCreatedPassword(null)
    setCopied(false)
  }

  const handleClose = (val: boolean) => {
    if (!val) resetForm()
    onOpenChange(val)
  }

  const copyPassword = async () => {
    if (!createdPassword) return
    await navigator.clipboard.writeText(createdPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobileNumber || !formData.role || !formData.department) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          ...(formData.additionalMobileNumber ? { additionalMobileNumber: formData.additionalMobileNumber } : {}),
          role: formData.role,
          department: formData.department,
          status: 'Active',
        }),
      })

      if (!response.ok) throw new Error('Failed to create user')

      const created = await response.json()
      setCreatedPassword(created.password ?? null)
      router.refresh()
    } catch {
      toast({ title: "Error", description: "Failed to create user. Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // ── Password confirmation step ──────────────────────────────────────────
  if (createdPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">User Created ✓</DialogTitle>
            <DialogDescription>
              Save this generated password — it won&apos;t be shown again after closing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>Generated Password</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border bg-secondary px-3 py-2 font-mono text-base tracking-widest">
                {createdPassword}
              </code>
              <Button variant="outline" size="icon" onClick={copyPassword} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Create form ────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Add New User</DialogTitle>
          <DialogDescription>
            Enter the details for the new user account. A password will be auto-generated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalMobile">Additional Mobile <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="additionalMobile"
                  type="tel"
                  placeholder="+91 12345 67890"
                  value={formData.additionalMobileNumber}
                  onChange={(e) => setFormData({ ...formData, additionalMobileNumber: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={loading}>
                <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })} disabled={loading}>
                <SelectTrigger id="department"><SelectValue placeholder="Select a department" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Add User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
