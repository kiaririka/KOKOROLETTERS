import { CfEnv } from "./cfTypes";

const SESSION_COOKIE_NAME = "kokoro_session";
const MAGIC_TTL_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payloadObj: Record<string, unknown>, secret: string): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));
  const payloadB64 = toBase64Url(payloadBytes);
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

async function verifyPayload<T extends { exp?: number }>(token: string, secret: string): Promise<T | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const key = await importHmacKey(secret);
    const sigBytes = fromBase64Url(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;

    const jsonStr = new TextDecoder().decode(fromBase64Url(payloadB64));
    const parsed = JSON.parse(jsonStr) as T;
    if (typeof parsed.exp === "number" && Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthSecret(env: CfEnv): string | null {
  const secret = env.AUTH_SECRET?.trim();
  return secret && secret.length >= 6 ? secret : null;
}

export async function createMagicLinkToken(email: string, secret: string): Promise<string> {
  return signPayload(
    {
      purpose: "magic_login",
      email: email.trim().toLowerCase(),
      nonce: crypto.randomUUID(),
      exp: Date.now() + MAGIC_TTL_MS,
    },
    secret
  );
}

export async function verifyMagicLinkToken(token: string, secret: string): Promise<string | null> {
  const payload = await verifyPayload<{ purpose?: string; email?: string; exp?: number }>(token, secret);
  if (!payload || payload.purpose !== "magic_login" || !payload.email || !payload.email.includes("@")) {
    return null;
  }
  return payload.email.trim().toLowerCase();
}

export async function createSessionCookieHeader(email: string, secret: string, requestUrl: string): Promise<string> {
  const token = await signPayload(
    {
      purpose: "session",
      email: email.trim().toLowerCase(),
      exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    },
    secret
  );
  const isHttps = new URL(requestUrl).protocol === "https:";
  const secureFlag = isHttps ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secureFlag}`;
}

export function clearSessionCookieHeader(requestUrl: string): string {
  const isHttps = new URL(requestUrl).protocol === "https:";
  const secureFlag = isHttps ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`;
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0) {
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      result[k] = v;
    }
  }
  return result;
}

export async function getSessionEmail(request: Request, env: CfEnv): Promise<string | null> {
  const secret = getAuthSecret(env);
  if (!secret) return null;
  const cookies = parseCookies(request.headers.get("Cookie"));
  const rawToken = cookies[SESSION_COOKIE_NAME];
  if (!rawToken) return null;

  const payload = await verifyPayload<{ purpose?: string; email?: string; exp?: number }>(rawToken, secret);
  if (!payload || payload.purpose !== "session" || !payload.email || !payload.email.includes("@")) {
    return null;
  }
  return payload.email.trim().toLowerCase();
}
