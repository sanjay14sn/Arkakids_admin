import nodemailer from "nodemailer"

// Create reusable transporter object using SMTP transport
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587)
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    })
  }

  // If GMAIL service configuration is provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })
  }

  return null
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  try {
    const transporter = getMailTransporter()
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || "Ideal Play Abacus <noreply@idealplayabacus.com>"

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.text || payload.html.replace(/<[^>]*>/g, ""),
        html: payload.html,
      })
      console.log("✅ Email sent successfully to", payload.to, "MessageId:", info.messageId)
      return { success: true, messageId: info.messageId }
    }

    // When SMTP is not configured in env, log email details and return success so flows don't crash
    console.log("ℹ️ SMTP credentials not configured in environment. Email simulated:")
    console.log(`   To: ${payload.to}`)
    console.log(`   Subject: ${payload.subject}`)
    console.log(`   Preview: ${payload.html.slice(0, 200)}...`)
    return { success: true, simulated: true, messageId: `sim_${Date.now()}` }
  } catch (err: any) {
    console.error("❌ Failed to send email:", err)
    return { success: false, error: err.message || "Failed to deliver email" }
  }
}

export function generateRegistrationEmailHtml(details: {
  centerName: string
  centerCode: string
  city: string
  ownerName: string
  adminEmail: string
  tempPassword?: string
  agreementStartDate?: string
  renewalDate?: string
  academicYear?: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Ideal Play Abacus</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #8B0000 0%, #A80812 100%); padding: 32px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">IDEAL PLAY ABACUS</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Centre Registration & Franchise Agreement Confirmation</p>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-top: 0; color: #0f172a;">Welcome to the Network, ${details.ownerName || details.centerName}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Your training centre has been successfully registered on the Ideal Play Abacus Super Admin platform. Below are your official franchise and login details:
      </p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #cbd5e1;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Centre Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.centerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Institute Code:</td>
            <td style="padding: 6px 0; color: #8B0000; font-weight: 700; font-family: monospace; font-size: 14px; text-align: right;">${details.centerCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">City / Location:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.city}</td>
          </tr>
          ${details.academicYear ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Academic Year:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.academicYear}</td>
          </tr>` : ""}
          ${details.agreementStartDate ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Agreement Start Date:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.agreementStartDate}</td>
          </tr>` : ""}
          ${details.renewalDate ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Next Renewal Due (3 Years):</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.renewalDate}</td>
          </tr>` : ""}
        </table>
      </div>

      <h3 style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Portal Login Credentials</h3>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b;"><strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="color: #8B0000;">${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login</a></p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b;"><strong>Login Email:</strong> ${details.adminEmail}</p>
        ${details.tempPassword ? `<p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Initial Password:</strong> <code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${details.tempPassword}</code></p>` : ""}
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
        Please change your password upon your first login. For any assistance or questions regarding agreement terms, please reach out to the Ideal Play Abacus Super Admin.
      </p>
    </div>

    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} Ideal Play Abacus. All rights reserved.
    </div>
  </div>
</body>
</html>
  `
}

export function generateRenewalEmailHtml(details: {
  centerName: string
  centerCode: string
  city: string
  renewalDate: string
  renewalFee?: string
  validUntil: string
  adminEmail: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Agreement Renewal Confirmation - Ideal Play Abacus</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">IDEAL PLAY ABACUS</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Franchise Agreement Renewal Confirmed</p>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-top: 0; color: #0f172a;">Agreement Successfully Renewed!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We are pleased to inform you that your franchise agreement for <strong>${details.centerName}</strong> has been officially renewed for the standard <strong>3-Year Term</strong>.
      </p>

      <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #a7f3d0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #065f46; font-weight: 500;">Centre Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.centerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #065f46; font-weight: 500;">Institute Code:</td>
            <td style="padding: 6px 0; color: #047857; font-weight: 700; font-family: monospace; font-size: 14px; text-align: right;">${details.centerCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #065f46; font-weight: 500;">Location:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.city}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #065f46; font-weight: 500;">Renewal Effective Date:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${details.renewalDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #065f46; font-weight: 500;">Valid Through (3 Years):</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${details.validUntil}</td>
          </tr>
          ${details.renewalFee ? `
          <tr>
            <td style="padding: 6px 0; color: #065f46; font-weight: 500;">Renewal Fee Recorded:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">₹${details.renewalFee}</td>
          </tr>` : ""}
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
        This confirmation has been logged in the system and linked to your centre account. Thank you for your continued partnership with Ideal Play Abacus.
      </p>
    </div>

    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} Ideal Play Abacus. All rights reserved.
    </div>
  </div>
</body>
</html>
  `
}
