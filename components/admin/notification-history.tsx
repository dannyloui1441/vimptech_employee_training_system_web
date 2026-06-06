"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, BellOff } from "lucide-react"

interface HistoryItem {
  title: string;
  message: string;
  sentAt: string;
  recipientCount: number;
  sentBy: string;
}

export function NotificationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/admin/notifications/history")
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      } else {
        throw new Error("Failed to load history")
      }
    } catch (err) {
      console.error("Error fetching notification history:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()

    const handleNotificationSent = () => {
      fetchHistory()
    }

    window.addEventListener("notification-sent", handleNotificationSent)
    return () => {
      window.removeEventListener("notification-sent", handleNotificationSent)
    }
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <Card className="border-border shadow-sm h-full flex flex-col">
      <CardHeader className="bg-secondary/20 border-b border-border py-4">
        <CardTitle className="text-lg font-bold">Recent Notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <BellOff className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-sm">No notification history found</span>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div 
                key={index} 
                className="p-3 border border-border bg-card hover:bg-secondary/10 transition-colors rounded-lg space-y-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm text-foreground line-clamp-1">{item.title}</p>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-xxs font-normal">
                    Delivered
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span>{item.recipientCount} recipient(s)</span>
                  <span>{formatDate(item.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
