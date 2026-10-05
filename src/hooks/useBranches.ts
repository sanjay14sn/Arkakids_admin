import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useStore } from "@/store/useStore"

export function useBranches() {
  const { user, activeTenant } = useStore()
  const [branches, setBranches] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const isMultiBranch = user?.role === "super_admin" || user?.role === "owner"
  const myBranchName = String(activeTenant?.name ?? user?.tenantId ?? "").trim()

  useEffect(() => {
    async function fetchCenters() {
      try {
        const res = await api.getCenters()
        const centerList: any[] = Array.isArray(res) ? res : (res?.centers ?? res?.data ?? [])
        let names = centerList
          .map((c: any) => (typeof c === "string" ? c : c?.name ?? c?.branchName ?? c?.centerName ?? c?.tenantName ?? ""))
          .filter(Boolean) as string[]

        if (!isMultiBranch && myBranchName) {
          const matched = names.filter(n => String(n || "").trim().toLowerCase() === myBranchName.toLowerCase())
          names = matched.length > 0 ? matched : (myBranchName ? [myBranchName] : names)
        }

        if (names.length > 0) {
          setBranches(names)
        } else if (!isMultiBranch && myBranchName) {
          setBranches([myBranchName])
        } else {
          setBranches([])
        }
      } catch (err) {
        if (!isMultiBranch && myBranchName) {
          setBranches([myBranchName])
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchCenters()
  }, [isMultiBranch, myBranchName])

  return { branches, loading, isMultiBranch, myBranchName }
}
