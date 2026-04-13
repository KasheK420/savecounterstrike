"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

const INPUT_CLASS =
  "w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground";

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: "12+ characters", test: (pw) => pw.length >= 12 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Digit", test: (pw) => /\d/.test(pw) },
  { label: "Special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function getStrengthColor(passed: number): string {
  if (passed <= 1) return "bg-red-500";
  if (passed <= 2) return "bg-red-400";
  if (passed <= 3) return "bg-yellow-500";
  if (passed <= 4) return "bg-yellow-400";
  return "bg-green-500";
}

function getStrengthLabel(passed: number): string {
  if (passed <= 1) return "Very weak";
  if (passed <= 2) return "Weak";
  if (passed <= 3) return "Fair";
  if (passed <= 4) return "Strong";
  return "Very strong";
}

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength
  const passedChecks = PASSWORD_CHECKS.filter((c) => c.test(password));
  const passedCount = passedChecks.length;
  const allPassed = passedCount === PASSWORD_CHECKS.length;

  // Client-side validation errors
  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side checks
    if (!allPassed) {
      setError("Password does not meet all strength requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName: displayName || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle structured validation errors
        if (data.details && Array.isArray(data.details)) {
          setError(data.details.join(" "));
        } else {
          setError(data.error || "An unexpected error occurred.");
        }
        return;
      }

      // Success — redirect to email verification info page
      router.push("/auth/verify-email");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold">
          CREATE <span className="text-cs-orange cs-glow">ACCOUNT</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Join the fight for a better Counter-Strike.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Form card */}
      <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display name */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Display Name{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="username"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Choose a display name"
              className={INPUT_CLASS}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={INPUT_CLASS}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className={`${INPUT_CLASS} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="space-y-3 pt-1">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Strength</span>
                    <span
                      className={
                        passedCount <= 2
                          ? "text-red-400"
                          : passedCount <= 4
                            ? "text-yellow-400"
                            : "text-green-400"
                      }
                    >
                      {getStrengthLabel(passedCount)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passedCount)}`}
                      style={{ width: `${(passedCount / PASSWORD_CHECKS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {PASSWORD_CHECKS.map((check) => {
                    const passed = check.test(password);
                    return (
                      <li
                        key={check.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          passed ? "text-green-400" : "text-muted-foreground"
                        }`}
                      >
                        {passed ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <X className="h-3 w-3 shrink-0" />
                        )}
                        {check.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`${INPUT_CLASS} pr-12 ${
                  passwordMismatch ? "border-destructive focus:ring-destructive/50" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordMismatch && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed cs-pulse-glow"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Steam login */}
        <a
          href="/api/auth/steam/login"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-cs-orange/30 text-cs-orange font-semibold hover:bg-cs-orange hover:text-background transition-all"
        >
          <LogIn className="h-4 w-4" />
          Sign in via Steam
        </a>
      </div>

      {/* Sign-in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-cs-orange hover:text-cs-orange-light font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>

      {/* Terms/Privacy */}
      <p className="text-center text-xs text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
