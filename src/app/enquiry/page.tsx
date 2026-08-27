"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { EnquiryForm } from "@/components/preschool/EnquiryForm"

export default function PublicEnquiryPage() {
  const [saved, setSaved] = React.useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2 text-white mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">ARKA KIDS</p>
            <p className="text-[11px] text-white/70">Admission enquiry</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white p-6 shadow-xl">
          {saved ? (
            <div className="space-y-3 text-sm">
              <h1 className="text-lg font-bold">Thank you</h1>
              <p className="text-muted-foreground">
                Your enquiry is with the branch team. We will call you to schedule a visit or trial class.
              </p>
              <div className="flex gap-2">
                <Link href="/login" className="text-primary font-semibold text-xs">Parent login →</Link>
                <button type="button" className="text-xs text-muted-foreground" onClick={() => setSaved(false)}>
                  Submit another
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold mb-1">Enquire for a seat</h1>
              <p className="text-xs text-muted-foreground mb-4">
                Child date of birth picks Toddler (2–3), Nursery (3–4), Jr KG (4–5), or Sr KG (5–6). Under 2 joins the waitlist.
              </p>
              <EnquiryForm submitLabel="Submit enquiry" onSuccess={() => setSaved(true)} />
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-white/70 mt-4">
          Already enrolled? <Link href="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
