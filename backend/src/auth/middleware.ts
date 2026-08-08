import { Request, Response, NextFunction } from "express";
import { verifySession } from "./session.js";
import { prisma } from "../db/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; walletAddress: string | null };
      oidcState?: { state: string; nonce: string; codeVerifier: string; expiresAt: number };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  if (!token) return res.status(401).json({ error: "認証が必要です" });

  try {
    const { userId } = await verifySession(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.bannedAt) {
      return res.status(401).json({ error: "無効なセッションです" });
    }
    req.user = { id: user.id, email: user.email, walletAddress: user.walletAddress };
    next();
  } catch {
    return res.status(401).json({ error: "セッションが無効または期限切れです" });
  }
}
