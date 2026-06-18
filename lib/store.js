/* Storage abstraction for the shared household record.
   - On Replit: uses the built-in Replit Database (REPLIT_DB_URL is provided automatically).
   - Locally: falls back to a JSON file under .data/ so the server runs without Replit.
   Either way the rest of the app just calls getHousehold() / saveHousehold(). */
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.REPLIT_DB_URL;            // present only inside Replit
const KEY = 'household:moore';
const LOCAL_FILE = path.join(__dirname, '..', '.data', 'household.json');

async function getRaw(key) {
  if (DB_URL) {
    const res = await fetch(`${DB_URL}/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    const text = await res.text();
    return text === '' ? null : text;
  }
  try {
    const all = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
    return key in all ? all[key] : null;
  } catch (e) {
    return null;
  }
}

async function setRaw(key, value) {
  if (DB_URL) {
    await fetch(DB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    });
    return;
  }
  let all = {};
  try { all = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')); } catch (e) {}
  all[key] = value;
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2));
}

module.exports = {
  usingReplitDB: !!DB_URL,
  async getHousehold() {
    const raw = await getRaw(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },
  async saveHousehold(doc) {
    await setRaw(KEY, JSON.stringify(doc));
  }
};
