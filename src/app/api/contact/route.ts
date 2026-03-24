/**
 * @fileoverview Contact form submission handler.
 *
 * Sends contact form submissions via email using nodemailer.
 * Rate limited to 5 submissions per hour per IP.
 *
 * @route POST /api/contact
 */

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactSchema } from "@/lib/validations";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Escape HTML special characters for safe email HTML rendering.
 * Prevents HTML injection in email bodies.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * POST /api/contact
 * Send contact form email. Rate limited to 5 per hour per IP.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 contact submissions per hour per IP (uses trusted IP extraction)
    const rl = rateLimitByIp(request, "contact:send", 5, 3600_000);
    if (rl.limited) return rateLimitResponse(rl);

    // Validate input
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Please check your form." },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Configure SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.protonmail.ch",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "contact@savecounterstrike.com",
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email with both text and HTML versions
    await transporter.sendMail({
      from: `"SaveCounterStrike Contact" <${process.env.SMTP_USER || "contact@savecounterstrike.com"}>`,
      to: process.env.CONTACT_EMAIL || "contact@savecounterstrike.com",
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr/>
        <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
