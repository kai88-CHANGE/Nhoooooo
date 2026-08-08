import express from "express";
import cookieParser from "cookie-parser";
import { googleRouter } from "./auth/google.js";
import { authApiRouter } from "./api/auth.js";
import { walletRouter } from "./api/wallet.js";
import { grantRouter } from "./api/grant.js";
import { purchaseRouter } from "./api/purchase.js";
import { cfg } from "./config.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS（開発時のみ緩める）
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", cfg.FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ルート
app.use("/auth", googleRouter);
app.use("/api/auth", authApiRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/grant", grantRouter);
app.use("/api/purchase", purchaseRouter);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.listen(cfg.PORT, () => {
  console.log(`[server] listening on :${cfg.PORT}`);
});

export default app;
