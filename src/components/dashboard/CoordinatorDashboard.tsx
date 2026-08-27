"use client"

import { useStore } from "@/store/useStore"
import { BDEDashboard } from "./BDEDashboard"
import { TrainerDashboard } from "./TrainerDashboard"

export function CoordinatorDashboard() {
  const role = useStore((s) => s.user?.role)
  if (role === "bde") return <BDEDashboard />
  return <TrainerDashboard />
}
