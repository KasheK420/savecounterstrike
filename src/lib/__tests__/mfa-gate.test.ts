import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkMfaCompliance } from "../mfa-gate";

// ── Mock Prisma client ──────────────────────────────────────
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";

const findUnique = db.user.findUnique as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  checkMfaCompliance                                                 */
/* ------------------------------------------------------------------ */
describe("checkMfaCompliance", () => {
  it("returns compliant when session is null", async () => {
    const result = await checkMfaCompliance(null);
    expect(result).toEqual({ compliant: true });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns compliant when session has no userId", async () => {
    const result = await checkMfaCompliance({ user: {} });
    expect(result).toEqual({ compliant: true });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns compliant for regular USER without MFA", async () => {
    findUnique.mockResolvedValue({ role: "USER", mfaEnabled: false });

    const result = await checkMfaCompliance({
      user: { userId: "u1", mfaVerified: false },
    });

    expect(result).toEqual({ compliant: true });
  });

  it("returns compliant for regular USER with MFA enabled and mfaVerified=true", async () => {
    findUnique.mockResolvedValue({ role: "USER", mfaEnabled: true });

    const result = await checkMfaCompliance({
      user: { userId: "u1", mfaVerified: true },
    });

    expect(result).toEqual({ compliant: true });
  });

  it("returns non-compliant with /auth/mfa redirect for USER with MFA enabled but mfaVerified=false", async () => {
    findUnique.mockResolvedValue({ role: "USER", mfaEnabled: true });

    const result = await checkMfaCompliance({
      user: { userId: "u1", mfaVerified: false },
    });

    expect(result).toEqual({ compliant: false, redirect: "/auth/mfa" });
  });

  it("returns non-compliant with /auth/mfa/setup redirect for ADMIN without MFA enabled", async () => {
    findUnique.mockResolvedValue({ role: "ADMIN", mfaEnabled: false });

    const result = await checkMfaCompliance({
      user: { userId: "admin1", mfaVerified: false },
    });

    expect(result).toEqual({ compliant: false, redirect: "/auth/mfa/setup" });
  });

  it("returns non-compliant with /auth/mfa/setup redirect for MODERATOR without MFA enabled", async () => {
    findUnique.mockResolvedValue({ role: "MODERATOR", mfaEnabled: false });

    const result = await checkMfaCompliance({
      user: { userId: "mod1", mfaVerified: false },
    });

    expect(result).toEqual({ compliant: false, redirect: "/auth/mfa/setup" });
  });

  it("returns compliant for ADMIN with MFA enabled and mfaVerified=true", async () => {
    findUnique.mockResolvedValue({ role: "ADMIN", mfaEnabled: true });

    const result = await checkMfaCompliance({
      user: { userId: "admin1", mfaVerified: true },
    });

    expect(result).toEqual({ compliant: true });
  });

  it("returns non-compliant with /auth/mfa redirect for ADMIN with MFA enabled but mfaVerified=false", async () => {
    findUnique.mockResolvedValue({ role: "ADMIN", mfaEnabled: true });

    const result = await checkMfaCompliance({
      user: { userId: "admin1", mfaVerified: false },
    });

    expect(result).toEqual({ compliant: false, redirect: "/auth/mfa" });
  });

  it("returns compliant when user is not found in database", async () => {
    findUnique.mockResolvedValue(null);

    const result = await checkMfaCompliance({
      user: { userId: "nonexistent", mfaVerified: false },
    });

    expect(result).toEqual({ compliant: true });
  });
});
