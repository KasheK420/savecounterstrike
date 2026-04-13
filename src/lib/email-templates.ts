/**
 * @fileoverview Branded HTML and plain-text email templates.
 *
 * Each function returns { subject, html, text } ready for nodemailer or
 * any transactional email provider.
 *
 * @module email-templates
 */

const BRAND_COLOR = "#F97316"; // cs-orange
const SITE_NAME = "SaveCounterStrike";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://savecounterstrike.com";

/**
 * Wraps body content in the branded email shell.
 */
function wrapTemplate(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="margin:0;padding:0;background:#0a0a0a;color:#e5e5e5;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><span style="font-size:24px;font-weight:bold;color:${BRAND_COLOR};">${SITE_NAME}</span></div>${body}<div style="margin-top:40px;text-align:center;font-size:12px;color:#666;">&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</div></div></body></html>`;
}

/** Email verification template */
export function verificationEmail(userName: string, verifyUrl: string) {
  return {
    subject: `Verify your email — ${SITE_NAME}`,
    html: wrapTemplate(
      "Verify Email",
      `<p>Hi ${userName},</p><p>Click below to verify your email:</p><p style="text-align:center;margin:32px 0;"><a href="${verifyUrl}" style="background:${BRAND_COLOR};color:#000;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:bold;">Verify Email</a></p><p style="font-size:12px;color:#888;">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>`,
    ),
    text: `Hi ${userName},\n\nVerify your email: ${verifyUrl}\n\nLink expires in 24 hours.`,
  };
}

/** Password reset template */
export function passwordResetEmail(userName: string, resetUrl: string) {
  return {
    subject: `Password reset — ${SITE_NAME}`,
    html: wrapTemplate(
      "Password Reset",
      `<p>Hi ${userName},</p><p>You requested a password reset. Click below:</p><p style="text-align:center;margin:32px 0;"><a href="${resetUrl}" style="background:${BRAND_COLOR};color:#000;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a></p><p style="font-size:12px;color:#888;">Link expires in 30 minutes. If you didn't request this, ignore this email.</p>`,
    ),
    text: `Hi ${userName},\n\nReset your password: ${resetUrl}\n\nLink expires in 30 minutes.`,
  };
}

/** MFA enabled notification template */
export function mfaEnabledEmail(userName: string) {
  return {
    subject: `MFA enabled — ${SITE_NAME}`,
    html: wrapTemplate(
      "MFA Enabled",
      `<p>Hi ${userName},</p><p>Two-factor authentication has been enabled on your account. If you didn't do this, contact support immediately.</p>`,
    ),
    text: `Hi ${userName},\n\nMFA has been enabled on your account. If you didn't do this, contact support immediately.`,
  };
}

/** Account merge notification template */
export function accountMergeEmail(userName: string, mergedIdentity: string) {
  return {
    subject: `Account merged — ${SITE_NAME}`,
    html: wrapTemplate(
      "Account Merged",
      `<p>Hi ${userName},</p><p>Your account has been merged with ${mergedIdentity}. All content has been transferred.</p>`,
    ),
    text: `Hi ${userName},\n\nYour account has been merged with ${mergedIdentity}. All content has been transferred.`,
  };
}
