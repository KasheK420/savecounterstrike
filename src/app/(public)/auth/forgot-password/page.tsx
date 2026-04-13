"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        // Rate limit or CSRF errors are the only non-200 responses
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Always show success regardless of whether account exists (anti-enumeration)
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-8 text-center">
        <div className="cs-card rounded-xl p-10">
          <CheckCircle className="h-14 w-14 text-cs-green mx-auto mb-5" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-3">
            CHECK YOUR INBOX
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            If an account exists with that email, we&apos;ve sent a reset link.
            Check your inbox and spam folder.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-cs-orange hover:text-cs-orange-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold">
          RESET <span className="text-cs-orange cs-glow">PASSWORD</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {/* Form card */}
      <div className="cs-card rounded-xl p-6 sm:p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="reset-email"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Mail className="h-4 w-4 text-cs-orange" />
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>

      {/* Back to sign in */}
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-cs-orange hover:text-cs-orange-light font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
