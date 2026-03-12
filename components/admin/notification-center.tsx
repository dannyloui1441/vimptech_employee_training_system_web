"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send } from "lucide-react"

export function NotificationCenter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <Select>
            <SelectTrigger id="recipient">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="program">By Program</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Notification title" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" placeholder="Write your notification message..." rows={5} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule">Schedule</Label>
          <Select>
            <SelectTrigger id="schedule">
              <SelectValue placeholder="Send immediately" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Send Now</SelectItem>
              <SelectItem value="schedule">Schedule for Later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" size="lg">
          <Send className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </CardContent>
    </Card>
  )
}
