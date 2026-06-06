"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function NotificationCenter() {
  const { toast } = useToast()
  
  const [recipientType, setRecipientType] = useState<"all" | "subject" | "individual">("all")
  const [targetId, setTargetId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  
  const [subjects, setSubjects] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Fetch recipients list based on type
  useEffect(() => {
    if (recipientType === "all") return;

    async function loadRecipients() {
      setIsLoadingData(true)
      try {
        if (recipientType === "subject") {
          const res = await fetch("/api/training-subjects")
          if (res.ok) {
            const data = await res.json()
            setSubjects(data)
          } else {
            throw new Error("Failed to fetch subjects")
          }
        } else if (recipientType === "individual") {
          const res = await fetch("/api/users?role=Employee")
          if (res.ok) {
            const data = await res.json()
            setEmployees(data.filter((u: any) => u.status === "Active"))
          } else {
            throw new Error("Failed to fetch employees")
          }
        }
      } catch (err: any) {
        toast({
          title: "Error loading recipients",
          description: err.message || "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadRecipients()
  }, [recipientType, toast])

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields.",
        variant: "destructive",
      })
      return
    }

    if (recipientType !== "all" && !targetId) {
      toast({
        title: "Validation Error",
        description: `Please select a target ${recipientType === "subject" ? "subject" : "employee"}.`,
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const payload: any = {
        recipientType,
        title,
        message,
      }
      if (recipientType !== "all") {
        payload.targetId = targetId
      }

      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send notifications")
      }

      toast({
        title: "Notification Sent",
        description: `Successfully broadcasted to ${data.recipientCount} recipient(s).`,
      })

      // Reset form
      setTitle("")
      setMessage("")
      setTargetId("")
      setRecipientType("all")

      // Fire a custom event to notify NotificationHistory to refresh
      window.dispatchEvent(new Event("notification-sent"))
    } catch (err: any) {
      toast({
        title: "Failed to send",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-secondary/20">
        <CardTitle className="text-xl font-bold">Send Notification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="recipient" className="font-semibold text-sm">Recipient Type</Label>
          <Select 
            value={recipientType} 
            onValueChange={(val) => {
              setRecipientType(val as any)
              setTargetId("")
            }}
          >
            <SelectTrigger id="recipient" className="border-border">
              <SelectValue placeholder="Select recipient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Active Employees</SelectItem>
              <SelectItem value="subject">By Subject</SelectItem>
              <SelectItem value="individual">Individual Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recipientType === "subject" && (
          <div className="space-y-2">
            <Label htmlFor="subject" className="font-semibold text-sm">Select Subject</Label>
            {isLoadingData ? (
              <div className="flex items-center text-xs text-muted-foreground gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading subjects...
              </div>
            ) : (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="subject" className="border-border">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <SelectItem value="none" disabled>No subjects available</SelectItem>
                  ) : (
                    subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {recipientType === "individual" && (
          <div className="space-y-2">
            <Label htmlFor="employee" className="font-semibold text-sm">Select Employee</Label>
            {isLoadingData ? (
              <div className="flex items-center text-xs text-muted-foreground gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading employees...
              </div>
            ) : (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="employee" className="border-border">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="none" disabled>No active employees found</SelectItem>
                  ) : (
                    employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.email})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold text-sm">Title</Label>
          <Input 
            id="title" 
            placeholder="Notification title" 
            className="border-border"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="font-semibold text-sm">Message</Label>
          <Textarea 
            id="message" 
            placeholder="Write your notification message..." 
            rows={5} 
            className="border-border resize-none"
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule" className="font-semibold text-sm">Schedule</Label>
          <Select defaultValue="now">
            <SelectTrigger id="schedule" className="border-border">
              <SelectValue placeholder="Send immediately" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Send Now</SelectItem>
              <SelectItem value="schedule" disabled>Schedule for Later (Pro Feature)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full mt-4 font-semibold" 
          size="lg"
          onClick={handleSend}
          disabled={isSending || !title.trim() || !message.trim() || (recipientType !== 'all' && !targetId)}
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
