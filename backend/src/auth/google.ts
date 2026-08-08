import { Router } from "express";
import { Issuer, generators, Client } from "openid-client";
import { prisma } from "../db/client.js";
import { signSession } from "./session.js";
import { cfg } from "../config.js";

export const googleRouter = Router();

// oidcState を req に一時保存するための簡易メモリストア（本番はRedis推奨）
const stateStore = new Map<string, { nonce: string; codeVerifier: string; expiresAt: number }>();

let oidcClient: Client | null = null;

async function getClient(): Promise<Client> {
  if (oidcClient) return oidcClient;
  const issuer = await Issuer.discover("https://accounts.google.com");
  oidcClient = new issuer.Client({
    client_id: cfg.GOOGLE_CLIENT_ID,
    client_secret: cfg.GOOGLE_CLIENT_SECRET,
    redirect_uris: [cfg.GOOGLE_CALLBACK_URL],
    response_types: ["code"],
  });
  return oidcClient;
}

// GET /auth/google
googleRouter.get("/google", async (_req, res) => {
  try {
    const client = await getClient();
    const state = generators.state();
    const nonce = generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    stateStore.set(state, {
      nonce,
      codeVerifier,
      expiresAt: Date.now() + 15 * 60_000,
    });

    const url = client.authorizationUrl({
      scope: "openid email profile",
      state,
      nonce,
      hd: cfg.SCHOOL_DOMAIN,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(url);
  } catch (err) {
    console.error("[auth/google]", err);
    res.redirect(`${cfg.FRONTEND_URL}?auth_error=1`);
  }
});

// GET /auth/google/callback
googleRouter.get("/google/callback", async (req, res) => {
  try {
    const client = await getClient();
    const params = client.callbackParams(req);
    const { state } = params;

    if (!state) return res.status(400).json({ error: "stateがありません" });

    const stored = stateStore.get(state);
    stateStore.delete(state); // 使い捨て

    if (!stored || Date.now() > stored.expiresAt) {
      return res.status(400).json({ error: "セッションが無効または期限切れです" });
    }

    const tokenSet = await client.callback(cfg.GOOGLE_CALLBACK_URL, params, {
      state,
      nonce: stored.nonce,
      code_verifier: stored.codeVerifier,
    });

    const claims = tokenSet.claims();
    const email = claims.email as string | undefined;

    if (!email?.endsWith(`@${cfg.SCHOOL_DOMAIN}`)) {
      return res.redirect(`${cfg.FRONTEND_URL}?auth_error=domain`);
    }

    const user = await prisma.user.upsert({
      where: { provider_subject: { provider: "google", subject: claims.sub } },
      update: { email },
      create: { provider: "google", subject: claims.sub, email },
    });

    if (user.bannedAt) {
      return res.redirect(`${cfg.FRONTEND_URL}?auth_error=banned`);
    }

    const token = await signSession({ userId: user.id });
    res.cookie("session", token, {
      httpOnly: true,
      secure: cfg.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(cfg.FRONTEND_URL);
  } catch (err) {
    console.error("[auth/google/callback]", err);
    res.redirect(`${cfg.FRONTEND_URL}?auth_error=1`);
  }
});
