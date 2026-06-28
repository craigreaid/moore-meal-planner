/* Moore Family Meal & Grocery Planner — server
   Serves the app, handles a single shared family login, stores one shared
   household record, and pushes live updates to every connected device. */
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { WebSocketServer } = require('ws');
const store = require('./lib/store');

const PORT = process.env.PORT || 3000;

// Shared family password + cookie-signing secret.
// On Replit set these as Secrets. Locally they fall back to dev defaults.
const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD || 'moorefamily';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
if (!process.env.FAMILY_PASSWORD) console.warn('[warn] FAMILY_PASSWORD not set — using dev default "moorefamily".');
if (!process.env.SESSION_SECRET) console.warn('[warn] SESSION_SECRET not set — using dev default (fine for local only).');

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days — keeps family devices signed in

const app = express();
app.use(express.json({ limit: '512kb' }));

/* ---------- sessions (signed cookie, no DB needed) ---------- */
function sign(value) {
  const mac = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  return `${value}.${mac}`;
}
function verify(signed) {
  if (!signed) return false;
  const i = signed.lastIndexOf('.');
  if (i < 0) return false;
  const value = signed.slice(0, i), mac = signed.slice(i + 1);
  const expect = crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
  const a = Buffer.from(mac), b = Buffer.from(expect);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && value === 'ok';
}
function parseCookies(req) {
  const out = {};
  const c = req.headers.cookie;
  if (!c) return out;
  c.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function isAuthed(req) { return verify(parseCookies(req).session); }

function passwordMatches(input) {
  if (typeof input !== 'string') return false;
  const a = Buffer.from(input), b = Buffer.from(FAMILY_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- auth endpoints ---------- */
app.post('/api/login', (req, res) => {
  if (!passwordMatches((req.body || {}).password)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  res.setHeader('Set-Cookie',
    `session=${encodeURIComponent(sign('ok'))}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`);
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ ok: true });
});
app.get('/api/me', (req, res) => res.json({ authed: isAuthed(req) }));

/* ---------- shared household state ---------- */
function defaultDoc() {
  return {
    selections: {}, thistleNights: {}, householdSel: {},
    storePrefs: {}, customItems: [], customMeals: [], customQty: {}, barcodeMap: {}, sideCatalog: [], daySides: {},
    rev: 0, updatedAt: 0
  };
}
let current = null; // in-memory cache of the latest household doc
async function ensureLoaded() {
  if (!current) current = (await store.getHousehold()) || defaultDoc();
  return current;
}

app.get('/api/state', async (req, res) => {
  if (!isAuthed(req)) return res.status(401).json({ error: 'unauthorized' });
  res.json(await ensureLoaded());
});

/* ---------- barcode -> product name (Open Food Facts) ---------- */
app.get('/api/lookup', async (req, res) => {
  if (!isAuthed(req)) return res.status(401).json({ error: 'unauthorized' });
  const code = String(req.query.code || '').replace(/\D/g, '');
  if (!code) return res.status(400).json({ error: 'no code' });
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_en,brands`;
    const r = await fetch(url, { headers: { 'User-Agent': 'MooreMealPlanner/1.0 (family use)' } });
    const j = await r.json();
    if (j && j.status === 1 && j.product) {
      const p = j.product;
      const name = (p.product_name || p.product_name_en || '').trim();
      const brand = (p.brands || '').split(',')[0].trim();
      // Prepend the brand only when the name doesn't already include it (avoids "Nutella Nutella").
      const label = (brand && !name.toLowerCase().includes(brand.toLowerCase()))
        ? `${brand} ${name}`.trim()
        : (name || brand);
      return res.json({ found: !!label, code, name: label });
    }
    return res.json({ found: false, code, name: '' });
  } catch (e) {
    return res.status(502).json({ error: 'lookup failed', code });
  }
});

// Serve the vendored scanner library (and any future static assets) from /vendor.
app.use('/vendor', express.static(path.join(__dirname, 'public', 'vendor')));

// Serve the single-page app. (We intentionally do NOT static-serve the whole
// folder, so server.js / package.json aren't exposed.)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* ---------- live sync over WebSocket ---------- */
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', async (ws, req) => {
  if (!isAuthed(req)) { ws.close(4001, 'unauthorized'); return; }
  await ensureLoaded();
  ws.send(JSON.stringify({ type: 'state', doc: current }));

  ws.on('message', async (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch (e) { return; }
    if (msg.type !== 'update' || !msg.doc || typeof msg.doc !== 'object') return;

    const doc = msg.doc;
    doc.rev = (current.rev || 0) + 1;
    doc.updatedAt = Date.now();
    current = doc;
    try { await store.saveHousehold(current); } catch (e) { console.error('save failed', e); }

    const out = JSON.stringify({ type: 'state', doc: current });
    wss.clients.forEach(c => { if (c.readyState === 1 && c !== ws) c.send(out); });
    ws.send(JSON.stringify({ type: 'ack', rev: current.rev })); // tell sender the new revision
  });
});

server.listen(PORT, () => {
  console.log(`Meal planner listening on :${PORT} — storage: ${store.usingReplitDB ? 'Replit DB' : 'local file (.data/)'}`);
});
