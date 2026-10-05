"use client"

import * as React from "react"
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Building,
  UserCheck,
  UserX,
  Upload,
  User as UserIcon,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"

interface PanelAssociateItem {
  _id?: string
  id?: string
  profileImage?: string
  name: string
  mobileNumber: string
  email: string
  department?: string
  status: "active" | "inactive"
}

export default function PanelAssociatesPage() {
  const { addNotification } = useStore()
  const [associates, setAssociates] = React.useState<PanelAssociateItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [profileImage, setProfileImage] = React.useState("")
  const [name, setName] = React.useState("")
  const [mobileNumber, setMobileNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [department, setDepartment] = React.useState("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getPanelAssociates().catch(() => [])
      setAssociates(Array.isArray(data) ? data : [])
    } catch {
      addNotification({ title: "Error", description: "Failed to load panel associates.", type: "system" })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setEditingId(null)
    setProfileImage("")
    setName("")
    setMobileNumber("")
    setEmail("")
    setDepartment("")
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (item: PanelAssociateItem) => {
    setEditingId(item._id || item.id || "")
    setProfileImage(item.profileImage || "")
    setName(item.name || "")
    setMobileNumber(item.mobileNumber || "")
    setEmail(item.email || "")
    setDepartment(item.department || "")
    setModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await api.uploadFile(file, "avatars")
      if (res.url) {
        setProfileImage(res.url)
      }
    } catch {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") setProfileImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !mobileNumber.trim() || !email.trim()) {
      addNotification({ title: "Validation Error", description: "Name, Mobile, and Email are required.", type: "system" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        profileImage,
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        department: department.trim(),
      }

      if (editingId) {
        await api.updatePanelAssociate(editingId, payload)
        addNotification({ title: "Updated", description: `${name} has been updated.`, type: "system" })
      } else {
        await api.createPanelAssociate(payload)
        addNotification({ title: "Created", description: `${name} added to panel associates.`, type: "system" })
      }

      setModalOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      addNotification({ title: "Error", description: err.message || "Failed to save.", type: "system" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, assocName: string) => {
    if (!confirm(`Delete panel associate "${assocName}"?`)) return
    try {
      await api.deletePanelAssociate(id)
      addNotification({ title: "Deleted", description: `${assocName} was removed.`, type: "system" })
      loadData()
    } catch {
      addNotification({ title: "Error", description: "Could not delete associate.", type: "system" })
    }
  }

  const handleToggleStatus = async (item: PanelAssociateItem) => {
    const id = item._id || item.id
    if (!id) return
    const newStatus = item.status === "active" ? "inactive" : "active"
    try {
      await api.updatePanelAssociate(id, { status: newStatus })
      addNotification({ title: "Status updated", description: `${item.name} is now ${newStatus}.`, type: "system" })
      loadData()
    } catch {
      addNotification({ title: "Error", description: "Could not update status.", type: "system" })
    }
  }

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return associates
    return associates.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.mobileNumber.toLowerCase().includes(q) ||
        (a.department && a.department.toLowerCase().includes(q))
    )
  }, [associates, search])

  return (
    <div className="flex flex-col gap-6 animate-fade-in p-2 md:p-6 min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Panel Associates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage expert panel members, external advisors, and associate coordinators.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          Create Panel Associate
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search panel associates by name, email, mobile, department..."
                className="pl-9 h-9 text-xs rounded-xl bg-background"
              />
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Total Associates: <span className="font-bold text-foreground">{associates.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading panel associates...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {search ? `No associates matching "${search}"` : "No panel associates found. Click 'Create Panel Associate' to add one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Associate</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((assoc) => {
                    const id = assoc._id || assoc.id || ""
                    return (
                      <tr key={id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {assoc.profileImage ? (
                              <img
                                src={assoc.profileImage}
                                alt={assoc.name}
                                className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {assoc.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="font-semibold text-foreground">{assoc.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                            {assoc.mobileNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                            {assoc.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-foreground">
                          {assoc.department ? (
                            <div className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              {assoc.department}
                            </div>
                          ) : (
                            <span className="text-muted-foreground font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(assoc)}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                          >
                            {assoc.status === "active" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                                <UserCheck className="h-3 w-3" /> Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground text-xs gap-1">
                                <UserX className="h-3 w-3" /> Inactive
                              </Badge>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(assoc)}
                              className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(id, assoc.name)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

      {/* Modal */}
      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Panel Associate" : "Create Panel Associate"}
        description="Enter associate details and department assignments."
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex flex-col items-center justify-center space-y-2 py-2 border-b border-border/40 pb-4">
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-sm"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <UserIcon className="h-8 w-8" />
                </div>
              )}
              <label
                htmlFor="assoc-image-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <input
                  id="assoc-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Profile Image</span>
          </div>

          <FormField label="Name *" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" required />
          </FormField>

          <FormField label="Mobile Number *" required>
            <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="9988776655" required />
          </FormField>

          <FormField label="Email *" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="associate@example.com" required />
          </FormField>

          <FormField label="Department / Specialty">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Academic Review / Advisory" />
          </FormField>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {submitting ? "Saving..." : editingId ? "Update Associate" : "Create Associate"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
