"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Building2, ChevronRight, ArrowLeft, Search, ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { FeesModule } from "@/components/fees/FeesModule"
import { ParentFeesView } from "@/components/fees/ParentFeesView"
import { AccessRestricted } from "@/components/shared/AccessRestricted"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"

function SuperAdminFeesView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const centerId = searchParams.get("center")
  const [centers, setCenters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const filteredCenters = centers.filter(center => {
    if (!query) return true
    const hay = `${center.name || center.tenantName} ${center.location || center.city}`.toLowerCase()
    return hay.includes(query.toLowerCase())
  })

  const PAGE_SIZE = 9
  const paginatedCenters = filteredCenters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filteredCenters.length / PAGE_SIZE))

  useEffect(() => {
    if (!centerId) {
      api.getCenters().then((res) => {
        setCenters(Array.isArray(res) ? res : [])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [centerId])

  if (centerId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/fees")}
          className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all centers
        </button>
        <FeesModule superAdminCenter={centerId} />
      </div>
    )
  }

  if (loading) return <p className="text-xs text-muted-foreground py-16 text-center animate-pulse">Loading centers...</p>

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
          <Building2 className="h-6 w-6 text-primary" />
          Center Fees & Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a center to view its fee collection history and overview.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={query} 
            onChange={(e) => { setQuery(e.target.value); setPage(1); }} 
            placeholder="Search centers..." 
            className="pl-9 h-10" 
          />
        </div>
        <div className="text-sm text-muted-foreground hidden sm:block">
          Showing {filteredCenters.length} {filteredCenters.length === 1 ? 'center' : 'centers'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedCenters.map(center => {
          const name = center.name || center.tenantName || "Branch"
          const location = center.location || center.city || "Branch Location"
          return (
            <div
              key={center.id || center._id || name}
              onClick={() => router.push(`/fees?center=${encodeURIComponent(name)}`)}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full min-h-[140px]"
            >
              {/* Subtle background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-80 group-hover:opacity-100 group-hover:from-primary/10 transition-colors duration-500" />
              
              <div className="relative z-10 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shadow-xs shrink-0 uppercase group-hover:scale-105 transition-transform duration-300">
                  {name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">{name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{location}</p>
                </div>
              </div>
              
              <div className="relative z-10 mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider group-hover:text-primary/70 transition-colors">Manage Fees</span>
                <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-3 group-hover:translate-x-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          )
        })}
        {paginatedCenters.length === 0 && (
           <div className="col-span-full py-16 text-center border border-dashed border-border rounded-2xl bg-card/50">
             <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
               <Building2 className="h-6 w-6 text-primary" />
             </div>
             <p className="text-base font-bold text-foreground">No centers found</p>
             <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query.</p>
           </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filteredCenters.length)} of {filteredCenters.length} centers
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8">
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-xs font-medium px-2">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FeesPage() {
  return (
    <Suspense fallback={<p className="text-xs text-muted-foreground py-16 text-center">Loading fees & payments...</p>}>
      <FeesPageContent />
    </Suspense>
  )
}

function FeesPageContent() {
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

  if (role === "super_admin") {
    return <SuperAdminFeesView />
  }

  return <FeesModule />
}
