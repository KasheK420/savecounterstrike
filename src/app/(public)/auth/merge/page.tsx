"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Merge,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const INPUT_CLASS =
  "w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground";

/** Decode a JWT payload without verification (server verifies). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

interface MergePayload {
  keepUserId: string;
  mergeUserId: string;
  mergeType: "steam" | "email";
  iat: number;
  exp: number;
}

export default function MergeAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decode the merge token payload client-side
  const payload = useMemo(() => {
    if (!token) return null;
    const decoded = decodeJwtPayload(token);
    if (
      !decoded ||
      typeof decoded.mergeUserId !== "string" ||
      typeof decoded.mergeType !== "string"
    ) {
      return null;
    }
    return decoded as unknown as MergePayload;
  }, [token]);

  // Check token expiry
  const isExpired = useMemo(() => {
    if (!payload?.exp) return false;
    return Date.now() / 1000 > payload.exp;
  }, [payload]);

  // Derive identity display from payload
  const mergeIdentity = payload?.mergeType === "email" ? "email account" : "Steam account";
  const requiresPassword = payload?.mergeType === "email";

  useEffect(() => {
    if (!token) {
      setError("No merge token provided. This link may be invalid.");
    } else if (!payload) {
      setError("Invalid merge token. Please try again from the link accounts page.");
    } else if (isExpired) {
      setError("This merge token has expired. Please start the merge process again.");
    }
  }, [token, payload, isExpired]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !payload || isExpired) return;

    if (requiresPassword && !password.trim()) {
      setError("Password is required to verify ownership of the email account.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/merge/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mergeToken: token,
          ...(requiresPassword ? { password } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An unexpected error occurred during the merge.");
        return;
      }

      // Redirect to profile with success message
      router.push("/?merged=true");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasError = !token || !payload || isExpired;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold">
          MERGE <span className="text-cs-orange cs-glow">ACCOUNTS</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Review and confirm the account merge below.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Merge details card */}
      {payload && !isExpired && (
        <div className="cs-card rounded-xl p-6 sm:p-8 space-y-6">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-lg border border-cs-orange/40 bg-cs-orange/5 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-cs-orange shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                You are about to merge a {mergeIdentity} into your current account
              </p>
              <p className="text-xs text-muted-foreground">
                All content (opinions, comments, votes, media) will be transferred to your current account. The merged account will be deleted. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Merge info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Merge type</span>
              <span className="text-foreground font-medium capitalize">
                {payload.mergeType}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Token expires</span>
              <span className="text-foreground font-medium">
                {new Date(payload.exp * 1000).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Password input for email merges */}
          <form onSubmit={handleConfirm} className="space-y-4">
            {requiresPassword && (
              <div className="space-y-2">
                <label
                  htmlFor="merge-password"
                  className="text-sm font-medium text-foreground"
                >
                  Password of the account being merged
                </label>
                <div className="relative">
                  <input
                    id="merge-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to verify ownership"
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
                <p className="text-[10px] text-muted-foreground">
                  Enter the password of the account you are merging into this one.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || hasError}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Merge className="h-4 w-4" />
                )}
                {loading ? "Merging..." : "Confirm Merge"}
              </button>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-muted-foreground font-semibold hover:bg-muted/50 hover:text-foreground transition-all"
              >
                <X className="h-4 w-4" />
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Fallback for invalid/expired tokens */}
      {hasError && (
        <div className="cs-card rounded-xl p-6 sm:p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-cs-orange/50 mx-auto" />
          <p className="text-sm text-muted-foreground">
            The merge link is invalid or has expired. Please return to your profile settings and start the process again.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cs-orange text-background font-semibold hover:bg-cs-orange-light transition-all"
          >
            Return Home
          </Link>
        </div>
      )}
    </div>
  );
}
