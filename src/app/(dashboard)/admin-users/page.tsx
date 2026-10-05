"use client"

import * as React from "react"
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Lock,
  UserCheck,
  UserX,
  Upload,
  Shield,
  Phone,
  Mail,
  User as UserIcon,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { FormField } from "@/components/ui/FormField"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"

interface AdminUserItem {
  _id?: string
  id?: string
  profileImage?: string
  name: string
  mobileNumber: string
  email: string
  pin: string
  role: string
  status: "active" | "inactive"
  createdAt?: string
}

interface RoleItem {
  id: string
  name: string
  slug: string
}

export default function AdminUsersPage() {
  const { addNotification } = useStore()

  const [users, setUsers] = React.useState<AdminUserItem[]>([])
  const [roles, setRoles] = React.useState<RoleItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  // Form states
  const [profileImage, setProfileImage] = React.useState("")
  const [name, setName] = React.useState("")
  const [mobileNumber, setMobileNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [role, setRole] = React.useState("")
  const [pinError, setPinError] = React.useState("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getAdminUsers().catch(() => []),
        api.getRoles().catch(() => []),
      ])

      const userList = Array.isArray(usersData) ? usersData : []
      setUsers(userList)

      const roleList = Array.isArray(rolesData)
        ? rolesData.map((r: any) => ({
            id: r.id || r._id || r.slug,
            name: r.name,
            slug: r.slug || r.name.toLowerCase().replace(/\s+/g, "_"),
          }))
        : []
      setRoles(roleList)
      if (roleList.length > 0 && !role) {
        setRole(roleList[0].name)
      }
    } catch {
      addNotification({
        title: "Error loading data",
        description: "Could not fetch admin users or roles.",
        type: "system",
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification, role])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setEditingId(null)
    setProfileImage("")
    setName("")
    setMobileNumber("")
    setEmail("")
    setPin("")
    setRole(roles[0]?.name || "Super Admin")
    setPinError("")
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (item: AdminUserItem) => {
    setEditingId(item._id || item.id || "")
    setProfileImage(item.profileImage || "")
    setName(item.name || "")
    setMobileNumber(item.mobileNumber || "")
    setEmail(item.email || "")
    setPin(item.pin || "")
    setRole(item.role || (roles[0]?.name || "Super Admin"))
    setPinError("")
    setModalOpen(true)
  }

  const handlePinChange = (val: string) => {
    // Only numbers allowed, max 4 digits
    const cleaned = val.replace(/\D/g, "").slice(0, 4)
    setPin(cleaned)
    if (cleaned.length > 0 && cleaned.length !== 4) {
      setPinError("Must be exactly 4 digits (numbers only)")
    } else {
      setPinError("")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await api.uploadFile(file, "avatars")
      if (res.url) {
        setProfileImage(res.url)
        addNotification({ title: "Image uploaded", description: "Profile image updated.", type: "system" })
      }
    } catch {
      // Fallback preview URL using FileReader
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProfileImage(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      addNotification({ title: "Validation Error", description: "Name is required.", type: "system" })
      return
    }
    if (!mobileNumber.trim()) {
      addNotification({ title: "Validation Error", description: "Mobile Number is required.", type: "system" })
      return
    }
    if (!email.trim()) {
      addNotification({ title: "Validation Error", description: "Email is required.", type: "system" })
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setPinError("Must be exactly 4 digits (numbers only)")
      addNotification({ title: "Validation Error", description: "PIN must be exactly 4 digits.", type: "system" })
      return
    }
    if (!role) {
      addNotification({ title: "Validation Error", description: "Role is required.", type: "system" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        profileImage,
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        pin,
        role,
      }

      if (editingId) {
        await api.updateAdminUser(editingId, payload)
        addNotification({ title: "Admin User Updated", description: `${name} has been updated.`, type: "system" })
      } else {
        await api.createAdminUser(payload)
        addNotification({ title: "Admin User Created", description: `${name} has been created.`, type: "system" })
      }

      setModalOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      addNotification({
        title: "Action failed",
        description: err.message || "Failed to save admin user.",
        type: "system",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete admin user "${userName}"?`)) return
    try {
      await api.deleteAdminUser(id)
      addNotification({ title: "Deleted", description: `${userName} was removed.`, type: "system" })
      loadData()
    } catch (err: any) {
      addNotification({ title: "Delete failed", description: err.message || "Could not delete user.", type: "system" })
    }
  }

  const handleToggleStatus = async (item: AdminUserItem) => {
    const id = item._id || item.id
    if (!id) return
    const newStatus = item.status === "active" ? "inactive" : "active"
    try {
      await api.updateAdminUser(id, { status: newStatus })
      addNotification({
        title: "Status updated",
        description: `${item.name} is now ${newStatus}.`,
        type: "system",
      })
      loadData()
    } catch {
      addNotification({ title: "Update failed", description: "Could not change status.", type: "system" })
    }
  }

  const filteredUsers = React.useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobileNumber.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [users, search])

  return (
    <div className="flex flex-col gap-6 animate-fade-in p-2 md:p-6 min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Users
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system administrative accounts, assigned roles, and security access PINs.
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shadow-sm">
          <UserPlus className="h-4 w-4" />
          Create Admin User
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admin users by name, email, mobile, or role..."
                className="pl-9 h-9 text-xs rounded-xl bg-background"
              />
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Total Users: <span className="font-bold text-foreground">{users.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading admin users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {search ? `No admin users matching "${search}"` : "No admin users created yet. Click 'Create Admin User' to add one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">PIN</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((userItem) => {
                    const id = userItem._id || userItem.id || ""
                    return (
                      <tr key={id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {userItem.profileImage ? (
                              <img
                                src={userItem.profileImage}
                                alt={userItem.name}
                                className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {userItem.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{userItem.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                            {userItem.mobileNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                            {userItem.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                            {userItem.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground tracking-widest">
                          ••••
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(userItem)}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                          >
                            {userItem.status === "active" ? (
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
                              onClick={() => openEditModal(userItem)}
                              className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(id, userItem.name)}
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

      {/* Create / Edit Admin User Modal */}
      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Admin User" : "Create Admin User"}
        description="Enter user profile details, credentials, and role assignment below."
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Profile Image */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2 border-b border-border/40 pb-4">
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-sm"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <UserIcon className="h-8 w-8" />
                </div>
              )}
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Profile Image</span>
          </div>

          {/* Name * */}
          <FormField label="Name *" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </FormField>

          {/* Mobile Number * */}
          <FormField label="Mobile Number *" required>
            <Input
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9988776655"
              required
            />
          </FormField>

          {/* Email * */}
          <FormField label="Email *" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </FormField>

          {/* PIN * */}
          <FormField label="PIN *" required error={pinError}>
            <div className="relative">
              <Input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="••••"
                className="tracking-widest font-mono pr-8"
                required
              />
              <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Must be exactly 4 digits (numbers only)
            </p>
          </FormField>

          {/* Role * */}
          <FormField label="Role *" required>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full"
              required
            >
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.id || r.slug} value={r.name}>
                    {r.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Franchise Owner">Franchise Owner</option>
                  <option value="Center Manager">Center Manager</option>
                  <option value="Academic Head">Academic Head</option>
                  <option value="Finance Manager">Finance Manager</option>
                  <option value="Coordinator">Coordinator</option>
                </>
              )}
            </Select>
          </FormField>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              {submitting ? "Saving..." : editingId ? "Update Admin User" : "Create Admin User"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
