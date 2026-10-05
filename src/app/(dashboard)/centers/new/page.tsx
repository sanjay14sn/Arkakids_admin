"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Building2, Plus, CheckCircle2, Eye, EyeOff, KeyRound, User, Mail, 
  Phone, MapPin, Shield, Upload, FileText, Trash2, Calendar, DollarSign, 
  Map, Clock, Check, Copy, HelpCircle, Lock, RefreshCw, AlertCircle, ArrowRight
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { useStore, ALL_MODULES } from "@/store/useStore"
import { api } from "@/lib/api"

export default function RegisterCenterPage() {
  const router = useRouter()
  const { addNotification } = useStore()

  // State Management for Steps (1 to 5)
  const [currentStep, setCurrentStep] = React.useState(1)
  
  // Section 1: Institute / Franchise Details
  const [instName, setInstName] = React.useState("")
  const [instCode, setInstCode] = React.useState("")
  const [academicYear, setAcademicYear] = React.useState("")
  const [status, setStatus] = React.useState("active")

  // Section 2: Owner / Franchisee Details
  const [ownerName, setOwnerName] = React.useState("")
  const [ownerMobile, setOwnerMobile] = React.useState("")
  const [ownerEmail, setOwnerEmail] = React.useState("")
  const [ownerAltMobile, setOwnerAltMobile] = React.useState("")
  const [ownerDob, setOwnerDob] = React.useState("")
  const [ownerPan, setOwnerPan] = React.useState("")
  const [ownerAadhaar, setOwnerAadhaar] = React.useState("")
  const [ownerPhotoName, setOwnerPhotoName] = React.useState("")

  // Section 3: Institute Address
  const [address1, setAddress1] = React.useState("")
  const [address2, setAddress2] = React.useState("")
  const [country, setCountry] = React.useState("India")
  const [state, setState] = React.useState("Maharashtra")
  const [city, setCity] = React.useState("")
  const [pincode, setPincode] = React.useState("")
  const [gmapsUrl, setGmapsUrl] = React.useState("")

  // Section 4: Contact Details
  const [officialEmail, setOfficialEmail] = React.useState("")
  const [officialMobile, setOfficialMobile] = React.useState("")
  const [whatsappNumber, setWhatsappNumber] = React.useState("")
  const [website, setWebsite] = React.useState("")

  // Section 5: Primary Admin Account
  const [adminName, setAdminName] = React.useState("")
  const [adminEmail, setAdminEmail] = React.useState("")
  const [adminMobile, setAdminMobile] = React.useState("")
  const [adminUsername, setAdminUsername] = React.useState("")
  const [adminPassword, setAdminPassword] = React.useState("")
  const [sendWelcome, setSendWelcome] = React.useState(true)
  const [sameAsOwner, setSameAsOwner] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  // Section 6: Play School Setup
  const [selectedClasses, setSelectedClasses] = React.useState<string[]>(["Toddler", "Nursery", "Jr. KG", "Sr. KG"])
  const [totalCapacity, setTotalCapacity] = React.useState("120")
  const [capacityNoLimit, setCapacityNoLimit] = React.useState(false)
  const [classroomsCount, setClassroomsCount] = React.useState("6")
  const [openingDate, setOpeningDate] = React.useState("")
  const [workingDays, setWorkingDays] = React.useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
  const [openingTime, setOpeningTime] = React.useState("08:30")
  const [closingTime, setClosingTime] = React.useState("13:30")

  // Section 7: Agreement / Franchise Information
  const [agreementStartDate, setAgreementStartDate] = React.useState("")
  const [agreementEndDate, setAgreementEndDate] = React.useState("")
  const [franchiseFee, setFranchiseFee] = React.useState("")
  const [renewalDate, setRenewalDate] = React.useState("")
  const [agreementDocName, setAgreementDocName] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")

  // Section 8: Subscription / Package
  const [subPlan, setSubPlan] = React.useState("Standard")
  const [subStartDate, setSubStartDate] = React.useState("")
  const [subEndDate, setSubEndDate] = React.useState("")
  const [studentLimit, setStudentLimit] = React.useState("200")
  const [staffLimit, setStaffLimit] = React.useState("15")
  const [paymentStatus, setPaymentStatus] = React.useState("Pending")

  // Section 9: Documents Upload
  const [uploadedDocs, setUploadedDocs] = React.useState<Record<string, string>>({})

  // Form Flow States
  const [saving, setSaving] = React.useState(false)
  const [hasTriedSubmit, setHasTriedSubmit] = React.useState(false)
  const [validationError, setValidationError] = React.useState("")
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false)
  const [registeredDetails, setRegisteredDetails] = React.useState<any>(null)
  
  // Draft State
  const [hasDraft, setHasDraft] = React.useState(false)

  React.useEffect(() => {
    const draft = localStorage.getItem("arka_kids_center_draft")
    if (draft) setHasDraft(true)
  }, [])

  // Auto-generate Institute Code based on name prefix
  React.useEffect(() => {
    if (instName.trim()) {
      const cleanName = instName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
      const namePart = cleanName.slice(0, 3).padEnd(3, "X")
      const code = `IPA-BLR-${namePart}-${Math.floor(100 + Math.random() * 900)}`
      setInstCode(code)
    } else {
      setInstCode("")
    }
  }, [instName])

  // Copy Owner Details to Admin Account when toggled
  React.useEffect(() => {
    if (sameAsOwner) {
      setAdminName(ownerName)
      setAdminEmail(ownerEmail)
      setAdminMobile(ownerMobile)
      if (ownerEmail) {
        const parts = ownerEmail.split("@")
        setAdminUsername(parts[0] || "")
      }
    }
  }, [sameAsOwner, ownerName, ownerEmail, ownerMobile])

  // Generate strong random password helper
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    let pass = ""
    for (let i = 0; i < 9; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setAdminPassword(pass)
  }

  // Toggle class list selections
  const toggleClass = (cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    )
  }

  // Toggle working day selections
  const toggleWorkingDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // Handle doc uploads (stored in Cloudinary via backend /upload)
  const [uploadingDocKey, setUploadingDocKey] = React.useState<string | null>(null)
  const triggerDocUpload = async (key: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setValidationError("Document must be 10 MB or smaller.")
      return
    }
    setUploadingDocKey(key)
    setValidationError("")
    try {
      const uploaded = await api.uploadFile(file, "documents")
      if (!uploaded?.url) throw new Error("Upload returned no URL")
      setUploadedDocs(prev => ({ ...prev, [key]: uploaded.url }))
    } catch (err: any) {
      setValidationError(err.message || "Document upload failed. Please try again.")
    } finally {
      setUploadingDocKey(null)
    }
  }

  const removeDoc = (key: string) => {
    setUploadedDocs(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // Save Draft to localStorage
  const handleSaveDraft = () => {
    const draftData = {
      instName, instCode, academicYear, status,
      ownerName, ownerMobile, ownerEmail, ownerAltMobile, ownerDob, ownerPan, ownerAadhaar, ownerPhotoName,
      address1, address2, country, state, city, pincode, gmapsUrl,
      officialEmail, officialMobile, whatsappNumber, website,
      adminName, adminEmail, adminMobile, adminUsername, adminPassword, sendWelcome, sameAsOwner,
      selectedClasses, totalCapacity, capacityNoLimit, classroomsCount, openingDate, workingDays, openingTime, closingTime,
      agreementStartDate, agreementEndDate, franchiseFee, renewalDate, agreementDocName, gstNumber,
      subPlan, subStartDate, subEndDate, studentLimit, staffLimit, paymentStatus,
      uploadedDocs, currentStep
    }
    localStorage.setItem("arka_kids_center_draft", JSON.stringify(draftData))
    setHasDraft(true)
    addNotification({
      title: "Draft Saved",
      description: `Draft for "${instName || 'New Institute'}" saved.`,
      type: "system"
    })
  }

  // Load Draft from localStorage
  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem("arka_kids_center_draft")
      if (draft) {
        const d = JSON.parse(draft)
        setInstName(d.instName || "")
        setInstCode(d.instCode || "")
        setAcademicYear(d.academicYear || "")
        setStatus(d.status || "active")
        setOwnerName(d.ownerName || "")
        setOwnerMobile(d.ownerMobile || "")
        setOwnerEmail(d.ownerEmail || "")
        setOwnerAltMobile(d.ownerAltMobile || "")
        setOwnerDob(d.ownerDob || "")
        setOwnerPan(d.ownerPan || "")
        setOwnerAadhaar(d.ownerAadhaar || "")
        setOwnerPhotoName(d.ownerPhotoName || "")
        setAddress1(d.address1 || "")
        setAddress2(d.address2 || "")
        setCountry(d.country || "India")
        setState(d.state || "Maharashtra")
        setCity(d.city || "")
        setPincode(d.pincode || "")
        setGmapsUrl(d.gmapsUrl || "")
        setOfficialEmail(d.officialEmail || "")
        setOfficialMobile(d.officialMobile || "")
        setWhatsappNumber(d.whatsappNumber || "")
        setWebsite(d.website || "")
        setAdminName(d.adminName || "")
        setAdminEmail(d.adminEmail || "")
        setAdminMobile(d.adminMobile || "")
        setAdminUsername(d.adminUsername || "")
        setAdminPassword(d.adminPassword || "")
        setSendWelcome(d.sendWelcome !== false)
        setSameAsOwner(d.sameAsOwner || false)
        setSelectedClasses(d.selectedClasses || ["Toddler", "Nursery", "Jr. KG", "Sr. KG"])
        setTotalCapacity(d.totalCapacity || "120")
        setCapacityNoLimit(d.capacityNoLimit || false)
        setClassroomsCount(d.classroomsCount || "6")
        setOpeningDate(d.openingDate || "")
        setWorkingDays(d.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
        setOpeningTime(d.openingTime || "08:30")
        setClosingTime(d.closingTime || "13:30")
        setAgreementStartDate(d.agreementStartDate || "")
        setAgreementEndDate(d.agreementEndDate || "")
        setFranchiseFee(d.franchiseFee || "")
        setRenewalDate(d.renewalDate || "")
        setAgreementDocName(d.agreementDocName || "")
        setGstNumber(d.gstNumber || "")
        setSubPlan(d.subPlan || "Standard")
        setSubStartDate(d.subStartDate || "")
        setSubEndDate(d.subEndDate || "")
        setStudentLimit(d.studentLimit || "200")
        setStaffLimit(d.staffLimit || "15")
        setPaymentStatus(d.paymentStatus || "Pending")
        setUploadedDocs(d.uploadedDocs || {})
        setCurrentStep(d.currentStep || 1)

        addNotification({
          title: "Draft Restored",
          description: "Details loaded from your draft.",
          type: "system"
        })
        setHasDraft(false)
      }
    } catch (e) {
      console.error("Failed to load draft", e)
    }
  }

  const handleClearDraft = () => {
    localStorage.removeItem("arka_kids_center_draft")
    setHasDraft(false)
  }

  // Step Validation Evaluator
  const isStepValid = (stepNum: number) => {
    switch (stepNum) {
      case 1:
        // Franchise Details & Owner Details
        return !!(instName && academicYear && status && ownerName && ownerMobile && ownerEmail)
      case 2:
        // Institute Address & Contact Details
        return !!(address1 && country && state && city && pincode && officialEmail && officialMobile)
      case 3:
        // Primary Admin Account
        return !!(adminName && adminEmail && adminMobile && adminUsername && adminPassword)
      case 4:
        // Agreement Details
        return !!agreementStartDate
      case 5:
        // Documents are optional uploads/pre-valid
        return true
      default:
        return false
    }
  }

  // Step Switch Handler
  const handleStepClick = (stepNum: number) => {
    if (stepNum < currentStep) {
      setCurrentStep(stepNum)
      setValidationError("")
      setHasTriedSubmit(false)
    } else if (stepNum > currentStep) {
      // Validate intermediate steps
      for (let s = currentStep; s < stepNum; s++) {
        if (!isStepValid(s)) {
          setValidationError(`Please complete all required fields in Step ${s} first.`)
          setCurrentStep(s)
          return
        }
      }
      setCurrentStep(stepNum)
      setValidationError("")
      setHasTriedSubmit(false)
    }
  }

  const [checkingEmail, setCheckingEmail] = React.useState(false)

  const handleNextStep = async () => {
    setHasTriedSubmit(true)
    if (!isStepValid(currentStep)) {
      setValidationError("Please fill in all required fields (marked *) before proceeding to the next step.")
      return
    }

    // Emails entered on this step must not belong to another center
    const stepEmails: Record<number, string[]> = {
      1: [ownerEmail],
      2: [officialEmail],
      3: [adminEmail],
    }
    const norm = (v?: string) => (v || "").trim().toLowerCase()
    const wanted = (stepEmails[currentStep] || []).map(norm).filter(Boolean)
    if (wanted.length > 0) {
      setCheckingEmail(true)
      try {
        const existing: any[] = (await api.getCenters().catch(() => [])) || []
        const clash = existing.find((c) =>
          [c.email, c.officialEmail, c.ownerEmail, c.adminEmail].map(norm).some((e) => e && wanted.includes(e))
        )
        if (clash) {
          setValidationError(`This email is already registered with "${clash.name}". Please use a different email address.`)
          return
        }
      } finally {
        setCheckingEmail(false)
      }
    }

    setValidationError("")
    setHasTriedSubmit(false)
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const handleBackStep = () => {
    setValidationError("")
    setHasTriedSubmit(false)
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Submit Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasTriedSubmit(true)
    setValidationError("")

    // Validate all steps before submission
    for (let s = 1; s <= 4; s++) {
      if (!isStepValid(s)) {
        setValidationError(`Please fill in all required fields in Step ${s}.`)
        setCurrentStep(s)
        return
      }
    }

    setSaving(true)
    try {
      // 0. Reject emails that are already registered with another center
      const norm = (v?: string) => (v || "").trim().toLowerCase()
      const wanted = [adminEmail, officialEmail, ownerEmail].map(norm).filter(Boolean)
      const existing: any[] = (await api.getCenters().catch(() => [])) || []
      const clash = existing.find((c) =>
        [c.email, c.officialEmail, c.ownerEmail, c.adminEmail].map(norm).some((e) => e && wanted.includes(e))
      )
      if (clash) {
        throw new Error(`This email is already registered with "${clash.name}". Please use a different email address.`)
      }

      // 1. Create the primary admin account user credentials (role: owner for console auth access)
      try {
        await api.register({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: "owner",
          tenantId: instName
        })
      } catch (err: any) {
        if (/already exists|already registered|duplicate/i.test(err.message || "")) {
          throw new Error("This email is already registered. Please use a different email address.")
        }
        throw err
      }

      // 2. Register the training center with all registration details
      await api.createCenter({
        name: instName,
        tenantName: instName,
        location: address1 ? `${address1}, ${city}, ${state}` : `${city}, ${state}`,
        manager: ownerName || adminName,
        email: officialEmail || ownerEmail || adminEmail,
        phone: officialMobile || ownerMobile || adminMobile,
        status: status as any,
        enabledModules: [...ALL_MODULES],
        centerCode: instCode,
        academicYear,
        ownerName,
        ownerMobile,
        ownerEmail,
        ownerAltMobile,
        ownerDob,
        ownerPan,
        ownerAadhaar,
        ownerPhotoUrl: ownerPhotoName,
        address1,
        address2,
        country,
        state,
        city,
        pincode,
        gmapsUrl,
        googleMaps: gmapsUrl,
        officialEmail,
        officialMobile,
        whatsappNumber,
        whatsapp: whatsappNumber,
        website,
        adminName,
        adminEmail,
        adminMobile,
        adminUsername,
        selectedClasses,
        totalCapacity,
        capacityNoLimit,
        classroomsCount,
        openingDate,
        workingDays,
        operatingHoursStart: openingTime,
        operatingHoursEnd: closingTime,
        agreementStartDate,
        agreementEndDate,
        franchiseFee,
        renewalDate,
        agreementDocName,
        gstVatNumber: gstNumber,
        gstNumber,
        subPlan,
        subStartDate,
        subEndDate,
        studentLimit,
        staffLimit,
        paymentStatus,
        uploadedDocs,
      })

      addNotification({
        title: "Center Registered",
        description: `"${instName}" successfully registered with code ${instCode}.`,
        type: "system"
      })

      // Capture register details and open confirmation modal
      setRegisteredDetails({
        code: instCode,
        adminName,
        loginEmail: adminEmail,
        tempPassword: adminPassword,
        plan: subPlan,
        status: status.charAt(0).toUpperCase() + status.slice(1)
      })

      // Clear draft
      localStorage.removeItem("arka_kids_center_draft")
      setHasDraft(false)

      setShowSuccessDialog(true)
    } catch (err: any) {
      setValidationError(err.message || "An error occurred during center registration. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Copy details helper inside confirmation dialog
  const handleCopyCredentials = () => {
    if (!registeredDetails) return
    const text = `ARKA KIDS - Institute Registered Successfully\n\n` +
      `Institute Code: ${registeredDetails.code}\n` +
      `Franchise Admin Name: ${registeredDetails.adminName}\n` +
      `Login Email: ${registeredDetails.loginEmail}\n` +
      `Temporary Password: ${registeredDetails.tempPassword}\n` +
      `Subscription/Plan: ${registeredDetails.plan}\n` +
      `Status: ${registeredDetails.status}`
    
    navigator.clipboard.writeText(text)
    addNotification({
      title: "Copied Details",
      description: "Credentials copied to clipboard.",
      type: "system"
    })
  }

  // Steps indicator configuration
  const stepsConfig = [
    { num: 1, title: "Franchise & Owner" },
    { num: 2, title: "Location & Contacts" },
    { num: 3, title: "System & Classes" },
    { num: 4, title: "Contract & Plan" },
    { num: 5, title: "Documents & Register" }
  ]

  return (
    <div className="space-y-6 w-full mx-auto pb-20 px-4 md:px-6">
      
      {/* ─── Breadcrumb and Page Header ─── */}
      <div className="flex flex-col gap-2 border-b border-border/40 pb-4 max-w-6xl mx-auto">
        <button
          onClick={() => router.push("/centers")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Centers
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2 mt-1">
              <Building2 className="h-6 w-6 text-primary" />
              Register New Institute
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the institute details and owner login credentials. The owner can log in immediately after registration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
              Save Draft
            </Button>
          </div>
        </div>

        {/* Draft Restore Alert */}
        {hasDraft && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-primary-light/50 border border-primary/20 rounded-xl px-4 py-3 text-xs mt-3">
            <div className="flex items-center gap-2 text-primary font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>You have a saved registration draft from a previous session.</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLoadDraft}
                className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Restore Draft
              </button>
              <button 
                onClick={handleClearDraft}
                className="text-muted-foreground hover:text-foreground text-[11px] font-semibold px-2 py-1.5 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Horizontal 5-Step Progress Bar ─── */}
      <div className="max-w-6xl mx-auto w-full py-4">
        <div className="relative flex items-center justify-between w-full">
          
          {/* Connector Line behind steps */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-border z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />

          {stepsConfig.map((step) => {
            const isCompleted = step.num < currentStep
            const isActive = step.num === currentStep
            const isInvalidTried = hasTriedSubmit && step.num === currentStep && !isStepValid(step.num)

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => handleStepClick(step.num)}
                className="flex flex-col items-center relative z-10 focus:outline-none cursor-pointer group"
              >
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-success border-success text-white shadow-sm"
                      : isActive
                      ? isInvalidTried
                        ? "bg-destructive border-destructive text-white ring-4 ring-destructive/15"
                        : "bg-primary border-primary text-white ring-4 ring-primary/20 shadow-md scale-105"
                      : "bg-card border-border text-muted-foreground group-hover:border-primary-hover"
                  }`}
                >
                  {isCompleted ? <Check className="h-4.5 w-4.5 stroke-[2.5]" /> : step.num}
                </div>
                <span 
                  className={`hidden sm:block text-[11px] font-bold mt-2 text-center transition-colors max-w-[120px] ${
                    isActive 
                      ? isInvalidTried 
                        ? "text-destructive" 
                        : "text-primary" 
                      : isCompleted 
                      ? "text-slate-500" 
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Form Content Area (Centered & Utilizing Full Screen Width) ─── */}
      <div className="max-w-6xl mx-auto w-full">
        
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          
          {/* STEP 1: Institute Details & Owner Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* Card 1: Institute & Franchise Details */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Building2 className="h-4 w-4" />
                    Institute & Franchise Details
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Setup franchise identifiers and academic year settings.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Institute Name *</label>
                    <Input
                      required
                      placeholder="e.g. ABC Kids Play School"
                      value={instName}
                      onChange={e => setInstName(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5 hidden">
                    <label className="text-xs font-semibold text-muted-foreground">Institute Code (Auto-generated) *</label>
                    <Input
                      disabled
                      placeholder="e.g. IPA-BLR-001"
                      value={instCode}
                      className="text-xs h-10 font-mono bg-disabled-bg/50"
                    />
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Academic Year Start Date *</label>
                    <Input
                      type="date"
                      required
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Select
                      label="Status *"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="text-xs h-10"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Owner / Franchisee Details */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" />
                    Owner / Franchisee Details
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Personal profile and verification data of the franchisee owner.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Owner / Franchisee Name *</label>
                      <Input
                        required
                        placeholder="e.g. Sarah Jenkins"
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Mobile Number *</label>
                      <Input
                        required
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={ownerMobile}
                        onChange={e => setOwnerMobile(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Email Address *</label>
                      <Input
                        required
                        type="email"
                        placeholder="owner@example.com"
                        value={ownerEmail}
                        onChange={e => setOwnerEmail(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Alternate Mobile</label>
                      <Input
                        type="tel"
                        placeholder="e.g. +91 98765 43211"
                        value={ownerAltMobile}
                        onChange={e => setOwnerAltMobile(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
                      <Input
                        type="date"
                        value={ownerDob}
                        onChange={e => setOwnerDob(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">PAN Number</label>
                      <Input
                        placeholder="ABCDE1234F"
                        value={ownerPan}
                        onChange={e => setOwnerPan(e.target.value)}
                        className="text-xs h-10 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Aadhaar Number</label>
                      <Input
                        placeholder="1234 5678 9012"
                        value={ownerAadhaar}
                        onChange={e => setOwnerAadhaar(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Profile Photo (Optional)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 text-xs font-medium cursor-pointer transition-colors text-foreground shrink-0">
                          <Upload className="h-3.5 w-3.5" />
                          Browse Photo
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setOwnerPhotoName(e.target.files[0].name)
                              }
                            }}
                          />
                        </label>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {ownerPhotoName || "No photo selected"}
                        </span>
                        {ownerPhotoName && (
                          <button 
                            type="button" 
                            onClick={() => setOwnerPhotoName("")}
                            className="text-destructive hover:text-[#A80812] transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* STEP 2: Institute Address & Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              {/* Card 1: Address Details */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" />
                    Institute Address
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Physical address and localization configurations for maps lookup.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Address Line 1 *</label>
                      <Input
                        required
                        placeholder="Street address, building, floor"
                        value={address1}
                        onChange={e => setAddress1(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Address Line 2</label>
                      <Input
                        placeholder="Apartment, suite, unit, area"
                        value={address2}
                        onChange={e => setAddress2(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 grid-cols-1 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Country *</label>
                      <Input
                        required
                        placeholder="e.g. India"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Select
                        label="State *"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="text-xs h-10"
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Gujarat">Gujarat</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">District / City *</label>
                      <Input
                        required
                        placeholder="e.g. Mumbai"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Pincode *</label>
                      <Input
                        required
                        placeholder="e.g. 400001"
                        value={pincode}
                        onChange={e => setPincode(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Google Maps Location Link (Optional)</label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="https://maps.google.com/?q=..."
                        value={gmapsUrl}
                        onChange={e => setGmapsUrl(e.target.value)}
                        className="text-xs h-10 pl-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Contact Details */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4" />
                    Contact Details
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Official endpoints and media handles for parent outreach.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Official Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        required
                        type="email"
                        placeholder="contact@arkaschool.com"
                        value={officialEmail}
                        onChange={e => setOfficialEmail(e.target.value)}
                        className="text-xs h-10 pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Official Mobile *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        required
                        placeholder="+91 98765 43220"
                        value={officialMobile}
                        onChange={e => setOfficialMobile(e.target.value)}
                        className="text-xs h-10 pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number</label>
                    <Input
                      placeholder="+91 98765 43220"
                      value={whatsappNumber}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Website (Optional)</label>
                    <Input
                      placeholder="https://www.arkaschool.com"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* STEP 3: Primary Admin & Play School Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              
              {/* Card 1: Primary Admin Account */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                        <KeyRound className="h-4 w-4" />
                        Primary Admin Account
                      </CardTitle>
                      <CardDescription className="text-xs font-medium">Core login credentials for the Franchise Administrator.</CardDescription>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsOwner}
                        onChange={e => setSameAsOwner(e.target.checked)}
                        className="rounded text-primary border-border focus:ring-primary h-3.5 w-3.5"
                      />
                      Same as Owner details
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 grid-cols-1 md:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Admin Name *</label>
                      <Input
                        required
                        disabled={sameAsOwner}
                        placeholder="e.g. Sarah Jenkins"
                        value={adminName}
                        onChange={e => setAdminName(e.target.value)}
                        className="text-xs h-10 disabled:bg-disabled-bg/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Admin Email *</label>
                      <Input
                        required
                        type="email"
                        disabled={sameAsOwner}
                        placeholder="admin@franchise.com"
                        value={adminEmail}
                        onChange={e => setAdminEmail(e.target.value)}
                        className="text-xs h-10 disabled:bg-disabled-bg/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Admin Mobile *</label>
                      <Input
                        required
                        disabled={sameAsOwner}
                        placeholder="+91 98765 43210"
                        value={adminMobile}
                        onChange={e => setAdminMobile(e.target.value)}
                        className="text-xs h-10 disabled:bg-disabled-bg/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Username *</label>
                      <Input
                        required
                        placeholder="e.g. sarah_admin"
                        value={adminUsername}
                        onChange={e => setAdminUsername(e.target.value)}
                        className="text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Temporary Password *</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          required
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={adminPassword}
                          onChange={e => setAdminPassword(e.target.value)}
                          className="text-xs h-10 pl-9 pr-20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          title="Generate random password"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors p-1 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendWelcome}
                          onChange={e => setSendWelcome(e.target.checked)}
                          className="rounded text-primary border-border focus:ring-primary h-4 w-4"
                        />
                        Send Welcome Email/SMS
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* STEP 4: Agreement & Subscription Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              
              {/* Card 1: Agreement Info */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <FileText className="h-4 w-4" />
                    Agreement / Franchise Information
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Franchise fee structures, agreement limits, and tax configurations.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 grid-cols-1 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Agreement Start Date *</label>
                    <Input
                      required
                      type="date"
                      value={agreementStartDate}
                      onChange={e => setAgreementStartDate(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Agreement End Date</label>
                    <Input
                      type="date"
                      value={agreementEndDate}
                      onChange={e => setAgreementEndDate(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Franchise Fee</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="e.g. 150000"
                        value={franchiseFee}
                        onChange={e => setFranchiseFee(e.target.value)}
                        className="text-xs h-10 pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Renewal Date</label>
                    <Input
                      type="date"
                      value={renewalDate}
                      onChange={e => setRenewalDate(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block">Agreement Document (PDF)</label>
                    <div className="flex items-center gap-3 h-10">
                      <label className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 text-xs font-medium cursor-pointer transition-colors text-foreground shrink-0">
                        <Upload className="h-3.5 w-3.5" />
                        Upload PDF
                        <input 
                          type="file" 
                          accept=".pdf"
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAgreementDocName(e.target.files[0].name)
                            }
                          }}
                        />
                      </label>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {agreementDocName || "No PDF uploaded"}
                      </span>
                      {agreementDocName && (
                        <button 
                          type="button" 
                          onClick={() => setAgreementDocName("")}
                          className="text-destructive hover:text-[#A80812] transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">GST Number (If applicable)</label>
                    <Input
                      placeholder="27AAAAA1111A1Z1"
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value)}
                      className="text-xs h-10 font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 5: Document Uploads & Register Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              
              {/* Card 1: Documents Upload */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Upload className="h-4 w-4" />
                    Documents Upload
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Verify legal status of the franchisee node using official ID proofs.</CardDescription>
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
                    ].map(docItem => {
                      const fileName = uploadedDocs[docItem.key]
                      const isUploading = uploadingDocKey === docItem.key
                      return (
                        <div key={docItem.key} className="p-4 rounded-xl border border-border bg-secondary/15 flex flex-col gap-2 justify-between min-h-[90px]">
                          <span className="text-[11px] font-bold text-foreground block">{docItem.label}</span>
                          <div className="flex items-center gap-2 justify-between">
                            {isUploading ? (
                              <span className="text-xs text-muted-foreground italic">Uploading…</span>
                            ) : fileName ? (
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-xs text-slate-700 truncate">{decodeURIComponent(fileName.split("/").pop() || fileName)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No file chosen</span>
                            )}

                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="p-1.5 rounded-lg border border-border hover:bg-card cursor-pointer transition-colors bg-white shadow-xs">
                                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    e.target.value = ""
                                    if (file) triggerDocUpload(docItem.key, file)
                                  }}
                                />
                              </label>
                              {fileName && (
                                <button 
                                  type="button" 
                                  onClick={() => removeDoc(docItem.key)}
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

              {/* Card 2: Final Registration Action Card */}
              <Card className="bg-card border-border/80">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Register Center & Complete Setup
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">Verify credentials summary and dispatch notification emails immediately.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border text-xs text-slate-600">
                    <AlertCircle className="h-4 w-4 text-[#FBBE00] shrink-0" />
                    <span>Please ensure all details in Steps 1 to 4 are completed before executing submission.</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* ─── Validation Error Banner ─── */}
          {validationError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-destructive bg-destructive/5 text-destructive text-xs font-semibold max-w-6xl mx-auto">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{validationError}</p>
            </div>
          )}

          {/* ─── Wizard Footer Buttons ─── */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40 max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/centers")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleSaveDraft}
                disabled={saving}
              >
                Save as Draft
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackStep}
                  disabled={saving}
                >
                  Back
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                  isLoading={checkingEmail}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  className="shadow-sm shadow-primary/20"
                >
                  {saving ? "Registering..." : "Register Institute"}
                </Button>
              )}
            </div>
          </div>

        </form>

      </div>

      {/* ─── Success Confirmation Dialog Modal ─── */}
      <Dialog
        isOpen={showSuccessDialog}
        dismissible={false}
        onClose={() => {
          setShowSuccessDialog(false)
          router.push("/centers")
        }}
        title="Institute Registered Successfully"
        description="The new preschool branch has been established in the head office database. The Franchise Admin login credentials are ready."
        className="max-w-md"
      >
        {registeredDetails && (
          <div className="space-y-5">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-success">Active Network Node Created</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Franchise Administrator credentials have been dispatched and are ready for CRM access.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/10 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <span className="font-semibold text-muted-foreground">Institute Code</span>
                <span className="font-mono font-bold text-foreground bg-card border px-2 py-0.5 rounded-md">{registeredDetails.code}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <span className="font-semibold text-muted-foreground">Franchise Admin</span>
                <span className="font-bold text-foreground">{registeredDetails.adminName}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <span className="font-semibold text-muted-foreground">Login Email</span>
                <span className="font-bold text-foreground">{registeredDetails.loginEmail}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <span className="font-semibold text-muted-foreground">Temporary Password</span>
                <span className="font-mono font-bold text-[#FBBE00] bg-slate-950 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  {registeredDetails.tempPassword}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                <span className="font-semibold text-muted-foreground">Subscription/Plan</span>
                <span className="font-bold text-foreground">{registeredDetails.plan}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Status</span>
                <span className="font-bold text-success">{registeredDetails.status}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Copy}
                onClick={handleCopyCredentials}
                className="flex-1"
              >
                Copy Details
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowSuccessDialog(false)
                  router.push("/centers")
                }}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  )
}
