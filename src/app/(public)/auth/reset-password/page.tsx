"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";

/** Client-side password strength rules matching server-side validation. */
function getPasswordChecks(password: string) {
  return [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Digit", met: /\d/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrengthLevel(checks: ReturnType<typeof getPasswordChecks>) {
  const met = checks.filter((c) => c.met).length;
  if (met <= 1) return { level: 0, label: "Very weak", color: "bg-cs-red" };
  if (met === 2) return { level: 1, label: "Weak", color: "bg-cs-red" };
  if (met === 3) return { level: 2, label: "Fair", color: "bg-cs-gold" };
  if (met === 4) return { level: 3, label: "Good", color: "bg-cs-blue" };
  return { level: 4, label: "Strong", color: "bg-cs-green" };
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Read token from URL once, then clear it from the address bar
  useEffect(() => {
    const t = searchParams.get("token");
    setToken(t);
    setTokenChecked(true);

    // Security: remove token from visible URL to prevent leaking via Referer
    if (t) {
      window.history.replaceState({}, "", "/auth/reset-password");
    }
  }, [searchParams]);

  // Security: prevent token leakage via Referer header
  useEffect(() => {
    let meta = document.querySelector('meta[name="referrer"]');
    const existed = !!meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "referrer");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "no-referrer");

    return () => {
      if (!existed && meta) {
        meta.remove();
      }
    };
  }, []);

  const checks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const strength = useMemo(() => getStrengthLevel(checks), [checks]);
  const allChecksMet = checks.every((c) => c.met);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!allChecksMet) {
        setError("Password does not meet all requirements.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (!token) {
        setError("Invalid reset link.");
        return;
      }

      setSubmitting(true);

      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong. Please try again.");
          return;
        }

        router.push("/auth/login?reset=true");
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [allChecksMet, confirmPassword, newPassword, token, router],
  );

  // Wait for useEffect to read search params
  if (!tokenChecked) {
    return null;
  }

  // Token param was missing or empty
  if (!token) {
    return (
      <div className="space-y-8 text-center">
        <div className="cs-card rounded-xl p-10">
          <AlertTriangle className="h-14 w-14 text-cs-red mx-auto mb-5" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-3">
            INVALID RESET LINK
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-cs-orange hover:bg-cs-orange-light text-background transition-colors"
          >
            Request New Link
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
          SET NEW <span className="text-cs-orange cs-glow">PASSWORD</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose a strong password for your account.
        </p>
      </div>

      {/* Form card */}
      <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <label
              htmlFor="new-password"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Lock className="h-4 w-4 text-cs-orange" />
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                maxLength={72}
                placeholder="Min. 12 characters"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength Indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength.level ? strength.color : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[70px] text-right">
                    {strength.label}
                  </span>
                </div>

                <ul className="space-y-1">
                  {checks.map((check) => (
                    <li
                      key={check.label}
                      className={`flex items-center gap-2 text-xs ${
                        check.met ? "text-cs-green" : "text-muted-foreground"
                      }`}
                    >
                      {check.met ? (
                        <Check className="h-3 w-3 shrink-0" />
                      ) : (
                        <X className="h-3 w-3 shrink-0" />
                      )}
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <ShieldCheck className="h-4 w-4 text-cs-orange" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={12}
                maxLength={72}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-cs-red flex items-center gap-1.5">
                <X className="h-3 w-3" />
                Passwords do not match
              </p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-cs-green flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                Passwords match
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !allChecksMet || !passwordsMatch}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting ? "Resetting..." : "Reset Password"}
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
