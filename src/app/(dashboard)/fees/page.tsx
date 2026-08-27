"use client"

import { Suspense } from "react"
import { FeesModule } from "@/components/fees/FeesModule"
import { ParentFeesView } from "@/components/fees/ParentFeesView"
import { AccessRestricted } from "@/components/shared/AccessRestricted"
import { useStore } from "@/store/useStore"

export default function FeesPage() {
  const { user } = useStore()
  const role = user?.role

  if (role === "student") return <ParentFeesView />

  if (role === "trainer" || role === "bde") {
    return (
      <AccessRestricted
        title="Fees are managed by the branch office"
        description="Classroom Coordinators do not collect or edit student fees. Parents see their own child’s fees. Franchise Owners and Head Office use Fees & Payments."
      />
    )
  }

  return (
    <Suspense fallback={<p className="text-xs text-muted-foreground py-16 text-center">Loading fees & payments...</p>}>
      <FeesModule />
    </Suspense>
  )
}
