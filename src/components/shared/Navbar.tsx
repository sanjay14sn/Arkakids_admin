"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, Search, X, Sparkles } from "lucide-react"
import { useStore } from "@/store/useStore"
import { ThemeSwitcher } from "./ThemeSwitcher"
import { NotificationDropdown } from "./NotificationDropdown"
import { UserDropdown } from "./UserDropdown"
import { GlobalSearchModal } from "./GlobalSearchModal"
import { cn } from "@/lib/utils"
import { isPolicyFeatureEnabled } from "@/lib/centerPolicyClient"
import { BRAND_NAME, BRAND_TAGLINE, breadcrumbLabel } from "@/lib/portalRoles"
import { getPortalNavLinks } from "@/lib/portalNav"

export function Navbar() {
  const pathname = usePathname()
  const { user, centerPolicy, supportQueueCount } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
  }, [])

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter((x) => x)
    if (paths.length === 0) return [{ label: "Home", href: "/" }]

    return paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join("/")}`
      return { label: breadcrumbLabel(path), href }
    })
  }

  const breadcrumbs = getBreadcrumbs()

  const policyOk = (feature: Parameters<typeof isPolicyFeatureEnabled>[1]) =>
    user?.role === "super_admin" || isPolicyFeatureEnabled(centerPolicy, feature)

  const mobileLinks = getPortalNavLinks({
    role: user?.role,
    policyOk,
    supportQueueCount,
  })

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between bg-card px-3 sm:px-4 shadow-xs border-b-[3px] border-highlight">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="ARKA KIDS Logo"
              className="h-8 w-8 rounded-full object-contain bg-white p-0.5 shadow-xs border border-primary/20"
            />
          </Link>

          <span className="sm:hidden truncate text-sm font-semibold text-foreground capitalize">
            {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
          </span>

          <nav className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground min-w-0">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <span className="text-muted-foreground/60">/</span>}
                  {isLast ? (
                    <span className="text-primary font-semibold">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        </div>

        <div
          onClick={() => setSearchOpen(true)}
          className="hidden lg:flex w-full max-w-sm relative cursor-pointer mx-6"
        >
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <input
            readOnly
            type="text"
            placeholder="Search enquiries, students, fees..."
            className="w-full h-8 rounded-lg border border-primary/15 bg-primary-light px-3 pl-9 text-xs text-primary placeholder:text-placeholder focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground/60 border border-border/80 rounded bg-muted/40 px-1 py-0.5 select-none">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeSwitcher />
          <NotificationDropdown />
          <div className="h-4 w-px bg-border/60" />
          <UserDropdown />
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />
          <div className="relative flex w-64 max-w-xs flex-1 flex-col bg-card border-r border-border p-0 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-3 border-b-[3px] border-highlight">
              <div className="flex items-center gap-2.5 font-bold tracking-tight">
                <img
                  src="/logo.png"
                  alt="ARKA KIDS Logo"
                  className="h-7 w-7 rounded-full object-contain bg-white p-0.5 shrink-0 shadow-xs border border-white/20"
                />
                <span className="text-sm font-bold text-white">{BRAND_NAME}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-1 hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {mobileLinks.map((link) => {
                const Icon = link.icon
                const isActive =
                  pathname === link.path ||
                  (link.path !== "/dashboard" && pathname.startsWith(link.path))
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-border/50 p-4 mt-auto">
              <div className="rounded-lg bg-primary-light p-3 text-[10px] border border-primary/10">
                <p className="font-semibold text-primary">{BRAND_NAME}</p>
                <p className="text-secondary-text mt-0.5 leading-normal">
                  {BRAND_TAGLINE}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
