"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Shield,
  Loader2,
  AlertCircle,
  Copy,
  Download,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

const CODE_INPUT_CLASS =
  "w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground text-center text-2xl tracking-[0.3em] font-mono";

type Step = "qr" | "verify" | "recovery";

interface SetupData {
  qrCode: string;
  otpauthUri: string;
  recoveryCodes: string[];
}

export default function MfaSetupPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("qr");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Verify
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Show secret toggle
  const [showSecret, setShowSecret] = useState(false);

  // Step 3: Recovery codes
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  // Fetch setup data on mount
  useEffect(() => {
    async function initSetup() {
      try {
        const res = await fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to initialize MFA setup.");
          return;
        }

        setSetupData(data);
      } catch {
        setError(
          "Network error. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    initSetup();
  }, []);

  // Auto-focus code input when step changes to verify
  useEffect(() => {
    if (step === "verify") {
      codeInputRef.current?.focus();
    }
  }, [step]);

  // Extract secret from otpauth URI for manual entry
  const manualSecret = setupData?.otpauthUri
    ? new URL(setupData.otpauthUri).searchParams.get("secret") || ""
    : "";

  const handleVerify = useCallback(
    async (submittedCode: string) => {
      if (verifying) return;
      setError(null);
      setVerifying(true);

      try {
        const res = await fetch("/api/auth/mfa/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: submittedCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invalid code. Please try again.");
          setCode("");
          codeInputRef.current?.focus();
          return;
        }

        // Move to recovery codes step
        setStep("recovery");
      } catch {
        setError(
          "Network error. Please check your connection and try again.",
        );
        setCode("");
        codeInputRef.current?.focus();
      } finally {
        setVerifying(false);
      }
    },
    [verifying],
  );

  function handleCodeChange(value: string) {
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setCode(sanitized);

    // Auto-submit when 6 digits entered
    if (sanitized.length === 6) {
      handleVerify(sanitized);
    }
  }

  function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length === 6) {
      handleVerify(code);
    }
  }

  async function handleCopyAll() {
    if (!setupData) return;
    const text = setupData.recoveryCodes.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownload() {
    if (!setupData) return;
    const header = "SaveCounterStrike - MFA Recovery Codes\n";
    const separator = "=".repeat(40) + "\n";
    const warning =
      "Store these codes somewhere safe.\nEach code can only be used once.\n\n";
    const text =
      header +
      separator +
      warning +
      setupData.recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n";

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "savecounterstrike-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDone() {
    router.push("/");
    router.refresh();
  }

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-cs-orange mx-auto opacity-80" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            SET UP TWO-FACTOR{" "}
            <span className="text-cs-orange cs-glow">AUTHENTICATION</span>
          </h1>
        </div>
        <div className="cs-card rounded-xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cs-orange" />
        </div>
      </div>
    );
  }

  // ── Error without setup data ────────────────────────────────
  if (!setupData && error) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-cs-orange mx-auto opacity-80" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            SET UP TWO-FACTOR{" "}
            <span className="text-cs-orange cs-glow">AUTHENTICATION</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  if (!setupData) return null;

  // ── Step 1: QR Code ─────────────────────────────────────────
  if (step === "qr") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-cs-orange mx-auto opacity-80" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            SET UP TWO-FACTOR{" "}
            <span className="text-cs-orange cs-glow">AUTHENTICATION</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </p>
        </div>

        {/* QR card */}
        <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cs-orange text-background text-xs font-bold">
              1
            </span>
            <span className="w-8 h-px bg-border" />
            <span className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground text-xs">
              2
            </span>
            <span className="w-8 h-px bg-border" />
            <span className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground text-xs">
              3
            </span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-lg">
              <Image
                src={setupData.qrCode}
                alt="MFA QR Code"
                width={200}
                height={200}
                unoptimized
              />
            </div>
          </div>

          {/* Manual secret toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="inline-flex items-center gap-1.5 text-xs text-cs-orange hover:text-cs-orange-light transition-colors"
            >
              {showSecret ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {showSecret
                ? "Hide secret key"
                : "Can't scan? Click to show secret key"}
            </button>

            {showSecret && (
              <div className="mt-3 p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Enter this key manually in your authenticator app:
                </p>
                <code className="text-sm font-mono text-cs-orange tracking-wider break-all">
                  {manualSecret}
                </code>
              </div>
            )}
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={() => setStep("verify")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all cs-pulse-glow"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Verify ──────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-cs-orange mx-auto opacity-80" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            VERIFY{" "}
            <span className="text-cs-orange cs-glow">SETUP</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the 6-digit code from your app to confirm setup
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Verify card */}
        <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cs-orange/30 text-cs-orange text-xs font-bold">
              1
            </span>
            <span className="w-8 h-px bg-cs-orange/30" />
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cs-orange text-background text-xs font-bold">
              2
            </span>
            <span className="w-8 h-px bg-border" />
            <span className="flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground text-xs">
              3
            </span>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-5">
            {/* Code input */}
            <div className="space-y-2">
              <label
                htmlFor="verify-code"
                className="text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <input
                ref={codeInputRef}
                id="verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className={CODE_INPUT_CLASS}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed cs-pulse-glow"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {verifying ? "Verifying..." : "Verify & Enable"}
            </button>
          </form>

          {/* Back link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep("qr");
                setCode("");
                setError(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to QR code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Recovery Codes ──────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-cs-green mx-auto" />
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          SAVE YOUR{" "}
          <span className="text-cs-orange cs-glow">RECOVERY CODES</span>
        </h1>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-cs-orange/30 bg-cs-orange/5 px-4 py-3 text-sm text-cs-orange">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          These codes can be used to access your account if you lose your
          authenticator. Each code can only be used once. Save them somewhere
          safe.
        </span>
      </div>

      {/* Recovery codes card */}
      <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cs-orange/30 text-cs-orange text-xs font-bold">
            1
          </span>
          <span className="w-8 h-px bg-cs-orange/30" />
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cs-orange/30 text-cs-orange text-xs font-bold">
            2
          </span>
          <span className="w-8 h-px bg-cs-orange/30" />
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-cs-orange text-background text-xs font-bold">
            3
          </span>
        </div>

        {/* Codes grid */}
        <div className="grid grid-cols-2 gap-2">
          {setupData.recoveryCodes.map((rc, i) => (
            <div
              key={i}
              className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-center"
            >
              <code className="text-sm font-mono text-foreground tracking-wider">
                {rc}
              </code>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-all"
          >
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-cs-green" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy All"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-all"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={savedConfirmed}
            onChange={(e) => setSavedConfirmed(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-muted/50 text-cs-orange accent-cs-orange focus:ring-cs-orange/50"
          />
          <span className="text-sm text-muted-foreground">
            I have saved my recovery codes
          </span>
        </label>

        {/* Done button */}
        <button
          type="button"
          onClick={handleDone}
          disabled={!savedConfirmed}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed cs-pulse-glow"
        >
          Done
        </button>
      </div>
    </div>
  );
}
