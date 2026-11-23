/**
 * Preview mode: answers the site's /api/* calls inside the browser so the
 * interactive pages (map, unlocking, journal, checkout flow) work on static
 * hosting such as GitHub Pages.
 *
 * Nothing here is real: no emails are sent, no payments are taken, and demo
 * accounts live only in this browser's localStorage. Never put real
 * customer data or payment logic in this file.
 */
import type { PlanTier, Subscriber } from './types';

const STORE_KEY = 'kokoro_preview_state_v1';

interface PreviewState {
  sessionEmail: string | null;
  subscribers: Record<string, Subscriber>;
  unlocked: Record<string, string[]>;
}

function loadState(): PreviewState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PreviewState;
      if (parsed && parsed.subscribers && parsed.unlocked) return parsed;
    }
  } catch {
    // storage unavailable or corrupted: start fresh
  }
  return { sessionEmail: null, subscribers: {}, unlocked: {} };
}

let state: PreviewState = loadState();

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: the demo still works for this page view
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normEmail(email: unknown): string {
  return String(email ?? '').toLowerCase().trim();
}

function unlock(email: string, regionId: string) {
  const list = state.unlocked[email] ?? [];
  if (!list.includes(regionId)) list.push(regionId);
  state.unlocked[email] = list;
}

function upsertSubscriber(email: string, patch: Partial<Subscriber>): Subscriber {
  const base: Subscriber = {
    email,
    shipping_address: '',
    subscription_status: 'Inactive',
    plan_tier: 'Standard (India)' as PlanTier,
    destination: 'India',
    cancellation_reason: '',
    createdAt: new Date().toISOString(),
    payment_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const sub: Subscriber = Object.assign(base, state.subscribers[email], patch);
  state.subscribers[email] = sub;
  return sub;
}

function currentSession() {
  const email = state.sessionEmail;
  if (!email) return null;
  return {
    email,
    subscriber: state.subscribers[email] ?? null,
    unlocked_regions: [...(state.unlocked[email] ?? [])],
  };
}

function readBody(init?: RequestInit): Record<string, any> {
  try {
    if (init && typeof init.body === 'string') return JSON.parse(init.body);
  } catch {
    // ignore malformed body
  }
  return {};
}

async function handle(method: string, path: string, query: URLSearchParams, body: Record<string, any>): Promise<Response> {
  const route = `${method} ${path}`;

  switch (route) {
    case 'GET /api/session': {
      const s = currentSession();
      return json(s ? { authenticated: true, ...s } : { authenticated: false });
    }

    case 'GET /api/regions/check-access': {
      const s = currentSession();
      const regionId = query.get('region_id');
      if (!s) return json({ success: true, unlocked: false });
      if (!regionId) return json({ success: false, error: 'Missing or invalid region_id' }, 400);
      return json({ success: true, unlocked: s.unlocked_regions.includes(regionId) });
    }

    case 'POST /api/auth/request-link': {
      const email = normEmail(body.email);
      if (!email.includes('@')) return json({ success: false, error: 'Invalid email address' }, 400);
      const base = `${window.location.origin}${window.location.pathname}`;
      return json({
        success: true,
        message: 'Preview mode: no email is sent. Use the link below to enter the demo.',
        link: `${base}?preview_login=${encodeURIComponent(email)}`,
      });
    }

    case 'POST /api/auth/logout': {
      state.sessionEmail = null;
      saveState();
      return json({ success: true });
    }

    case 'POST /api/checkout/direct': {
      const email = normEmail(body.email);
      const address = String(body.shipping_address ?? '').trim();
      if (!email.includes('@')) return json({ success: false, error: 'Please provide a valid email address.' }, 400);
      if (address.length < 5) return json({ success: false, error: 'Please provide a complete shipping address.' }, 400);
      const sub = upsertSubscriber(email, {
        subscription_status: 'Active',
        shipping_address: address,
        plan_tier: (body.plan_tier as PlanTier) || 'India',
      });
      unlock(email, 'hokkaido');
      state.sessionEmail = email;
      saveState();
      return json({ success: true, subscriber: sub });
    }

    case 'POST /api/checkout': {
      const s = currentSession();
      if (!s) return json({ success: false, error: 'Unauthorized. Please log in first.' }, 401);
      const sub = upsertSubscriber(s.email, {
        subscription_status: 'Active',
        shipping_address: String(body.shipping_address ?? '') || 'No address provided',
        plan_tier: (body.plan_tier as PlanTier) || 'India',
      });
      if (body.region_id) unlock(s.email, String(body.region_id));
      saveState();
      return json({ success: true, subscriber: sub });
    }

    case 'POST /api/regions/stamp': {
      const s = currentSession();
      if (!s) return json({ success: false, error: 'Unauthorized. Please log in first.' }, 401);
      if (!body.region_id) return json({ success: false, error: 'Missing region_id' }, 400);
      if (s.subscriber?.subscription_status !== 'Active') {
        return json({ success: false, error: 'Subscription inactive. Please activate first.' }, 403);
      }
      unlock(s.email, String(body.region_id));
      saveState();
      return json({ success: true, unlocked_regions: [...(state.unlocked[s.email] ?? [])] });
    }

    case 'POST /api/subscriber/update-address': {
      const s = currentSession();
      if (!s) return json({ success: false, error: 'Unauthorized' }, 401);
      if (!body.shipping_address) return json({ success: false, error: 'Address is required' }, 400);
      const sub = upsertSubscriber(s.email, { shipping_address: String(body.shipping_address) });
      saveState();
      return json({ success: true, subscriber: sub });
    }

    case 'POST /api/subscriber/change-plan': {
      const s = currentSession();
      if (!s) return json({ success: false, error: 'Unauthorized' }, 401);
      if (!body.plan_tier) return json({ success: false, error: 'Plan tier is required' }, 400);
      const sub = upsertSubscriber(s.email, { plan_tier: String(body.plan_tier) });
      saveState();
      return json({ success: true, subscriber: sub });
    }

    case 'POST /api/subscriber/cancel': {
      const s = currentSession();
      if (!s) return json({ success: false, error: 'Unauthorized' }, 401);
      const sub = upsertSubscriber(s.email, { 
        subscription_status: 'Cancelled',
        cancellation_reason: String(body.reason || 'Cancelled by subscriber')
      });
      saveState();
      return json({ success: true, subscriber: sub });
    }

    case 'POST /api/subscriber/pause': {
      const s = currentSession();
      if (!s) return json({ success: false, error: 'Unauthorized' }, 401);
      const newStatus = s.subscriber?.subscription_status === 'Paused' ? 'Active' : 'Paused';
      const sub = upsertSubscriber(s.email, { subscription_status: newStatus });
      saveState();
      return json({ success: true, subscriber: sub, newStatus });
    }

    // The admin ledger is not part of the public preview: always empty.
    case 'GET /api/admin/subscribers':
      return json({ success: true, subscribers: [] });
    case 'GET /api/debug/webhooks':
      return json({ success: true, webhooks: [] });

    default:
      return json({ success: false, error: 'Not available in preview mode.' }, 404);
  }
}

export function installPreviewApi() {
  // Demo "magic link": ?preview_login=<email> signs that email in locally.
  const params = new URLSearchParams(window.location.search);
  const loginEmail = normEmail(params.get('preview_login'));
  if (loginEmail.includes('@')) {
    upsertSubscriber(loginEmail, {});
    state.sessionEmail = loginEmail;
    saveState();
    window.history.replaceState({}, '', `${window.location.pathname}?login_success=true`);
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    return handle(method, url.pathname, url.searchParams, readBody(init));
  };

  // Honest label so visitors never think a payment or email really happened.
  const badge = document.createElement('div');
  badge.textContent = 'Preview mode: no real payments or emails. Demo data stays in this browser.';
  badge.setAttribute('role', 'note');
  Object.assign(badge.style, {
    position: 'fixed',
    left: '12px',
    bottom: '12px',
    zIndex: '9999',
    maxWidth: '260px',
    padding: '6px 10px',
    borderRadius: '10px',
    background: 'rgba(30, 58, 40, 0.92)',
    color: '#fff',
    font: '11px/1.35 system-ui, sans-serif',
    pointerEvents: 'none',
  });
  document.body.appendChild(badge);
}
