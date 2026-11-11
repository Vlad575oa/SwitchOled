import crypto from "crypto";

const ITERATIONS = 10000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
    .toString("hex");
  return { hash, salt };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const checkHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST)
    .toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(checkHash, "hex"),
    Buffer.from(hash, "hex")
  );
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// The cookie holds the raw token; the DB stores only its HMAC, so a leaked
// Session table cannot be replayed as cookies without NEXTAUTH_SECRET.
export function hashSessionToken(token: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required");
  }
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

// Session ids to look up for a cookie token. The raw token is a transitional
// fallback for sessions created before hashing (deployed 2026-11-11);
// they expire within 30 days, so drop the fallback after 2026-12-12.
export function sessionIdsForToken(token: string): string[] {
  const ids = [token];
  if (process.env.NEXTAUTH_SECRET) {
    ids.unshift(hashSessionToken(token));
  }
  return ids;
}

export function getSessionExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}

export const SESSION_COOKIE = "user_session";
