"use client"

import * as React from "react"
import { BookOpen, Edit2, Trash2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { fetchAPI } from "@/lib/api"
import { formatClock } from "@/lib/preschoolBatch"
import {
  formatAgeGroup,
  makeProgramCode,
  mergeProgramLists,
  parseAgeRange,
  persistPrograms,
  uniqueDurations,
  uniqueProgramNames,
  type ProgramStatus,
  type SavedClassProgram,
} from "@/lib/preschoolProgram"

interface Course extends SavedClassProgram {}

interface Batch {
  id: string
  courseName: string
}

export default function ManageCoursesPage() {
  const { addNotification } = useStore()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [batches, setBatches] = React.useState<Batch[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Edit Course Modal States
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editCode, setEditCode] = React.useState("")
  const [editDuration, setEditDuration] = React.useState("")
  const [editAgeFrom, setEditAgeFrom] = React.useState("")
  const [editAgeTo, setEditAgeTo] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editStartTime, setEditStartTime] = React.useState("09:00")
  const [editEndTime, setEditEndTime] = React.useState("12:30")
  const [editCapacity, setEditCapacity] = React.useState("20")
  const [editStatus, setEditStatus] = React.useState<ProgramStatus>("active")
  const [editCodeTouched, setEditCodeTouched] = React.useState(true)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [coursesData, batchesData] = await Promise.all([
        fetchAPI('/courses'),
        fetchAPI('/batches')
      ])
      setCourses(mergeProgramLists(coursesData))
      setBatches(Array.isArray(batchesData) ? batchesData : [])
    } catch (error) {
      console.error("Failed to load courses data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const savedProgramNames = React.useMemo(() => uniqueProgramNames(courses), [courses])
  const savedDurations = React.useMemo(() => uniqueDurations(courses), [courses])

  const handleEditClick = (course: Course) => {
    const range = parseAgeRange(course)
    setSelectedCourse(course)
    setEditName(course.name)
    setEditCode(course.code)
    setEditDuration(course.duration || "")
    setEditAgeFrom(range.from)
    setEditAgeTo(range.to)
    setEditDescription(course.description || "")
    setEditStartTime(course.startTime || "09:00")
    setEditEndTime(course.endTime || "12:30")
    setEditCapacity(String(course.capacity || 20))
    setEditStatus(course.status === "inactive" ? "inactive" : "active")
    setEditCodeTouched(true)
    setIsEditOpen(true)
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse || !editName || !editAgeFrom || !editAgeTo) return
    const ageFrom = Number(editAgeFrom)
    const ageTo = Number(editAgeTo)
    if (!Number.isFinite(ageFrom) || !Number.isFinite(ageTo) || ageFrom <= 0 || ageTo <= 0) {
      addNotification({ title: "Age group needed", description: "Enter From and To ages in years.", type: "system" })
      return
    }
    if (ageTo < ageFrom) {
      addNotification({ title: "Age group", description: "To age must be the same as or later than From age.", type: "system" })
      return
    }

    const updatedData = {
      name: editName,
      code: editCode.trim() || makeProgramCode(editName),
      duration: editDuration.trim(),
      ageFrom,
      ageTo,
      ageGroup: formatAgeGroup(ageFrom, ageTo),
      description: editDescription,
      startTime: editStartTime,
      endTime: editEndTime,
      capacity: Number(editCapacity) || 20,
      status: editStatus,
      fees: selectedCourse.fees || 0,
    }

    try {
      const updated = await fetchAPI(`/courses/${selectedCourse.id || selectedCourse._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      })
      const normalized = {
        ...selectedCourse,
        ...updatedData,
        ...updated,
        id: updated.id || updated._id || selectedCourse.id,
      } as Course
      const nextCourses = courses.map((c) =>
        c.id === selectedCourse.id || c._id === selectedCourse._id ? normalized : c
      )
      setCourses(nextCourses)
      persistPrograms(nextCourses)
      setIsEditOpen(false)
      addNotification({
        title: "Class program updated",
        description: `${editName} details have been saved.`,
        type: "system"
      })
    } catch (error) {
      console.error("Failed to update course:", error)
      addNotification({
        title: "Error",
        description: "Failed to update course program.",
        type: "system"
      })
    }
  }

  const handleDeleteCourse = async (course: Course) => {
    const courseId = course.id || course._id
    if (!courseId) return

    const activeBatchesCount = batches.filter(b => b.courseName === course.name).length
    if (activeBatchesCount > 0) {
      alert(`Cannot delete "${course.name}" because it has ${activeBatchesCount} active batch(es). Please delete or re-assign the batches first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete the course program "${course.name}" (${course.code})?`)) {
      return
    }

    try {
      await fetchAPI(`/courses/${courseId}`, {
        method: 'DELETE'
      })

      const nextCourses = courses.filter((c) => c.id !== courseId && c._id !== courseId)
      setCourses(nextCourses)
      persistPrograms(nextCourses)
      addNotification({
        title: "Course Deleted",
        description: `Successfully deleted course program "${course.name}".`,
        type: "system"
      })
    } catch (error) {
      console.error("Failed to delete course:", error)
      addNotification({
        title: "Error",
        description: "Failed to delete course program.",
        type: "system"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <button
            onClick={() => window.location.href = '/courses'}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Classes</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Manage class programs</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Toddler, Nursery, Jr KG, Sr KG, or any program you add — age group, timing, and capacity.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <Card className="bg-card">
          <CardContent className="p-0">
            <div className="overflow-visible">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="p-4">Program</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Typical Age</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Timing</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground italic">
                        No class programs yet. Add one from Classes.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => {
                      const activeBatchesCount = batches.filter((b) => b.courseName === course.name).length
                      const hasBatches = activeBatchesCount > 0
                      const isActive = course.status ? course.status === "active" : hasBatches
                      const timing =
                        course.startTime && course.endTime
                          ? `${formatClock(course.startTime)} – ${formatClock(course.endTime)}`
                          : "—"

                      return (
                        <tr key={course.id || course._id} className="hover:bg-muted/30">
                          <td className="p-4">
                            <p className="font-bold text-foreground">{course.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {course.description || ""}
                            </p>
                          </td>
                          <td className="p-4 font-mono text-muted-foreground">{course.code}</td>
                          <td className="p-4 text-muted-foreground">{formatAgeGroup(course.ageFrom, course.ageTo) || course.ageGroup || "—"}</td>
                          <td className="p-4 text-muted-foreground">{course.duration || "—"}</td>
                          <td className="p-4 text-muted-foreground">{timing}</td>
                          <td className="p-4 text-muted-foreground">{course.capacity || "—"}</td>
                          <td className="p-4">
                            {isActive ? (
                              <Badge variant="success" className="font-bold">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="font-bold">Inactive</Badge>
                            )}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(course)}
                              icon={Edit2}
                              className="h-8 w-8 p-0 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                              title="Edit program"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course)}
                              icon={Trash2}
                              disabled={hasBatches}
                              className={`h-8 w-8 p-0 text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 cursor-pointer ${hasBatches ? "opacity-40 cursor-not-allowed" : ""}`}
                              title={hasBatches ? "Cannot delete a program with class batches" : "Delete program"}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Course Modal Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        className="max-w-2xl"
        title="Edit Class Program"
        description="Age group, default timing, capacity, and program status."
      >
        <form onSubmit={handleUpdateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Program Name *</label>
              <Input
                list="edit-program-name-options"
                value={editName}
                onChange={(e) => {
                  const name = e.target.value
                  setEditName(name)
                  if (!editCodeTouched) setEditCode(name ? makeProgramCode(name) : "")
                }}
                className="bg-card text-xs h-9.5"
                required
              />
              <datalist id="edit-program-name-options">
                {savedProgramNames.map((name) => (
                  <option key={`edit-name-${name}`} value={name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Program Code</label>
              <Input
                value={editCode}
                onChange={(e) => {
                  setEditCodeTouched(true)
                  setEditCode(e.target.value.toUpperCase())
                }}
                className="bg-card text-xs h-9.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Age Group * · From (years)</label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={editAgeFrom}
                onChange={(e) => setEditAgeFrom(e.target.value)}
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
                value={editAgeTo}
                onChange={(e) => setEditAgeTo(e.target.value)}
                placeholder="e.g. 3"
                className="bg-card text-xs h-9.5"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus-visible:outline-hidden focus-visible:border-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Program Duration</label>
              <Input
                list="edit-program-duration-options"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="e.g. 1 Year, 10 months, Term"
                className="bg-card text-xs h-9.5"
              />
              <datalist id="edit-program-duration-options">
                {savedDurations.map((item) => (
                  <option key={`edit-duration-${item}`} value={item} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Maximum Student Capacity</label>
              <Input
                type="number"
                min={1}
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
                className="bg-card text-xs h-9.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Default Class Timing</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="bg-card text-xs h-9.5"
                />
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="bg-card text-xs h-9.5"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProgramStatus)}
                className="bg-card text-xs h-9.5"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
