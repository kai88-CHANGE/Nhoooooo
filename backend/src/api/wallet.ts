import { Router } from "express";
import { ethers } from "ethers";
import crypto from "node:crypto";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";

export const walletRouter = Router();

// GET /api/wallet/nonce — 署名検証用使い捨てnonceを返す
walletRouter.get("/nonce", requireAuth, async (req, res) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { walletNonce: nonce },
  });
  res.json({ nonce });
});

// POST /api/wallet/connect — 署名を検証してウォレットを紐付け
walletRouter.post("/connect", requireAuth, async (req, res) => {
  const { address, signature } = req.body as { address?: string; signature?: string };

  if (!address || !signature) {
    return res.status(400).json({ error: "address と signature が必要です" });
  }
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "無効なウォレットアドレスです" });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  if (!user.walletNonce) {
    return res.status(400).json({ error: "先に /api/wallet/nonce を呼び出してください" });
  }

  const message = `CampusCoin ウォレット接続\nnonce: ${user.walletNonce}`;
  const recovered = ethers.verifyMessage(message, signature);

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: "署名が一致しません" });
  }

  // 別アカウントとの重複チェック
  const existing = await prisma.user.findUnique({ where: { walletAddress: address } });
  if (existing && existing.id !== user.id) {
    return res.status(409).json({ error: "このウォレットは既に別のアカウントに登録されています" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { walletAddress: address, walletNonce: null }, // nonceを消費
  });

  res.json({ ok: true, walletAddress: address });
});
