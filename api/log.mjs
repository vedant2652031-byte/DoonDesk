// DoonDesk question log (Vercel Function).
// Saves each question, DoonDesk's answer and, when it didn't know, its closest guess,
// so the answers can be fixed later. Nothing that identifies the visitor is stored:
// no IP address, account or device ID.
//
// Storage: a free Upstash Redis database added from Vercel → Storage (it sets
// KV_REST_API_URL and KV_REST_API_TOKEN). Reading the log needs the ADMIN_KEY
// environment variable, sent by the review page (review.html). Setup: AI-SETUP.md.

const ALLOWED_ORIGINS = ['https://doondesk.vercel.app', 'https://vedant2652031-byte.github.io'];
const STATUSES = ['notes', 'ai', 'ai-gap', 'ai-unsure', 'web', 'partial', 'unknown', 'flagged'];
const LOG_KEY = 'doondesk:log', FLAG_KEY = 'doondesk:flags', KEEP = 5000;
const WINDOW_MS = 10 * 60 * 1000, PER_WINDOW = 150;
const hits = new Map();

const env = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
  admin: process.env.ADMIN_KEY || '',
});

async function redis(cmds) {
  const { url, token } = env();
  const r = await fetch(url.replace(/\/$/, '') + '/pipeline', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds), signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error('storage HTTP ' + r.status);
  return r.json();
}

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= PER_WINDOW) return true;
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

const clip = (s, n) => String(s ?? '').replace(/\s+\n/g, '\n').slice(0, n);
function sameKey(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(request) {
    const origin = request.headers.get('origin') || '';
    const okOrigin = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
      'Vary': 'Origin',
    };
    const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    const { url, token, admin } = env();
    const ready = !!(url && token);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (request.method === 'GET') {
      const key = request.headers.get('x-admin-key') || '';
      if (!key) return json(200, { ready, review: !!admin });
      if (!admin) return json(501, { error: 'ADMIN_KEY has not been added in Vercel yet' });
      if (!sameKey(key, admin)) return json(403, { error: 'Wrong review password' });
      if (!ready) return json(501, { error: 'No database connected yet (Vercel → Storage → Upstash Redis)' });
      const [log, flags] = await redis([['LRANGE', LOG_KEY, '0', '-1'], ['LRANGE', FLAG_KEY, '0', '-1']]);
      const parse = a => (a?.result || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      return json(200, { entries: parse(log), flags: parse(flags) });
    }

    if (request.method !== 'POST') return json(405, { error: 'Use POST' });
    if (!okOrigin) return json(403, { error: 'Only the DoonDesk website can write to the log' });
    if (!ready) return json(501, { error: 'No database connected yet' });
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    if (tooMany(ip)) return json(429, { error: 'Too many' });

    const raw = await request.text();
    if (raw.length > 12000) return json(413, { error: 'Too large' });
    let b; try { b = JSON.parse(raw); } catch { return json(400, { error: 'Bad request' }); }

    const id = clip(b.id, 40).replace(/[^a-z0-9]/gi, '');
    if (b.type === 'flag') {
      const rec = { id, t: new Date().toISOString(), q: clip(b.q, 500), said: clip(b.said, 1500), note: clip(b.note, 300) };
      await redis([['RPUSH', FLAG_KEY, JSON.stringify(rec)], ['LTRIM', FLAG_KEY, String(-KEEP), '-1']]);
      return json(200, { ok: true });
    }
    const rec = {
      id, t: new Date().toISOString(),
      q: clip(b.q, 500), said: clip(b.said, 1500),
      status: STATUSES.includes(b.status) ? b.status : 'notes',
      guess: clip(b.guess, 800),
      web: (Array.isArray(b.web) ? b.web : []).slice(0, 5).map(x => clip(x, 160)),
      mode: clip(b.mode, 20), model: clip(b.model, 40),
    };
    if (!rec.q) return json(400, { error: 'No question' });
    await redis([['RPUSH', LOG_KEY, JSON.stringify(rec)], ['LTRIM', LOG_KEY, String(-KEEP), '-1']]);
    return json(200, { ok: true });
  },
};
