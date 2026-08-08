import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { prisma } from "../db/client.js";

export const authApiRouter = Router();

// GET /api/auth/me
authApiRouter.get("/me", requireAuth, async (req, res) => {
  const user = req.user!;
  const grant = await prisma.grant.findUnique({ where: { userId: user.id } });
  res.json({
    id: user.id,
    email: user.email,
    walletAddress: user.walletAddress,
    grant: grant
      ? { status: grant.status, txHash: grant.txHash, amount: grant.amount.toString() }
      : null,
  });
});

// POST /api/auth/logout
authApiRouter.post("/logout", (_req, res) => {
  res.clearCookie("session");
  res.json({ ok: true });
});
