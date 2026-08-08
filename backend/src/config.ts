import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  SCHOOL_DOMAIN: z.string().default("nnn.ed.jp"),
  FRONTEND_URL: z.string().url(),
  RPC_URL: z.string().min(1),
  DISTRIBUTION_WALLET_PRIVATE_KEY: z.string().min(64),
  CAMPUS_COIN_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

// テスト時はバリデーションをスキップできるようにする
export const cfg = schema.parse(process.env);
