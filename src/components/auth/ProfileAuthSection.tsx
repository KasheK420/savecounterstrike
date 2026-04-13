"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Link2,
  Mail,
  Shield,
  ShieldCheck,
  ShieldOff,
  Lock,
  AlertTriangle,
} from "lucide-react";

const INPUT_CLASS =
  "w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cs-orange/50 text-foreground";

/** User auth data fetched from the API or passed as props. */
export interface UserAuthData {
  steamId: string | null;
  email: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  hasPassword: boolean;
  role: string;
}

interface ProfileAuthSectionProps {
  authData: UserAuthData;
}

// ── Password Strength Indicator ─────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very weak", color: "bg-cs-red", width: "w-1/5" },
    { label: "Weak", color: "bg-cs-red", width: "w-2/5" },
    { label: "Fair", color: "bg-cs-orange", width: "w-3/5" },
    { label: "Strong", color: "bg-cs-green", width: "w-4/5" },
    { label: "Very strong", color: "bg-cs-green", width: "w-full" },
  ];

  const level = levels[Math.min(score, levels.length - 1)];

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${level.color} ${level.width} rounded-full transition-all duration-300`}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{level.label}</p>
    </div>
  );
}

// ── Status Message ──────────────────────────────────────

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
        type === "success"
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

// ── Section 1: Linked Accounts ──────────────────────────

function LinkedAccountsSection({
  authData,
  onUpdate,
}: {
  authData: UserAuthData;
  onUpdate: () => void;
}) {
  const [showLinkEmail, setShowLinkEmail] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  async function handleLinkEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/link/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: linkEmail, password: linkPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : "Failed to link email. Please try again.";
        setError(errMsg);
        return;
      }

      // Merge required - redirect to merge page
      if (data.mergeRequired && data.mergeToken) {
        router.push(
          `/auth/merge?token=${encodeURIComponent(data.mergeToken)}`
        );
        return;
      }

      setSuccess(data.message || "Email linked. Check your inbox to verify.");
      setShowLinkEmail(false);
      setLinkEmail("");
      setLinkPassword("");
      onUpdate();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cs-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-cs-orange" />
        <h2 className="font-heading font-semibold text-foreground">
          Linked Accounts
        </h2>
      </div>

      {error && <StatusMessage type="error" message={error} />}
      {success && <StatusMessage type="success" message={success} />}

      <div className="space-y-3">
        {/* Steam */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
              <Shield className="h-4 w-4 text-cs-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Steam</p>
              {authData.steamId ? (
                <p className="text-xs text-muted-foreground">
                  ID: {authData.steamId}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>
          {authData.steamId ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-cs-green/30 text-cs-green bg-cs-green/5">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </span>
          ) : (
            <a
              href="/api/auth/link/steam"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-cs-orange/30 text-cs-orange hover:bg-cs-orange hover:text-background transition-all"
            >
              Link Steam Account
            </a>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
              <Mail className="h-4 w-4 text-cs-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              {authData.email ? (
                <p className="text-xs text-muted-foreground">
                  {authData.email}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not linked</p>
              )}
            </div>
          </div>
          {authData.email ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                authData.emailVerified
                  ? "border-cs-green/30 text-cs-green bg-cs-green/5"
                  : "border-cs-orange/30 text-cs-orange bg-cs-orange/5"
              }`}
            >
              {authData.emailVerified ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Unverified
                </>
              )}
            </span>
          ) : (
            <button
              onClick={() => setShowLinkEmail(!showLinkEmail)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-cs-orange/30 text-cs-orange hover:bg-cs-orange hover:text-background transition-all"
            >
              Add Email &amp; Password
            </button>
          )}
        </div>

        {/* Inline email link form */}
        {showLinkEmail && !authData.email && (
          <form
            onSubmit={handleLinkEmail}
            className="p-4 rounded-lg border border-border/50 bg-muted/10 space-y-3"
          >
            <div className="space-y-2">
              <label
                htmlFor="link-email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="link-email"
                type="email"
                autoComplete="email"
                required
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="you@example.com"
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="link-password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="link-password"
                  type={showLinkPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className={`${INPUT_CLASS} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowLinkPassword(!showLinkPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showLinkPassword ? "Hide password" : "Show password"
                  }
                >
                  {showLinkPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordStrength password={linkPassword} />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cs-orange text-background font-semibold text-sm hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                {loading ? "Linking..." : "Link Email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkEmail(false);
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Section 2: Change Password ──────────────────────────

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : data.details
              ? (data.details as string[]).join(". ")
              : "Failed to change password.";
        setError(errMsg);
        return;
      }

      setSuccess("Password changed successfully. Other sessions have been invalidated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cs-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-cs-orange" />
        <h2 className="font-heading font-semibold text-foreground">
          Change Password
        </h2>
      </div>

      {error && <StatusMessage type="error" message={error} />}
      {success && <StatusMessage type="success" message={success} />}

      <form onSubmit={handleChangePassword} className="space-y-4">
        {/* Current password */}
        <div className="space-y-2">
          <label
            htmlFor="current-password"
            className="text-sm font-medium text-foreground"
          >
            Current password
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={`${INPUT_CLASS} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-2">
          <label
            htmlFor="new-password"
            className="text-sm font-medium text-foreground"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a strong password"
              className={`${INPUT_CLASS} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrength password={newPassword} />
        </div>

        {/* Confirm new password */}
        <div className="space-y-2">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium text-foreground"
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className={INPUT_CLASS}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-[10px] text-destructive">
              Passwords do not match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cs-orange text-background font-semibold text-sm hover:bg-cs-orange-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

// ── Section 3: Two-Factor Authentication ────────────────

function MfaSection({ authData }: { authData: UserAuthData }) {
  const router = useRouter();
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableRecoveryCode, setDisableRecoveryCode] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isElevated =
    authData.role === "ADMIN" || authData.role === "MODERATOR";

  async function handleDisableMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!disablePassword && !disableRecoveryCode) {
      setError("Password or recovery code is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(disablePassword ? { password: disablePassword } : {}),
          ...(disableRecoveryCode
            ? { recoveryCode: disableRecoveryCode }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : "Failed to disable MFA.";
        setError(errMsg);
        return;
      }

      setSuccess("Two-factor authentication has been disabled.");
      setShowDisable(false);
      setDisablePassword("");
      setDisableRecoveryCode("");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cs-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-cs-orange" />
        <h2 className="font-heading font-semibold text-foreground">
          Two-Factor Authentication
        </h2>
      </div>

      {error && <StatusMessage type="error" message={error} />}
      {success && <StatusMessage type="success" message={success} />}

      {/* MFA required warning for elevated roles */}
      {isElevated && !authData.mfaEnabled && (
        <div className="flex items-start gap-3 rounded-lg border border-cs-red/40 bg-cs-red/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-cs-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-cs-red">
              MFA is required for your role
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              As an {authData.role.toLowerCase()}, two-factor authentication is
              mandatory. Please enable it immediately.
            </p>
          </div>
        </div>
      )}

      {/* Current status */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
            {authData.mfaEnabled ? (
              <ShieldCheck className="h-4 w-4 text-cs-green" />
            ) : (
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Authenticator App
            </p>
            <p className="text-xs text-muted-foreground">
              {authData.mfaEnabled
                ? "TOTP authenticator is active"
                : "Add an extra layer of security"}
            </p>
          </div>
        </div>
        {authData.mfaEnabled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-cs-green/30 text-cs-green bg-cs-green/5">
            <CheckCircle2 className="h-3 w-3" />
            Enabled
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground bg-muted/10">
            Not enabled
          </span>
        )}
      </div>

      {/* Actions */}
      {authData.mfaEnabled ? (
        <>
          {!showDisable ? (
            <button
              onClick={() => setShowDisable(true)}
              disabled={isElevated}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isElevated ? "MFA is mandatory for your role" : "Disable MFA"
              }
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Disable MFA
            </button>
          ) : (
            <form
              onSubmit={handleDisableMfa}
              className="p-4 rounded-lg border border-border/50 bg-muted/10 space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Verify your identity to disable two-factor authentication.
              </p>

              {authData.hasPassword && (
                <div className="space-y-2">
                  <label
                    htmlFor="disable-mfa-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="disable-mfa-password"
                      type={showDisablePassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`${INPUT_CLASS} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowDisablePassword(!showDisablePassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showDisablePassword ? "Hide password" : "Show password"
                      }
                    >
                      {showDisablePassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="disable-mfa-recovery"
                  className="text-sm font-medium text-foreground"
                >
                  {authData.hasPassword
                    ? "Or recovery code"
                    : "Recovery code"}
                </label>
                <input
                  id="disable-mfa-recovery"
                  type="text"
                  autoComplete="off"
                  value={disableRecoveryCode}
                  onChange={(e) => setDisableRecoveryCode(e.target.value)}
                  placeholder="Enter a recovery code"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={
                    loading || (!disablePassword && !disableRecoveryCode)
                  }
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldOff className="h-3.5 w-3.5" />
                  )}
                  {loading ? "Disabling..." : "Confirm Disable"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisable(false);
                    setError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <button
          onClick={() => router.push("/auth/mfa/setup")}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cs-orange text-background font-semibold text-sm hover:bg-cs-orange-light transition-all"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Enable MFA
        </button>
      )}
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────

export function ProfileAuthSection({ authData }: ProfileAuthSectionProps) {
  const { user } = useSession();
  const [data, setData] = useState(authData);

  // Refresh auth data after changes
  function handleUpdate() {
    // Optimistic: we rely on the component-level state already being
    // updated through form success handlers. A full refetch could be
    // added here if a dedicated auth-data endpoint exists.
    setData((prev) => ({ ...prev }));
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <LinkedAccountsSection authData={data} onUpdate={handleUpdate} />

      {data.hasPassword && <ChangePasswordSection />}

      <MfaSection authData={data} />
    </div>
  );
}
