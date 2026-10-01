import crypto from "node:crypto";

function getKey() {
  const secret = process.env.YANDEX_DIRECT_ENCRYPTION_KEY || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("YANDEX_DIRECT_ENCRYPTION_KEY не настроен");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptYandexSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptYandexSecret(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}
