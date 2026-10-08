import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Student } from "@/models/Student"
import { Staff } from "@/models/Staff"
import { Lead } from "@/models/Lead"
import { Attendance } from "@/models/Attendance"
import { Admission, Journal, ChildCare } from "@/models/index"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

// GET /api/dashboard/metrics
export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const tf = tenantFilter(user)
    const today = new Date().toISOString().slice(0, 10)

    const [totalStudents, allActiveStudents, totalStaff, activeStaff, totalLeads, pendingAdmissions, todayAttendances, todayJournalsList, todaySafetyList] =
      await Promise.all([
        Student.countDocuments(tf),
        Student.find({ ...tf, status: "active" }),
        Staff.countDocuments(tf),
        Staff.countDocuments({ ...tf, status: "active" }),
        Lead.countDocuments(tf),
        Admission.countDocuments({ ...tf, status: "pending" }),
        Attendance.find({ ...tf, date: today, type: "student" }),
        Journal.find({ ...tf, date: today }),
        ChildCare.find({ ...tf, date: today }),
      ])

    const activeStudents = allActiveStudents.length

    let presentCount = 0
    let absentCount = 0
    let sectionAttendanceMap: Record<string, { Enrolled: number; Present: number }> = {}

    // Initialize Enrolled from Students
    allActiveStudents.forEach(s => {
      const sec = s.className || "Unassigned"
      if (!sectionAttendanceMap[sec]) sectionAttendanceMap[sec] = { Enrolled: 0, Present: 0 }
      sectionAttendanceMap[sec].Enrolled++
    })

    // Count Present/Absent and section Present
    todayAttendances.forEach(att => {
      const sec = att.className || "Unassigned"
      if (!sectionAttendanceMap[sec]) sectionAttendanceMap[sec] = { Enrolled: 0, Present: 0 }
      
      att.records.forEach((r: any) => {
        if (r.status === "present" || r.status === "late") {
          presentCount++
          sectionAttendanceMap[sec].Present++
        } else if (r.status === "absent") {
          absentCount++
        }
      })
    })

    const sectionAttendanceData = Object.keys(sectionAttendanceMap).map(sec => ({
      section: sec,
      ...sectionAttendanceMap[sec]
    }))

    // Journal Updates Data
    let mealCount = 0
    let napCount = 0
    let photoCount = 0
    
    // We also use ChildCare for meals and naps based on type
    todaySafetyList.forEach(cc => {
      if (cc.type === "meal") mealCount++
      if (cc.type === "nap") napCount++
    })

    todayJournalsList.forEach(j => {
      if (j.photos && j.photos.length > 0) photoCount++
    })

    const totalLogs = mealCount + napCount + photoCount
    const pendingLogs = Math.max(0, activeStudents - totalLogs) // simplistic proxy
    const totalJournalMetric = totalLogs + pendingLogs
    
    const journalUpdatesData = totalJournalMetric === 0 ? [] : [
      { name: "Meal Photos", value: Math.round((mealCount / totalJournalMetric) * 100), color: "#8B0000" },
      { name: "Nap Logs", value: Math.round((napCount / totalJournalMetric) * 100), color: "#D97706" },
      { name: "Activity Videos", value: Math.round((photoCount / totalJournalMetric) * 100), color: "#10B981" },
      { name: "Pending Logs", value: Math.round((pendingLogs / totalJournalMetric) * 100), color: "#6B7280" },
    ]

    // Safety Watchlist Data
    let allergyAlerts = 0
    let earlyPickups = 0 // Mocking early pickups since not explicitly tracked yet
    allActiveStudents.forEach(s => {
      if (s.allergies && s.allergies.length > 0) allergyAlerts++
      if (s.medicalNotes && s.medicalNotes.toLowerCase().includes("allergy")) allergyAlerts++
    })

    const safetyWatchlistData = [
      { category: "Absenteeism", count: absentCount, fill: "#F59E0B" },
      { category: "Food Allergy", count: allergyAlerts, fill: "#EF4444" },
      { category: "Early Pickup", count: earlyPickups, fill: "#3B82F6" },
      { category: "Special Care", count: 0, fill: "#10B981" },
    ]

    // Routine Timeline (Mocked based on attendance time for now since no detailed timeline events yet)
    const routineTimelineData = [
      { time: "09:00 AM", Children: presentCount, Completion: presentCount > 0 ? 100 : 0 },
      { time: "10:00 AM", Children: Math.floor(presentCount * 0.9), Completion: presentCount > 0 ? 85 : 0 },
      { time: "11:00 AM", Children: presentCount, Completion: presentCount > 0 ? 60 : 0 },
      { time: "12:00 PM", Children: Math.floor(presentCount * 0.4), Completion: presentCount > 0 ? 30 : 0 },
      { time: "01:00 PM", Children: Math.floor(presentCount * 0.5), Completion: presentCount > 0 ? 15 : 0 },
      { time: "02:00 PM", Children: presentCount, Completion: 0 },
    ]

    return NextResponse.json({
      totalStudents,
      activeStudents,
      totalStaff,
      activeStaff,
      totalLeads,
      pendingAdmissions,
      todayPresent: presentCount,
      todayAbsent: absentCount,
      todayJournals: todayJournalsList.length,
      
      sectionAttendanceData,
      journalUpdatesData,
      safetyWatchlistData,
      routineTimelineData,
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
