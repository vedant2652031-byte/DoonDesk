// DoonDesk shared AI connection (Vercel Function).
// The website sends a question here; this adds the Gemini key on the server and
// streams Google's answer back. The key lives only in Vercel's settings as an
// Environment Variable called GEMINI_KEY: never in this file, the website or GitHub.
// Setup steps: see AI-SETUP.md.

const ALLOWED_ORIGINS = [
  'https://doondesk.vercel.app',
  'https://vedant2652031-byte.github.io',
];
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemma-4-31b-it', 'gemma-4-26b-a4b-it'];
const MAX_BODY = 120000;        // characters; stops oversized requests
const MAX_OUTPUT_TOKENS = 2048;
// Light per-visitor brake (per server instance): at most 60 AI questions per IP every 10 minutes (high, because a whole venue can share one Wi-Fi address).
const WINDOW_MS = 10 * 60 * 1000, PER_WINDOW = 60;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= PER_WINDOW) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

export default {
  async fetch(request) {
    const origin = request.headers.get('origin') || '';
    const okOrigin = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const json = (status, obj) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    const fail = (status, message) => json(status, { error: { code: status, message } });
    const key = process.env.GEMINI_KEY;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    // The website asks this first to see whether the shared connection is set up.
    if (request.method === 'GET') return json(200, { ready: !!key });
    if (request.method !== 'POST') return fail(405, 'Use POST');
    if (!okOrigin) return fail(403, 'This connection only works from the DoonDesk website');
    if (!key) return fail(501, 'The GEMINI_KEY environment variable has not been added in Vercel yet');

    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    if (tooMany(ip)) return json(429, { error: { code: 429, message: 'Too many questions from this device. Please wait a few minutes.', details: [{ retryDelay: '120s' }] } });

    const raw = await request.text();
    if (raw.length > MAX_BODY) return fail(413, 'Request too large');
    let body;
    try { body = JSON.parse(raw); } catch { return fail(400, 'Bad request'); }

    const model = MODELS.includes(body.model) ? body.model : MODELS[0];
    const payload = {
      systemInstruction: body.systemInstruction,
      contents: Array.isArray(body.contents) ? body.contents.slice(-12) : [],
      generationConfig: {
        temperature: Math.min(1, Math.max(0, Number(body.generationConfig?.temperature ?? 0.4))),
        maxOutputTokens: Math.min(MAX_OUTPUT_TOKENS, Number(body.generationConfig?.maxOutputTokens ?? MAX_OUTPUT_TOKENS)),
      },
    };

    let upstream;
    try {
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(payload) }
      );
    } catch {
      return fail(503, 'Could not reach Gemini');
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream', 'Cache-Control': 'no-store' },
    });
  },
};
