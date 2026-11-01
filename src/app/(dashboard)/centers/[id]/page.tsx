"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Trash2,
  Layers,
  ShieldAlert,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Building2,
  User,
  FileText,
  Globe,
  Upload,
  CheckCircle2,
  RefreshCw,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  type CenterConfig,
  DEFAULT_CENTER_CONFIG,
  centerFromApi,
  centerToPayload,
} from "@/lib/centerConfig"

const STATUS_STYLES: Record<CenterConfig["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  maintenance: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
}

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

const CITY_CODE_MAP: Record<string, string> = {
  bengaluru: "BLR",
  bangalore: "BLR",
  chennai: "CHE",
  madras: "CHE",
  mumbai: "MUM",
  delhi: "DEL",
  hyderabad: "HYD",
  kolkata: "CCU",
  pune: "PUN",
  ahmedabad: "AMD",
  jaipur: "JAI",
  coimbatore: "CJB",
  salem: "SLM",
  trichy: "TRZ",
  madurai: "IXM",
  kochi: "COK",
  mysore: "MYQ",
  mangalore: "IXE",
  chandigarh: "IXC",
}

function resolveCityCode(cityStr?: string): string {
  if (!cityStr) return "BLR"
  const clean = cityStr.trim().toLowerCase()
  if (CITY_CODE_MAP[clean]) return CITY_CODE_MAP[clean]
  for (const [key, code] of Object.entries(CITY_CODE_MAP)) {
    if (clean.includes(key) || key.includes(clean)) return code
  }
  const letters = clean.replace(/[^a-z0-9]/g, "").toUpperCase()
  return (letters.slice(0, 3) || "LOC").padEnd(3, "X")
}

function toCalendarDate(val?: string): string {
  const currentYear = new Date().getFullYear()
  const defaultDate = `${currentYear}-06-01`
  if (!val) return defaultDate
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const year = parseInt(val.split("-")[0], 10)
    if (year < currentYear) return defaultDate
    return val
  }
  const match = val.match(/^(\d{4})/)
  if (match) {
    const year = parseInt(match[1], 10)
    if (year < currentYear) return defaultDate
    return `${year}-06-01`
  }
  return defaultDate
}

const ACADEMIC_YEAR_OPTIONS = ["2026–27", "2025–26", "2024–25", "2027–28", "2028–29"]

export default function EditCenterPage() {
  const router = useRouter()
  const params = useParams()
  const centerId = params.id as string

  const { addNotification, setOwnerEnabledModules } = useStore()
  const [config, setConfig] = React.useState<CenterConfig>(DEFAULT_CENTER_CONFIG)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null)

  const [loadError, setLoadError] = React.useState("")
  const [isDirty, setIsDirty] = React.useState(false)

  // Renewal Dialog States (Every 3 Years)
  const [showRenewalDialog, setShowRenewalDialog] = React.useState(false)
  const [renewalSuccessModal, setRenewalSuccessModal] = React.useState(false)
  const [renewStartDate, setRenewStartDate] = React.useState(new Date().toISOString().split("T")[0])
  const [renewEndDate, setRenewEndDate] = React.useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 3)
    return d.toISOString().split("T")[0]
  })
  const [renewFee, setRenewFee] = React.useState("")
  const [isRenewing, setIsRenewing] = React.useState(false)
  const [renewalDetails, setRenewalDetails] = React.useState<any>(null)

  const updateConfig = React.useCallback((patch: Partial<CenterConfig>) => {
    setIsDirty(true)
    setConfig((prev) => ({ ...prev, ...patch }))
  }, [])

  React.useEffect(() => {
    const fetchCenter = async () => {
      try {
        setLoadError("")
        const data = await api.getCenterById(centerId)
        if (data) {
          setConfig(centerFromApi(data as Record<string, unknown>))
        }
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : "Failed to load center")
      } finally {
        setIsLoading(false)
      }
    }
    fetchCenter()
  }, [centerId])

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!config.name || !(config.location || config.address1) || !(config.manager || config.ownerName) || !(config.email || config.ownerEmail)) {
      alert("Please complete all required fields.")
      return
    }

    // Validate date sequences
    const currentYear = new Date().getFullYear()
    const effectiveJoining = config.dateOfJoining || config.openingDate
    if (effectiveJoining && config.agreementStartDate) {
      if (new Date(effectiveJoining) < new Date(config.agreementStartDate)) {
        alert(`Invalid date sequence: Date of Joining (${effectiveJoining}) cannot be earlier than Agreement Start Date (${config.agreementStartDate}). The franchise agreement must be on or before the centre's joining date.`)
        return
      }
    }
    if (config.agreementStartDate && config.agreementEndDate) {
      if (new Date(config.agreementEndDate) <= new Date(config.agreementStartDate)) {
        alert(`Invalid date sequence: Agreement End Date (${config.agreementEndDate}) must be after Agreement Start Date (${config.agreementStartDate}).`)
        return
      }
    }
    if (config.agreementStartDate && config.renewalDate) {
      if (new Date(config.renewalDate) <= new Date(config.agreementStartDate)) {
        alert(`Invalid date sequence: Renewal Date (${config.renewalDate}) must be after Agreement Start Date (${config.agreementStartDate}).`)
        return
      }
    }

    setIsSaving(true)
    try {
      const norm = (v?: string) => (v || "").trim().toLowerCase()
      const wanted = [config.email, config.officialEmail, config.ownerEmail, config.adminEmail].map(norm).filter(Boolean)
      const others: any[] = ((await api.getCenters().catch(() => [])) || []).filter(
        (c: any) => String(c._id ?? c.id) !== centerId
      )
      const clash = others.find((c) =>
        [c.email, c.officialEmail, c.ownerEmail, c.adminEmail].map(norm).some((e) => e && wanted.includes(e))
      )
      if (clash) {
        alert(`This email is already registered with "${clash.name}". Please use a different email address.`)
        return
      }
      await api.updateCenter(centerId, centerToPayload(config))
      setIsDirty(false)
      addNotification({
        title: "Center Updated",
        description: `Details for ${config.name} have been saved successfully.`,
        type: "system",
      })
      router.push("/centers")
    } catch {
      alert("Failed to save center configuration.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${config.name}"? This cannot be undone.`)) return
    try {
      await api.deleteCenter(centerId)
      router.push("/centers")
    } catch {
      alert("Failed to delete center.")
    }
  }

  const handleApplyToOwner = () => {
    setOwnerEnabledModules(config.enabledModules)
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `centerPolicy:${config.tenantName}`,
        JSON.stringify({
          enabledModules: config.enabledModules,
          minAttendancePercent: config.minAttendancePercent,
          lowAttendanceThreshold: config.lowAttendanceThreshold,
          currency: config.currency,
          brandColor: config.brandColor,
        })
      )
    }
    addNotification({
      title: "Policy applied",
      description: "Owner portal preview updated with current center settings.",
      type: "system",
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading center details…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4 px-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Center not found</h2>
        <p className="text-sm text-muted-foreground max-w-md">{loadError}</p>
        <Button variant="outline" onClick={() => router.push("/centers")}>Back to centers</Button>
      </div>
    )
  }

  return (
    <div className="pb-28 space-y-6 max-w-6xl mx-auto px-4 md:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/centers" className="hover:text-foreground transition-colors">Centers</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{config.name}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Edit Details</span>
      </nav>

      {/* Hero header */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="h-1.5 w-full bg-primary" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/80 text-lg font-bold bg-primary/10 text-primary shadow-xs">
                {config.name ? config.name.slice(0, 2).toUpperCase() : "AK"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
                    {config.name || "Edit Center"}
                  </h1>
                  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", STATUS_STYLES[config.status])}>
                    {config.status}
                  </span>
                  {isDirty && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/5">
                      Unsaved changes
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.tenantName || config.name} · Training center details</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{config.city || config.address1 || config.location}</span>
                  <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{config.timezone}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{config.operatingHoursStart} – {config.operatingHoursEnd}</span>
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{config.officialEmail || config.email}</span>
                  {(config.officialMobile || config.phone) && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{config.officialMobile || config.phone}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button type="button" variant="outline" size="sm" icon={Layers} onClick={handleApplyToOwner}>
                Apply to owner
              </Button>
              <Button type="button" variant="outline" size="sm" icon={Trash2} onClick={handleDelete} className="text-destructive border-destructive/20 hover:bg-destructive/5">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* Section 1: Institute & Franchise Details */}
        <Card className="bg-card border-border/80">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Building2 className="h-4 w-4" />
              Institute & Franchise Details
            </CardTitle>
            <CardDescription className="text-xs font-medium">Franchise identifiers, operational status, and academic year settings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Institute Name *</label>
              <Input
                required
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value, tenantName: config.tenantName || e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Institute Code</label>
                {config.city && (
                  <button
                    type="button"
                    onClick={() => {
                      const cityCode = resolveCityCode(config.city)
                      const namePart = (config.name.trim().split(/\s+/).find(t => /arka/i.test(t)) || config.name.trim().split(/\s+/)[0] || "Arka").replace(/[^a-zA-Z0-9]/g, "")
                      updateConfig({ centerCode: `IPA-${cityCode}-${namePart}` })
                    }}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Sync city code ({resolveCityCode(config.city)})
                  </button>
                )}
              </div>
              <Input
                value={config.centerCode}
                onChange={(e) => updateConfig({ centerCode: e.target.value.toUpperCase() })}
                className="text-xs h-10 font-mono font-bold text-primary"
                placeholder="e.g. IPA-BLR-Arka"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Academic Year</label>
              <Input
                type="date"
                min={`${new Date().getFullYear()}-01-01`}
                value={toCalendarDate(config.academicYear)}
                onChange={(e) => updateConfig({ academicYear: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Select
                label="Status *"
                value={config.status}
                onChange={(e) => updateConfig({ status: e.target.value as any })}
                className="text-xs h-10"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Owner / Franchisee Details */}
        <Card className="bg-card border-border/80">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              Owner / Franchisee Details
            </CardTitle>
            <CardDescription className="text-xs font-medium">Personal profile and verification data of the franchisee owner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Owner / Franchisee Name *</label>
              <Input
                required
                value={config.ownerName || config.manager}
                onChange={(e) => updateConfig({ ownerName: e.target.value, manager: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mobile Number *</label>
              <Input
                required
                type="tel"
                value={config.ownerMobile || config.phone}
                onChange={(e) => updateConfig({ ownerMobile: e.target.value, phone: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email Address *</label>
              <Input
                required
                type="email"
                value={config.ownerEmail || config.email}
                onChange={(e) => updateConfig({ ownerEmail: e.target.value, email: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Alternate Mobile</label>
              <Input
                type="tel"
                value={config.ownerAltMobile}
                onChange={(e) => updateConfig({ ownerAltMobile: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
              <Input
                type="date"
                value={config.ownerDob}
                onChange={(e) => updateConfig({ ownerDob: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">PAN Number</label>
              <Input
                value={config.ownerPan}
                onChange={(e) => updateConfig({ ownerPan: e.target.value.toUpperCase() })}
                className="text-xs h-10 font-mono"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Aadhaar Number</label>
              <Input
                value={config.ownerAadhaar}
                onChange={(e) => updateConfig({ ownerAadhaar: e.target.value })}
                className="text-xs h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Institute Address & Contacts */}
        <Card className="bg-card border-border/80">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" />
              Institute Address & Contacts
            </CardTitle>
            <CardDescription className="text-xs font-medium">Physical address and official contact channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Address Line 1 *</label>
                <Input
                  required
                  value={config.address1 || config.location}
                  onChange={(e) => updateConfig({ address1: e.target.value, location: e.target.value })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Address Line 2</label>
                <Input
                  value={config.address2}
                  onChange={(e) => updateConfig({ address2: e.target.value })}
                  className="text-xs h-10"
                />
              </div>
            </div>

            <div className="grid gap-5 grid-cols-1 md:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Country *</label>
                <Input
                  required
                  value={config.country}
                  onChange={(e) => updateConfig({ country: e.target.value })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">State *</label>
                <Select
                  required
                  value={config.state}
                  onChange={(e) => updateConfig({ state: e.target.value })}
                  className="text-xs h-10"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">City *</label>
                <Input
                  required
                  value={config.city}
                  onChange={(e) => updateConfig({ city: e.target.value })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Pincode *</label>
                <Input
                  required
                  value={config.pincode}
                  onChange={(e) => updateConfig({ pincode: e.target.value })}
                  className="text-xs h-10"
                />
              </div>
            </div>

            <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Official Email *</label>
                <Input
                  type="email"
                  required
                  value={config.officialEmail || config.email}
                  onChange={(e) => updateConfig({ officialEmail: e.target.value, email: e.target.value })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Official Mobile *</label>
                <Input
                  type="tel"
                  required
                  value={config.officialMobile || config.phone}
                  onChange={(e) => updateConfig({ officialMobile: e.target.value, phone: e.target.value })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number</label>
                <Input
                  type="tel"
                  value={config.whatsappNumber || config.whatsapp}
                  onChange={(e) => updateConfig({ whatsappNumber: e.target.value, whatsapp: e.target.value })}
                  className="text-xs h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Primary Admin Account */}
        <Card className="bg-card border-border/80">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              Primary Admin Account
            </CardTitle>
            <CardDescription className="text-xs font-medium">Head administrator contact credentials for institute login.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Admin Name *</label>
              <Input
                required
                value={config.adminName || config.manager}
                onChange={(e) => updateConfig({ adminName: e.target.value, manager: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Admin Email *</label>
              <Input
                type="email"
                required
                value={config.adminEmail || config.email}
                onChange={(e) => updateConfig({ adminEmail: e.target.value, email: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Admin Mobile *</label>
              <Input
                type="tel"
                required
                value={config.adminMobile || config.phone}
                onChange={(e) => updateConfig({ adminMobile: e.target.value, phone: e.target.value })}
                className="text-xs h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Play School & Setup Details */}
        <Card className="bg-card border-border/80">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Clock className="h-4 w-4" />
              Play School & Classroom Setup
            </CardTitle>
            <CardDescription className="text-xs font-medium">Capacity limits, classroom counts, and operational hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-5 grid-cols-1 md:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Total Capacity</label>
                <Input
                  value={config.totalCapacity || String(config.maxStudentCapacity)}
                  onChange={(e) => updateConfig({ totalCapacity: e.target.value, maxStudentCapacity: Number(e.target.value) || config.maxStudentCapacity })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Classrooms Count</label>
                <Input
                  type="number"
                  value={config.classroomsCount}
                  onChange={(e) => updateConfig({ classroomsCount: Number(e.target.value) || 1 })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Opening Time</label>
                <Input
                  type="time"
                  value={config.operatingHoursStart}
                  onChange={(e) => updateConfig({ operatingHoursStart: e.target.value })}
                  className="text-xs h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Closing Time</label>
                <Input
                  type="time"
                  value={config.operatingHoursEnd}
                  onChange={(e) => updateConfig({ operatingHoursEnd: e.target.value })}
                  className="text-xs h-10"
                />
              </div>
            </div>

            <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Selected Classes (Comma-separated)</label>
                <Input
                  value={Array.isArray(config.selectedClasses) ? config.selectedClasses.join(", ") : config.selectedClasses || ""}
                  onChange={(e) => updateConfig({ selectedClasses: e.target.value.split(",").map(s => s.trim()) })}
                  className="text-xs h-10"
                  placeholder="Toddler, Nursery, Jr. KG, Sr. KG"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Working Days (Comma-separated)</label>
                <Input
                  value={Array.isArray(config.workingDays) ? config.workingDays.join(", ") : config.workingDays || ""}
                  onChange={(e) => updateConfig({ workingDays: e.target.value.split(",").map(s => s.trim()) })}
                  className="text-xs h-10"
                  placeholder="Mon, Tue, Wed, Thu, Fri, Sat"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Agreement & Contract Details */}
        <Card className="bg-card border-border/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" />
                Agreement & Contract Details
              </CardTitle>
              <CardDescription className="text-xs font-medium">Franchise agreement dates, 3-year renewal cycle, and fee terms.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                const baseDate = config.renewalDate ? new Date(config.renewalDate) : new Date()
                const startStr = baseDate.toISOString().split("T")[0]
                const endD = new Date(baseDate)
                endD.setFullYear(endD.getFullYear() + 3)
                setRenewStartDate(startStr)
                setRenewEndDate(endD.toISOString().split("T")[0])
                setRenewFee(config.franchiseFee || "150000")
                setShowRenewalDialog(true)
              }}
              className="text-xs border-primary/40 text-primary hover:bg-primary/5 font-semibold"
            >
              Renew Agreement (3 Years)
            </Button>
          </CardHeader>
          <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Agreement Start Date</label>
              <Input
                type="date"
                min={`${new Date().getFullYear()}-01-01`}
                value={config.agreementStartDate}
                onChange={(e) => {
                  const val = e.target.value
                  const patch: Partial<CenterConfig> = { agreementStartDate: val }
                  if (val) {
                    const d = new Date(val)
                    if (!isNaN(d.getTime())) {
                      d.setFullYear(d.getFullYear() + 3)
                      patch.renewalDate = d.toISOString().split("T")[0]
                    }
                  }
                  updateConfig(patch)
                }}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Agreement End Date</label>
              <Input
                type="date"
                min={config.agreementStartDate || `${new Date().getFullYear()}-01-01`}
                value={config.agreementEndDate}
                onChange={(e) => updateConfig({ agreementEndDate: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Renewal Date</label>
                <span className="text-[10px] text-primary font-medium">(Every 3 Years)</span>
              </div>
              <Input
                type="date"
                min={config.agreementStartDate || `${new Date().getFullYear()}-01-01`}
                value={config.renewalDate}
                onChange={(e) => updateConfig({ renewalDate: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Franchise Fee</label>
              <Input
                value={config.franchiseFee}
                onChange={(e) => updateConfig({ franchiseFee: e.target.value })}
                className="text-xs h-10"
                placeholder="e.g. 5,00,000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">GST / VAT Number</label>
              <Input
                value={config.gstVatNumber || config.gstNumber}
                onChange={(e) => updateConfig({ gstVatNumber: e.target.value, gstNumber: e.target.value })}
                className="text-xs h-10 font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Documents Upload & Verification */}
        <Card className="bg-card border-border/80">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Upload className="h-4 w-4" />
              Documents Upload & Verification
            </CardTitle>
            <CardDescription className="text-xs font-medium">Verify legal status and uploaded verification files of the franchisee node.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
              {[
                { key: "agreement", label: "Franchise Agreement *" },
                { key: "owner_id", label: "Owner ID Proof *" },
                { key: "address", label: "Address Proof *" },
                { key: "business", label: "Business Registration *" },
                { key: "gst", label: "GST Certificate (Optional)" },
                { key: "other", label: "Other Documents" }
              ].map((docItem) => {
                const docs = config.uploadedDocs || {}
                const fileVal = docs[docItem.key]
                return (
                  <div key={docItem.key} className="p-4 rounded-xl border border-border bg-secondary/15 flex flex-col gap-2 justify-between min-h-[90px]">
                    <span className="text-[11px] font-bold text-foreground block">{docItem.label}</span>
                    <div className="flex items-center gap-2 justify-between">
                      {uploadingKey === docItem.key ? (
                        <span className="text-xs text-muted-foreground italic">Uploading…</span>
                      ) : fileVal ? (
                        <a href={fileVal} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 min-w-0 flex-1 hover:underline">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs text-slate-700 truncate">{decodeURIComponent(fileVal.split("/").pop() || fileVal)}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No file chosen</span>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="p-1.5 rounded-lg border border-border hover:bg-card cursor-pointer transition-colors bg-white shadow-xs">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingKey === docItem.key}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              e.target.value = ""
                              if (!file) return
                              if (file.size > 10 * 1024 * 1024) {
                                alert("Document must be 10 MB or smaller.")
                                return
                              }
                              setUploadingKey(docItem.key)
                              try {
                                const uploaded = await api.uploadFile(file, "documents")
                                if (!uploaded?.url) throw new Error("Upload returned no URL")
                                updateConfig({
                                  uploadedDocs: { ...(config.uploadedDocs || {}), [docItem.key]: uploaded.url },
                                })
                              } catch (err) {
                                alert(err instanceof Error ? err.message : "Document upload failed.")
                              } finally {
                                setUploadingKey(null)
                              }
                            }}
                          />
                        </label>
                        {fileVal && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextDocs = { ...(config.uploadedDocs || {}) }
                              delete nextDocs[docItem.key]
                              updateConfig({ uploadedDocs: nextDocs })
                            }}
                            className="p-1.5 rounded-lg border border-border bg-white text-destructive hover:text-[#A80812] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/90 backdrop-blur-md md:left-[var(--sidebar-width,0px)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/centers")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to centers
            </button>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={() => router.push("/centers")}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Agreement Renewal Dialog (Every 3 Years) */}
      <Dialog
        isOpen={showRenewalDialog}
        onClose={() => setShowRenewalDialog(false)}
        title="Renew Franchise Agreement"
        description="Renew the franchise contract for a standard 3-year term with automatic confirmation and email dispatch."
        className="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
            <p className="text-xs font-bold text-primary">{config.name} ({config.centerCode || "IPA"})</p>
            <p className="text-[11px] text-muted-foreground">Recipient: {config.officialEmail || config.ownerEmail || config.email || "No email"}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Renewal Effective Date *</label>
            <Input
              type="date"
              value={renewStartDate}
              onChange={(e) => {
                setRenewStartDate(e.target.value)
                const d = new Date(e.target.value)
                if (!isNaN(d.getTime())) {
                  d.setFullYear(d.getFullYear() + 3)
                  setRenewEndDate(d.toISOString().split("T")[0])
                }
              }}
              className="text-xs h-9.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">New Valid Until (3-Year Term) *</label>
            <Input
              type="date"
              value={renewEndDate}
              onChange={(e) => setRenewEndDate(e.target.value)}
              className="text-xs h-9.5 font-bold text-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Renewal Franchise Fee (₹)</label>
            <Input
              type="number"
              placeholder="e.g. 150000"
              value={renewFee}
              onChange={(e) => setRenewFee(e.target.value)}
              className="text-xs h-9.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRenewalDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isRenewing}
              onClick={async () => {
                setIsRenewing(true)
                try {
                  const targetEmail = config.officialEmail || config.ownerEmail || config.email || config.adminEmail
                  
                  // Update center in backend
                  await api.updateCenter(centerId, {
                    renewalDate: renewEndDate,
                    agreementEndDate: renewEndDate,
                    franchiseFee: renewFee || config.franchiseFee,
                  })

                  updateConfig({
                    renewalDate: renewEndDate,
                    agreementEndDate: renewEndDate,
                    franchiseFee: renewFee || config.franchiseFee,
                  })

                  // Dispatch confirmation email
                  if (targetEmail) {
                    await api.sendEmail({
                      type: "renewal",
                      to: targetEmail,
                      details: {
                        centerName: config.name,
                        centerCode: config.centerCode,
                        city: config.city,
                        renewalDate: renewStartDate,
                        validUntil: renewEndDate,
                        renewalFee: renewFee,
                        adminEmail: targetEmail,
                      }
                    })
                  }

                  setRenewalDetails({
                    centerName: config.name,
                    centerCode: config.centerCode,
                    validUntil: renewEndDate,
                    email: targetEmail,
                  })

                  setShowRenewalDialog(false)
                  setRenewalSuccessModal(true)
                  addNotification({
                    title: "Agreement Renewed",
                    description: `Franchise agreement renewed until ${renewEndDate} (3 Years). Confirmation email sent to ${targetEmail}.`,
                    type: "system"
                  })
                } catch (err: any) {
                  alert(err.message || "Failed to renew agreement")
                } finally {
                  setIsRenewing(false)
                }
              }}
            >
              {isRenewing ? "Renewing…" : "Confirm 3-Year Renewal"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Renewal Confirmation Modal */}
      <Dialog
        isOpen={renewalSuccessModal}
        onClose={() => setRenewalSuccessModal(false)}
        title="Agreement Renewed Successfully"
        description="The 3-year agreement renewal has been recorded and confirmed."
        className="max-w-md text-center"
      >
        <div className="py-4 space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">{renewalDetails?.centerName}</h4>
            <p className="text-xs text-muted-foreground">Valid through <span className="font-bold text-primary">{renewalDetails?.validUntil}</span> (3-Year Term)</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-xl text-left text-xs space-y-1 text-muted-foreground">
            <p><strong>Confirmation Email:</strong> Dispatched to {renewalDetails?.email}</p>
            <p><strong>Institute Code:</strong> {renewalDetails?.centerCode}</p>
            <p><strong>Status:</strong> Active Franchise Agreement</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setRenewalSuccessModal(false)} className="w-full">
            Done
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
