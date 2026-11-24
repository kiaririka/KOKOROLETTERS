import { CfEnv, normalizeEmail } from "./cfTypes";

const DEFAULT_PROJECT_ID = "kokoro-letters";

interface ServiceAccountCreds {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function toBase64UrlStr(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return toBase64UrlStr(binary);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(env: CfEnv): Promise<string | null> {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.token;
  }

  try {
    const creds = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccountCreds;
    if (!creds.client_email || !creds.private_key) return null;

    const now = Math.floor(Date.now() / 1000);
    const header = toBase64UrlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = toBase64UrlStr(
      JSON.stringify({
        iss: creds.client_email,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: creds.token_uri || "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    );

    const signingInput = `${header}.${claim}`;
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(creds.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );
    const assertion = `${signingInput}.${bytesToBase64Url(new Uint8Array(sigBuf))}`;

    const tokenRes = await fetch(creds.token_uri || "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!tokenRes.ok) return null;
    const tokenJson = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
    if (!tokenJson.access_token) return null;

    cachedAccessToken = {
      token: tokenJson.access_token,
      expiresAt: Date.now() + (tokenJson.expires_in ?? 3600) * 1000,
    };
    return cachedAccessToken.token;
  } catch {
    return null;
  }
}

function getBaseUrl(env: CfEnv): string {
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function getAuthHeadersAndQuery(env: CfEnv): Promise<{ headers: Record<string, string>; query: string }> {
  const token = await getGoogleAccessToken(env);
  if (token) {
    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      query: "",
    };
  }
  const apiKey = env.FIREBASE_API_KEY;
  return {
    headers: { "Content-Type": "application/json" },
    query: apiKey ? `?key=${encodeURIComponent(apiKey)}` : "",
  };
}

function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => toFirestoreValue(item)) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(v: any): unknown {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return Boolean(v.booleanValue);
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) {
    const vals = v.arrayValue?.values;
    return Array.isArray(vals) ? vals.map((item: any) => fromFirestoreValue(item)) : [];
  }
  if ("mapValue" in v) {
    const out: Record<string, unknown> = {};
    const fields = v.mapValue?.fields || {};
    for (const [k, fv] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(fv);
    }
    return out;
  }
  return null;
}

function fromFirestoreDoc(doc: any): Record<string, any> | null {
  if (!doc || !doc.name) return null;
  const id = String(doc.name).split("/").pop() || "";
  const out: Record<string, any> = { id };
  const fields = doc.fields || {};
  for (const [k, fv] of Object.entries(fields)) {
    out[k] = fromFirestoreValue(fv);
  }
  return out;
}

export interface FirestoreOrder {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  email: string;
  recipientName: string;
  shipping_address: string;
  plan_tier: string;
  destination: "India" | "International";
  gateway: string;
  status: string;
  items: any[];
  totalFormatted: string;
  currency: string;
  cancellation_reason?: string;
  payment_deadline?: string;
  unlocked_regions?: string[];
  createdDate: string;
}

export async function getOrdersByEmail(env: CfEnv, email: string): Promise<FirestoreOrder[]> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return [];

  const baseUrl = getBaseUrl(env);
  const { headers, query } = await getAuthHeadersAndQuery(env);

  const res = await fetch(`${baseUrl}:runQuery${query}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "orders" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "email" },
            op: "EQUAL",
            value: { stringValue: cleanEmail },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore query failed (${res.status}): ${errText}`);
  }

  const rows = (await res.json()) as Array<{ document?: any }>;
  const orders: FirestoreOrder[] = [];

  for (const row of rows) {
    if (!row.document) continue;
    const raw = fromFirestoreDoc(row.document);
    if (!raw) continue;
    orders.push({
      id: raw.id,
      orderNumber: raw.orderNumber || `KOK-${raw.id.slice(0, 4).toUpperCase()}`,
      trackingNumber: raw.trackingNumber || `TRK-${raw.id.slice(0, 6).toUpperCase()}`,
      email: raw.email || cleanEmail,
      recipientName: raw.recipientName || cleanEmail.split("@")[0],
      shipping_address: raw.shipping_address || "",
      plan_tier: raw.plan_tier || "Standard (India)",
      destination: raw.destination === "International" ? "International" : "India",
      gateway: raw.gateway || "Standard",
      status: raw.status || "Active",
      items: Array.isArray(raw.items) ? raw.items : [],
      totalFormatted: raw.totalFormatted || "",
      currency: raw.currency || "USD",
      cancellation_reason: raw.cancellation_reason || "",
      payment_deadline: raw.payment_deadline || "",
      unlocked_regions: Array.isArray(raw.unlocked_regions) ? raw.unlocked_regions : [],
      createdDate: raw.createdDate || new Date().toISOString(),
    });
  }

  orders.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  return orders;
}

export async function createOrderDoc(
  env: CfEnv,
  orderData: Record<string, unknown>
): Promise<string | null> {
  const baseUrl = getBaseUrl(env);
  const { headers, query } = await getAuthHeadersAndQuery(env);

  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(orderData)) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }

  const res = await fetch(`${baseUrl}/orders${query}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) return null;
  const created = (await res.json()) as { name?: string };
  return created.name ? created.name.split("/").pop() || null : null;
}

export async function patchOrderDoc(
  env: CfEnv,
  docId: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const baseUrl = getBaseUrl(env);
  const { headers, query } = await getAuthHeadersAndQuery(env);

  const fieldNames = Object.keys(updates).filter((k) => updates[k] !== undefined);
  if (fieldNames.length === 0) return true;

  const maskParams = fieldNames
    .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join("&");
  const separator = query ? "&" : "?";

  const fields: Record<string, unknown> = {};
  for (const k of fieldNames) {
    fields[k] = toFirestoreValue(updates[k]);
  }

  const res = await fetch(`${baseUrl}/orders/${encodeURIComponent(docId)}${query}${separator}${maskParams}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

export async function buildSessionProfile(env: CfEnv, email: string) {
  const cleanEmail = normalizeEmail(email);
  const orders = await getOrdersByEmail(env, cleanEmail);

  // Pick the most recent subscription order or latest order overall
  const subOrder =
    orders.find((o) => o.items?.some((i: any) => i.isSubscription)) ||
    orders.find((o) => ["Active", "Renewed", "Paused", "Cancelled"].includes(o.status)) ||
    orders[0] ||
    null;

  const unlockedSet = new Set<string>();
  for (const o of orders) {
    for (const r of o.unlocked_regions || []) {
      unlockedSet.add(r);
    }
  }

  if (subOrder && (subOrder.status === "Active" || subOrder.status === "Renewed")) {
    unlockedSet.add("hokkaido");
  }

  const subscriber = subOrder
    ? {
        email: cleanEmail,
        shipping_address: subOrder.shipping_address || "",
        subscription_status: subOrder.status as any,
        plan_tier: subOrder.plan_tier || "Standard (India)",
        destination: subOrder.destination || "India",
        cancellation_reason: subOrder.cancellation_reason || "",
        payment_deadline: subOrder.payment_deadline || "",
        createdAt: subOrder.createdDate,
      }
    : null;

  return {
    email: cleanEmail,
    subscriber,
    unlocked_regions: Array.from(unlockedSet),
    orders,
  };
}
