"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
  icon?: LucideIcon
  iconPosition?: "left" | "right"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, icon: Icon, iconPosition = "left", children, disabled, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer"

    const variants = {
      primary:
        "bg-primary text-primary-foreground shadow-xs border border-transparent hover:bg-primary-hover active:bg-primary-pressed disabled:bg-border-strong disabled:text-white disabled:opacity-100",
      secondary:
        "bg-card text-primary border border-primary hover:bg-[#F8F8F8] active:bg-[#F8F8F8] disabled:bg-disabled-bg disabled:text-disabled disabled:border-border-strong disabled:opacity-100",
      outline:
        "border border-border bg-card text-foreground hover:bg-[#F8F8F8] hover:border-border-strong active:bg-[#F8F8F8] disabled:bg-disabled-bg disabled:text-disabled disabled:opacity-100",
      ghost:
        "text-secondary-text hover:bg-[#F8F8F8] hover:text-foreground active:bg-[#F8F8F8] disabled:text-disabled disabled:opacity-100",
      destructive:
        "bg-destructive text-destructive-foreground shadow-xs border border-transparent hover:bg-[#A80812] active:bg-[#8F0710] disabled:bg-border-strong disabled:text-white disabled:opacity-100",
      success:
        "bg-success text-success-foreground shadow-xs border border-transparent hover:bg-[#005A27] active:bg-[#004820] disabled:bg-border-strong disabled:text-white disabled:opacity-100",
    }

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 py-2 text-sm gap-2",
      lg: "h-11 px-6 text-sm gap-2.5",
      icon: "h-9 w-9"
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && Icon && iconPosition === "left" && <Icon className={cn("h-4 w-4 shrink-0", size === "sm" ? "h-3.5 w-3.5" : "")} />}
        {children}
        {!isLoading && Icon && iconPosition === "right" && <Icon className={cn("h-4 w-4 shrink-0", size === "sm" ? "h-3.5 w-3.5" : "")} />}
      </motion.button>
    )
  }
)
Button.displayName = "Button"
