"use client"

import * as React from "react"
import { GraduationCap } from "lucide-react"
import { AdmissionForm } from "@/components/preschool/AdmissionForm"
import { AccessRestricted } from "@/components/shared/AccessRestricted"
import { useParentPortal } from "@/lib/parentPortal"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useStore } from "@/store/useStore"

export default function ApplyPage() {
  const { user } = useStore()
  const { state, update, ready } = useParentPortal()
  const [justId, setJustId] = React.useState<string | null>(null)

  if (user?.role === "student") {
    return (
      <AccessRestricted
        title="Admission is not part of the parent portal"
        description="Your child’s enrolment is already in the school records. New admission enquiries are handled by the branch, not from the parent login."
      />
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          Admission application
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Child, parents, emergency contacts, health, pickup persons, visit/trial, and documents.
        </p>
      </div>

      {justId && (
        <p className="text-sm text-emerald-600 font-medium">Application {justId} submitted. Branch staff will review it.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">New application</CardTitle>
        </CardHeader>
        <CardContent>
          <AdmissionForm
            onCreated={(application) => {
              update((prev) => ({ ...prev, applications: [application, ...prev.applications] }))
              setJustId(application.id)
            }}
          />
        </CardContent>
      </Card>

      {ready && state.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {state.applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <span>{app.childName} · {app.branch}</span>
                <Badge variant={app.status === "approved" ? "success" : app.status === "rejected" ? "destructive" : "warning"} className="capitalize">
                  {app.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
