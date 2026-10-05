"use client"

import * as React from "react"
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  ChevronRight,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"
import {
  type AppRole,
  type RolePermissions,
  normalizePermissions,
  emptyPermissions,
} from "@/lib/rolePermissions"
import { RolePermissionsMatrixTable } from "@/components/roles/RolePermissionsEditor"

function permissionsEqual(a: RolePermissions, b: RolePermissions) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function RolesPage() {
  const { addNotification } = useStore()

  const [roles, setRoles] = React.useState<AppRole[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [isCreatingNew, setIsCreatingNew] = React.useState(false)

  // Draft role form states
  const [draftName, setDraftName] = React.useState("")
  const [draftPermissions, setDraftPermissions] = React.useState<RolePermissions>(emptyPermissions())

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const selectedRole = roles.find((r) => r.id === selectedId) ?? null

  const isDirty = isCreatingNew
    ? Boolean(draftName.trim())
    : selectedRole
    ? draftName !== selectedRole.name || !permissionsEqual(draftPermissions, selectedRole.permissions)
    : false

  const loadRoles = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = (await api.getRoles()) as AppRole[]
      const list = Array.isArray(data) ? data : []
      setRoles(list)
      if (list.length > 0) {
        setSelectedId(list[0].id)
        setDraftName(list[0].name)
        setDraftPermissions(normalizePermissions(list[0].permissions))
        setIsCreatingNew(false)
      } else {
        startAddRole()
      }
    } catch (err) {
      addNotification({
        title: "Failed to load roles",
        description: err instanceof Error ? err.message : "Could not fetch roles.",
        type: "system",
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  React.useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const startAddRole = () => {
    setIsCreatingNew(true)
    setSelectedId(null)
    setDraftName("")
    setDraftPermissions(emptyPermissions())
  }

  const handleSelectRole = (id: string) => {
    const r = roles.find((item) => item.id === id)
    if (!r) return
    setIsCreatingNew(false)
    setSelectedId(r.id)
    setDraftName(r.name)
    setDraftPermissions(normalizePermissions(r.permissions))
  }

  const handleSave = async () => {
    if (!draftName.trim()) {
      addNotification({
        title: "Validation Error",
        description: "Please enter a role name.",
        type: "system",
      })
      return
    }

    setSaving(true)
    try {
      if (isCreatingNew) {
        const created = (await api.createRole({
          name: draftName.trim(),
          permissions: draftPermissions,
        })) as AppRole

        setRoles((prev) => [...prev, created])
        setSelectedId(created.id)
        setIsCreatingNew(false)
        addNotification({
          title: "Role Created",
          description: `${created.name} role has been added successfully.`,
          type: "system",
        })
      } else if (selectedRole) {
        const updated = (await api.updateRole(selectedRole.id, {
          name: draftName.trim(),
          permissions: draftPermissions,
        })) as AppRole

        setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        addNotification({
          title: "Role Saved",
          description: `${updated.name} permissions updated successfully.`,
          type: "system",
        })
      }
    } catch (err: any) {
      addNotification({
        title: "Save Failed",
        description: err.message || "Could not save role.",
        type: "system",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRole || selectedRole.isSystem) return
    if (!window.confirm(`Delete role "${selectedRole.name}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      await api.deleteRole(selectedRole.id)
      const remaining = roles.filter((r) => r.id !== selectedRole.id)
      setRoles(remaining)
      if (remaining.length > 0) {
        handleSelectRole(remaining[0].id)
      } else {
        startAddRole()
      }
      addNotification({
        title: "Role deleted",
        description: `${selectedRole.name} was removed.`,
        type: "system",
      })
    } catch {
      addNotification({
        title: "Delete failed",
        description: "Could not delete this role.",
        type: "system",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in p-2 md:p-6 min-h-screen pb-24">
      {/* Page Title & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>User Management</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Role</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Role & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure role names and access permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {roles.length > 0 && (
            <Select
              value={selectedId || ""}
              onChange={(e) => {
                if (e.target.value === "new") {
                  startAddRole()
                } else {
                  handleSelectRole(e.target.value)
                }
              }}
              className="h-10 text-xs font-semibold bg-background"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              <option value="new">+ Add New Role</option>
            </Select>
          )}

          <Button size="sm" onClick={startAddRole} className="gap-1.5 shrink-0 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 gap-6 w-full">
        {loading ? (
          <p className="text-sm text-muted-foreground py-16 text-center">Loading role configuration...</p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Role Name Card */}
            <Card className="rounded-2xl border-border/60 shadow-xs overflow-hidden">
              <CardHeader className="p-6 bg-background">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-2 flex-1 max-w-md">
                    <label className="text-xs font-bold text-black !text-black">
                      Role Name
                    </label>
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="Enter role name"
                      className="h-10 text-sm font-semibold text-black !text-black bg-background border-border/70 rounded-lg focus-visible:ring-1"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!isCreatingNew && selectedRole && !selectedRole.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        disabled={saving}
                        className="gap-1.5 rounded-xl text-xs font-semibold text-destructive hover:text-destructive border-destructive/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Role
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !draftName.trim()}
                      className="gap-1.5 rounded-xl text-xs px-5 shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {saving ? "Saving..." : isCreatingNew ? "Add Role" : "Save Role"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Role Permissions Matrix Table */}
            <Card className="rounded-2xl border-border/60 shadow-xs overflow-hidden">
              <CardContent className="p-6">
                <RolePermissionsMatrixTable
                  permissions={draftPermissions}
                  onChange={setDraftPermissions}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Save Toolbar when edited */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/90 backdrop-blur-md px-4 py-4 md:pl-[calc(var(--sidebar-width,256px)+1rem)]">
          <div className="w-full flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card shadow-lg px-4 py-3 max-w-6xl mx-auto">
            <p className="text-sm font-semibold text-black !text-black">
              {isCreatingNew ? "Creating new role" : "Unsaved changes to"}{" "}
              <span className="font-bold text-black !text-black">
                {draftName.trim() || "Untitled Role"}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  if (isCreatingNew && roles.length > 0) {
                    handleSelectRole(roles[0].id)
                  } else if (selectedRole) {
                    setDraftName(selectedRole.name)
                    setDraftPermissions(normalizePermissions(selectedRole.permissions))
                  }
                }}
              >
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !draftName.trim()} className="gap-1.5 rounded-xl px-5">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : isCreatingNew ? "Add Role" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
