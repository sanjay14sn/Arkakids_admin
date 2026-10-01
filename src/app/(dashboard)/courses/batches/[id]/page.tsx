"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Calendar, Clock, UserCheck, Users, Sparkles,
  Video, ExternalLink, MapPin, Save, BookOpen, ShieldAlert,
  Search, Check, Info, AlertTriangle, Monitor, PlayCircle, Eye,
  CheckCircle2, RotateCcw, ChevronLeft, ChevronRight, Filter
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { fetchAPI, api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { defaultSessionEndFromStart, formatSessionTimeRange } from "@/lib/sessionUtils"

type BatchMode = "online" | "offline" | "recorded"
type BatchStatus = "active" | "completed"

interface Student {
  id: string
  name: string
  email: string
  status: "active" | "completed" | "dropped"
  course?: string
}

const mockActiveStudents: Student[] = [
  { id: "s-101", name: "David Miller", email: "david.m@student.com", status: "active", course: "Toddler Program" },
  { id: "s-102", name: "Elena Rostova", email: "elena.r@student.com", status: "active" },
  { id: "s-103", name: "Hiroshi Tanaka", email: "hiroshi.t@student.com", status: "active" },
  { id: "s-104", name: "Chloe Dupont", email: "chloe.d@student.com", status: "active" },
  { id: "s-105", name: "Tariq Al-Mansoor", email: "tariq.a@student.com", status: "active" },
  { id: "s-106", name: "Emily Parker", email: "emily@apexacademy.com", status: "active" },
  { id: "s-107", name: "Lucas Vance", email: "lucas@vance.com", status: "active" }
]

export default function EditBatchPage() {
  const router = useRouter()
  const params = useParams()
  const batchId = params.id as string

  const { user, addNotification, activeTenant } = useStore()
  const isTrainer = user?.role === "trainer"
  const isAdmin = user?.role === "owner" || user?.role === "super_admin"

  React.useEffect(() => {
    if (user && user.role === "student") {
      router.replace("/courses")
    }
  }, [user, router])

  // Data lists from API
  const [courses, setCourses] = React.useState<any[]>([])
  const [trainers, setTrainers] = React.useState<any[]>([])
  const [centersList, setCentersList] = React.useState<string[]>([])
  const [activeStudentsList, setActiveStudentsList] = React.useState<Student[]>(mockActiveStudents)

  // Loading and Error States
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  // Form Fields
  const [code, setCode] = React.useState("")
  const [courseName, setCourseName] = React.useState("")
  const [trainerName, setTrainerName] = React.useState("")
  const [schedule, setSchedule] = React.useState("")
  const [capacity, setCapacity] = React.useState("25")
  const [meetLink, setMeetLink] = React.useState("")
  const [platform, setPlatform] = React.useState<"gmeet" | "zoom" | "teams" | "discord">("gmeet")
  const [selectedCenterName, setSelectedCenterName] = React.useState("")
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<BatchMode>("online")
  const [roomName, setRoomName] = React.useState("")
  const [nextSessionDate, setNextSessionDate] = React.useState("")
  const [nextSessionTopic, setNextSessionTopic] = React.useState("")
  const [sessions, setSessions] = React.useState<{ topic: string; date: string; endDate?: string }[]>([])
  const [batchStatus, setBatchStatus] = React.useState<BatchStatus>("active")
  const [completedAt, setCompletedAt] = React.useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)

  // Student Search, Filter, Pagination
  const [studentSearchQuery, setStudentSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<"all" | "enrolled" | "unassigned">("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  React.useEffect(() => {
    setCurrentPage(1)
  }, [studentSearchQuery, filterStatus])

  const filteredStudents = React.useMemo(() => {
    return activeStudentsList.filter((st) => {
      // Role logic
      if (isTrainer && !selectedStudentIds.includes(st.id)) return false
      
      // Text search
      const query = studentSearchQuery.toLowerCase()
      if (query && !st.name.toLowerCase().includes(query) && !st.email.toLowerCase().includes(query)) {
        return false
      }

      // Dropdown filter
      const isSelected = selectedStudentIds.includes(st.id)
      if (filterStatus === "enrolled" && !isSelected) return false
      if (filterStatus === "unassigned" && isSelected) return false

      // Course constraint: only show students enrolled in this batch's course
      if (courseName && st.course) {
        // If the DB course wrongly contains the batch name (e.g. Toddler Program - A), we check if it includes the courseName
        if (st.course !== courseName && !st.course.startsWith(courseName)) {
          return false
        }
      }

      return true
    })
  }, [activeStudentsList, studentSearchQuery, filterStatus, selectedStudentIds, isTrainer, courseName])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage))
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  React.useEffect(() => {
    const loadBatchAndData = async () => {
      try {
        setIsLoading(true)
        setErrorMsg("")

        const [batchData, coursesData, trainersData, studentsData, centersData] = await Promise.all([
          fetchAPI(`/batches/${batchId}`),
          fetchAPI('/courses'),
          isTrainer ? Promise.resolve([]) : fetchAPI('/trainers').catch(() => []),
          isTrainer ? api.getTrainerStudents().catch(() => []) : fetchAPI('/students').catch(() => []),
          isAdmin ? fetchAPI('/centers').catch(() => []) : Promise.resolve([])
        ])

        // Set catalog selections
        setCourses(coursesData)
        
        const trainersList = trainersData && trainersData.length > 0 ? trainersData : [{ name: "Marcus Vance" }, { name: "Samantha Cole" }]
        setTrainers(trainersList)

        const centersFiltered =
          user?.role === "super_admin"
            ? centersData || []
            : (centersData || []).filter(
                (center: any) =>
                  (center.tenantName || "").trim().toLowerCase() ===
                  (user?.tenantId || activeTenant?.name || "").trim().toLowerCase()
              )

        const centers =
          centersFiltered.length > 0
            ? centersFiltered.map((c: any) => c.name)
            : user?.tenantId
              ? [user.tenantId.trim()]
              : []
        setCentersList(centers)

        // Process student list
        let formattedStudents = mockActiveStudents
        if (studentsData && studentsData.length > 0) {
          formattedStudents = studentsData
            .filter((st: any) => st.status === 'active')
            .map((st: any) => ({
              id: st.id || st._id,
              name: st.name,
              email: st.email,
              status: st.status,
              course: st.course || st.className || st.classId || ""
            }))
          setActiveStudentsList(formattedStudents)
        }

        // Hydrate batch data
        if (batchData) {
          setCode(batchData.code || "")
          setCourseName(batchData.courseName || "")
          setTrainerName(batchData.trainerName || "")
          setSchedule(batchData.schedule || "")
          setCapacity(String(batchData.capacity || 25))
          setMeetLink(batchData.meetLink || "")
          setPlatform(batchData.platform || "gmeet")
          setSelectedCenterName(batchData.centerName || "")
          setMode(batchData.mode || "online")
          setRoomName(batchData.roomName || "")
          setNextSessionDate(batchData.nextSessionDate || "")
          setNextSessionTopic(batchData.nextSessionTopic || "")
          setSessions(batchData.sessions || [])
          setBatchStatus(batchData.status === "completed" ? "completed" : "active")
          setCompletedAt(batchData.completedAt || null)

          // Map student names to internal IDs
          const studentIds = formattedStudents
            .filter(st => batchData.studentNames?.includes(st.name))
            .map(st => st.id)
          setSelectedStudentIds(studentIds)
        }
      } catch (err: any) {
        console.error("Failed to load edit batch data:", err)
        setErrorMsg(err.message || "Failed to retrieve batch configuration from the server.")
      } finally {
        setIsLoading(false)
      }
    }

    loadBatchAndData()
  }, [batchId, user?.role, user?.tenantId, activeTenant?.name])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) {
      alert("Please fill in the Batch Code.")
      return
    }

    setIsSaving(true)
    const enrolledStudents = activeStudentsList
      .filter((st) => selectedStudentIds.includes(st.id))
      .map((st) => st.name)

    const firstSession = sessions[0]
    const payload = {
      code,
      courseName,
      trainerName,
      schedule,
      enrolled: enrolledStudents.length,
      capacity: Number(capacity),
      meetLink: mode === "online" || mode === "recorded" ? (meetLink || undefined) : undefined,
      platform: mode === "online" && meetLink ? platform : undefined,
      centerName: selectedCenterName,
      studentNames: enrolledStudents,
      mode,
      roomName: mode === "offline" ? roomName : undefined,
      nextSessionDate: firstSession ? (firstSession.date || undefined) : undefined,
      nextSessionTopic: firstSession ? (firstSession.topic || undefined) : undefined,
      sessions
    }

    try {
      await fetchAPI(`/batches/${batchId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      addNotification({
        title: "Batch Configuration Saved",
        description: `Successfully updated settings for training cohort "${code}".`,
        type: "admissions"
      })

      router.push("/courses")
    } catch (err: any) {
      console.error("Failed to save batch:", err)
      alert(err.message || "Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleBatchStatus = async () => {
    const nextStatus: BatchStatus = batchStatus === "completed" ? "active" : "completed"
    const actionLabel = nextStatus === "completed" ? "mark this batch as completed" : "reopen this batch"
    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) {
      return
    }

    setIsUpdatingStatus(true)
    try {
      const updated = await fetchAPI(`/batches/${batchId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })
      setBatchStatus(updated.status === "completed" ? "completed" : "active")
      setCompletedAt(updated.completedAt || null)
      addNotification({
        title: nextStatus === "completed" ? "Batch Completed" : "Batch Reopened",
        description:
          nextStatus === "completed"
            ? `Batch "${code}" is marked as completed.`
            : `Batch "${code}" is active again.`,
        type: "admissions",
      })
    } catch (err: any) {
      alert(err.message || "Failed to update batch status.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Generate initials for avatars
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider animate-pulse">
          Loading Batch Workspace...
        </p>
      </div>
    )
  }

  if (errorMsg || !code) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert className="h-12 w-12 text-red-500 animate-bounce" />
        <h2 className="text-xl font-bold text-foreground">Cohort Not Found</h2>
        <p className="text-sm text-muted-foreground">{errorMsg || "The requested training batch does not exist."}</p>
        <Button variant="outline" onClick={() => router.push("/courses")}>
          Go Back to Courses
        </Button>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push("/courses")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Courses</span>
          </button>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2 mt-1">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>{isTrainer ? "Manage Training Batch" : "Edit Training Batch"}</span>
            <span className="text-sm font-normal text-muted-foreground">/</span>
            <Badge variant="outline" className="text-xs font-mono font-extrabold bg-primary/10 border-primary/20 text-primary px-2.5 py-0.5 animate-pulse">
              {code}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground">
            {isTrainer
              ? "Update schedules and upcoming class information for your batch."
              : "Modify schedules, room allocation, and update cohort student enrollment."}
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          {batchStatus === "completed" && (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] self-start sm:self-auto">
              Completed
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUpdatingStatus}
            onClick={handleToggleBatchStatus}
            className={`h-8 text-xs gap-1.5 ${batchStatus === "completed" ? "" : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"}`}
          >
            {batchStatus === "completed" ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen Batch
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Batch Completed
              </>
            )}
          </Button>
        </div>
      </div>

      {batchStatus === "completed" && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            This batch is completed
          </p>
          <p className="mt-1">
            Live sessions and meet links are hidden from the courses page. LMS access remains available for enrolled students.
            {completedAt && (
              <> Completed on {new Date(completedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}.</>
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-border/60 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-1/2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="pl-9 bg-muted/20 border-border/80 h-9 text-xs w-full focus-visible:ring-1 focus-visible:ring-primary/50"
              />
            </div>
            
            <div className="relative w-36">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-muted/20 border-border/80 h-9 text-xs w-full focus-visible:ring-1 focus-visible:ring-primary/50"
              >
                <option value="all">All Status</option>
                <option value="enrolled">Enrolled Only</option>
                <option value="unassigned">Unassigned Only</option>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-muted-foreground mr-2">
              <span className="text-primary font-bold">{selectedStudentIds.length}</span> selected
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/courses")} className="h-8 text-xs">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} icon={Save} className="h-8 text-xs shadow-sm">
              Save Roster
            </Button>
          </div>
        </div>

        {/* Zoho-style List View */}
        <div className="bg-card rounded-xl shadow-sm border border-border/60 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase">
                  <th className="p-3 w-12 text-center">
                    {!isTrainer && (
                      <div
                        onClick={() => {
                          if (selectedStudentIds.length === activeStudentsList.length) {
                            setSelectedStudentIds([])
                          } else {
                            setSelectedStudentIds(activeStudentsList.map(s => s.id))
                          }
                        }}
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center cursor-pointer mx-auto transition-colors",
                          selectedStudentIds.length === activeStudentsList.length && activeStudentsList.length > 0
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-card hover:border-primary/50"
                        )}
                      >
                        {selectedStudentIds.length === activeStudentsList.length && activeStudentsList.length > 0 && <Check className="h-3 w-3" />}
                      </div>
                    )}
                  </th>
                  <th className="p-3 font-semibold">Student Name</th>
                  <th className="p-3 font-semibold">Contact / Email</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 min-h-[400px]">
                {paginatedStudents.map((st) => {
                  const isSelected = selectedStudentIds.includes(st.id)
                  const initials = getInitials(st.name)
                  
                  return (
                    <tr
                      key={st.id}
                      onClick={() => {
                        if (isTrainer) return
                        if (isSelected) {
                          setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id))
                        } else {
                          setSelectedStudentIds([...selectedStudentIds, st.id])
                        }
                      }}
                      className={cn(
                        "transition-colors group",
                        isTrainer ? "cursor-default" : "cursor-pointer hover:bg-muted/20",
                        isSelected ? "bg-primary/[0.02]" : ""
                      )}
                    >
                      <td className="p-3 text-center">
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center mx-auto transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-card group-hover:border-primary/50"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0",
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {initials}
                          </div>
                          <span className={cn("font-semibold text-[13px]", isSelected ? "text-foreground" : "text-muted-foreground")}>
                            {st.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{st.email || "—"}</td>
                      <td className="p-3">
                        {isSelected ? (
                          <Badge variant="success" className="text-[10px] h-5 px-1.5">Enrolled</Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium px-1.5">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {paginatedStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No students found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-border/60 bg-muted/10 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className="flex items-center justify-center px-3 text-xs font-semibold">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  )
}
