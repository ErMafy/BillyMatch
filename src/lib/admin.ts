import { cookies } from "next/headers";
import { createHmac } from "crypto";

const COOKIE_NAME = "billy_admin";

function getSecret(): string {
  return process.env.BILLY_COOKIE_SECRET || process.env.BILLY_ADMIN_PIN || "default-secret-change-me";
}

function signValue(value: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

function verifySignedValue(signed: string): boolean {
  const parts = signed.split(".");
  if (parts.length !== 2) return false;
  const [value, sig] = parts;
  const hmac = createHmac("sha256", getSecret());
  hmac.update(value);
  return hmac.digest("hex") === sig;
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return false;
  return verifySignedValue(cookie.value);
}

export function createAdminCookie(): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: COOKIE_NAME,
    value: signValue("1"),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
    },
  };
}

export function verifyPin(pin: string): boolean {
  const adminPin = process.env.BILLY_ADMIN_PIN;
  if (!adminPin) return false;
  return pin === adminPin;
}
