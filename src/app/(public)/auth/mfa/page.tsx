"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Loader2, AlertCircle, KeyRound } from "lucide-react";

const CODE_INPUT_CLASS =
  "w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground text-center text-2xl tracking-[0.3em] font-mono";

export default function MfaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeToken = searchParams.get("token") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and mode switch
  useEffect(() => {
    codeInputRef.current?.focus();
  }, [useRecovery]);

  // Redirect if no challenge token
  useEffect(() => {
    if (!challengeToken) {
      router.replace("/auth/login");
    }
  }, [challengeToken, router]);

  const handleSubmit = useCallback(
    async (submittedCode: string) => {
      if (loading) return;
      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/auth/mfa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeToken, code: submittedCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Verification failed. Please try again.");
          setCode("");
          codeInputRef.current?.focus();
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setError("Network error. Please check your connection and try again.");
        setCode("");
        codeInputRef.current?.focus();
      } finally {
        setLoading(false);
      }
    },
    [challengeToken, loading, router],
  );

  function handleCodeChange(value: string) {
    if (useRecovery) {
      // Recovery code: 16 hex characters
      const sanitized = value.replace(/[^a-fA-F0-9]/g, "").slice(0, 16);
      setCode(sanitized);
    } else {
      // TOTP: 6 digits only
      const sanitized = value.replace(/\D/g, "").slice(0, 6);
      setCode(sanitized);

      // Auto-submit when 6 digits entered
      if (sanitized.length === 6) {
        handleSubmit(sanitized);
      }
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (useRecovery && code.length === 16) {
      handleSubmit(code);
    } else if (!useRecovery && code.length === 6) {
      handleSubmit(code);
    }
  }

  function toggleMode() {
    setUseRecovery(!useRecovery);
    setCode("");
    setError(null);
  }

  if (!challengeToken) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Shield className="h-12 w-12 text-cs-orange mx-auto opacity-80" />
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          TWO-FACTOR{" "}
          <span className="text-cs-orange cs-glow">AUTHENTICATION</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {useRecovery
            ? "Enter one of your 16-character recovery codes"
            : "Enter the 6-digit code from your authenticator app"}
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
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Code input */}
          <div className="space-y-2">
            <label
              htmlFor="mfa-code"
              className="text-sm font-medium text-foreground"
            >
              {useRecovery ? "Recovery Code" : "Verification Code"}
            </label>
            <input
              ref={codeInputRef}
              id="mfa-code"
              type="text"
              inputMode={useRecovery ? "text" : "numeric"}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={useRecovery ? "a1b2c3d4e5f6g7h8" : "000000"}
              className={CODE_INPUT_CLASS}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              loading ||
              (useRecovery ? code.length !== 16 : code.length !== 6)
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed cs-pulse-glow"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* Toggle recovery mode */}
        <div className="text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="inline-flex items-center gap-1.5 text-xs text-cs-orange hover:text-cs-orange-light transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {useRecovery
              ? "Use authenticator code instead"
              : "Use recovery code instead"}
          </button>
        </div>
      </div>

      {/* Back to login */}
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
