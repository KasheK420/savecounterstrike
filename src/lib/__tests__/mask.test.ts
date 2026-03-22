import { describe, it, expect } from "vitest";
import { maskDisplayName, maskSteamId } from "../mask";

describe("maskDisplayName", () => {
  it("masks names longer than 2 chars", () => {
    expect(maskDisplayName("Lukas")).toBe("Lu***");
    expect(maskDisplayName("KasheK420")).toBe("Ka*******");
  });

  it("handles short names", () => {
    expect(maskDisplayName("Lu")).toBe("Lu****");
    expect(maskDisplayName("A")).toBe("A****");
  });

  it("handles empty/falsy input", () => {
    expect(maskDisplayName("")).toBe("****");
  });

  it("caps asterisks at 8", () => {
    const longName = "VeryLongDisplayName123";
    const masked = maskDisplayName(longName);
    expect(masked).toBe("Ve********");
    expect(masked.length).toBe(10); // 2 + 8
  });
});

describe("maskSteamId", () => {
  it("masks standard Steam64 ID", () => {
    expect(maskSteamId("76561198012345678")).toBe("7656****5678");
  });

  it("handles short IDs", () => {
    expect(maskSteamId("12345678")).toBe("****");
    expect(maskSteamId("123456789")).toBe("1234****6789");
  });

  it("handles empty/falsy input", () => {
    expect(maskSteamId("")).toBe("****");
  });
});
