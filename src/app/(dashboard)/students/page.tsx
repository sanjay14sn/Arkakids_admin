"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, Search, Plus, Filter, Download, ArrowLeft, MoreHorizontal, Mail, Phone,
  FileCheck, ShieldAlert, BadgeDollarSign, CalendarRange, GraduationCap, Clock, FileDown, CheckSquare, Trash2, Calendar,
  ChevronLeft, ChevronRight, Pencil, AlertTriangle, Syringe, X, Check, Eye
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { useStore } from "@/store/useStore"
import { formatCurrency, formatDate } from "@/lib/utils"
import { api, ApiError, isForbiddenError } from "@/lib/api"
import { AccessRestricted } from "@/components/shared/AccessRestricted"
import { useCenterPolicy } from "@/hooks/useCenterPolicy"
import { CapacityLimitNotice, showCapacityLimitToast } from "@/components/shared/CapacityLimitNotice"
import {
  computeInstallmentRows,
  getCurrentDueInstallment,
  isFullyPaid,
  resolveNextDueDate,
} from "@/lib/installments"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  course: string
  status: "active" | "completed" | "on_hold"
  attendanceRate: number
  feesPaid: number
  feesTotal: number
  guardian: { name: string; phone: string }
  enrollmentDate: string
  dateOfBirth?: string
  gender?: string
  parentName?: string
  parentPhone?: string
  parentRelation?: string
  academicYear?: string
  address?: string
  admissionDate?: string
  emergencyContact?: string
  pickupPerson?: string
  bloodGroup?: string
  allergies?: string
  prevSchool?: string
  transport?: string
  nextDueDate?: string
  installmentsCount?: number
  installmentSchedule?: Array<{ amount: number; dueDate: string; label?: string }>
  password?: string
  vaccinations?: Array<{ name: string; date: string; due?: string; status?: "Done" | "Pending" }>
}

const STUDENTS_PAGE_SIZE = 10

/** Map a raw DB student document to the Student interface */
function mapStudentFromDB(d: any): Student {
  return {
    ...d,
    id: d._id || d.id,
    course: d.course || d.className || d.classId || "",
    feesPaid: d.feesPaid ?? d.fees?.feesPaid ?? 0,
    feesTotal: d.feesTotal ?? d.fees?.feesTotal ?? 0,
    nextDueDate: d.nextDueDate || d.fees?.nextDueDate || undefined,
    installmentsCount: d.installmentsCount ?? d.fees?.installmentsCount ?? 1,
    installmentSchedule: d.installmentSchedule || d.fees?.installmentSchedule || [],
    enrollmentDate: d.enrollmentDate || d.admissionDate || d.createdAt?.slice(0, 10) || "",
    guardian: d.guardian || { name: d.parentName || "—", phone: d.parentPhone || d.phone || "—" },
    attendanceRate: d.attendanceRate ?? 0,
    phone: d.phone || d.parentPhone || "",
    email: d.email || d.parentEmail || "",
  }
}

export default function StudentsPage() {
  const { addNotification, user, fetchCenterPolicy } = useStore()
  const { policy, atCapacity } = useCenterPolicy()
  const studentsAtCapacity = atCapacity("students")
  const isTrainer = user?.role === "trainer"
  const isOwner = user?.role === "owner"
  const showCourseBatchFilters = isTrainer || isOwner
  const [students, setStudents] = React.useState<Student[]>([])
  const [courses, setCourses] = React.useState<any[]>([])
  const [batches, setBatches] = React.useState<any[]>([])
  const [pageLoading, setPageLoading] = React.useState(true)
  const [accessDenied, setAccessDenied] = React.useState(false)

  // Form States for Add & Edit Student
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [course, setCourse] = React.useState("Playgroup & Toddlers")
  const [feesTotal, setFeesTotal] = React.useState("1800")
  const [feesPaid, setFeesPaid] = React.useState("1800")
  const [paymentScheme, setPaymentScheme] = React.useState<"full" | "part1" | "part2" | "custom">("full")
  const [addNextDueDate, setAddNextDueDate] = React.useState("")
  const [addInstallmentCount, setAddInstallmentCount] = React.useState("3")
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = React.useState(false)

  // Wizard States
  const [addStep, setAddStep] = React.useState(1)
  const [dob, setDob] = React.useState("")
  const [gender, setGender] = React.useState("Female")
  const [parentName, setParentName] = React.useState("")
  const [parentRelation, setParentRelation] = React.useState("Mother")
  const [address, setAddress] = React.useState("")
  const [academicYear, setAcademicYear] = React.useState("2026-27")
  const [admissionDate, setAdmissionDate] = React.useState(new Date().toISOString().split("T")[0])
  const [emergencyContact, setEmergencyContact] = React.useState("")
  const [pickupPerson, setPickupPerson] = React.useState("")
  const [bloodGroup, setBloodGroup] = React.useState("")
  const [allergies, setAllergies] = React.useState("")
  const [prevSchool, setPrevSchool] = React.useState("")
  const [transport, setTransport] = React.useState("")

  // Edit & Delete Student States
  const [editStep, setEditStep] = React.useState(1)
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null)
  const [deletingStudentId, setDeletingStudentId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editPhone, setEditPhone] = React.useState("")
  const [editCourse, setEditCourse] = React.useState("")
  const [editDob, setEditDob] = React.useState("")
  const [editGender, setEditGender] = React.useState("Female")
  const [editParentName, setEditParentName] = React.useState("")
  const [editParentRelation, setEditParentRelation] = React.useState("Mother")
  const [editAcademicYear, setEditAcademicYear] = React.useState("2026-27")
  const [editAddress, setEditAddress] = React.useState("")
  const [editAdmissionDate, setEditAdmissionDate] = React.useState("")
  const [editEmergencyContact, setEditEmergencyContact] = React.useState("")
  const [editPickupPerson, setEditPickupPerson] = React.useState("")
  const [editBloodGroup, setEditBloodGroup] = React.useState("")
  const [editAllergies, setEditAllergies] = React.useState("")
  const [editPrevSchool, setEditPrevSchool] = React.useState("")
  const [editTransport, setEditTransport] = React.useState("")
  const [editNextDueDate, setEditNextDueDate] = React.useState("")
  const [editInstallmentsCount, setEditInstallmentsCount] = React.useState("1")

  React.useEffect(() => {
    const loadData = async () => {
      setPageLoading(true)
      try {
        await fetchCenterPolicy()
        const [studentsData, coursesData, batchesData] = await Promise.all([
          (isTrainer ? api.getTrainerStudents() : api.getStudents()).catch((err) => {
            if (isForbiddenError(err)) setAccessDenied(true)
            return []
          }),
          api.getCourses().catch(() => []),
          api.getBatches().catch(() => [])
        ])
        // Remap DB fields (IStudent schema) → Student interface
        const mapped = (studentsData || []).map(mapStudentFromDB)
        setStudents(mapped)
        setCourses(coursesData || [])
        setBatches(batchesData || [])
        if (coursesData?.length > 0) {
          setCourse(coursesData[0].name)
        }
      } catch (err) {
        console.error("Failed to load students, courses, or batches:", err)
        setStudents([])
      } finally {
        setPageLoading(false)
      }
    }
    loadData()
  }, [isTrainer, fetchCenterPolicy])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("all")
  const [filterCourse, setFilterCourse] = React.useState("all")
  const [filterBatch, setFilterBatch] = React.useState("all")
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)

  const getStudentBatches = React.useCallback(
    (student: Student) =>
      batches.filter((batch) =>
        batch.studentNames?.some(
          (name: string) => name.trim().toLowerCase() === student.name.trim().toLowerCase()
        )
      ),
    [batches]
  )

  const courseFilterOptions = React.useMemo(() => {
    if (!showCourseBatchFilters) return []
    const names = new Set<string>()
    if (isOwner) {
      courses.forEach((courseItem) => {
        if (courseItem.name) names.add(courseItem.name)
      })
    }
    batches.forEach((batch) => {
      if (batch.courseName) names.add(batch.courseName)
    })
    students.forEach((student) => {
      if (student.course) names.add(student.course)
    })
    return Array.from(names).sort()
  }, [showCourseBatchFilters, isOwner, courses, batches, students])

  const batchFilterOptions = React.useMemo(() => {
    if (!showCourseBatchFilters) return []
    const availableBatches = isOwner
      ? batches
      : batches.filter((batch) => batch.status !== "completed")
    if (filterCourse === "all") return availableBatches
    return availableBatches.filter((batch) => batch.courseName === filterCourse)
  }, [showCourseBatchFilters, isOwner, batches, filterCourse])
  
  // Fees Editing State
  const [isEditingFees, setIsEditingFees] = React.useState(false)
  const [editFeesTotal, setEditFeesTotal] = React.useState("")
  const [editFeesPaid, setEditFeesPaid] = React.useState("")

  const [selectedStudentLogs, setSelectedStudentLogs] = React.useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = React.useState(false)

  // Student Vaccination Form State
  const [showStudentVaxForm, setShowStudentVaxForm] = React.useState(false)
  const [newStudentVaxName, setNewStudentVaxName] = React.useState("")
  const [newStudentVaxDate, setNewStudentVaxDate] = React.useState("")
  const [newStudentVaxDue, setNewStudentVaxDue] = React.useState("")

  const handleAddStudentVaccine = (studentId: string) => {
    if (!newStudentVaxName.trim()) return
    const newVax = {
      name: newStudentVaxName.trim(),
      date: newStudentVaxDate,
      due: newStudentVaxDue || undefined,
    }
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const vaccinations = s.vaccinations || []
          return { ...s, vaccinations: [...vaccinations, newVax] }
        }
        return s
      })
    )
    setSelectedStudent((prev) => {
      if (!prev || prev.id !== studentId) return prev
      return { ...prev, vaccinations: [...(prev.vaccinations || []), newVax] }
    })
    setNewStudentVaxName("")
    setNewStudentVaxDate("")
    setNewStudentVaxDue("")
    setShowStudentVaxForm(false)
    addNotification({
      title: "Vaccine Record Added",
      description: `Added ${newVax.name} for ${selectedStudent?.name}.`,
      type: "admissions",
    })
  }

  const handleRemoveStudentVaccine = (studentId: string, index: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const vaccinations = (s.vaccinations || []).filter((_, i) => i !== index)
          return { ...s, vaccinations }
        }
        return s
      })
    )
    setSelectedStudent((prev) => {
      if (!prev || prev.id !== studentId) return prev
      const vaccinations = (prev.vaccinations || []).filter((_, i) => i !== index)
      return { ...prev, vaccinations }
    })
  }

  React.useEffect(() => {
    if (selectedStudent) {
      setEditFeesTotal(String(selectedStudent.feesTotal))
      setEditFeesPaid(String(selectedStudent.feesPaid))
      setIsEditingFees(false)
      
      const fetchLogs = async () => {
        try {
          setLoadingLogs(true)
          const logs = await api.getAttendanceByEntity(selectedStudent.id)
          setSelectedStudentLogs(logs || [])
        } catch (err) {
          console.error("Failed to fetch selected student attendance logs:", err)
          setSelectedStudentLogs([])
        } finally {
          setLoadingLogs(false)
        }
      }
      fetchLogs()
    } else {
      setSelectedStudentLogs([])
    }
  }, [selectedStudent])

  React.useEffect(() => {
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    setAddNextDueDate(thirtyDays.toISOString().split("T")[0])
  }, [])

  React.useEffect(() => {
    const selectedCourseObj = courses.find(c => c.name === course)
    if (selectedCourseObj) {
      setFeesTotal(String(selectedCourseObj.fees))
    }
  }, [course, courses])

  React.useEffect(() => {
    const total = Number(feesTotal) || 0
    if (paymentScheme === "full") {
      setFeesPaid(String(total))
    } else if (paymentScheme === "part1") {
      setFeesPaid(String(Math.round(total / 3)))
    } else if (paymentScheme === "part2") {
      setFeesPaid(String(Math.round((total / 3) * 2)))
    }
  }, [paymentScheme, feesTotal])

  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery)
    const matchesStatus = filterStatus === "all" || student.status === filterStatus

    if (showCourseBatchFilters && filterCourse !== "all") {
      const studentBatches = getStudentBatches(student)
      const matchesCourse =
        student.course === filterCourse ||
        studentBatches.some((batch) => batch.courseName === filterCourse)
      if (!matchesCourse) return false
    }

    if (showCourseBatchFilters && filterBatch !== "all") {
      const studentBatches = getStudentBatches(student)
      const matchesBatch = studentBatches.some(
        (batch) => String(batch.id) === filterBatch || batch.code === filterBatch
      )
      if (!matchesBatch) return false
    }

    return matchesSearch && matchesStatus
  })

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus, filterCourse, filterBatch])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PAGE_SIZE))

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedStudents = React.useMemo(() => {
    const start = (currentPage - 1) * STUDENTS_PAGE_SIZE
    return filteredStudents.slice(start, start + STUDENTS_PAGE_SIZE)
  }, [filteredStudents, currentPage])

  const paginationStart =
    filteredStudents.length === 0 ? 0 : (currentPage - 1) * STUDENTS_PAGE_SIZE + 1
  const paginationEnd = Math.min(currentPage * STUDENTS_PAGE_SIZE, filteredStudents.length)

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedStudents.map((s) => s.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleBulkAction = (action: "export" | "remind") => {
    if (selectedIds.length === 0) return
    if (action === "export") {
      alert(`Exporting ${selectedIds.length} student records as CSV.`);
      addNotification({
        title: "Export Success",
        description: `Exported data for ${selectedIds.length} students.`,
        type: "admissions"
      })
    } else {
      alert(`Dispatched payment reminder notifications to ${selectedIds.length} guardians.`);
      addNotification({
        title: "Reminders Sent",
        description: `Fee alert notifications sent to ${selectedIds.length} students.`,
        type: "fees"
      })
    }
    setSelectedIds([])
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return

    try {
      const hasDues = Number(feesTotal) - Number(feesPaid) > 0
      const newStudent = await api.createStudent({
        name,
        email,
        phone,
        className: course,
        course,
        status: "active",
        admissionDate,
        dateOfBirth: dob,
        gender: gender.toLowerCase(),
        parentName,
        parentPhone: phone,
        parentRelation,
        academicYear,
        address,
        emergencyContact,
        pickupPerson,
        bloodGroup,
        allergies,
        prevSchool,
        transport,
        fees: {
          feesPaid: Number(feesPaid),
          feesTotal: Number(feesTotal),
          nextDueDate: (Number(feesTotal) - Number(feesPaid)) > 0 ? addNextDueDate : null,
          installmentsCount: Number(addInstallmentCount),
        },
      })
      setStudents([mapStudentFromDB(newStudent), ...students])
      setIsAddOpen(false)
      addNotification({
        title: "Student Enrolled",
        description: `${name} enrolled in Course: ${course}. Password: ${newStudent.password}`,
        type: "admissions"
      })
      alert(`Student enrolled successfully!\nEmail: ${email}\nPassword: ${newStudent.password}`);

      // Reset fields
      setAddStep(1)
      setName("")
      setEmail("")
      setPhone("")
      setPaymentScheme("full")
      setCourse(courses.length > 0 ? courses[0].name : "")
      setFeesTotal("1800")
      setFeesPaid("1800")
      setAddInstallmentCount("3")
    } catch (err: unknown) {
      console.error("Failed to enroll student:", err)
      if (err instanceof ApiError && err.isCapacityLimit) {
        showCapacityLimitToast(addNotification, "students", policy, err.message)
        void fetchCenterPolicy()
      } else {
        addNotification({
          title: "Enrollment Failed",
          description: err instanceof Error ? err.message : "Failed to add student.",
          type: "system",
        })
      }
    }
  }

  const openEditModal = (student: Student) => {
    setEditStep(1)
    setEditingStudent(student)
    setEditName(student.name || "")
    setEditEmail(student.email || "")
    setEditPhone(student.phone || student.parentPhone || student.guardian?.phone || "")
    setEditCourse(student.course || (courses.length > 0 ? courses[0].name : "Playgroup & Toddlers"))
    setEditDob(student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : "")
    setEditGender(student.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : "Female")
    setEditParentName(student.parentName || student.guardian?.name || "")
    setEditParentRelation(student.parentRelation || "Mother")
    setEditAcademicYear(student.academicYear || "2026-27")
    setEditAddress(student.address || "")
    setEditAdmissionDate(student.admissionDate || student.enrollmentDate ? String(student.admissionDate || student.enrollmentDate).slice(0, 10) : "")
    setEditEmergencyContact(student.emergencyContact || "")
    setEditPickupPerson(student.pickupPerson || "")
    setEditBloodGroup(student.bloodGroup || "")
    setEditAllergies(student.allergies || "")
    setEditPrevSchool(student.prevSchool || "")
    setEditTransport(student.transport || "")
    setEditFeesTotal(String(student.feesTotal ?? 0))
    setEditFeesPaid(String(student.feesPaid ?? 0))
    setEditNextDueDate(student.nextDueDate ? String(student.nextDueDate).slice(0, 10) : "")
    setEditInstallmentsCount(String(student.installmentsCount ?? 1))
  }

  const handleSaveEditedStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent || !editName.trim()) return

    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        parentPhone: editPhone.trim(),
        className: editCourse,
        course: editCourse,
        dateOfBirth: editDob,
        gender: editGender.toLowerCase(),
        parentName: editParentName,
        parentRelation: editParentRelation,
        academicYear: editAcademicYear,
        address: editAddress,
        admissionDate: editAdmissionDate,
        emergencyContact: editEmergencyContact,
        pickupPerson: editPickupPerson,
        bloodGroup: editBloodGroup,
        allergies: editAllergies,
        prevSchool: editPrevSchool,
        transport: editTransport,
        fees: {
          feesTotal: Number(editFeesTotal) || 0,
          feesPaid: Number(editFeesPaid) || 0,
          nextDueDate: editNextDueDate || null,
          installmentsCount: Number(editInstallmentsCount) || 1,
        },
      }

      const updatedDB = await api.updateStudent(editingStudent.id, payload)
      const updated = mapStudentFromDB(updatedDB)

      setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? updated : s)))
      if (selectedStudent?.id === editingStudent.id) {
        setSelectedStudent(updated)
      }
      setEditingStudent(null)
      setEditStep(1)
      addNotification({
        title: "Student Profile Updated",
        description: `All profile & fee details for ${updated.name} updated successfully.`,
        type: "admissions",
      })
    } catch (err: any) {
      console.error("Failed to update student profile:", err)
      addNotification({
        title: "Update Failed",
        description: err.message || "Failed to update student profile.",
        type: "system",
      })
    }
  }

  const handleDeleteStudent = (id: string) => {
    const student = students.find((s) => s.id === id)
    setStudents((prev) => prev.filter((s) => s.id !== id))
    if (selectedStudent?.id === id) {
      setSelectedStudent(null)
    }
    setDeletingStudentId(null)
    addNotification({
      title: "Student Removed",
      description: `${student?.name || "Student"} removed from directory.`,
      type: "admissions",
    })
  }

  const handleSaveFees = async () => {
    if (!selectedStudent) return
    const updatedPaid = Number(editFeesPaid) || 0
    const updatedTotal = Number(editFeesTotal) || 0
    const fullyPaid = isFullyPaid(updatedPaid, updatedTotal)

    try {
      const updatedStudent = await api.updateStudentFees(selectedStudent.id, {
        feesPaid: updatedPaid,
        feesTotal: updatedTotal,
        nextDueDate: fullyPaid
          ? null
          : resolveNextDueDate({
              ...selectedStudent,
              feesPaid: updatedPaid,
              feesTotal: updatedTotal,
            }) || null,
      })

      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return updatedStudent
        }
        return s
      }))

      setSelectedStudent(updatedStudent)
      setIsEditingFees(false)

      addNotification({
        title: "Student Fees Updated",
        description: `Updated fee ledger for ${selectedStudent.name}.`,
        type: "fees"
      })
    } catch (err: any) {
      console.error("Failed to update fees:", err)
      addNotification({
        title: "Update Failed",
        description: err.message || "Failed to update fees.",
        type: "system"
      })
    }
  }

  const handlePayInstallment = async (amount: number) => {
    if (!selectedStudent) return
    const newPaid = Math.min(selectedStudent.feesPaid + amount, selectedStudent.feesTotal)
    const fullyPaid = isFullyPaid(newPaid, selectedStudent.feesTotal)

    try {
      const updatedStudent = await api.updateStudentFees(selectedStudent.id, {
        feesPaid: newPaid,
        nextDueDate: fullyPaid
          ? null
          : resolveNextDueDate({
              ...selectedStudent,
              feesPaid: newPaid,
            }) || null,
      })

      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return updatedStudent
        }
        return s
      }))

      setSelectedStudent(updatedStudent)

      addNotification({
        title: "Payment Recorded",
        description: `Recorded payment of ${formatCurrency(amount)} for ${selectedStudent.name}.`,
        type: "fees"
      })
    } catch (err: any) {
      console.error("Failed to record payment:", err)
      addNotification({
        title: "Payment Failed",
        description: err.message || "Failed to record payment.",
        type: "system"
      })
    }
  }

  const handleStatusUpdate = async (studentId: string, newStatus: Student["status"]) => {
    setStatusUpdatingId(studentId)
    const previousStudent = students.find((s) => s.id === studentId)
    try {
      const updatedStudent = await api.updateStudentStatus(studentId, newStatus)
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return updatedStudent
        }
        return s
      }))
      setSelectedStudent(prev => {
        if (!prev || prev.id !== studentId) return prev
        return updatedStudent
      })

      const accessEnabled = newStatus === "active"
      const matchingBatches = batches.filter((batch: any) =>
        batch.studentNames?.some(
          (name: string) =>
            name.trim().toLowerCase() === updatedStudent.name.trim().toLowerCase()
        )
      )

      if (matchingBatches.length > 0) {
        await Promise.all(
          matchingBatches.map((batch: any) =>
            api.updateBatch(String(batch.id || batch._id), {
              studentLmsAccess: {
                ...(batch.studentLmsAccess || {}),
                [updatedStudent.name]: accessEnabled,
              },
            })
          )
        )
        const batchesData = await api.getBatches().catch(() => [])
        setBatches(batchesData || [])
      }

      addNotification({
        title: accessEnabled ? "Access Enabled" : "Access Revoked",
        description: accessEnabled
          ? `${updatedStudent.name} can log in and use the LMS again.`
          : `${updatedStudent.name} can no longer log in or access the LMS.`,
        type: "admissions"
      })
    } catch (err: any) {
      console.error("Failed to update status:", err)
      if (previousStudent) {
        setStudents(prev => prev.map(s => (s.id === studentId ? previousStudent : s)))
        setSelectedStudent(prev => {
          if (!prev || prev.id !== studentId) return prev
          return previousStudent
        })
      }
      addNotification({
        title: "Update Failed",
        description: err.message || "Failed to update status.",
        type: "system"
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const getStatusBadge = (status: Student["status"]) => (
    <Badge
      variant={
        status === "active" ? "success" : status === "completed" ? "outline" : "warning"
      }
    >
      {status === "active" ? "Active" : status === "completed" ? "Completed" : "On Hold"}
    </Badge>
  )

  const renderStatusToggle = (student: Student) => {
    const isActive = student.status === "active"
    const isUpdating = statusUpdatingId === student.id
    const accessLabel =
      student.status === "active"
        ? "Active"
        : student.status === "completed"
          ? "Completed"
          : "No Access"

    return (
      <div
        className="flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-label={`Toggle portal access for ${student.name}`}
          title={isActive ? "Turn off to revoke login and LMS access" : "Turn on to restore access"}
          disabled={isUpdating || student.status === "completed"}
          onClick={() => {
            if (student.status === "completed") return
            void handleStatusUpdate(student.id, isActive ? "on_hold" : "active")
          }}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
            isActive ? "bg-emerald-500" : "bg-zinc-600"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
              isActive ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
        <span
          className={`text-[10px] font-semibold whitespace-nowrap ${
            student.status === "active"
              ? "text-emerald-600 dark:text-emerald-400"
              : student.status === "completed"
                ? "text-sky-600 dark:text-sky-400"
                : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {isUpdating ? "Saving…" : accessLabel}
        </span>
      </div>
    )
  }

  const stats = React.useMemo(() => {
    if (!selectedStudentLogs || selectedStudentLogs.length === 0) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
        rate: 0,
        hasLogs: false,
      }
    }
    const present = selectedStudentLogs.filter(l => l.status === 'present').length
    const late = selectedStudentLogs.filter(l => l.status === 'late').length
    const absent = selectedStudentLogs.filter(l => l.status === 'absent').length
    const total = selectedStudentLogs.length
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { present, absent, late, total, rate, hasLogs: true }
  }, [selectedStudentLogs])

  const selectedStudentBatch = React.useMemo(() => {
    if (!selectedStudent || !batches.length) return null
    return batches.find((b: any) =>
      b.studentNames?.some(
        (name: string) => name.trim().toLowerCase() === selectedStudent.name.trim().toLowerCase()
      )
    )
  }, [selectedStudent, batches])

  const handleAssignBatch = async (batchId: string) => {
    if (!selectedStudent || !batchId) return
    const batch = batches.find((b: any) => String(b.id || b._id) === batchId)
    if (!batch) return

    try {
      const studentNames = [...(batch.studentNames || [])]
      const alreadyAssigned = studentNames.some(
        (name: string) => name.trim().toLowerCase() === selectedStudent.name.trim().toLowerCase()
      )
      if (!alreadyAssigned) {
        studentNames.push(selectedStudent.name)
      }

      await api.updateBatch(String(batch.id || batch._id), {
        studentNames,
        enrolled: studentNames.length,
        studentLmsAccess: {
          ...(batch.studentLmsAccess || {}),
          [selectedStudent.name]: true,
        },
      })

      const batchesData = await api.getBatches().catch(() => [])
      setBatches(batchesData || [])

      addNotification({
        title: "Batch Assigned",
        description: `${selectedStudent.name} was added to ${batch.code}.`,
        type: "admissions",
      })
    } catch (err: any) {
      alert(err.message || "Failed to assign batch")
    }
  }

  const getInstallmentsList = (student: Student) => computeInstallmentRows(student)
  const getDocuments = (student: Student) => {
    const safeName = student.name.toLowerCase().replace(/\s+/g, "_")
    return [
      {
        name: `Admit_ID_${safeName}.pdf`,
        size: "340 KB",
        type: "Uploaded on enrollment"
      },
      {
        name: `Course_Agreement_${safeName}.pdf`,
        size: "185 KB",
        type: "Signed Agreement"
      }
    ]
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-xs text-muted-foreground">Loading students directory...</p>
      </div>
    )
  }

  if (accessDenied && students.length === 0) {
    return (
      <AccessRestricted
        title="Student records are not available for this login"
        description="Classroom Coordinators load students from their assigned classes. Enquiry Coordinators may need a classroom (trainer) login to view the directory."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isTrainer
              ? "View students in your assigned classes, attendance, and progress."
              : "Student profiles, parent details, attendance, documents, and fee schedules."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && !isTrainer && (
            <div className="flex items-center gap-1.5 animate-scale-in">
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => handleBulkAction("export")}
                className="text-xs"
              >
                CSV ({selectedIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={BadgeDollarSign}
                onClick={() => handleBulkAction("remind")}
                className="text-xs text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
              >
                Remind ({selectedIds.length})
              </Button>
            </div>
          )}
          {!isTrainer && (
            <Button variant="primary" size="sm" icon={Plus} disabled={studentsAtCapacity} onClick={() => setIsAddOpen(true)}>
              Enroll Student
            </Button>
          )}
        </div>
      </div>

      {studentsAtCapacity && policy && (
        <CapacityLimitNotice resource="students" policy={policy} />
      )}

        {/* Filter and Search Bar */}
        <div className={`grid gap-3 bg-card p-4 rounded-xl border border-border ${showCourseBatchFilters ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div className="relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search student or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card pl-9 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

        {showCourseBatchFilters && (
          <>
            <Select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value)
                setFilterBatch("all")
              }}
              className="h-9 text-xs"
            >
              <option value="all">All Courses</option>
              {courseFilterOptions.map((courseName, index) => (
                <option key={courseName || `course-${index}`} value={courseName}>
                  {courseName}
                </option>
              ))}
            </Select>
            <Select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="all">All Batches</option>
              {batchFilterOptions.map((batch, index) => (
                <option key={batch.id || batch._id || `batch-${index}`} value={String(batch.id)}>
                  {batch.courseName} ({batch.code})
                </option>
              ))}
            </Select>
          </>
        )}
      </div>

      {/* Student List Table */}
      <Card className="bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                  {!isTrainer && (
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-border/80 text-primary focus:ring-primary cursor-pointer"
                        checked={paginatedStudents.length > 0 && selectedIds.length === paginatedStudents.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="p-4">Student</th>
                  {!isTrainer && <th className="p-4">Next Due Date</th>}
                  <th className="p-4">Course</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Attendance</th>
                  {!isTrainer && <th className="p-4">Paid / Total Dues</th>}
                  <th className="p-4 font-semibold text-center">Actions</th>
                  <th className="p-4 text-right">Enrollment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={isTrainer ? 6 : 8} className="py-12 text-center text-muted-foreground">
                      No student records matched the filters.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => {
                    const isSelected = selectedIds.includes(student.id)
                    const studentBatches = getStudentBatches(student)
                    
                    // If course is accidentally set to a batch name (e.g. "Toddler Program - A"), fallback correctly
                    const displayCourse =
                      student.course && !student.course.includes(" - ")
                        ? student.course
                        : studentBatches[0]?.courseName || student.course || "—"
                        
                    const displayBatch =
                      studentBatches.length > 0
                        ? studentBatches.map((batch) => batch.code).join(", ")
                        : "—"
                    return (
                      <tr 
                        key={student.id || (student as any)._id}
                        onClick={() => setSelectedStudent(student)}
                        className={`hover:bg-muted/40 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        {!isTrainer && (
                          <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(student.id)}
                              className="rounded border-border/80 text-primary focus:ring-primary cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-4 font-bold text-foreground">
                          <div>
                            <p className="hover:underline">{student.name}</p>
                            <div className="text-[10px] text-muted-foreground font-normal space-y-0.5">
                              <p>{student.email}</p>
                              <p>{student.phone}</p>
                            </div>
                          </div>
                        </td>
                        {!isTrainer && (
                          <td className="p-4 text-muted-foreground font-mono">
                            {isFullyPaid(student.feesPaid, student.feesTotal) ? (
                              <span className="text-emerald-500 font-bold text-[10px] uppercase">Fully Paid</span>
                            ) : resolveNextDueDate(student) ? (
                              <span>{formatDate(resolveNextDueDate(student)!)}</span>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </td>
                        )}
                        <td className="p-4 text-foreground">{displayCourse}</td>
                        <td className="p-4 text-foreground">{displayBatch}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${student.attendanceRate < 75 ? "text-red-500" : "text-foreground"}`}>
                              {student.attendanceRate}%
                            </span>
                            <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${student.attendanceRate < 75 ? "bg-red-500" : "bg-primary"}`} 
                                style={{ width: `${student.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {!isTrainer && (
                          <td className="p-4 font-semibold text-foreground">
                            {formatCurrency(student.feesPaid)} / {formatCurrency(student.feesTotal)}
                          </td>
                        )}
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(student)}
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                              title="View Student Profile"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                              title="Edit Student Profile"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingStudentId(student.id)}
                              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">{formatDate(student.enrollmentDate)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredStudents.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border bg-secondary/10">
              <div className="text-[11px] text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{paginationStart}</span> to{" "}
                <span className="font-semibold text-foreground">{paginationEnd}</span> of{" "}
                <span className="font-semibold text-foreground">{filteredStudents.length}</span> students
                <span className="text-muted-foreground/80"> · {STUDENTS_PAGE_SIZE} per page</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs font-medium text-foreground px-1">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Profile Drawer Panel */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-card border-l border-border shadow-2xl p-6 flex flex-col justify-between animate-slide-in-bottom">
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selectedStudent.name}</h2>
                    <span className="text-[10px] text-muted-foreground">
                      ID: {selectedStudent.id}
                      {isTrainer ? (
                        <> • {getStudentBatches(selectedStudent).map((b) => `${b.courseName} (${b.batchName})`).join(", ") || selectedStudent.course}</>
                      ) : (
                        <> • {selectedStudent.course}</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedStudent)}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-primary" /> Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingStudentId(selectedStudent.id)}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview">
                <TabsList className={`grid w-full h-9 ${isTrainer ? "grid-cols-3" : "grid-cols-4"}`}>
                  <TabsTrigger value="overview">Info</TabsTrigger>
                  <TabsTrigger value="attendance">Attd</TabsTrigger>
                  {!isTrainer && <TabsTrigger value="fees">Fees</TabsTrigger>}
                  <TabsTrigger value="docs">Docs</TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="overview" className="space-y-4 pt-2">
                  
                  {/* Health Alerts - Show ONLY if there are allergies or medical notes */}
                  {selectedStudent.allergies && selectedStudent.allergies.toLowerCase() !== "none" && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">Health Alert: Allergies</p>
                        <p className="text-sm font-medium mt-0.5">{selectedStudent.allergies}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Primary Details Card */}
                    <Card className="p-4 bg-card border border-border shadow-xs col-span-2 sm:col-span-1">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/40">
                        <Users className="h-3.5 w-3.5" /> Personal Details
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Date of Birth</p>
                          <p className="font-semibold text-foreground">
                            {selectedStudent.dateOfBirth ? formatDate(selectedStudent.dateOfBirth) : "Not specified"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Gender</p>
                            <p className="font-semibold text-foreground capitalize">{selectedStudent.gender || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Blood Group</p>
                            <p className="font-semibold text-foreground">
                              {selectedStudent.bloodGroup ? (
                                <span className="inline-flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded px-1.5 py-0.5 text-[10px] font-bold">
                                  {selectedStudent.bloodGroup}
                                </span>
                              ) : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-[10px] text-muted-foreground">Admission Date</p>
                          <p className="font-semibold text-foreground">
                            {selectedStudent.admissionDate ? formatDate(selectedStudent.admissionDate) : (selectedStudent.enrollmentDate ? formatDate(selectedStudent.enrollmentDate) : "—")}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Parents & Guardians Card */}
                    <Card className="p-4 bg-card border border-border shadow-xs col-span-2 sm:col-span-1">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/40">
                        <Phone className="h-3.5 w-3.5" /> Guardian & Contacts
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            Primary Parent / {selectedStudent.parentRelation || "Guardian"}
                          </p>
                          <p className="font-semibold text-foreground">{selectedStudent.parentName || "—"}</p>
                          <p className="text-muted-foreground">{selectedStudent.parentPhone || selectedStudent.phone || "—"}</p>
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-[10px] text-muted-foreground">Emergency Contact</p>
                          <p className="font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                            <ShieldAlert className="h-3 w-3" />
                            {selectedStudent.emergencyContact || "—"}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-[10px] text-muted-foreground">Authorized Pickup Person</p>
                          <p className="font-semibold text-foreground">{selectedStudent.pickupPerson || selectedStudent.parentName || "—"}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Batch Allocation */}
                    <Card className="p-4 bg-card border border-border shadow-xs col-span-2 sm:col-span-1">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/40">
                        <GraduationCap className="h-3.5 w-3.5" /> Batch & Transport
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Assigned Batch</p>
                          {selectedStudentBatch ? (
                            <div className="mt-0.5">
                              <p className="font-semibold text-foreground text-sm">{selectedStudentBatch.code}</p>
                              <p className="text-muted-foreground">{selectedStudentBatch.courseName}</p>
                            </div>
                          ) : (
                            <div className="space-y-2 mt-1">
                              <p className="text-amber-600 dark:text-amber-400 font-medium text-[10px]">
                                Needs assignment
                              </p>
                              <Select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) handleAssignBatch(e.target.value)
                                }}
                                className="h-7 text-[10px] bg-secondary/30"
                              >
                                <option value="">Assign batch...</option>
                                {batches.map((batch: any, index: number) => (
                                  <option key={batch.id || batch._id || `assign-${index}`} value={batch.id || batch._id}>
                                    {batch.code}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-[10px] text-muted-foreground">Transport Route</p>
                          <p className="font-semibold text-foreground">{selectedStudent.transport || "Self Drop/Pickup"}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Quick Fees Snapshot */}
                    <Card className="p-4 bg-card border border-border shadow-xs col-span-2 sm:col-span-1">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/40">
                        <BadgeDollarSign className="h-3.5 w-3.5" /> Quick Fee Status
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Overall Status</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {selectedStudent.feesPaid >= selectedStudent.feesTotal && selectedStudent.feesTotal > 0 ? (
                              <span className="text-emerald-500 font-bold uppercase text-[10px] flex items-center gap-1"><Check className="h-3 w-3" /> Fully Paid</span>
                            ) : selectedStudent.feesTotal > 0 ? (
                              <span className="text-amber-500 font-bold uppercase text-[10px] flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Outstanding Dues</span>
                            ) : (
                              <span className="text-muted-foreground">Not Setup</span>
                            )}
                          </p>
                        </div>
                        {selectedStudent.feesPaid < selectedStudent.feesTotal && resolveNextDueDate(selectedStudent) && (
                          <div className="pt-2 border-t border-border/40">
                            <p className="text-[10px] text-muted-foreground">Next Installment Due</p>
                            <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5 font-mono">
                              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className={new Date(resolveNextDueDate(selectedStudent)!) < new Date() ? "text-red-500" : ""}>
                                {formatDate(resolveNextDueDate(selectedStudent)!)}
                              </span>
                            </p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-[10px] text-muted-foreground">Progress</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${selectedStudent.feesTotal > 0 ? (selectedStudent.feesPaid / selectedStudent.feesTotal) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold">{selectedStudent.feesTotal > 0 ? Math.round((selectedStudent.feesPaid / selectedStudent.feesTotal) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Vaccine & Health Record Card */}
                  <Card className="p-4 bg-muted/10 text-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Syringe className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-foreground uppercase text-[10px] text-muted-foreground">Vaccine & Health Record</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStudentVaxForm((prev) => !prev)}
                        className="h-7 px-2.5 rounded-lg bg-primary text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add Vaccine Record
                      </button>
                    </div>

                    {showStudentVaxForm && (
                      <div className="p-3 bg-card rounded-xl border border-border/60 mb-3 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Vaccine Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. MMR, DTP"
                              value={newStudentVaxName}
                              onChange={(e) => setNewStudentVaxName(e.target.value)}
                              className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Date Given</label>
                            <input
                              type="date"
                              value={newStudentVaxDate}
                              onChange={(e) => setNewStudentVaxDate(e.target.value)}
                              className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Next Due (Optional)</label>
                            <input
                              type="date"
                              value={newStudentVaxDue}
                              onChange={(e) => setNewStudentVaxDue(e.target.value)}
                              className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-wrap gap-1">
                            {["BCG", "Hepatitis B", "DTP", "Polio", "MMR", "Chickenpox", "Rotavirus"].map((vName) => (
                              <button
                                key={vName}
                                type="button"
                                onClick={() => setNewStudentVaxName(vName)}
                                className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-muted border border-border hover:border-primary text-muted-foreground transition-all"
                              >
                                + {vName}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowStudentVaxForm(false)}
                              className="h-7 px-2.5 rounded-lg border border-border text-[11px] text-muted-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddStudentVaccine(selectedStudent.id)}
                              disabled={!newStudentVaxName.trim()}
                              className="h-7 px-2.5 rounded-lg bg-primary text-white text-[11px] font-semibold disabled:opacity-50"
                            >
                              Save Record
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="divide-y divide-border/40">
                      {(!selectedStudent.vaccinations || selectedStudent.vaccinations.length === 0) ? (
                        <p className="text-muted-foreground text-[11px] py-2 italic">No vaccine records logged yet for this student.</p>
                      ) : (
                        selectedStudent.vaccinations.map((v, i) => (
                          <div key={i} className="py-2 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground text-xs">{v.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {v.date ? `Given: ${formatDate(v.date)}` : "Date not recorded"}
                                {v.due ? ` • Next Due: ${formatDate(v.due)}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 border ${
                                v.date ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {v.date ? "Completed" : "Pending / Due"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveStudentVaccine(selectedStudent.id, i)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="pt-2 space-y-4">
                  {loadingLogs ? (
                    <div className="flex flex-col justify-center items-center py-12 space-y-2">
                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] text-muted-foreground">Loading logs...</p>
                    </div>
                  ) : (
                    <>
                      {/* Overall Stat Banner */}
                      <Card className="bg-secondary/15 border-border/40 p-4">
                        <div className="flex items-center gap-6">
                          <div className="relative h-20 w-20 shrink-0 flex items-center justify-center">
                            <svg className="h-full w-full transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="30"
                                className="stroke-secondary"
                                strokeWidth="6"
                                fill="transparent"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="30"
                                className={
                                  stats.rate >= 90 ? "stroke-emerald-500" :
                                  stats.rate >= 75 ? "stroke-primary" : "stroke-red-500"
                                }
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 30}
                                strokeDashoffset={(2 * Math.PI * 30) - (stats.rate / 100) * (2 * Math.PI * 30)}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-sm font-black text-foreground">{stats.rate}%</span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-foreground">Attendance Performance</h4>
                            <p className="text-[11px] text-muted-foreground leading-normal">
                              {!stats.hasLogs
                                ? "No attendance recorded yet. Assign this student to a batch, then mark attendance from the Attendance page."
                                : stats.rate >= 90
                                  ? "Excellent standing. Student is meeting all required curriculum attendance goals."
                                  : stats.rate >= 75
                                    ? "Satisfactory attendance. Recommend regular check-ins to prevent drop-off."
                                    : "Critical attendance alert! Rate is below the 75% graduation requirement threshold."}
                            </p>
                          </div>
                        </div>
                      </Card>

                      {/* Header metrics grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                        <div className="p-3 bg-emerald-500/5 text-emerald-500 rounded-xl border border-emerald-500/10">
                          <p className="text-lg font-black">{stats.present + stats.late}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">Attended Days</p>
                        </div>
                        <div className="p-3 bg-red-500/5 text-red-500 rounded-xl border border-red-500/10">
                          <p className="text-lg font-black">{stats.absent}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">Absent Days</p>
                        </div>
                        <div className="p-3 bg-secondary/35 rounded-xl border border-border/80 text-foreground">
                          <p className="text-lg font-black">{stats.total}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">Total Sessions</p>
                        </div>
                      </div>

                      {!selectedStudentBatch && (
                        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                          <span>This student is not allocated to a batch. Go to the Info tab and assign a batch first.</span>
                        </div>
                      )}

                      {/* Warning Banner */}
                      {stats.hasLogs && stats.rate < 75 && (
                        <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-600 dark:text-red-400">
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                          <span>Warning: Attendance rate has dropped below safety limits (75%). Action required.</span>
                        </div>
                      )}

                      {/* Attendance Log Ledger Timeline */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Check-in Audit Logs</span>
                        </h5>
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                          {selectedStudentLogs.length === 0 ? (
                            <div className="text-center py-8 text-xs text-muted-foreground italic bg-secondary/10 border border-dashed border-border rounded-xl">
                              No attendance log ledger entries found.
                            </div>
                          ) : (
                            [...selectedStudentLogs]
                              .sort((a, b) => b.date.localeCompare(a.date))
                              .map((log) => {
                                let badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                if (log.status === "absent") badgeColor = "bg-red-500/10 text-red-500 border-red-500/20"
                                if (log.status === "late") badgeColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"

                                return (
                                  <div key={log.id || log._id} className="p-3 border border-border/60 rounded-xl flex items-center justify-between bg-card text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-extrabold text-foreground">{formatDate(log.date)}</span>
                                        {selectedStudentBatch && (
                                          <span className="text-[9px] text-primary font-bold px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10 uppercase">
                                            {selectedStudentBatch.code}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-muted-foreground font-semibold leading-normal">
                                        Topic: {(() => {
                                          if (!selectedStudentBatch || !selectedStudentBatch.sessions) return "General Lecture"
                                          const logDateStr = log.date.substring(0, 10)
                                          const match = selectedStudentBatch.sessions.find((s: any) => s && s.date && s.date.substring(0, 10) === logDateStr)
                                          return match ? match.topic : (selectedStudentBatch.nextSessionTopic || "General Lecture")
                                        })()}
                                      </p>
                                    </div>
                                    <Badge className={badgeColor}>
                                      {log.status === "present" ? "Present" : log.status === "absent" ? "Absent" : "Late"}
                                    </Badge>
                                  </div>
                                )
                              })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Fees Tab */}
                <TabsContent value="fees" className="pt-2 space-y-4">
                  <div className="flex justify-between items-center text-xs p-3.5 rounded-lg border border-border bg-secondary/30">
                    <div>
                      <p className="text-muted-foreground">Collected Dues</p>
                      <p className="text-base font-bold mt-0.5">{formatCurrency(selectedStudent.feesPaid)} / {formatCurrency(selectedStudent.feesTotal)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedStudent.feesPaid < selectedStudent.feesTotal ? (
                        <Badge variant="warning">Dues Outstanding</Badge>
                      ) : (
                        <Badge variant="success">Fully Paid</Badge>
                      )}
                      {!isTrainer && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2 cursor-pointer"
                          onClick={() => {
                            setEditFeesTotal(String(selectedStudent.feesTotal))
                            setEditFeesPaid(String(selectedStudent.feesPaid))
                            setIsEditingFees(!isEditingFees)
                          }}
                        >
                          {isEditingFees ? "Cancel" : "Update"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditingFees && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3.5 border border-border rounded-lg bg-card space-y-3 overflow-hidden text-xs"
                    >
                      <p className="font-bold text-xs">Update Dues Ledger</p>
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">Total Fees (₹)</label>
                          <input
                            type="number"
                            value={editFeesTotal}
                            onChange={(e) => setEditFeesTotal(e.target.value)}
                            className="w-full h-8.5 px-2.5 rounded-lg border border-border bg-card text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">Fees Paid (₹)</label>
                          <input
                            type="number"
                            value={editFeesPaid}
                            onChange={(e) => setEditFeesPaid(e.target.value)}
                            className="w-full h-8.5 px-2.5 rounded-lg border border-border bg-card text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                        {selectedStudent.feesPaid < selectedStudent.feesTotal && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 mr-auto cursor-pointer"
                            onClick={() => {
                              setEditFeesPaid(String(editFeesTotal))
                            }}
                          >
                            Mark Fully Paid
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="h-7 text-[10px] cursor-pointer"
                          onClick={handleSaveFees}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2 text-xs">
                    <h5 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wide">Installment History</h5>
                    {getInstallmentsList(selectedStudent).map((inst) => (
                      <div key={inst.number} className="p-3 border border-border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold">
                            Installment #{inst.number} - {inst.label}
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({inst.number}/{getInstallmentsList(selectedStudent).length})
                            </span>
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {inst.status === "paid"
                              ? `Paid: ${formatDate(inst.dueDate)}`
                              : inst.status === "overdue"
                                ? `Overdue: ${formatDate(inst.dueDate)}`
                                : `Due: ${formatDate(inst.dueDate)}`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={
                            inst.status === "paid"
                              ? "font-semibold text-emerald-500"
                              : inst.status === "overdue"
                                ? "font-semibold text-red-500"
                                : "font-semibold text-amber-500"
                          }>
                            {inst.status === "paid"
                              ? `+${formatCurrency(inst.amount)}`
                              : inst.status === "partial"
                                ? `${formatCurrency(inst.dueAmount)} due (${formatCurrency(inst.paidAmount)} paid)`
                                : `${formatCurrency(inst.dueAmount || inst.amount)} (${inst.status === "overdue" ? "Overdue" : "Pending"})`
                            }
                          </span>
                          {inst.status !== "paid" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[9px] py-0 px-2 text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
                              onClick={() => handlePayInstallment(inst.dueAmount || inst.amount)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="docs" className="pt-2 space-y-2.5">
                  {getDocuments(selectedStudent).map((doc, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-bold">{doc.name}</p>
                          <span className="text-[9px] text-muted-foreground">{doc.size} • {doc.type}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" icon={FileDown} className="h-7 text-[10px]" onClick={() => alert(`Downloading ${doc.name}...`)}>
                        Download
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id))
                  setSelectedStudent(null)
                }}
                icon={Trash2}
                className="w-full"
              >
                Deregister Student
              </Button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Dialog */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); setAddStep(1); }}
        title="Enroll New Student"
        description={`Step ${addStep} of 4: ${addStep === 1 ? 'Required Details' : addStep === 2 ? 'Optional Details' : addStep === 3 ? 'Documents' : 'Fees & Payment'}`}
        className="max-w-2xl"
      >
        <form onSubmit={addStep === 4 ? handleAddStudent : (e) => { e.preventDefault(); setAddStep(p => p + 1); }} className="space-y-4">
          {studentsAtCapacity && policy && (
            <CapacityLimitNotice resource="students" policy={policy} variant="inline" />
          )}

          {/* Stepper Header */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4].map(step => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${addStep === step ? 'border-primary bg-primary text-white' : addStep > step ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-card text-muted-foreground'}`}>
                  {addStep > step ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 4 && <div className={`h-1 flex-1 rounded-full ${addStep > step ? 'bg-emerald-500' : 'bg-border'}`} />}
              </React.Fragment>
            ))}
          </div>

          {addStep === 1 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Student Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Date of Birth <span className="text-red-500">*</span></label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Gender <span className="text-red-500">*</span></label>
                  <Select value={gender} onChange={(e) => setGender(e.target.value)} className="bg-card text-xs h-9.5" required>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Class/Grade <span className="text-red-500">*</span></label>
                  <Select value={course} onChange={(e) => setCourse(e.target.value)} className="bg-card text-xs h-9.5" required>
                    {courses.map((c, index) => <option key={c.id || c._id || `course-opt-${index}`} value={c.name}>{c.name}</option>)}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parent/Guardian Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parent Mobile Number <span className="text-red-500">*</span></label>
                  <Input placeholder="+1 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Relationship <span className="text-red-500">*</span></label>
                  <Select value={parentRelation} onChange={(e) => setParentRelation(e.target.value)} className="bg-card text-xs h-9.5" required>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Academic Year <span className="text-red-500">*</span></label>
                  <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Address <span className="text-red-500">*</span></label>
                <textarea
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg text-xs p-2.5 min-h-[60px]" required
                  placeholder="Full residential address"
                />
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Admission Date <span className="text-red-500">*</span></label>
                  <Input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Emergency Contact <span className="text-red-500">*</span></label>
                  <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Pickup Person <span className="text-red-500">*</span></label>
                  <Input value={pickupPerson} onChange={(e) => setPickupPerson(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Profile Photo</label>
                  <input type="file" className="block w-full text-xs file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted/40 cursor-pointer h-9.5 border border-border rounded-md bg-card pt-0.5 pl-0.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Blood Group</label>
                  <Input placeholder="e.g. O+" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Allergies / Medical Details</label>
                  <Input placeholder="Any medical conditions..." value={allergies} onChange={(e) => setAllergies(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Previous School</label>
                  <Input placeholder="Name of previous school (if any)" value={prevSchool} onChange={(e) => setPrevSchool(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Transport Details</label>
                  <Input placeholder="Route or pickup location" value={transport} onChange={(e) => setTransport(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
              </div>
            </div>
          )}

          {addStep === 3 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-primary" /> Birth Certificate</p>
                    <p className="text-[10px] text-muted-foreground">Recommended for age verification</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-muted-foreground" /> Student ID Document</p>
                    <p className="text-[10px] text-muted-foreground">Optional</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-muted-foreground" /> Address Proof</p>
                    <p className="text-[10px] text-muted-foreground">Optional</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-muted-foreground" /> Previous School Record</p>
                    <p className="text-[10px] text-muted-foreground">Optional</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {addStep === 4 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BadgeDollarSign className="h-4 w-4 text-primary" /> Fee Structure & Payment Details
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Setup fee details</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Total Fees (₹) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      placeholder="Total course fees"
                      value={feesTotal}
                      onChange={(e) => setFeesTotal(e.target.value)}
                      className="bg-card text-xs h-9.5"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fees Paid (₹) <span className="text-red-500">*</span></label>
                    <Input
                      type="number"
                      placeholder="Amount paid"
                      value={feesPaid}
                      onChange={(e) => setFeesPaid(e.target.value)}
                      className="bg-card text-xs h-9.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Next Due Date</label>
                    <Input
                      type="date"
                      value={addNextDueDate}
                      onChange={(e) => setAddNextDueDate(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Installments Count</label>
                    <Select
                      value={addInstallmentCount}
                      onChange={(e) => setAddInstallmentCount(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    >
                      <option value="1">1 (Single Payment)</option>
                      <option value="2">2 Installments</option>
                      <option value="3">3 Installments</option>
                      <option value="4">4 Installments</option>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-lg border border-border/50 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Remaining Dues: </span>
                    <span className={`font-bold ${Number(feesTotal) - Number(feesPaid) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      ₹{Math.max(0, Number(feesTotal) - Number(feesPaid))}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Status: {Number(feesPaid) >= Number(feesTotal) && Number(feesTotal) > 0 ? "Paid in Full" : Number(feesPaid) > 0 ? "Partial Payment" : "Pending"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border/50 flex justify-between items-center mt-6">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAddOpen(false); setAddStep(1); }}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {addStep > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setAddStep(p => p - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" disabled={addStep === 4 && studentsAtCapacity}>
                {addStep < 4 ? "Next Step" : "Enroll Student"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog
        isOpen={Boolean(editingStudent)}
        onClose={() => { setEditingStudent(null); setEditStep(1); }}
        title={`Edit Profile — ${editingStudent?.name || ""}`}
        description={`Step ${editStep} of 4: ${editStep === 1 ? 'Required Details' : editStep === 2 ? 'Optional Details' : editStep === 3 ? 'Documents' : 'Fees & Payment Setup'}`}
        className="max-w-2xl"
      >
        <form onSubmit={editStep === 4 ? handleSaveEditedStudent : (e) => { e.preventDefault(); setEditStep(p => p + 1); }} className="space-y-4 pt-1 pr-1">
          
          {/* Stepper Header */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4].map(step => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 ${editStep === step ? 'border-primary bg-primary text-white' : editStep > step ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-card text-muted-foreground'}`}>
                  {editStep > step ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 4 && <div className={`h-1 flex-1 rounded-full ${editStep > step ? 'bg-emerald-500' : 'bg-border'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Section 1: Required Details */}
          {editStep === 1 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Student Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Full name" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Date of Birth <span className="text-red-500">*</span></label>
                  <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Gender <span className="text-red-500">*</span></label>
                  <Select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="bg-card text-xs h-9.5" required>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Class/Grade <span className="text-red-500">*</span></label>
                  <Select value={editCourse} onChange={(e) => setEditCourse(e.target.value)} className="bg-card text-xs h-9.5" required>
                    {courses.length > 0 ? (
                      courses.map((c, index) => <option key={c.id || c._id || `edit-c-${index}`} value={c.name}>{c.name}</option>)
                    ) : (
                      <option value="Playgroup & Toddlers">Playgroup & Toddlers</option>
                    )}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parent/Guardian Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Parent name" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Parent Mobile Number <span className="text-red-500">*</span></label>
                  <Input placeholder="+1 555-0123" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Relationship <span className="text-red-500">*</span></label>
                  <Select value={editParentRelation} onChange={(e) => setEditParentRelation(e.target.value)} className="bg-card text-xs h-9.5" required>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Academic Year <span className="text-red-500">*</span></label>
                  <Input value={editAcademicYear} onChange={(e) => setEditAcademicYear(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Address <span className="text-red-500">*</span></label>
                <textarea
                  value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg text-xs p-2.5 min-h-[60px]" required
                  placeholder="Full residential address"
                />
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Admission Date <span className="text-red-500">*</span></label>
                  <Input type="date" value={editAdmissionDate} onChange={(e) => setEditAdmissionDate(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Emergency Contact <span className="text-red-500">*</span></label>
                  <Input value={editEmergencyContact} onChange={(e) => setEditEmergencyContact(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Pickup Person <span className="text-red-500">*</span></label>
                  <Input value={editPickupPerson} onChange={(e) => setEditPickupPerson(e.target.value)} className="bg-card text-xs h-9.5" required />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Optional Details */}
          {editStep === 2 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input type="email" placeholder="name@email.com" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Blood Group</label>
                  <Input placeholder="e.g. O+" value={editBloodGroup} onChange={(e) => setEditBloodGroup(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Allergies / Medical Details</label>
                  <Input placeholder="Any medical conditions..." value={editAllergies} onChange={(e) => setEditAllergies(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Previous School</label>
                  <Input placeholder="Name of previous school (if any)" value={editPrevSchool} onChange={(e) => setEditPrevSchool(e.target.value)} className="bg-card text-xs h-9.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Transport Details</label>
                <Input placeholder="Route or pickup location" value={editTransport} onChange={(e) => setEditTransport(e.target.value)} className="bg-card text-xs h-9.5" />
              </div>
            </div>
          )}

          {/* Section 3: Documents */}
          {editStep === 3 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-primary" /> Birth Certificate</p>
                    <p className="text-[10px] text-muted-foreground">Recommended for age verification</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-muted-foreground" /> Student ID Document</p>
                    <p className="text-[10px] text-muted-foreground">Optional</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-muted-foreground" /> Address Proof</p>
                    <p className="text-[10px] text-muted-foreground">Optional</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-1.5"><FileCheck className="h-4 w-4 text-muted-foreground" /> Previous School Record</p>
                    <p className="text-[10px] text-muted-foreground">Optional</p>
                  </div>
                  <input type="file" className="block max-w-[200px] text-[10px] file:mr-2 file:rounded file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-foreground cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Fees & Payment Setup */}
          {editStep === 4 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BadgeDollarSign className="h-4 w-4 text-primary" /> Fee Structure & Payment Details
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Update fee details</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Total Fees (₹)</label>
                    <Input
                      type="number"
                      value={editFeesTotal}
                      onChange={(e) => setEditFeesTotal(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fees Paid (₹)</label>
                    <Input
                      type="number"
                      value={editFeesPaid}
                      onChange={(e) => setEditFeesPaid(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Next Due Date</label>
                    <Input
                      type="date"
                      value={editNextDueDate}
                      onChange={(e) => setEditNextDueDate(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Installments Count</label>
                    <Select
                      value={editInstallmentsCount}
                      onChange={(e) => setEditInstallmentsCount(e.target.value)}
                      className="bg-card text-xs h-9.5"
                    >
                      <option value="1">1 (Single Payment)</option>
                      <option value="2">2 Installments</option>
                      <option value="3">3 Installments</option>
                      <option value="4">4 Installments</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border/50 flex justify-between items-center mt-6">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingStudent(null); setEditStep(1); }}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {editStep > 1 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setEditStep(p => p - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" icon={editStep === 4 ? Pencil : undefined}>
                {editStep < 4 ? "Next Step" : "Save Profile"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={Boolean(deletingStudentId)} onClose={() => setDeletingStudentId(null)} title="Delete Student Record">
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete this student record? This action cannot be undone.
            </p>
          </div>
          <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingStudentId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              icon={Trash2}
              onClick={() => deletingStudentId && handleDeleteStudent(deletingStudentId)}
            >
              Delete Student
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
