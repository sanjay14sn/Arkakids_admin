"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { useParentPortal } from "@/lib/parentPortal"

const TOPICS = ["Classroom", "Food", "Transport", "Communication", "Events"]

export default function FeedbackPage() {
  const { addNotification } = useStore()
  const { state, update, ready } = useParentPortal()
  const [rating, setRating] = React.useState(5)
  const [topic, setTopic] = React.useState(TOPICS[0])
  const [comment, setComment] = React.useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    update((prev) => ({
      ...prev,
      feedback: [
        {
          id: `fb-${Date.now()}`,
          rating,
          topic,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
        },
        ...prev.feedback,
      ],
    }))
    addNotification({
      title: "Feedback sent",
      description: `${topic} · ${rating}/5`,
      type: "system",
    })
    setComment("")
  }

  if (!ready) return <p className="text-xs text-muted-foreground py-16 text-center">Loading feedback...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          Parent feedback
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Rate classroom, food, transport, and events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">New feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={`star-${value}`}
                  type="button"
                  onClick={() => setRating(value)}
                  className="p-1"
                  aria-label={`${value} stars`}
                >
                  <Star className={`h-5 w-5 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((item) => (
                <option key={`topic-${item}`}>{item}</option>
              ))}
            </Select>
            <Input placeholder="What went well, or what should we improve?" value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button type="submit" size="sm">Send feedback</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {state.feedback.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 text-xs">
              <p className="font-bold">{item.topic} · {item.rating}/5</p>
              <p className="text-muted-foreground mt-1">{item.comment}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
