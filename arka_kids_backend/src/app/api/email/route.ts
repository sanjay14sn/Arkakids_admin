import { NextRequest, NextResponse } from "next/server"
import { sendEmail, generateRegistrationEmailHtml, generateRenewalEmailHtml } from "@/lib/mailer"
import { requireAuth } from "@/lib/authMiddleware"

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const { type, to, details } = body

    if (!to) {
      return NextResponse.json({ message: "Recipient email address ('to') is required." }, { status: 400 })
    }

    let subject = "Ideal Play Abacus Notification"
    let html = "<p>Notification from Ideal Play Abacus</p>"

    if (type === "registration") {
      subject = `Ideal Play Abacus — Centre Registration Confirmation (${details.centerCode || details.centerName})`
      html = generateRegistrationEmailHtml(details)
    } else if (type === "renewal") {
      subject = `Ideal Play Abacus — Franchise Agreement Renewal Confirmation (${details.centerName})`
      html = generateRenewalEmailHtml(details)
    } else if (body.subject && body.html) {
      subject = body.subject
      html = body.html
    }

    const result = await sendEmail({ to, subject, html })

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      simulated: result.simulated,
      message: result.success ? "Email delivered successfully." : result.error,
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to process email" }, { status: 500 })
  }
}
