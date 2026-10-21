// DoonDesk live lookup (Vercel Function). No API key needed.
// When DoonDesk's own notes don't cover a question, the website asks this function,
// which searches doonschool.com and Wikipedia and returns short passages with their links.
// Gemini then answers from those passages (and cites them), instead of guessing.

const ALLOWED_ORIGINS = ['https://doondesk.vercel.app', 'https://vedant2652031-byte.github.io'];
const UA = 'DoonDeskBot/1.0 (+https://doondesk.vercel.app; student-built school guide)';
const STOP = new Set(('a an the and or of to in on at for from by with about is are was were be been being who whom whose what which when where why how ' +
  'do does did done can could should would will shall may might must tell me please know there their they them this that these those it its ' +
  'doon school schools dosco doscos chandbagh dehradun india indian mr ms mrs dr sir madam you your my our any some much many more most ' +
  'give list name names find info information detail details history ever first one').split(' '));

const ents = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const textOf = html => ents(String(html || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|li|h\d|div|tr)>/gi, '. ').replace(/<[^>]+>/g, ' '))
  .replace(/\s+/g, ' ').replace(/(\.\s*){2,}/g, '. ').trim();

function terms(q) {
  return [...new Set(q.toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
    .filter(w => w.length >= 3 && !STOP.has(w)))].slice(0, 6);
}

// The sentences of a page that best match the question's words, in page order.
function snippet(text, ts) {
  if (!ts.length) return '';
  const sents = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 25 && s.length < 600);
  const need = Math.max(1, Math.ceil(ts.length * 0.6));
  const scored = sents.map((s, i) => {
    const l = s.toLowerCase();
    return { i, s, n: ts.filter(t => new RegExp('\\b' + t.replace(/[-]/g, '\\-') + '\\w*', 'i').test(l)).length };
  }).filter(x => x.n >= need);
  if (!scored.length) return '';
  const best = scored.sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 3).sort((a, b) => a.i - b.i);
  let out = best.map(x => x.s.trim()).join(' … ');
  if (out.length > 700) out = out.slice(0, 697).replace(/\s\S*$/, '') + '…';
  return out;
}

async function get(url, json = true) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': json ? 'application/json' : 'text/html' }, signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return json ? r.json() : r.text();
}

async function fromSchool(ts) {
  const base = 'https://www.doonschool.com/wp-json/wp/v2/';
  const hits = await get(`${base}search?search=${encodeURIComponent(ts.join(' '))}&per_page=4&_fields=id,title,url,subtype`);
  const out = await Promise.all((Array.isArray(hits) ? hits : []).slice(0, 4).map(async h => {
    try {
      let text = '';
      const kind = h.subtype === 'page' ? 'pages' : h.subtype === 'post' ? 'posts' : null;
      if (kind) { const p = await get(`${base}${kind}/${h.id}?_fields=content`); text = textOf(p?.content?.rendered); }
      if (!text && h.url) text = textOf(await get(h.url, false));
      const s = snippet(text, ts);
      return s ? { site: 'doonschool.com', title: ents(String(h.title || 'doonschool.com')), url: h.url, snippet: s } : null;
    } catch { return null; }
  }));
  return out.filter(Boolean);
}

async function fromWikipedia(ts) {
  const api = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&';
  const s = await get(api + 'action=query&list=search&srlimit=3&srprop=&srsearch=' + encodeURIComponent(ts.join(' ') + ' "Doon School"'));
  const titles = (s?.query?.search || []).map(x => x.title).slice(0, 2);
  const out = await Promise.all(titles.map(async t => {
    try {
      const p = await get(api + 'action=query&prop=extracts&explaintext=1&redirects=1&titles=' + encodeURIComponent(t));
      const text = (p?.query?.pages?.[0]?.extract || '').replace(/\n+/g, ' ');
      if (!/doon school/i.test(text)) return null;
      const sn = snippet(text, ts);
      return sn ? { site: 'Wikipedia', title: 'Wikipedia: ' + t, url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(t.replace(/ /g, '_')), snippet: sn } : null;
    } catch { return null; }
  }));
  return out.filter(Boolean);
}

export default {
  async fetch(request) {
    const origin = request.headers.get('origin') || '';
    const cors = ALLOWED_ORIGINS.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : { 'Vary': 'Origin' };
    const json = (status, obj, cache) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': cache || 'no-store' },
    });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    if (request.method !== 'GET') return json(405, { error: 'Use GET' });

    const q = (new URL(request.url).searchParams.get('q') || '').slice(0, 160);
    const ts = terms(q);
    if (!ts.length) return json(200, { q, terms: ts, results: [] }, 'public, s-maxage=86400');

    const errs = [];
    const [school, wiki] = await Promise.all([fromSchool(ts).catch(e => { errs.push('school: ' + e.message); return []; }), fromWikipedia(ts).catch(e => { errs.push('wiki: ' + e.message); return []; })]);
    if (new URL(request.url).searchParams.get('debug') === '1') return json(200, { q, terms: ts, results: [...school, ...wiki], errs });
    const results = [...school, ...wiki].slice(0, 5);
    // Cached at Vercel's edge for a day, so repeated questions don't search again.
    return json(200, { q, terms: ts, results }, 'public, s-maxage=86400, stale-while-revalidate=604800');
  },
};
