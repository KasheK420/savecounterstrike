import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { mergeAccounts } from "../account-merge";

// ── Mock Prisma transaction client ──────────────────────────
const mockTx = {
  petitionSignature: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  opinion: { updateMany: vi.fn() },
  comment: { updateMany: vi.fn() },
  media: { updateMany: vi.fn() },
  opinionVote: { findMany: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  commentVote: { findMany: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  mediaVote: { findMany: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  pageView: { updateMany: vi.fn() },
  loginAttempt: { updateMany: vi.fn() },
  passwordResetToken: { deleteMany: vi.fn() },
  emailVerifyToken: { deleteMany: vi.fn() },
  mfaRecoveryCode: { deleteMany: vi.fn() },
  user: { findUniqueOrThrow: vi.fn(), update: vi.fn(), delete: vi.fn() },
  auditLog: { create: vi.fn() },
};

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUniqueOrThrow: vi.fn() },
    $transaction: vi.fn((fn: (tx: typeof mockTx) => Promise<void>) =>
      fn(mockTx),
    ),
  },
}));

import { db } from "@/lib/db";

const dbFindUser = db.user.findUniqueOrThrow as ReturnType<typeof vi.fn>;

// ── Helpers ─────────────────────────────────────────────────
function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "keep-id",
    role: "USER",
    isBanned: false,
    karma: 10,
    steamId: null,
    email: null,
    passwordHash: null,
    emailVerified: null,
    emailVerifiedAt: null,
    ownsCs2: null,
    cs2PlaytimeHours: null,
    cs2Kills: null,
    cs2Deaths: null,
    cs2Wins: null,
    cs2HeadshotPct: null,
    securityStamp: "old-stamp",
    ...overrides,
  };
}

function setupUsers(
  keepOverrides: Record<string, unknown> = {},
  mergeOverrides: Record<string, unknown> = {},
) {
  const keepUser = makeUser({ id: "keep-id", ...keepOverrides });
  const mergeUser = makeUser({ id: "merge-id", ...mergeOverrides });

  dbFindUser
    .mockResolvedValueOnce(keepUser) // keepUser lookup
    .mockResolvedValueOnce(mergeUser); // mergeUser lookup

  return { keepUser, mergeUser };
}

function setupDefaultVoteMocks() {
  mockTx.opinionVote.findMany.mockResolvedValue([]);
  mockTx.commentVote.findMany.mockResolvedValue([]);
  mockTx.mediaVote.findMany.mockResolvedValue([]);
}

function setupDefaultSignatureMocks(
  keepSig: unknown = null,
  mergeSig: unknown = null,
) {
  mockTx.petitionSignature.findUnique
    .mockResolvedValueOnce(keepSig) // keepUser signature
    .mockResolvedValueOnce(mergeSig); // mergeUser signature
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no votes, no signatures
  setupDefaultVoteMocks();
  setupDefaultSignatureMocks();
});

/* ------------------------------------------------------------------ */
/*  Pre-check failures                                                 */
/* ------------------------------------------------------------------ */
describe("mergeAccounts pre-checks", () => {
  it("throws when merge user is banned", async () => {
    setupUsers({}, { isBanned: true });

    await expect(mergeAccounts("keep-id", "merge-id")).rejects.toThrow(
      "Cannot merge banned account",
    );
  });

  it("throws when merge user has elevated role above keep user", async () => {
    setupUsers({ role: "USER" }, { role: "ADMIN" });

    await expect(mergeAccounts("keep-id", "merge-id")).rejects.toThrow(
      "Cannot absorb elevated role",
    );
  });

  it("throws when merge user is MODERATOR and keep user is USER", async () => {
    setupUsers({ role: "USER" }, { role: "MODERATOR" });

    await expect(mergeAccounts("keep-id", "merge-id")).rejects.toThrow(
      "Cannot absorb elevated role",
    );
  });
});

/* ------------------------------------------------------------------ */
/*  Happy path                                                         */
/* ------------------------------------------------------------------ */
describe("mergeAccounts happy path", () => {
  it("transfers all relations for two regular users", async () => {
    setupUsers({ karma: 5 }, { karma: 15 });

    await mergeAccounts("keep-id", "merge-id");

    // Opinions transferred
    expect(mockTx.opinion.updateMany).toHaveBeenCalledWith({
      where: { authorId: "merge-id" },
      data: { authorId: "keep-id" },
    });

    // Comments transferred
    expect(mockTx.comment.updateMany).toHaveBeenCalledWith({
      where: { authorId: "merge-id" },
      data: { authorId: "keep-id" },
    });

    // Media transferred
    expect(mockTx.media.updateMany).toHaveBeenCalledWith({
      where: { authorId: "merge-id" },
      data: { authorId: "keep-id" },
    });

    // PageViews transferred
    expect(mockTx.pageView.updateMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
      data: { userId: "keep-id" },
    });

    // LoginAttempts transferred
    expect(mockTx.loginAttempt.updateMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
      data: { userId: "keep-id" },
    });

    // OpinionVote remaining transferred
    expect(mockTx.opinionVote.updateMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
      data: { userId: "keep-id" },
    });

    // CommentVote remaining transferred
    expect(mockTx.commentVote.updateMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
      data: { userId: "keep-id" },
    });

    // MediaVote remaining transferred
    expect(mockTx.mediaVote.updateMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
      data: { userId: "keep-id" },
    });

    // Tokens and recovery codes deleted
    expect(mockTx.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
    });
    expect(mockTx.emailVerifyToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
    });
    expect(mockTx.mfaRecoveryCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Petition signature handling                                        */
/* ------------------------------------------------------------------ */
describe("mergeAccounts petition signatures", () => {
  it("deletes merge user signature when keep user already has one", async () => {
    setupUsers();
    // Override default signature mocks
    mockTx.petitionSignature.findUnique.mockReset();
    mockTx.petitionSignature.findUnique
      .mockResolvedValueOnce({ id: "sig-keep", userId: "keep-id" }) // keepUser has sig
      .mockResolvedValueOnce({ id: "sig-merge", userId: "merge-id" }); // mergeUser has sig

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.petitionSignature.deleteMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
    });
    expect(mockTx.petitionSignature.updateMany).not.toHaveBeenCalled();
  });

  it("transfers merge user signature when keep user has none", async () => {
    setupUsers();
    // Override default signature mocks
    mockTx.petitionSignature.findUnique.mockReset();
    mockTx.petitionSignature.findUnique
      .mockResolvedValueOnce(null) // keepUser has no sig
      .mockResolvedValueOnce({ id: "sig-merge", userId: "merge-id" }); // mergeUser has sig

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.petitionSignature.updateMany).toHaveBeenCalledWith({
      where: { userId: "merge-id" },
      data: { userId: "keep-id" },
    });
    expect(mockTx.petitionSignature.deleteMany).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  Karma                                                              */
/* ------------------------------------------------------------------ */
describe("mergeAccounts karma", () => {
  it("sums karma from both accounts", async () => {
    setupUsers({ karma: 42 }, { karma: 58 });

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "keep-id" },
        data: expect.objectContaining({ karma: 100 }),
      }),
    );
  });
});

/* ------------------------------------------------------------------ */
/*  Security stamp                                                     */
/* ------------------------------------------------------------------ */
describe("mergeAccounts security stamp", () => {
  it("regenerates securityStamp on keep user", async () => {
    const uuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("new-uuid-stamp" as `${string}-${string}-${string}-${string}-${string}`);

    setupUsers();

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "keep-id" },
        data: expect.objectContaining({ securityStamp: "new-uuid-stamp" }),
      }),
    );

    uuidSpy.mockRestore();
  });
});

/* ------------------------------------------------------------------ */
/*  Audit log                                                          */
/* ------------------------------------------------------------------ */
describe("mergeAccounts audit log", () => {
  it("creates audit log with correct action and details", async () => {
    setupUsers(
      {},
      { steamId: "steam-merge", email: "merge@test.com" },
    );

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "keep-id",
        action: "account_merge",
        details: {
          mergedUserId: "merge-id",
          mergedSteamId: "steam-merge",
          mergedEmail: "merge@test.com",
        },
      },
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Merge user deletion                                                */
/* ------------------------------------------------------------------ */
describe("mergeAccounts cleanup", () => {
  it("deletes the merge user at end of transaction", async () => {
    setupUsers();

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.user.delete).toHaveBeenCalledWith({
      where: { id: "merge-id" },
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Identity transfer                                                  */
/* ------------------------------------------------------------------ */
describe("mergeAccounts identity transfer", () => {
  it("copies steamId when keep user has none and merge user has one", async () => {
    setupUsers({ steamId: null }, { steamId: "steam-merge-123" });

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "keep-id" },
        data: expect.objectContaining({ steamId: "steam-merge-123" }),
      }),
    );
  });

  it("does not overwrite existing steamId on keep user", async () => {
    setupUsers(
      { steamId: "steam-keep-456" },
      { steamId: "steam-merge-123" },
    );

    await mergeAccounts("keep-id", "merge-id");

    const updateCall = mockTx.user.update.mock.calls[0][0];
    expect(updateCall.data.steamId).toBeUndefined();
  });

  it("copies email and passwordHash when keep user has no email and merge user has one", async () => {
    setupUsers(
      { email: null, passwordHash: null },
      {
        email: "merge@example.com",
        passwordHash: "hashed-pw",
        emailVerified: true,
        emailVerifiedAt: new Date("2026-01-01"),
      },
    );

    await mergeAccounts("keep-id", "merge-id");

    expect(mockTx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "keep-id" },
        data: expect.objectContaining({
          email: "merge@example.com",
          passwordHash: "hashed-pw",
          emailVerified: true,
          emailVerifiedAt: new Date("2026-01-01"),
        }),
      }),
    );
  });

  it("does not overwrite existing email on keep user", async () => {
    setupUsers(
      { email: "keep@example.com", passwordHash: "keep-hash" },
      { email: "merge@example.com", passwordHash: "merge-hash" },
    );

    await mergeAccounts("keep-id", "merge-id");

    const updateCall = mockTx.user.update.mock.calls[0][0];
    expect(updateCall.data.email).toBeUndefined();
    expect(updateCall.data.passwordHash).toBeUndefined();
  });
});
