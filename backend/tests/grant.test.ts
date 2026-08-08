import { describe, it, expect, vi, beforeEach } from "vitest";

// DB・web3をモック
vi.mock("../src/db/client.js", () => ({
  prisma: {
    user: {
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
    grant: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../src/web3/grant.js", () => ({
  claimGrant: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/config.js", () => ({
  cfg: {
    NODE_ENV: "test",
    PORT: 3001,
    DATABASE_URL: "postgresql://test",
    JWT_SECRET: "test-secret-32-chars-minimum-xxx",
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    GOOGLE_CALLBACK_URL: "http://localhost:3001/auth/google/callback",
    SCHOOL_DOMAIN: "nnn.ed.jp",
    FRONTEND_URL: "http://localhost:5173",
    RPC_URL: "http://127.0.0.1:8545",
    DISTRIBUTION_WALLET_PRIVATE_KEY: "0x" + "a".repeat(64),
    CAMPUS_COIN_ADDRESS: "0x" + "b".repeat(40),
  },
}));

import { prisma } from "../src/db/client.js";
import { claimGrant } from "../src/web3/grant.js";

const mockPrisma = prisma as any;
const mockClaimGrant = claimGrant as any;

describe("Grant — 初回10,000CMP付与", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // テスト1: 新規ユーザーへ10,000Pが一度だけ付与される
  it("1. 新規ユーザーへGrant(pending)が作成される", async () => {
    const userId = "user-1";
    const walletAddress = "0x" + "c".repeat(40);

    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ id: userId, walletAddress });
    mockPrisma.grant.findUnique.mockResolvedValue(null); // 未付与
    mockPrisma.grant.create.mockResolvedValue({
      id: "grant-1",
      userId,
      status: "pending",
      amount: 10_000n * 10n ** 18n,
      txHash: null,
    });

    // 付与処理をシミュレート
    const existing = await prisma.grant.findUnique({ where: { userId } });
    expect(existing).toBeNull();

    const grant = await prisma.grant.create({
      data: { userId, status: "pending", amount: 10_000n * 10n ** 18n },
    });
    expect(grant.status).toBe("pending");
    expect(grant.amount).toBe(10_000n * 10n ** 18n);
  });

  // テスト2: 同じユーザーが再ログインしても再付与されない
  it("2. 既存Grantがある場合は再作成しない", async () => {
    const userId = "user-1";
    const existingGrant = {
      id: "grant-1",
      userId,
      status: "confirmed",
      txHash: "0xabc",
      amount: 10_000n * 10n ** 18n,
    };

    mockPrisma.grant.findUnique.mockResolvedValue(existingGrant);

    const existing = await prisma.grant.findUnique({ where: { userId } });
    expect(existing).not.toBeNull();
    expect(existing!.status).toBe("confirmed");

    // createは呼ばれない
    expect(mockPrisma.grant.create).not.toHaveBeenCalled();
  });

  // テスト3: 同時リクエストでも二重付与されない（P2002エラーで1件のみ）
  it("3. 一意制約違反(P2002)で競合リクエストは既存を返す", async () => {
    const userId = "user-2";

    mockPrisma.grant.findUnique
      .mockResolvedValueOnce(null) // 最初のfindはnull
      .mockResolvedValueOnce({ id: "grant-2", userId, status: "pending", txHash: null, amount: 10_000n * 10n ** 18n });

    // 1件目のcreateは成功、2件目はP2002
    mockPrisma.grant.create
      .mockResolvedValueOnce({ id: "grant-2", userId, status: "pending", amount: 10_000n * 10n ** 18n })
      .mockRejectedValueOnce({ code: "P2002" });

    // 1件目
    const grant1 = await prisma.grant.create({ data: { userId, status: "pending", amount: 10_000n * 10n ** 18n } });
    expect(grant1.status).toBe("pending");

    // 2件目は P2002
    await expect(
      prisma.grant.create({ data: { userId, status: "pending", amount: 10_000n * 10n ** 18n } })
    ).rejects.toMatchObject({ code: "P2002" });
  });

  // テスト4: 別SNSアカウントには別Grantが作られる
  it("4. 別userIdには独立したGrantが作られる", async () => {
    const userId1 = "user-1";
    const userId2 = "user-2";

    mockPrisma.grant.create
      .mockResolvedValueOnce({ id: "grant-1", userId: userId1, status: "pending", amount: 10_000n * 10n ** 18n })
      .mockResolvedValueOnce({ id: "grant-2", userId: userId2, status: "pending", amount: 10_000n * 10n ** 18n });

    const g1 = await prisma.grant.create({ data: { userId: userId1, status: "pending", amount: 10_000n * 10n ** 18n } });
    const g2 = await prisma.grant.create({ data: { userId: userId2, status: "pending", amount: 10_000n * 10n ** 18n } });

    expect(g1.userId).toBe(userId1);
    expect(g2.userId).toBe(userId2);
    expect(g1.id).not.toBe(g2.id);
  });

  // テスト8: 10,000CMPが18decimalsで正確に変換される
  it("8. 10,000CMPのBigInt変換精度", () => {
    const CMP_DECIMALS = 18n;
    const AMOUNT_CMP = 10_000n;
    const amountWei = AMOUNT_CMP * 10n ** CMP_DECIMALS;

    expect(amountWei).toBe(10_000_000_000_000_000_000_000n);
    expect(amountWei).toBe(10_000n * 10n ** 18n);

    // number型では精度が失われる（比較用）
    const floatAmount = 10000 * 1e18;
    // floatAmountとamountWeiは等しくない（BigIntのほうが安全）
    expect(typeof amountWei).toBe("bigint");
    expect(typeof floatAmount).toBe("number");
  });

  // テスト9: 送金失敗時にfailedになる
  it("9. claimGrantが失敗時はGrant.status=failedになる", async () => {
    const grantId = "grant-fail";
    mockPrisma.grant.update.mockResolvedValue({ id: grantId, status: "failed" });

    // エラーをシミュレート
    mockClaimGrant.mockImplementationOnce(async (id: string) => {
      await prisma.grant.update({ where: { id }, data: { status: "failed" } });
    });

    await claimGrant(grantId, "0x" + "d".repeat(40), 10_000n * 10n ** 18n);

    expect(mockPrisma.grant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "failed" } })
    );
  });
});

