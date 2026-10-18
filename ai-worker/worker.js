// DoonDesk AI connector — a Cloudflare Worker that keeps the Gemini API key secret.
// The website sends questions here; this adds the key and passes them to Google.
// Setup steps are in AI-SETUP.md. The key is stored as a Cloudflare secret called GEMINI_KEY,
// never in this file and never on the website.

const ALLOWED_ORIGINS = [
  'https://vedant2652031-byte.github.io',
];
const MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const MAX_BODY = 120000;       // characters; stops oversized requests
const MAX_OUTPUT_TOKENS = 4096;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const okOrigin = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const fail = (status, message) =>
      new Response(JSON.stringify({ error: { code: status, message } }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return fail(405, 'Use POST');
    if (!okOrigin) return fail(403, 'This connector only works from the DoonDesk website');
    if (!env.GEMINI_KEY) return fail(500, 'The GEMINI_KEY secret has not been added to this Worker yet');

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

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY }, body: JSON.stringify(payload) }
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': upstream.headers.get('Content-Type') || 'text/event-stream', 'Cache-Control': 'no-store' },
    });
  },
};
