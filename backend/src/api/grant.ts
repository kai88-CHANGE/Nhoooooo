import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";
import { claimGrant } from "../web3/grant.js";

export const grantRouter = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const GRANT_AMOUNT = 10_000n * 10n ** 18n;

// POST /api/grant/claim
grantRouter.post("/claim", limiter, requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.walletAddress) {
    return res.status(400).json({ error: "先にウォレットを接続してください" });
  }

  // 冪等性: 既存レコードがあればそれを返す
  const existing = await prisma.grant.findUnique({ where: { userId } });
  if (existing) {
    return res.json({
      status: existing.status,
      txHash: existing.txHash,
      amount: existing.amount.toString(),
    });
  }

  // DBに先にpendingレコードを作成（一意制約で競合リクエストを防ぐ）
  let grant;
  try {
    grant = await prisma.grant.create({
      data: { userId, status: "pending", amount: GRANT_AMOUNT },
    });
  } catch (e: any) {
    if (e.code === "P2002") {
      // 競合: 別リクエストが先に作成 → 既存を返す
      const g = await prisma.grant.findUnique({ where: { userId } });
      return res.json({ status: g!.status, txHash: g!.txHash, amount: g!.amount.toString() });
    }
    throw e;
  }

  // 非同期でオンチェーン送金（レスポンスより後に実行）
  setImmediate(() => {
    claimGrant(grant.id, user.walletAddress!, GRANT_AMOUNT).catch((err) =>
      console.error("[grant/claim] claimGrant error", err)
    );
  });

  res.status(202).json({ status: "pending", amount: GRANT_AMOUNT.toString() });
});

// GET /api/grant/status
grantRouter.get("/status", requireAuth, async (req, res) => {
  const grant = await prisma.grant.findUnique({ where: { userId: req.user!.id } });
  if (!grant) return res.json({ status: null });
  res.json({
    status: grant.status,
    txHash: grant.txHash,
    amount: grant.amount.toString(),
    blockNum: grant.blockNum,
  });
});
