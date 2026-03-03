import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");
export const AUTH_COOKIE_NAME = "hopeana_token";

export interface TokenPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export async function signToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as unknown as Record<string, unknown>;
    return {
      userId: p.userId as string,
      email: p.email as string,
      // Backward compat: old tokens won't have tokenVersion — treat as 0
      tokenVersion: typeof p.tokenVersion === "number" ? p.tokenVersion : 0,
    };
  } catch {
    return null;
  }
}

/** Cookie options used consistently when setting / clearing the auth cookie */
export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}
