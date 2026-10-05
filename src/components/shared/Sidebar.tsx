"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles } from "lucide-react"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { isPolicyFeatureEnabled } from "@/lib/centerPolicyClient"
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/portalRoles"
import { getPortalNavLinks } from "@/lib/portalNav"
import { usePreschoolOps } from "@/lib/preschoolOps"

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSection = searchParams.get("section")
  const currentTab = searchParams.get("tab") || "overview"
  const { sidebarCollapsed, toggleSidebar, user, centerPolicy, supportQueueCount, pendingLeavesCount } = useStore()

  // State to track expanded sub-menus (e.g. /staff, /fees, /admin-users)
  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>(() => ({
    "/staff": pathname.startsWith("/staff"),
    "/fees": pathname.startsWith("/fees"),
    "/admin-users":
      pathname.startsWith("/admin-users") ||
      pathname.startsWith("/panel-associates") ||
      pathname.startsWith("/roles"),
  }))

  React.useEffect(() => {
    if (pathname.startsWith("/staff")) {
      setExpandedMenus((prev) => ({ ...prev, "/staff": true }))
    }
    if (pathname.startsWith("/fees")) {
      setExpandedMenus((prev) => ({ ...prev, "/fees": true }))
    }
    if (
      pathname.startsWith("/admin-users") ||
      pathname.startsWith("/panel-associates") ||
      pathname.startsWith("/roles")
    ) {
      setExpandedMenus((prev) => ({ ...prev, "/admin-users": true }))
    }
  }, [pathname])

  const policyOk = (feature: Parameters<typeof isPolicyFeatureEnabled>[1]) =>
    user?.role === "super_admin" || isPolicyFeatureEnabled(centerPolicy, feature)

  const links = getPortalNavLinks({
    role: user?.role,
    policyOk,
    permissions: user?.permissions,
    supportQueueCount,
    pendingLeavesCount,
  })

  const toggleSubMenu = (path: string, e: React.MouseEvent) => {
    if (sidebarCollapsed) {
      toggleSidebar()
    }
    setExpandedMenus(prev => ({ ...prev, [path]: !prev[path] }))
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card h-screen sticky top-0 transition-all duration-300 z-30 shrink-0",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between px-3.5 bg-primary text-primary-foreground border-b-[3px] border-highlight">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight min-w-0">
          <img
            src="/logo.png"
            alt="ARKA KIDS Logo"
            className="h-9 w-9 rounded-full object-contain bg-white p-0.5 shrink-0 shadow-xs border border-white/20"
          />
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-bold text-white truncate"
            >
              {BRAND_NAME}
            </motion.span>
          )}
        </Link>

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const hasSubLinks = link.subLinks && link.subLinks.length > 0
          const isMenuExpanded = Boolean(expandedMenus[link.path])
          const [linkBase, linkQuery] = link.path.split("?")
          const linkSection = new URLSearchParams(linkQuery || "").get("section")
          const isParentActive = linkSection
            ? pathname === linkBase && currentSection === linkSection
            : pathname === link.path ||
              (link.path !== "/dashboard" && pathname.startsWith(link.path))

          return (
            <div key={link.path} className="space-y-1">
              <div className="flex items-center">
                <Link
                  href={link.path}
                  className={cn(
                    "flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group relative",
                    isParentActive
                      ? "bg-primary-light text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-primary"
                  )}
                >
                  {isParentActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-highlight" />
                  )}
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-105",
                      isParentActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate flex-1"
                    >
                      {link.label}
                    </motion.span>
                  )}
                  {link.badgeCount != null && (
                    <span
                      className={cn(
                        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums shrink-0",
                        link.badgeCount > 0
                          ? isParentActive
                            ? "bg-highlight-light text-highlight-foreground border border-highlight/30"
                            : "bg-highlight-light text-warning border border-highlight/25"
                          : isParentActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground border border-border"
                      )}
                    >
                      {link.badgeCount > 99 ? "99+" : link.badgeCount}
                    </span>
                  )}
                </Link>

                {hasSubLinks && !sidebarCollapsed && (
                  <button
                    onClick={(e) => toggleSubMenu(link.path, e)}
                    className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isMenuExpanded ? "rotate-180" : ""
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Sub Links Accordion */}
              {hasSubLinks && !sidebarCollapsed && isMenuExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="pl-7 space-y-1 border-l-2 border-primary/20 ml-4 py-1"
                >
                  {link.subLinks!.map((sub) => {
                    const SubIcon = sub.icon
                    const isSubActive = (() => {
                      if (pathname === "/staff") {
                        if (sub.path.includes("coordinators") && currentSection === "coordinators") return true
                        if (sub.path.includes("teachers") && currentSection === "teachers") return true
                      }
                      if (pathname === "/fees") {
                        const subTab = new URLSearchParams(sub.path.split("?")[1] || "").get("tab")
                        if (subTab === currentTab) return true
                      }
                      return pathname === sub.path
                    })()

                    return (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all",
                          isSubActive
                            ? "bg-primary text-white shadow-xs font-bold"
                            : "text-muted-foreground hover:bg-primary-light hover:text-primary"
                        )}
                      >
                        {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span>{sub.label}</span>
                      </Link>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        )}
        {!sidebarCollapsed && (
          <div className="rounded-lg bg-primary-light p-3 text-xs border border-primary/10">
            <p className="font-semibold text-primary flex items-center gap-1.5">
              <span>{BRAND_NAME}</span>
              <span className="inline-block rounded-full bg-highlight-light px-1.5 py-0.5 text-[9px] font-medium text-highlight-foreground border border-highlight/30">
                Portal
              </span>
            </p>
            <p className="text-[10px] text-secondary-text mt-1 leading-normal">
              {BRAND_TAGLINE}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
