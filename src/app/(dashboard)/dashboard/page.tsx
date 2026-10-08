"use client"

import * as React from "react"
import { useStore } from "@/store/useStore"
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard"
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard"
import { CoordinatorDashboard } from "@/components/dashboard/CoordinatorDashboard"
import { ParentDashboard } from "@/components/dashboard/ParentDashboard"

export default function DashboardPage() {
  const { user } = useStore()

  if (!user) {
    return (
      <div className="space-y-6 animate-pulse p-1">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted/60 rounded-md" />
        </div>
        
        {/* KPI Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[120px] bg-muted/40 rounded-2xl border border-border/50" />
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4 h-[400px] bg-muted/40 rounded-2xl border border-border/50" />
          <div className="lg:col-span-3 h-[400px] bg-muted/40 rounded-2xl border border-border/50" />
        </div>
      </div>
    )
  }

  switch (user.role) {
    case "super_admin":
      return <SuperAdminDashboard />
    case "owner":
      return <OwnerDashboard />
    case "coordinator":
    case "trainer":
    case "bde":
      return <CoordinatorDashboard />
    case "student":
      return <ParentDashboard />
    default:
      return <OwnerDashboard />
  }
}
