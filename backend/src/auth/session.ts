import { SignJWT, jwtVerify } from "jose";
import { cfg } from "../config.js";

const secret = new TextEncoder().encode(cfg.JWT_SECRET);
const ALG = "HS256";

export interface SessionPayload {
  userId: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}
