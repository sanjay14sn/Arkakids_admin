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
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
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
              <label className="text-xs font-semibold text-muted-foreground">Institute Code</label>
              <Input
                value={config.centerCode}
                onChange={(e) => updateConfig({ centerCode: e.target.value.toUpperCase() })}
                className="text-xs h-10 font-mono"
                placeholder="IPA-BLR-001"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Academic Year Start Date</label>
              <Input
                type="date"
                value={config.academicYear}
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
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <FileText className="h-4 w-4" />
              Agreement & Contract Details
            </CardTitle>
            <CardDescription className="text-xs font-medium">Franchise agreement dates, fees, and tax identifiers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Agreement Start Date</label>
              <Input
                type="date"
                value={config.agreementStartDate}
                onChange={(e) => updateConfig({ agreementStartDate: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Agreement End Date</label>
              <Input
                type="date"
                value={config.agreementEndDate}
                onChange={(e) => updateConfig({ agreementEndDate: e.target.value })}
                className="text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Renewal Date</label>
              <Input
                type="date"
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
    </div>
  )
}
