"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail, ArrowRight, ArrowLeft,
  CheckCircle2, Lock, Eye, EyeOff, Smartphone, Clock,
  Building2, ShieldCheck
} from "lucide-react"
import { useStore } from "@/store/useStore"

type AuthView = "login" | "forgot" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, login } = useStore()

  const [view, setView] = React.useState<AuthView>("login")
  const [isLoading, setIsLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [otpSent, setOtpSent] = React.useState(false)

  const isAccessDeniedError = errorMsg.includes("on hold") || errorMsg.includes("does not have portal access") || errorMsg.includes("enrollment is completed")

  React.useEffect(() => {
    if (isAuthenticated) router.push("/dashboard")
  }, [isAuthenticated, router])



  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!email || !password) {
      setErrorMsg("Please enter your email and password.")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.message || "Login failed. Please check your credentials.")
        return
      }
      // Store token
      localStorage.setItem("token", data.token)
      // Set user in store
      login(data.user)
      // Redirect to dashboard
      window.location.assign("/dashboard")
    } catch {
      setErrorMsg("Unable to connect. Please check your internet connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!otpSent) {
      if (!phone.trim()) {
        setErrorMsg("Enter the parent mobile number.")
        return
      }
      setOtpSent(true)
      setSuccessMsg("OTP sent to your mobile number.")
      return
    }
    setErrorMsg("OTP login coming soon. Please use email & password.")
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!email) {
      setErrorMsg("Please enter your email address.")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setSuccessMsg("Reset link sent! Check your inbox.")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen w-screen overflow-hidden font-sans bg-slate-50 relative select-none">
      
      {/* ─── LEFT BRANDING PANEL (52% width - Desktop only) ─── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden bg-primary">
        {/* Background Image with corporate color overlay */}
        <Image
          src="/login-bg.jpg"
          alt="ARKA KIDS Preschool"
          fill
          priority
          className="object-cover object-center pointer-events-none"
          sizes="52vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000]/94 via-[#700000]/90 to-[#4A0000]/96 pointer-events-none" />
        
        {/* Header Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img
            src="/logo.png"
            alt="ARKA KIDS Logo"
            className="h-12 w-12 rounded-full object-contain bg-white p-0.5 shadow-md border border-white/20"
          />
          <div>
            <span className="text-xl font-bold tracking-wider text-white">ARKA KIDS</span>
            <span className="block text-[10px] text-white/70 font-semibold tracking-wider uppercase">Preschool Operations</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="space-y-6 max-w-md relative z-10">
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.2] text-white">
            Preschool operations for every ARKA KIDS branch.
          </h1>
          <p className="text-[14px] text-white/70 leading-relaxed">
            Manage branches, admissions, fees, attendance, and parent communication from one Head Office portal.
          </p>

          <div className="space-y-3.5 pt-4">
            {[
              { icon: Building2, label: "Branch Management", desc: "Create, activate, and oversee franchise branches" },
              { icon: ShieldCheck, label: "Role-Based Access", desc: "Super Admin → Franchise Owner → Coordinator" },
              { icon: CheckCircle2, label: "Enquiry to Admission", desc: "Enquiries, classes, attendance, and fees" },
            ].map(({ icon: Icon, label, desc }) => (
              <div 
                key={label} 
                className="flex items-center gap-3.5 rounded-xl bg-white/5 border border-white/10 p-3.5 transition-colors hover:bg-white/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/15">
                  <Icon className="h-4.5 w-4.5 text-[#FBBE00]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-white/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-white/40 relative z-10">
          © 2026 ARKA KIDS. Preschool management portal.
        </div>
      </div>

      {/* ─── RIGHT FORM PANEL (48% width - Desktop / Full width - Mobile) ─── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 md:p-12 bg-slate-50 relative z-10">
        
        {/* Login Card */}
        <div className="w-full max-w-[390px] bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/30 p-8 space-y-6">
          
          {/* Branding header for the login form */}
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo.png"
              alt="ARKA KIDS Logo"
              className="h-20 w-20 rounded-full object-contain bg-white p-1.5 shadow-sm border border-primary/20"
            />
          </div>

          <AnimatePresence mode="wait">
            
            {/* LOGIN VIEW */}
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign In</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter your credentials to access the ARKA KIDS portal.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full text-sm rounded-xl px-4 py-3 pl-11 transition-all duration-200
                          bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                          focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="text-[11px] font-semibold text-primary hover:text-[#700000] transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full text-sm rounded-xl px-4 py-3 pl-11 pr-11 transition-all duration-200
                          bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                          focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Box */}
                  {errorMsg && (
                    <div className={`rounded-xl p-3 border ${
                      isAccessDeniedError
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    } text-xs font-semibold`}>
                      {errorMsg}
                    </div>
                  )}

                  {/* Submit Action */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#700000] text-white disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold rounded-xl py-3 transition-all duration-200 cursor-pointer shadow-sm shadow-primary/20 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                  {/* New Enquiry Link */}
                  <div className="pt-3 border-t border-slate-100 text-center">
                    <a
                      href="/enquiry"
                      className="text-[11px] font-semibold text-primary hover:text-[#700000] transition-colors"
                    >
                      New enquiry? Register here →
                    </a>
                  </div>
                </motion.div>
              )}


            {/* OTP VIEW */}
            {view === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setView("login"); setErrorMsg(""); setSuccessMsg(""); setOtpSent(false) }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </button>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">Parent OTP login</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter your registered mobile number to receive an OTP.
                  </p>
                </div>

                {successMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p>{successMsg}</p>
                  </div>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-sm rounded-xl px-4 py-3 pl-11 transition-all duration-200
                          bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                          focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  
                  {otpSent && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Enter OTP</label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full text-sm rounded-xl px-4 py-3 pl-11 tracking-[0.2em] transition-all duration-200
                            bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                            focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                  )}
                  
                  {errorMsg && (
                    <p className="text-xs text-red-800 font-semibold bg-red-50 border border-red-200 p-3 rounded-xl">{errorMsg}</p>
                  )}
                  
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#700000] text-white text-sm font-semibold rounded-xl py-3 cursor-pointer transition-all duration-200 shadow-sm shadow-primary/20"
                  >
                    {otpSent ? "Verify OTP" : "Send OTP"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* FORGOT PASSWORD VIEW */}
            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setView("login"); setErrorMsg(""); setSuccessMsg("") }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </button>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">Reset Password</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Enter your email and we&apos;ll send a recovery link.
                  </p>
                </div>

                {successMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <p>{successMsg}</p>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full text-sm rounded-xl px-4 py-3 pl-11 transition-all duration-200
                          bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                          focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-red-800 font-semibold bg-red-50 border border-red-200 p-3 rounded-xl">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#700000] text-white disabled:opacity-60 text-sm font-semibold rounded-xl py-3 transition-all duration-200 cursor-pointer shadow-sm shadow-primary/20"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "Send Recovery Link"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>

    </div>
  )
}
