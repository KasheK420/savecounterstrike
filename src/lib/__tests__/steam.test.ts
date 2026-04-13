import { describe, it, expect } from "vitest";
import {
  getSteamLoginUrl,
  parseSteamInput,
  steamId64ToSteamId,
  steamId64ToSteamId3,
} from "../steam";

// ── getSteamLoginUrl ────────────────────────────────────────

describe("getSteamLoginUrl", () => {
  const returnUrl = "https://example.com/api/auth/steam/callback";

  it("returns a URL starting with the Steam OpenID endpoint", () => {
    const url = getSteamLoginUrl(returnUrl);
    expect(url).toMatch(
      /^https:\/\/steamcommunity\.com\/openid\/login\?/
    );
  });

  it("contains the correct openid.return_to parameter", () => {
    const url = getSteamLoginUrl(returnUrl);
    const params = new URL(url).searchParams;
    expect(params.get("openid.return_to")).toBe(returnUrl);
  });

  it("sets realm to the origin of the return URL", () => {
    const url = getSteamLoginUrl(returnUrl);
    const params = new URL(url).searchParams;
    expect(params.get("openid.realm")).toBe("https://example.com");
  });

  it("sets openid.mode to checkid_setup", () => {
    const url = getSteamLoginUrl(returnUrl);
    const params = new URL(url).searchParams;
    expect(params.get("openid.mode")).toBe("checkid_setup");
  });
});

// ── parseSteamInput ─────────────────────────────────────────

describe("parseSteamInput", () => {
  it("parses a raw Steam64 ID", () => {
    expect(parseSteamInput("76561198012345678")).toEqual({
      type: "id",
      value: "76561198012345678",
    });
  });

  it("parses a Steam profile URL with ID", () => {
    expect(
      parseSteamInput(
        "https://steamcommunity.com/profiles/76561198012345678"
      )
    ).toEqual({ type: "id", value: "76561198012345678" });
  });

  it("parses a Steam vanity URL", () => {
    expect(
      parseSteamInput("https://steamcommunity.com/id/kashek")
    ).toEqual({ type: "vanity", value: "kashek" });
  });

  it("parses a Steam vanity URL with trailing slash", () => {
    expect(
      parseSteamInput("https://steamcommunity.com/id/kashek/")
    ).toEqual({ type: "vanity", value: "kashek" });
  });

  it("parses a plain vanity name", () => {
    expect(parseSteamInput("kashek")).toEqual({
      type: "vanity",
      value: "kashek",
    });
  });

  it("returns null for empty string", () => {
    expect(parseSteamInput("")).toBeNull();
  });

  it("returns null for single character", () => {
    expect(parseSteamInput("a")).toBeNull();
  });

  it("returns null for input with special characters", () => {
    expect(parseSteamInput("foo bar!@#")).toBeNull();
  });

  it("treats a 10-digit number (not starting with 7656) as vanity", () => {
    expect(parseSteamInput("1234567890")).toEqual({
      type: "vanity",
      value: "1234567890",
    });
  });

  it("treats a 16-digit number (wrong prefix) as vanity", () => {
    expect(parseSteamInput("1234567890123456")).toEqual({
      type: "vanity",
      value: "1234567890123456",
    });
  });
});

// ── steamId64ToSteamId ──────────────────────────────────────

describe("steamId64ToSteamId", () => {
  it("returns a string matching STEAM_X:Y:Z format", () => {
    expect(steamId64ToSteamId("76561198012345678")).toMatch(
      /^STEAM_\d+:\d+:\d+$/
    );
  });

  it("converts a known Steam64 ID correctly", () => {
    expect(steamId64ToSteamId("76561197960287930")).toBe(
      "STEAM_1:0:11101"
    );
  });
});

// ── steamId64ToSteamId3 ─────────────────────────────────────

describe("steamId64ToSteamId3", () => {
  it("converts a known Steam64 ID to Steam3 format", () => {
    expect(steamId64ToSteamId3("76561197960287930")).toBe("[U:1:22202]");
  });

  it("always returns [U:1:NUMBER] format", () => {
    expect(steamId64ToSteamId3("76561198012345678")).toMatch(
      /^\[U:1:\d+\]$/
    );
  });
});
