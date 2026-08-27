"use client"

import { ShieldOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"

export function AccessRestricted({
  title = "This module is not available for your login",
  description = "Your account can open this page, but the server did not grant access to this data. Use a Coordinator enquiry login (BDE) for pipeline writes, or a classroom login (trainer) for attendance and class records.",
}: {
  title?: string
  description?: string
}) {
  return (
    <Card className="rounded-2xl border-dashed max-w-lg mx-auto mt-16">
      <CardContent className="py-16 text-center space-y-3">
        <ShieldOff className="h-10 w-10 text-muted-foreground/50 mx-auto" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
