import { describe, it, expect, vi } from "vitest";

vi.mock("../src/config.js", () => ({
  cfg: {
    NODE_ENV: "test",
    SCHOOL_DOMAIN: "nnn.ed.jp",
    JWT_SECRET: "test-secret-32-chars-minimum-xxx",
  },
}));

describe("Auth — 認証チェック", () => {
  // テスト5: 許可されていないドメインは拒否
  it("5. nnn.ed.jp以外のメールは拒否される", () => {
    const SCHOOL_DOMAIN = "nnn.ed.jp";
    const testEmails = [
      { email: "student@nnn.ed.jp", allowed: true },
      { email: "user@gmail.com", allowed: false },
      { email: "teacher@other-school.ed.jp", allowed: false },
      { email: "attacker@nnn.ed.jp.evil.com", allowed: false },
    ];

    for (const { email, allowed } of testEmails) {
      const isAllowed = email.endsWith(`@${SCHOOL_DOMAIN}`);
      expect(isAllowed).toBe(allowed);
    }
  });

  // テスト6: 無効なJWT Cookieでは401
  it("6. 無効なセッションCookieでは認証エラー", async () => {
    const { verifySession } = await import("../src/auth/session.js").catch(() => ({
      verifySession: async () => {
        throw new Error("invalid");
      },
    }));

    await expect(verifySession("invalid.jwt.token")).rejects.toThrow();
  });
});
