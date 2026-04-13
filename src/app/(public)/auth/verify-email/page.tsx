"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleResend() {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend verification email.");
        return;
      }

      setSuccess("Verification email sent! Check your inbox.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Mail className="h-12 w-12 text-cs-orange mx-auto opacity-80" />
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          CHECK YOUR{" "}
          <span className="text-cs-orange cs-glow">EMAIL</span>
        </h1>
      </div>

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Card */}
      <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
        <p className="text-muted-foreground text-sm text-center leading-relaxed">
          We&apos;ve sent a verification email to your address. Click the link
          in the email to activate your account.
        </p>

        {/* Resend section */}
        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-cs-orange/30 text-cs-orange text-sm font-medium hover:bg-cs-orange hover:text-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {loading ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      </div>

      {/* Back to sign in */}
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="text-cs-orange hover:text-cs-orange-light font-medium transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
