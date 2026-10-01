"use client"

import * as React from "react"
import { BookOpen, Plus, Clock, Users, Edit, Trash2, ClipboardList } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { fetchAPI, api } from "@/lib/api"
import { studentNameInBatch } from "@/lib/lms"
import { useRouter, useSearchParams } from "next/navigation"
import { useCenterPolicy } from "@/hooks/useCenterPolicy"
import { ATTENDANCE_CHILDREN } from "@/lib/preschoolAttendance"
import {
  ACADEMIC_YEARS,
  CLASSROOMS,
  PREVIEW_STAFF,
  SECTIONS,
  WEEKDAYS,
  buildSchedule,
  makeBatchCode,
} from "@/lib/preschoolBatch"
import {
  formatAgeGroup,
  makeProgramCode,
  mergeProgramLists,
  parseAgeRange,
  persistPrograms,
  programKey,
  uniqueDurations,
  uniqueProgramNames,
  type ProgramStatus,
  type SavedClassProgram,
} from "@/lib/preschoolProgram"

type BatchMode = "online" | "offline" | "recorded"
type BatchStatus = "active" | "inactive" | "completed"

export interface Batch {
  id: string
  code: string
  courseName: string
  trainerName: string
  schedule: string
  enrolled: number
  capacity: number
  meetLink?: string
  platform?: "gmeet" | "zoom" | "teams" | "discord"
  centerName?: string
  studentNames?: string[]
  mode?: BatchMode
  status?: BatchStatus
  completedAt?: string
  roomName?: string
  nextSessionDate?: string
  nextSessionTopic?: string
  nextSessionEndDate?: string
  sessions?: { topic: string; date: string; endDate?: string }[]
  academicYear?: string
  section?: string
  classTeacherName?: string
  assistantTeacherName?: string
  startTime?: string
  endTime?: string
  workingDays?: string[]
}

interface Student {
  id: string
  name: string
  email: string
  status: "active" | "completed" | "dropped"
  age?: number
  parentName?: string
  ageBand?: "Playgroup" | "Nursery" | "LKG" | "UKG"
}

function childAge(ageBand: Student["ageBand"]) {
  if (ageBand === "Playgroup") return 2
  if (ageBand === "Nursery") return 3
  if (ageBand === "LKG") return 4
  return 5
}

function rosterStudents(): Student[] {
  return ATTENDANCE_CHILDREN.map((child) => ({
    id: child.id,
    name: child.name,
    email: "",
    status: "active",
    age: childAge(child.ageBand),
    parentName: child.parentName,
    ageBand: child.ageBand,
  }))
}

function matchesGrade(student: Student, grade: string) {
  const band =
    grade === "Toddler" || grade === "Play Group"
      ? "Playgroup"
      : grade === "Jr KG" || grade === "LKG"
        ? "LKG"
        : grade === "Sr KG" || grade === "UKG"
          ? "UKG"
          : grade
  return !student.ageBand || student.ageBand === band
}

function staffByKind(kind: "coordinator" | "teacher" | "assistant", trainers: { name?: string, role?: string }[]) {
  const roles = kind === "coordinator" ? ["Center Coordinator"] :
                kind === "teacher" ? ["Lead Educator"] :
                ["Assistant Teacher", "Caregiver / Support"];
                
  const matches = trainers.filter(t => roles.includes(t.role || "")).map(t => t.name)
  return matches.filter((name): name is string => typeof name === "string" && name.length > 0)
}

function batchTitle(batch: Batch) {
  const grade = batch.courseName || "Class"
  const section = batch.section
  return section ? `${grade} - ${section}` : batch.code
}

function statusBadge(status?: BatchStatus) {
  if (status === "completed") return { label: "Completed", variant: "secondary" as const }
  if (status === "inactive") return { label: "Inactive", variant: "outline" as const }
  return { label: "Active", variant: "success" as const }
}

export default function CoursesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, addNotification, activeTenant } = useStore()
  const isTrainer = user?.role === "trainer"
  const isSuperAdmin = user?.role === "super_admin"
  const isAdmin = user?.role === "owner" || user?.role === "super_admin"
  const { allowTrainerDeleteBatch } = useCenterPolicy()
  const canDeleteBatch = isAdmin || (isTrainer && allowTrainerDeleteBatch)
  const [batches, setBatches] = React.useState<Batch[]>([])
  const [courses, setCourses] = React.useState<SavedClassProgram[]>([])
  const [pageLoading, setPageLoading] = React.useState(true)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isCourseAddOpen, setIsCourseAddOpen] = React.useState(false)
  const [dialogView, setDialogView] = React.useState<"form" | "students" | "details">("form")
  const [detailBatch, setDetailBatch] = React.useState<Batch | null>(null)
  const [codeTouched, setCodeTouched] = React.useState(false)
  const [studentsReturnView, setStudentsReturnView] = React.useState<"form" | "details">("form")
  const [studentSearchQuery, setStudentSearchQuery] = React.useState("")
  const [activeStudentsList, setActiveStudentsList] = React.useState<Student[]>([])
  const [trainers, setTrainers] = React.useState<any[]>([])
  const [centersList, setCentersList] = React.useState<string[]>([])

  const applyCentersForUser = React.useCallback(
    (centersData: any[]) => {
      if (!centersData?.length) {
        setCentersList([])
        return
      }

      let filtered = centersData
      if (user?.role !== "super_admin") {
        const tenantKey = (user?.tenantId || activeTenant?.name || "").trim().toLowerCase()
        if (tenantKey) {
          filtered = centersData.filter(
            (center: any) => (center.tenantName || "").trim().toLowerCase() === tenantKey
          )
        }
      }

      const names = filtered.map((center: any) => center.name).filter(Boolean)
      setCentersList(names)
      if (names[0]) {
        setSelectedCenterName(names[0])
      } else if (user?.tenantId) {
        setSelectedCenterName(user.tenantId.trim())
      }
    },
    [user?.role, user?.tenantId, activeTenant?.name]
  )

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true)
        const [batchesData, coursesData, trainersData, studentsData, centersData] = await Promise.all([
          fetchAPI('/batches'),
          fetchAPI('/courses'),
          isTrainer ? Promise.resolve([]) : api.getStaff().catch(() => []),
          isTrainer ? api.getTrainerStudents().catch(() => []) : fetchAPI('/students').catch(() => []),
          isAdmin ? fetchAPI('/centers').catch(() => []) : Promise.resolve([])
        ]);
        setBatches(Array.isArray(batchesData) ? batchesData : [])
        setCourses(mergeProgramLists(coursesData))

        if (trainersData && trainersData.length > 0) {
          setTrainers(trainersData)
        }
        
        if (studentsData && studentsData.length > 0) {
          const roster = rosterStudents()
          const activeSts = studentsData
            .filter((st: any) => st.status === "active")
            .map((st: any) => {
              const match = roster.find((child) => child.name === st.name)
              return {
                id: st.id || st._id,
                name: st.name,
                email: st.email,
                status: st.status,
                age: match?.age,
                parentName: match?.parentName,
                ageBand: match?.ageBand,
              }
            })
          setActiveStudentsList(activeSts.length > 0 ? activeSts : roster)
        } else {
          setActiveStudentsList(rosterStudents())
        }

        applyCentersForUser(centersData || [])
      } catch (error) {
        console.error("Failed to fetch courses and batches:", error);
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [applyCentersForUser, isTrainer, isAdmin]);

  // Find allocated batches and courses for the user role:
  const displayedBatches = React.useMemo(() => {
    if (!user) return []
    if (user.role === 'student') {
      return batches.filter((batch) => studentNameInBatch(batch, user.name || ""))
    }
    return batches
  }, [batches, user])

  // Form states for batch
  const [editingBatch, setEditingBatch] = React.useState<Batch | null>(null)
  const [code, setCode] = React.useState("")
  const [courseName, setCourseName] = React.useState("")
  const [trainerName, setTrainerName] = React.useState("")
  const [schedule, setSchedule] = React.useState("")
  const [capacity, setCapacity] = React.useState("25")
  const [meetLink, setMeetLink] = React.useState("")
  const [platform, setPlatform] = React.useState<"gmeet" | "zoom" | "teams" | "discord">("gmeet")
  const [selectedCenterName, setSelectedCenterName] = React.useState("ARKA KIDS")
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<BatchMode>("offline")
  const [roomName, setRoomName] = React.useState("Room 101")
  const [nextSessionDate, setNextSessionDate] = React.useState("")
  const [nextSessionTopic, setNextSessionTopic] = React.useState("")
  const [nextSessionEndDate, setNextSessionEndDate] = React.useState("")
  const [academicYear, setAcademicYear] = React.useState<string>("2026–27")
  const [grade, setGrade] = React.useState<string>("")
  const [section, setSection] = React.useState<string>("A")
  const [classTeacherName, setClassTeacherName] = React.useState("")
  const [assistantTeacherName, setAssistantTeacherName] = React.useState("")
  const [startTime, setStartTime] = React.useState("09:00")
  const [endTime, setEndTime] = React.useState("12:30")
  const [workingDays, setWorkingDays] = React.useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [batchStatus, setBatchStatus] = React.useState<BatchStatus>("active")

  const coordinatorOptions = React.useMemo(() => staffByKind("coordinator", trainers), [trainers])
  const teacherOptions = React.useMemo(() => staffByKind("teacher", trainers), [trainers])
  const assistantOptions = React.useMemo(() => staffByKind("assistant", trainers), [trainers])
  const generatedCode = makeBatchCode(grade, section, academicYear)
  const maxCapacity = Math.max(1, Number(capacity) || 25)
  const availableStudents = React.useMemo(() => {
    const matched = activeStudentsList.filter((student) => matchesGrade(student, grade))
    return matched.length > 0 ? matched : activeStudentsList
  }, [activeStudentsList, grade])

  React.useEffect(() => {
    if (codeTouched) return
    setCode(generatedCode)
  }, [generatedCode, codeTouched])

  const resetBatchForm = React.useCallback(() => {
    setEditingBatch(null)
    setDetailBatch(null)
    setCodeTouched(false)
    setAcademicYear("2026–27")
    setGrade(uniqueProgramNames(courses)[0] || "")
    setSection("A")
    setCode(makeBatchCode(uniqueProgramNames(courses)[0] || "CLS", "A", "2026–27"))
    setCourseName(uniqueProgramNames(courses)[0] || "")
    setTrainerName(staffByKind("coordinator", trainers)[0] || "")
    setClassTeacherName(staffByKind("teacher", trainers)[0] || "")
    setAssistantTeacherName(staffByKind("assistant", trainers)[0] || "")
    setSchedule("")
    setCapacity("25")
    setMeetLink("")
    setPlatform("gmeet")
    setSelectedCenterName(centersList[0] || user?.tenantId || "ARKA KIDS")
    setSelectedStudentIds([])
    setMode("offline")
    setRoomName("Room 101")
    setNextSessionDate("")
    setNextSessionTopic("")
    setNextSessionEndDate("")
    setStartTime("09:00")
    setEndTime("12:30")
    setWorkingDays(["Mon", "Tue", "Wed", "Thu", "Fri"])
    setBatchStatus("active")
    setDialogView("form")
    setStudentsReturnView("form")
    setStudentSearchQuery("")
  }, [centersList, trainers, user?.tenantId, courses])

  const openCreateBatch = React.useCallback(() => {
    resetBatchForm()
    setIsAddOpen(true)
  }, [resetBatchForm])

  const toggleWorkingDay = (dayId: string) => {
    setWorkingDays((prev) =>
      prev.includes(dayId) ? prev.filter((day) => day !== dayId) : [...prev, dayId]
    )
  }

  const buildBatchPayload = () => {
    const enrolledStudents = activeStudentsList
      .filter((st) => selectedStudentIds.includes(st.id))
      .map((st) => st.name)
    const batchCode = code.trim() || generatedCode

    return {
      code: batchCode,
      courseName: grade,
      trainerName,
      schedule: buildSchedule(workingDays, startTime, endTime),
      enrolled: enrolledStudents.length,
      capacity: maxCapacity,
      centerName: selectedCenterName,
      studentNames: enrolledStudents,
      mode: "offline" as BatchMode,
      roomName,
      status: batchStatus,
      academicYear,
      section,
      classTeacherName,
      assistantTeacherName: assistantTeacherName || undefined,
      startTime,
      endTime,
      workingDays,
    }
  }

  // Form states for course
  const [newCourseName, setNewCourseName] = React.useState("")
  const [newCourseCode, setNewCourseCode] = React.useState("")
  const [newCourseDuration, setNewCourseDuration] = React.useState("")
  const [newCourseFees, setNewCourseFees] = React.useState("0")
  const [programAgeFrom, setProgramAgeFrom] = React.useState("")
  const [programAgeTo, setProgramAgeTo] = React.useState("")
  const [programDescription, setProgramDescription] = React.useState("")
  const [programStartTime, setProgramStartTime] = React.useState("09:00")
  const [programEndTime, setProgramEndTime] = React.useState("12:30")
  const [programCapacity, setProgramCapacity] = React.useState("20")
  const [programStatus, setProgramStatus] = React.useState<ProgramStatus>("active")
  const [programCodeTouched, setProgramCodeTouched] = React.useState(false)

  const savedProgramNames = React.useMemo(() => uniqueProgramNames(courses), [courses])
  const savedDurations = React.useMemo(() => uniqueDurations(courses), [courses])

  const fillProgramForm = React.useCallback((program: SavedClassProgram, keepCustomCode = false) => {
    const range = parseAgeRange(program)
    setNewCourseName(program.name || "")
    setProgramAgeFrom(range.from)
    setProgramAgeTo(range.to)
    setProgramDescription(program.description || "")
    setNewCourseDuration(program.duration || "")
    setProgramStartTime(program.startTime || "09:00")
    setProgramEndTime(program.endTime || "12:30")
    setProgramCapacity(String(program.capacity || 20))
    setProgramStatus(program.status === "inactive" ? "inactive" : "active")
    if (!keepCustomCode) {
      setNewCourseCode(program.code || makeProgramCode(program.name || ""))
      setProgramCodeTouched(false)
    }
  }, [])

  const resetProgramForm = React.useCallback(() => {
    setProgramCodeTouched(false)
    setProgramStatus("active")
    setNewCourseName("")
    setNewCourseCode("")
    setProgramAgeFrom("")
    setProgramAgeTo("")
    setProgramDescription("")
    setNewCourseDuration("")
    setProgramStartTime("09:00")
    setProgramEndTime("12:30")
    setProgramCapacity("20")
  }, [])

  const openAddCourseDialog = React.useCallback(() => {
    resetProgramForm()
    setIsCourseAddOpen(true)
  }, [resetProgramForm])

  React.useEffect(() => {
    if (pageLoading || !isAdmin) return
    if (searchParams.get("action") !== "add-course") return
    openAddCourseDialog()
    router.replace("/courses", { scroll: false })
  }, [pageLoading, isAdmin, searchParams, openAddCourseDialog, router])

  React.useEffect(() => {
    if (centersList[0]) {
      setSelectedCenterName(centersList[0])
    }
  }, [centersList])

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academicYear || !grade || !section || !roomName || !startTime || !endTime) return
    if (!trainerName || !classTeacherName) return
    if (workingDays.length === 0) {
      addNotification({
        title: "Working days required",
        description: "Select the days this class batch meets.",
        type: "system",
      })
      return
    }
    if (selectedStudentIds.length > maxCapacity) {
      addNotification({
        title: "Capacity exceeded",
        description: `This batch can take ${maxCapacity} students.`,
        type: "system",
      })
      return
    }

    const batchDataPayload = buildBatchPayload()

    try {
      if (editingBatch) {
        const updatedBatch = await fetchAPI(`/batches/${editingBatch.id}`, {
          method: "PUT",
          body: JSON.stringify(batchDataPayload),
        })
        const normalizedBatch = { ...updatedBatch, id: updatedBatch._id || updatedBatch.id }
        setBatches(batches.map((b) => (b.id === editingBatch.id ? normalizedBatch : b)))
        setDetailBatch(normalizedBatch)
        setEditingBatch(null)
        setDialogView("details")
        addNotification({
          title: "Batch updated",
          description: `${batchTitle(normalizedBatch)} has been saved.`,
          type: "admissions",
        })
      } else {
        const createdBatch = await fetchAPI("/batches", {
          method: "POST",
          body: JSON.stringify(batchDataPayload),
        })
        const normalizedBatch = { ...createdBatch, id: createdBatch._id || createdBatch.id }
        setBatches([normalizedBatch, ...batches])
        setDetailBatch(normalizedBatch)
        setDialogView("details")
        addNotification({
          title: "Batch created",
          description: `${batchTitle(normalizedBatch)} is ready. Assign students next.`,
          type: "admissions",
        })
      }
    } catch (error: any) {
      console.error("Failed to save batch:", error)
      addNotification({
        title: "Error saving batch",
        description: error.message || "Failed to save batch. Please try again.",
        type: "system",
      })
      alert(error.message || "Failed to save batch. Please try again.")
    }
  }

  const persistAssignedStudents = async (batch: Batch) => {
    const payload = { ...buildBatchPayload() }
    const updatedBatch = await fetchAPI(`/batches/${batch.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    const normalizedBatch = { ...updatedBatch, id: updatedBatch._id || updatedBatch.id }
    setBatches((prev) => prev.map((item) => (item.id === batch.id ? normalizedBatch : item)))
    setDetailBatch(normalizedBatch)
    return normalizedBatch
  }

  const handleOpenEditBatch = (batch: Batch) => {
    setEditingBatch(batch)
    setDetailBatch(batch)
    setCodeTouched(true)
    setCode(batch.code)
    setGrade(batch.courseName || uniqueProgramNames(courses)[0] || "")
    setCourseName(batch.courseName || uniqueProgramNames(courses)[0] || "")
    setSection(batch.section || batch.code.split("-")[1] || "A")
    setAcademicYear(batch.academicYear || "2026–27")
    setTrainerName(batch.trainerName || staffByKind("coordinator", trainers)[0] || "")
    setClassTeacherName(batch.classTeacherName || staffByKind("teacher", trainers)[0] || "")
    setAssistantTeacherName(batch.assistantTeacherName || "")
    setSchedule(batch.schedule)
    setCapacity(String(batch.capacity))
    setMeetLink("")
    setPlatform("gmeet")
    setSelectedCenterName(batch.centerName || centersList[0] || "ARKA KIDS")
    setMode("offline")
    setRoomName(batch.roomName || "Room 101")
    setStartTime(batch.startTime || "09:00")
    setEndTime(batch.endTime || "12:30")
    setWorkingDays(batch.workingDays?.length ? batch.workingDays : ["Mon", "Tue", "Wed", "Thu", "Fri"])
    setBatchStatus(batch.status === "inactive" || batch.status === "completed" ? batch.status : "active")
    setNextSessionDate("")
    setNextSessionTopic("")
    setNextSessionEndDate("")

    const studentIds = activeStudentsList
      .filter((st) => batch.studentNames?.includes(st.name))
      .map((st) => st.id)
    setSelectedStudentIds(studentIds)

    setDialogView("form")
    setStudentsReturnView("form")
    setIsAddOpen(true)
  }

  const openStudentPicker = (returnView: "form" | "details") => {
    setStudentSearchQuery("")
    setStudentsReturnView(returnView)
    setDialogView("students")
  }

  const handleDeleteBatch = async (batch: Batch) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batch.code}"?`)) {
      return
    }
    try {
      await fetchAPI(`/batches/${batch.id}`, { method: 'DELETE' })
      setBatches(batches.filter(b => b.id !== batch.id))
      addNotification({
        title: "Batch Deleted",
        description: `Batch "${batch.code}" was removed.`,
        type: "admissions"
      })
    } catch (error: any) {
      console.error("Failed to delete batch:", error)
      alert(error.message || "Failed to delete batch.")
    }
  }

  const handleUpdateBatchStatus = async (batch: Batch, status: BatchStatus) => {
    const actionLabel = status === "completed" ? "mark this batch as completed" : "reopen this batch"
    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) {
      return
    }

    try {
      const updatedBatch = await fetchAPI(`/batches/${batch.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      const normalizedBatch = { ...updatedBatch, id: updatedBatch._id || updatedBatch.id }
      setBatches(batches.map((b) => (b.id === batch.id ? normalizedBatch : b)))
      addNotification({
        title: status === "completed" ? "Batch Completed" : "Batch Reopened",
        description:
          status === "completed"
            ? `Batch "${batch.code}" is marked as completed.`
            : `Batch "${batch.code}" is active again.`,
        type: "admissions",
      })
    } catch (error: any) {
      console.error("Failed to update batch status:", error)
      alert(error.message || "Failed to update batch status.")
    }
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseName || !programAgeFrom || !programAgeTo) return
    const ageFrom = Number(programAgeFrom)
    const ageTo = Number(programAgeTo)
    if (!Number.isFinite(ageFrom) || !Number.isFinite(ageTo) || ageFrom <= 0 || ageTo <= 0) {
      addNotification({ title: "Age group needed", description: "Enter From and To ages in years.", type: "system" })
      return
    }
    if (ageTo < ageFrom) {
      addNotification({ title: "Age group", description: "To age must be the same as or later than From age.", type: "system" })
      return
    }

    const newCourseData = {
      name: newCourseName,
      code: newCourseCode.trim() || makeProgramCode(newCourseName),
      duration: newCourseDuration.trim(),
      fees: Number(newCourseFees) || 0,
      ageFrom,
      ageTo,
      ageGroup: formatAgeGroup(ageFrom, ageTo),
      description: programDescription,
      startTime: programStartTime,
      endTime: programEndTime,
      capacity: Number(programCapacity) || 20,
      status: programStatus,
    }

    try {
      const createdCourseRaw = await fetchAPI("/courses", {
        method: "POST",
        body: JSON.stringify(newCourseData),
      })
      const createdCourse = {
        ...newCourseData,
        ...createdCourseRaw,
        id: createdCourseRaw.id || createdCourseRaw._id,
      } as SavedClassProgram
      const nextCourses = [createdCourse, ...courses]
      setCourses(nextCourses)
      persistPrograms(nextCourses)
      setIsCourseAddOpen(false)
      addNotification({
        title: "Class program created",
        description: `${newCourseName} is now available for classroom batches.`,
        type: "system",
      })
      resetProgramForm()
      if (!grade) setGrade(newCourseName)
    } catch (error) {
      console.error("Failed to create course program:", error)
      addNotification({
        title: "Error",
        description: "Failed to create class program. Please try again.",
        type: "system",
      })
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs text-muted-foreground">Loading courses and batches...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>{isSuperAdmin ? "Class Programs" : "Classes & Programs"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSuperAdmin 
              ? "Manage the master catalog of class programs, age ranges, and capacities."
              : isTrainer
                ? "Your assigned class batches, timings, and enrolled children."
                : "Class programs and batches: year, grade, section, staff, and student assignment."}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button variant="primary" size="sm" icon={Plus} onClick={openAddCourseDialog}>
            Add Class Program
          </Button>
        ) : (
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={Plus} onClick={openCreateBatch}>
                Create Batch
              </Button>
            </div>
          )
        )}
      </div>

      {isSuperAdmin ? (
        <Card className="bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold">Available Programs</CardTitle>
            <CardDescription className="text-xs">
              View, edit, and manage saved class programs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">No programs saved yet</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                  Click 'Add Class Program' to create the first program in the catalog.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                      <th className="p-4 min-w-[140px]">Program Name</th>
                      <th className="p-4 min-w-[100px]">Code</th>
                      <th className="p-4 min-w-[100px]">Age Group</th>
                      <th className="p-4 min-w-[80px]">Status</th>
                      <th className="p-4 text-right min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {courses.map((course, index) => (
                      <tr key={course.id || course._id || `course-${index}`} className="hover:bg-muted/30 transition-colors align-top">
                        <td className="p-4">
                          <p className="font-bold text-foreground">{course.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">{course.description || "—"}</p>
                        </td>
                        <td className="p-4 font-mono font-medium text-muted-foreground">{course.code}</td>
                        <td className="p-4 text-foreground">{course.ageGroup || formatAgeGroup(course.ageFrom, course.ageTo) || "—"}</td>
                        <td className="p-4">
                          <Badge variant={course.status === "active" ? "success" : "secondary"} className="text-[10px]">
                            {course.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                fillProgramForm(course)
                                setIsCourseAddOpen(true)
                              }}
                              title="Edit Program"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${course.name}?`)) {
                                  const newCourses = courses.filter(c => (c.id || c._id) !== (course.id || course._id));
                                  setCourses(newCourses);
                                  persistPrograms(newCourses);
                                }
                              }}
                              title="Delete Program"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold">Class Batches</CardTitle>
            <CardDescription className="text-xs">
              Academic year, grade, section, classroom staff, and enrolled children.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {displayedBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {user?.role === "student" ? "No batch assigned" : "No class batches"}
                </p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                  {user?.role === "student"
                    ? "Your class batch and timetable will appear here after you are assigned."
                    : "Create a class batch to assign a coordinator, teachers, room, and children."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 h-8 text-xs"
                  icon={Plus}
                  onClick={openCreateBatch}
                >
                  Create Batch
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                      <th className="p-4 min-w-[140px]">Batch</th>
                      <th className="p-4 min-w-[90px]">Year</th>
                      <th className="p-4 min-w-[140px]">Timing</th>
                      <th className="p-4 min-w-[90px]">Room</th>
                      <th className="p-4 min-w-[110px]">Coordinator</th>
                      <th className="p-4 min-w-[110px]">Class Teacher</th>
                      {user?.role !== "student" && <th className="p-4 min-w-[110px]">Students</th>}
                      <th className="p-4 min-w-[80px]">Status</th>
                      <th className="p-4 text-right min-w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {displayedBatches.map((batch, index) => {
                      const occupancyRate = batch.capacity ? (batch.enrolled / batch.capacity) * 100 : 0
                      const isFull = batch.enrolled >= batch.capacity
                      const isCompleted = batch.status === "completed"
                      const status = statusBadge(batch.status)

                      return (
                        <tr key={batch.id || `batch-${index}`} className="hover:bg-muted/30 transition-colors align-top">
                          <td className="p-4">
                            <p className="font-bold text-foreground">{batchTitle(batch)}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{batch.code}</p>
                          </td>
                          <td className="p-4 text-muted-foreground">{batch.academicYear?.includes('-') ? batch.academicYear.split('-').reverse().join('-') : batch.academicYear || "—"}</td>
                          <td className="p-4 text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              {batch.schedule}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{batch.roomName || "—"}</td>
                          <td className="p-4 text-foreground">{batch.trainerName || "—"}</td>
                          <td className="p-4 text-foreground">{batch.classTeacherName || "—"}</td>
                          {user?.role !== "student" && (
                            <td className="p-4">
                              <div className="space-y-1.5 min-w-[110px]">
                                <div className="text-[12px] text-muted-foreground font-medium">
                                  {batch.enrolled}
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="p-4">
                            <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {user?.role !== "student" && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 text-[10px] px-2 font-bold"
                                  onClick={() => router.push(`/courses/batches/${batch.id || (batch as any)._id}`)}
                                  title="Assign Students & Edit"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  Assign Students
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleOpenEditBatch(batch)}
                                title="Quick Edit Batch"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              {isTrainer && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => router.push(`/attendance?batch=${batch.id || (batch as any)._id}`)}
                                  title="Attendance"
                                >
                                  <ClipboardList className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canDeleteBatch && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteBatch(batch)}
                                  title="Delete Batch"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Batch Dialog */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        className="max-w-2xl"
        title={
          dialogView === "students"
            ? "Add Students"
            : dialogView === "details"
              ? "Batch Details"
              : editingBatch
                ? "Edit Batch"
                : "Create New Batch"
        }
        description={
          dialogView === "students"
            ? "Select children to assign to this class batch."
            : dialogView === "details"
              ? "Coordinator, teachers, room, and enrolled children."
              : "Academic year, class, section, timing, and staff for this cohort."
        }
      >
        {dialogView === "form" ? (
          <form onSubmit={handleAddBatch} className="space-y-5">
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Academic Year Date *</label>
                  <Input
                    type="date"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="bg-card text-xs h-9.5"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Class / Grade *</label>
                  {savedProgramNames.length > 0 ? (
                    <Select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="bg-card text-xs h-9.5"
                      required
                    >
                      <option value="">Select program</option>
                      {savedProgramNames.map((item, index) => (
                        <option key={`grade-${item}-${index}`} value={item}>{item}</option>
                      ))}
                      {grade && !savedProgramNames.includes(grade) && (
                        <option value={grade}>{grade}</option>
                      )}
                    </Select>
                  ) : (
                    <Input
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="bg-card text-xs h-9.5"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Section / Batch *</label>
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="bg-card text-xs h-9.5"
                    placeholder="e.g. A"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Classroom *</label>
                  <Input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bg-card text-xs h-9.5"
                    placeholder="e.g. Room 101"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <Select
                  value={batchStatus}
                  onChange={(e) => setBatchStatus(e.target.value as BatchStatus)}
                  className="bg-card text-xs h-9.5"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </Select>
              </div>
            </div>

            <div className="pt-2.5 border-t border-border/40 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Class Timing</h4>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Start Time *</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-card text-xs h-9.5"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">End Time *</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-card text-xs h-9.5"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Working Days *</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const checked = workingDays.includes(day.id)
                    return (
                      <label
                        key={`wd-${day.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer ${
                          checked
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWorkingDay(day.id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                        {day.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-border/40 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Staff Assignment</h4>
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Classroom Coordinator *</label>
                  <Select
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="bg-card text-xs h-9.5"
                    required
                  >
                    <option value="">Select Coordinator</option>
                    {Array.from(new Set([trainerName, ...coordinatorOptions].filter(Boolean))).map((name) => (
                      <option key={`coord-${name}`} value={name}>{name}</option>
                    ))}
                    {coordinatorOptions.length === 0 && !trainerName && (
                      <option value="" disabled>No coordinators found</option>
                    )}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Class Teacher *</label>
                    <Select
                      value={classTeacherName}
                      onChange={(e) => setClassTeacherName(e.target.value)}
                      className="bg-card text-xs h-9.5"
                      required
                    >
                      <option value="">Select Teacher</option>
                      {Array.from(new Set([classTeacherName, ...teacherOptions].filter(Boolean))).map((name) => (
                        <option key={`teacher-${name}`} value={name}>{name}</option>
                      ))}
                      {teacherOptions.length === 0 && !classTeacherName && (
                        <option value="" disabled>No teachers found</option>
                      )}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Assistant Teacher</label>
                    <Select
                      value={assistantTeacherName}
                      onChange={(e) => setAssistantTeacherName(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    >
                      <option value="">None</option>
                      {Array.from(new Set([assistantTeacherName, ...assistantOptions].filter(Boolean))).map((name) => (
                        <option key={`assistant-${name}`} value={name}>{name}</option>
                      ))}
                      {assistantOptions.length === 0 && !assistantTeacherName && (
                        <option value="" disabled>No assistants found</option>
                      )}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingBatch ? "Save Changes" : "Create Batch"}
              </Button>
            </div>
          </form>
        ) : dialogView === "details" && detailBatch ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-foreground">{batchTitle(detailBatch)}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{detailBatch.code}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Academic Year</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.academicYear || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Room</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.roomName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Timing</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.schedule}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Students</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.enrolled} / {detailBatch.capacity}</p>
              </div>
            </div>
            <div className="border-t border-border/40 pt-4 space-y-3 text-xs">
              <div>
                <p className="text-muted-foreground">Coordinator</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.trainerName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Class Teacher</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.classTeacherName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assistant Teacher</p>
                <p className="font-semibold text-foreground mt-0.5">{detailBatch.assistantTeacherName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <div className="mt-1">
                  <Badge variant={statusBadge(detailBatch.status).variant} className="text-[10px]">
                    {statusBadge(detailBatch.status).label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => openStudentPicker("details")} icon={Plus}>
                Add Students
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => handleOpenEditBatch(detailBatch)}>
                Edit Batch
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDialogView(studentsReturnView)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>&larr;</span>
                <span>Back</span>
              </button>
              <p className="text-xs text-muted-foreground">
                {selectedStudentIds.length} / {maxCapacity} Students
              </p>
            </div>

            <Input
              placeholder="Search by name or parent"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              className="bg-card text-xs h-9.5"
            />

            <div className="max-h-72 overflow-y-auto border border-border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="p-2.5 w-8"></th>
                    <th className="p-2.5">Student</th>
                    <th className="p-2.5">Age</th>
                    <th className="p-2.5">Parent</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {availableStudents
                    .filter((st) => {
                      const query = studentSearchQuery.toLowerCase()
                      return (
                        st.name.toLowerCase().includes(query) ||
                        (st.parentName || "").toLowerCase().includes(query)
                      )
                    })
                    .map((st) => {
                      const isSelected = selectedStudentIds.includes(st.id)
                      return (
                        <tr key={`pick-${st.id}`} className={isSelected ? "bg-primary/5" : ""}>
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id))
                                  return
                                }
                                if (selectedStudentIds.length >= maxCapacity) {
                                  addNotification({
                                    title: "Capacity full",
                                    description: `This batch can take ${maxCapacity} students.`,
                                    type: "system",
                                  })
                                  return
                                }
                                setSelectedStudentIds([...selectedStudentIds, st.id])
                              }}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5 font-semibold text-foreground">{st.name}</td>
                          <td className="p-2.5 text-muted-foreground">{st.age ?? "—"}</td>
                          <td className="p-2.5 text-muted-foreground">{st.parentName || "—"}</td>
                          <td className="p-2.5">
                            <Badge variant="success" className="text-[9px] py-0.5 px-2">Active</Badge>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-border/50 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const target = detailBatch || editingBatch
                  if (target) {
                    try {
                      await persistAssignedStudents(target)
                      addNotification({
                        title: "Students assigned",
                        description: `${selectedStudentIds.length} / ${maxCapacity} children in this batch.`,
                        type: "admissions",
                      })
                    } catch (error: any) {
                      addNotification({
                        title: "Could not assign students",
                        description: error.message || "Please try again.",
                        type: "system",
                      })
                      return
                    }
                  }
                  setDialogView(studentsReturnView)
                }}
              >
                Assign Selected Students
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Class Program Dialog */}
      <Dialog
        isOpen={isCourseAddOpen}
        onClose={() => setIsCourseAddOpen(false)}
        className="max-w-2xl"
        title="Add Class Program"
        description="Name any program, set the age range, then save it to the catalog."
      >
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Program Name *</label>
              <Input
                list="program-name-options"
                value={newCourseName}
                onChange={(e) => {
                  const name = e.target.value
                  setNewCourseName(name)
                  if (!programCodeTouched) setNewCourseCode(name ? makeProgramCode(name) : "")
                }}
                className="bg-card text-xs h-9.5"
                required
              />
              <datalist id="program-name-options">
                {savedProgramNames.map((name, index) => (
                  <option key={`name-opt-${name}-${index}`} value={name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Program Code</label>
              <Input
                value={newCourseCode}
                onChange={(e) => {
                  setProgramCodeTouched(true)
                  setNewCourseCode(e.target.value.toUpperCase())
                }}
                className="bg-card text-xs h-9.5"
              />
              <p className="text-[10px] text-muted-foreground">Auto-generated from the program name. Optional to edit.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Age Group * · From (years)</label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={programAgeFrom}
                onChange={(e) => setProgramAgeFrom(e.target.value)}
                placeholder="e.g. 2"
                className="bg-card text-xs h-9.5"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">To (years)</label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={programAgeTo}
                onChange={(e) => setProgramAgeTo(e.target.value)}
                placeholder="e.g. 3"
                className="bg-card text-xs h-9.5"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus-visible:outline-hidden focus-visible:border-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <div className="flex h-9.5 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProgramStatus("active")}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs cursor-pointer ${
                    programStatus === "active"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setProgramStatus("inactive")}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs cursor-pointer ${
                    programStatus === "inactive"
                      ? "border-border bg-muted text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Available programs</p>
            {courses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No programs saved yet. Type a name and age range, then save to add the first one.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {courses.map((program, index) => (
                  <button
                    key={`avail-${programKey(program)}-${index}`}
                    type="button"
                    onClick={() => fillProgramForm(program)}
                    className={`text-left rounded-md border px-2.5 py-2 cursor-pointer ${
                      newCourseName === program.name
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground">{program.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatAgeGroup(program.ageFrom, program.ageTo) || program.ageGroup || "Age group not set"}</p>
                    <p className="text-[10px] text-muted-foreground">{program.description || program.code}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCourseAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Program
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
