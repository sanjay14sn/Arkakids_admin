import { type ModuleKey, ALL_MODULES } from "@/store/useStore"

export type BranchType = "single" | "multiple"
export type CenterStatus = "active" | "inactive" | "maintenance"

export interface CenterConfig {
  // Core
  name: string
  tenantName: string
  location: string
  manager: string
  email: string
  phone: string
  status: CenterStatus
  branchType: BranchType
  centerCode: string
  city: string
  state: string
  pincode: string
  country: string
  timezone: string
  operatingHoursStart: string
  operatingHoursEnd: string
  maxStudentCapacity: number
  maxTrainers: number
  maxBdes: number
  enabledModules: ModuleKey[]

  // Branding
  logoUrl: string
  faviconUrl: string
  brandColor: string
  secondaryBrandColor: string
  tagline: string
  welcomeMessage: string
  customDomain: string
  publicPortalEnabled: boolean
  website: string
  linkedin: string
  instagram: string
  whatsapp: string
  youtube: string
  facebook: string
  twitter: string
  googleMaps: string

  // Notifications
  smsProvider: string
  whatsappAlerts: boolean
  smsAlertsEnabled: boolean
  emailSender: string
  reminderTimings: string
  dailyDigestEnabled: boolean
  emailAlertsFees: boolean
  emailAlertsAttendance: boolean
  emailAlertsAdmissions: boolean
  emailAlertsLeads: boolean
  feeReminderDaysBefore: number
  feeReminderAutoSend: boolean

  // Billing
  gstVatNumber: string
  invoicePrefix: string
  currency: string
  paymentGateway: string
  taxRatePercent: number
  lateFeePercent: number
  lateFeeGraceDays: number
  allowPartialPayments: boolean
  autoGenerateReceipts: boolean
  invoiceFooterNote: string
  defaultInstallmentCount: number
  scholarshipTrackingEnabled: boolean

  // Access & features
  allowStudentPortal: boolean
  allowLeadCsvImport: boolean
  allowBdeDirectConvert: boolean
  allowTrainerDeleteBatch: boolean
  enableCampaigns: boolean
  enableHrModule: boolean
  enableLmsAiTutor: boolean
  enableJobPortal: boolean

  // Attendance
  defaultClassDuration: number
  minAttendancePercent: number
  lowAttendanceThreshold: number
  autoAbsentAfterMinutes: number
  allowLateAttendanceMarking: boolean
  geofenceEnabled: boolean
  geofenceRadiusMeters: number

  // Security
  sessionTimeoutMinutes: number
  passwordMinLength: number
  requireOwnerTwoFactor: boolean
  dataRetentionDays: number
  ipWhitelist: string

  // Lead Chatbot Configuration
  leadChatbotEnabled: boolean
  leadChatbotAutoOutreach: boolean
  leadChatbotInboundEnabled: boolean
  mailHost: string
  mailPort: number
  mailSecure: boolean
  mailUsername: string
  mailPassword: string
  mailFrom: string
  googleClientId: string
  googleClientSecret: string
  googleRedirectUri: string
  googleRefreshToken: string
  autoAiReply: boolean
  // Registration Details & Franchise Profile
  academicYear: string
  ownerName: string
  ownerMobile: string
  ownerEmail: string
  ownerAltMobile: string
  ownerDob: string
  ownerPan: string
  ownerAadhaar: string
  ownerPhotoUrl: string
  address1: string
  address2: string
  gmapsUrl: string
  officialEmail: string
  officialMobile: string
  whatsappNumber: string
  adminName: string
  adminEmail: string
  adminMobile: string
  adminUsername: string
  selectedClasses: string[]
  totalCapacity: string
  capacityNoLimit: boolean
  classroomsCount: number
  openingDate: string
  workingDays: string[]
  agreementStartDate: string
  agreementEndDate: string
  franchiseFee: string
  renewalDate: string
  agreementDocName: string
  gstNumber: string
  subPlan: string
  subStartDate: string
  subEndDate: string
  studentLimit: string
  staffLimit: string
  paymentStatus: string
  uploadedDocs: Record<string, string>
}

export const DEFAULT_CENTER_CONFIG: CenterConfig = {
  name: "",
  tenantName: "",
  location: "",
  manager: "",
  email: "",
  phone: "",
  status: "active",
  branchType: "multiple",
  centerCode: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  timezone: "Asia/Kolkata",
  operatingHoursStart: "09:00",
  operatingHoursEnd: "18:00",
  maxStudentCapacity: 500,
  maxTrainers: 25,
  maxBdes: 10,
  enabledModules: [...ALL_MODULES],

  // Registration & Owner Details
  academicYear: "",
  ownerName: "",
  ownerMobile: "",
  ownerEmail: "",
  ownerAltMobile: "",
  ownerDob: "",
  ownerPan: "",
  ownerAadhaar: "",
  ownerPhotoUrl: "",
  address1: "",
  address2: "",
  gmapsUrl: "",
  officialEmail: "",
  officialMobile: "",
  whatsappNumber: "",
  adminName: "",
  adminEmail: "",
  adminMobile: "",
  adminUsername: "",
  selectedClasses: ["Toddler", "Nursery", "Jr. KG", "Sr. KG"],
  totalCapacity: "120",
  capacityNoLimit: false,
  classroomsCount: 6,
  openingDate: "",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  agreementStartDate: "",
  agreementEndDate: "",
  franchiseFee: "",
  renewalDate: "",
  agreementDocName: "",
  gstNumber: "",
  subPlan: "Standard",
  subStartDate: "",
  subEndDate: "",
  studentLimit: "200",
  staffLimit: "15",
  paymentStatus: "Pending",
  uploadedDocs: {},

  logoUrl: "",
  faviconUrl: "",
  brandColor: "#3b82f6",
  secondaryBrandColor: "#10b981",
  tagline: "",
  welcomeMessage: "",
  customDomain: "",
  publicPortalEnabled: true,
  website: "",
  linkedin: "",
  instagram: "",
  whatsapp: "",
  youtube: "",
  facebook: "",
  twitter: "",
  googleMaps: "",

  smsProvider: "twilio",
  whatsappAlerts: true,
  smsAlertsEnabled: false,
  emailSender: "",
  reminderTimings: "24h",
  dailyDigestEnabled: true,
  emailAlertsFees: true,
  emailAlertsAttendance: true,
  emailAlertsAdmissions: true,
  emailAlertsLeads: true,
  feeReminderDaysBefore: 3,
  feeReminderAutoSend: true,

  gstVatNumber: "",
  invoicePrefix: "INV",
  currency: "INR",
  paymentGateway: "razorpay",
  taxRatePercent: 18,
  lateFeePercent: 2,
  lateFeeGraceDays: 7,
  allowPartialPayments: true,
  autoGenerateReceipts: true,
  invoiceFooterNote: "",
  defaultInstallmentCount: 3,
  scholarshipTrackingEnabled: false,

  allowStudentPortal: true,
  allowLeadCsvImport: true,
  allowBdeDirectConvert: false,
  allowTrainerDeleteBatch: false,
  enableCampaigns: true,
  enableHrModule: true,
  enableLmsAiTutor: true,
  enableJobPortal: true,

  defaultClassDuration: 90,
  minAttendancePercent: 75,
  lowAttendanceThreshold: 75,
  autoAbsentAfterMinutes: 15,
  allowLateAttendanceMarking: true,
  geofenceEnabled: false,
  geofenceRadiusMeters: 200,

  sessionTimeoutMinutes: 480,
  passwordMinLength: 6,
  requireOwnerTwoFactor: false,
  dataRetentionDays: 365,
  ipWhitelist: "",

  // Chatbot config defaults
  leadChatbotEnabled: true,
  leadChatbotAutoOutreach: true,
  leadChatbotInboundEnabled: true,
  mailHost: "",
  mailPort: 587,
  mailSecure: false,
  mailUsername: "",
  mailPassword: "",
  mailFrom: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRedirectUri: "",
  googleRefreshToken: "",
  autoAiReply: true,
}

export function centerFromApi(data: Record<string, unknown>): CenterConfig {
  const base = { ...DEFAULT_CENTER_CONFIG }
  for (const key of Object.keys(DEFAULT_CENTER_CONFIG) as (keyof CenterConfig)[]) {
    if (data[key] !== undefined && data[key] !== null) {
      ;(base as Record<string, unknown>)[key] = data[key]
    }
  }

  // Cross-compatibility fallbacks between API data and edit forms
  if (!base.tenantName && base.name) base.tenantName = base.name as string
  if (!base.ownerName && base.manager) base.ownerName = base.manager as string
  if (!base.manager && base.ownerName) base.manager = base.ownerName as string
  if (!base.officialEmail && base.email) base.officialEmail = base.email as string
  if (!base.email && base.officialEmail) base.email = base.officialEmail as string
  if (!base.officialMobile && base.phone) base.officialMobile = base.phone as string
  if (!base.phone && base.officialMobile) base.phone = base.officialMobile as string
  if (!base.address1 && base.location) base.address1 = base.location as string
  if (!base.location && base.address1) {
    base.location = [base.address1, base.city, base.state].filter(Boolean).join(", ")
  }
  if (!base.gstVatNumber && data.gstNumber) base.gstVatNumber = data.gstNumber as string
  if (!base.gstNumber && base.gstVatNumber) base.gstNumber = base.gstVatNumber as string
  if (!base.whatsappNumber && (data.whatsapp || base.whatsapp)) base.whatsappNumber = (data.whatsapp || base.whatsapp) as string
  if (!base.whatsapp && base.whatsappNumber) base.whatsapp = base.whatsappNumber as string
  if (!base.gmapsUrl && base.googleMaps) base.gmapsUrl = base.googleMaps as string
  if (!base.googleMaps && base.gmapsUrl) base.googleMaps = base.gmapsUrl as string

  if (Array.isArray(data.enabledModules)) {
    base.enabledModules = data.enabledModules as ModuleKey[]
  }
  return base
}

export function centerToPayload(config: CenterConfig): Record<string, unknown> {
  return { ...config }
}

export const CONFIG_TABS = [
  { id: "general", label: "General", description: "Profile, location, and primary contacts" },
  { id: "modules", label: "Modules", description: "Enable platform modules for this center" },
  { id: "access", label: "Access & limits", description: "Roles, caps, and feature gates" },
  { id: "branding", label: "Branding", description: "Visual identity and public links" },
  { id: "notifications", label: "Notifications", description: "Email, SMS, and alert channels" },
  { id: "chatbot", label: "Lead Chatbot", description: "SMTP and Google OAuth settings for automated AI outreach" },
  { id: "billing", label: "Billing & tax", description: "Currency, gateway, and invoicing" },
  { id: "attendance", label: "Attendance", description: "Class rules and geofencing" },
  { id: "security", label: "Security", description: "Sessions, passwords, and access control" },
  { id: "operations", label: "Operations", description: "Timezone, hours, and regional settings" },
] as const

export type ConfigTabId = (typeof CONFIG_TABS)[number]["id"]
