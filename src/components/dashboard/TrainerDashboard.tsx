"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  UserCheck,
  GraduationCap,
  Camera,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ShieldAlert,
  ChevronRight,
  Sparkles
} from "lucide-react"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"

function DashboardChart({
  children,
  height = 240,
}: {
  children: React.ReactElement
  height?: number
}) {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setReady(true)
  }, [])

  return (
    <div className="w-full min-w-0" style={{ height }}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full rounded-lg bg-muted/20 animate-pulse" aria-hidden />
      )}
    </div>
  )
}

export function TrainerDashboard() {
  const { user } = useStore()
  const [isLoading, setIsLoading] = React.useState(true)

  // Chart Datasets
  const sectionAttendanceData = [
    { section: "Playgroup", Enrolled: 18, Present: 16 },
    { section: "Nursery A", Enrolled: 16, Present: 15 },
    { section: "Nursery B", Enrolled: 17, Present: 16 },
    { section: "LKG", Enrolled: 16, Present: 16 },
    { section: "UKG", Enrolled: 17, Present: 16 },
  ]

  const routineTimelineData = [
    { time: "09:00 AM", Children: 79, Completion: 100 },
    { time: "10:00 AM", Children: 45, Completion: 85 },
    { time: "11:00 AM", Children: 79, Completion: 60 },
    { time: "12:00 PM", Children: 36, Completion: 30 },
    { time: "01:00 PM", Children: 40, Completion: 15 },
    { time: "02:00 PM", Children: 79, Completion: 0 },
  ]

  const journalUpdatesData = [
    { name: "Meal Photos", value: 35, color: "#8B0000" },
    { name: "Nap Logs", value: 28, color: "#D97706" },
    { name: "Activity Videos", value: 25, color: "#10B981" },
    { name: "Pending Logs", value: 12, color: "#6B7280" },
  ]

  const safetyWatchlistData = [
    { category: "Absenteeism", count: 2, fill: "#F59E0B" },
    { category: "Food Allergy", count: 1, fill: "#EF4444" },
    { category: "Early Pickup", count: 1, fill: "#3B82F6" },
    { category: "Special Care", count: 0, fill: "#10B981" },
  ]

  React.useEffect(() => {
    let cancelled = false
    const loadDashboard = async () => {
      try {
        await api.getDashboardMetrics().catch(() => null)
      } catch (err) {
        console.error("Failed to load coordinator dashboard:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Loading Dashboard Visualizations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Preschool Center Coordinator Dashboard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational analytics, real-time toddler check-ins, routine timelines, and activity charts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/journal">
            <Button variant="outline" size="sm" icon={Camera} className="text-xs font-medium">
              Daily Journal
            </Button>
          </Link>
          <Link href="/attendance">
            <Button variant="outline" size="sm" icon={UserCheck} className="text-xs font-medium">
              Check-In Attendance
            </Button>
          </Link>
          <Link href="/staff">
            <Button variant="primary" size="sm" icon={Users} className="text-xs font-medium">
              Staff Roster
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Metric KPI Row */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Preschoolers</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">84</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">Toddlers</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">5 Sections (Playgroup - UKG)</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs hover:border-emerald-500/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Today's Attendance</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">94%</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">Present</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">79 of 84 Toddlers Checked In</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">On-Duty Staff</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">9</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">Personnel</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">6 Lead Educators · 3 Caregivers</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs hover:border-primary/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Parent Journal Updates</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-primary tracking-tight">88%</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">Logged</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Meals, Naps & Photos shared</p>
        </div>
      </div>

      {/* Visual Analytics Graphs Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Section Attendance Bar Chart */}
        <Card className="bg-card border-border shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Section-wise Attendance Overview</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Comparison of present toddlers vs enrolled total per section today.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DashboardChart height={230}>
              <BarChart data={sectionAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="section" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 20]} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Enrolled" fill="var(--border-strong)" radius={[4, 4, 0, 0]} name="Enrolled Total" />
                <Bar dataKey="Present" fill="#8B0000" radius={[4, 4, 0, 0]} name="Checked In" />
              </BarChart>
            </DashboardChart>
          </CardContent>
        </Card>

        {/* Chart 2: Daily Activity Routine Timeline Gradient Area Chart */}
        <Card className="bg-card border-border shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>Routine Activity Timeline & Participation</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time participation and completion progress across today's schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DashboardChart height={230}>
              <AreaChart data={routineTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="childrenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Children" stroke="#8B0000" fillOpacity={1} fill="url(#childrenGrad)" strokeWidth={2.5} name="Toddlers Active" />
              </AreaChart>
            </DashboardChart>
          </CardContent>
        </Card>

        {/* Chart 3: Parent Journal Updates Donut Pie Chart */}
        <Card className="bg-card border-border shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <span>Parent Activity Journal Breakdown</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of logged meal updates, nap records, and photo shares today.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <DashboardChart height={210}>
              <PieChart>
                <Pie
                  data={journalUpdatesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {journalUpdatesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </DashboardChart>

            <div className="space-y-2 w-full sm:w-44 shrink-0 text-xs">
              {journalUpdatesData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-1.5 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-foreground font-medium text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground text-[11px]">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Toddler Safety & Care Watchlist Status Chart */}
        <Card className="bg-card border-border shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>Toddler Safety & Care Watchlist Overview</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Immediate alert breakdown for absenteeism, food allergies, and early pickups.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <DashboardChart height={210}>
              <BarChart data={safetyWatchlistData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} domain={[0, 4]} />
                <YAxis dataKey="category" type="category" stroke="var(--muted-foreground)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Cases Today">
                  {safetyWatchlistData.map((entry, index) => (
                    <Cell key={`cell-safety-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </DashboardChart>
          </CardContent>
        </Card>
      </div>

      {/* Quick Coordinator Tip Box */}
      <div className="p-4 rounded-xl bg-card border border-primary/20 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">Center Coordinator Tip</h4>
            <p className="text-xs text-muted-foreground">
              Send bulk instant photo journals and morning check-in notifications to all parents directly from the Daily Journal tab.
            </p>
          </div>
        </div>
        <Link
          href="/journal"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
        >
          <span>Go to Daily Journal</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
