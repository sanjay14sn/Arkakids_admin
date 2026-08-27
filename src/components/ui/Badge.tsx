import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "bg-primary-light text-primary border border-primary/10",
    secondary: "bg-muted text-muted-foreground border border-border",
    success: "bg-success-light text-success border border-success/15",
    warning: "bg-warning-light text-warning border border-warning/15",
    destructive: "bg-destructive-light text-destructive border border-destructive/15",
    info: "bg-info-light text-info border border-info/15",
    outline: "text-foreground border border-border bg-card"
  }

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}
