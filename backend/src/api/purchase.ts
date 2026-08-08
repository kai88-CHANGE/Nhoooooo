import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";
import { getCampusCoinContract, getProvider } from "../web3/client.js";
import { ethers } from "ethers";

export const purchaseRouter = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

// POST /api/purchase
purchaseRouter.post("/", limiter, requireAuth, async (req, res) => {
  const { productId, txHash } = req.body as { productId?: string; txHash?: string };
  const buyerId = req.user!.id;

  if (!productId || !txHash) {
    return res.status(400).json({ error: "productId と txHash が必要です" });
  }

  const buyer = await prisma.user.findUniqueOrThrow({ where: { id: buyerId } });
  if (!buyer.walletAddress) {
    return res.status(400).json({ error: "ウォレットが接続されていません" });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "商品が見つかりません" });
  if (product.status !== "active") {
    return res.status(409).json({ error: "この商品は購入できません" });
  }
  if (product.sellerId === buyerId) {
    return res.status(400).json({ error: "自分の商品は購入できません" });
  }

  // 残高確認（オンチェーン）
  const token = getCampusCoinContract();
  const balance = await token.balanceOf(buyer.walletAddress);
  if (balance < product.priceWei) {
    return res.status(400).json({ error: "残高が不足しています" });
  }

  // tx検証
  const provider = getProvider();
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    return res.status(400).json({ error: "トランザクションが確認できません" });
  }

  // 商品ステータスをin_transactionに変更（競合防止）
  const updated = await prisma.product.updateMany({
    where: { id: productId, status: "active" },
    data: { status: "in_transaction" },
  });
  if (updated.count === 0) {
    return res.status(409).json({ error: "この商品は既に取引中です" });
  }

  // 購入レコード作成 → 完了
  await prisma.$transaction([
    prisma.purchase.create({
      data: { productId, buyerId, txHash, status: "confirmed" },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { status: "sold" },
    }),
  ]);

  res.json({ ok: true, txHash });
});
