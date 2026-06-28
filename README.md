# Moore Family Meal & Grocery Planner

A repeatable weekly dinner planner with a consolidated, store-by-store grocery list. The app is a single self-contained web page (`index.html`) backed by a small Node server that provides a **shared family login** and **live sync** — changes made on one phone or computer show up on everyone's devices within about a second.

## What it does

- **Themed weekly menu** — 7 days, each with a cuisine theme (Tacos, Thai, etc.) and 5 dinner options to choose from.
- **Recipes built in** — every meal has a "📖 View recipe" link showing GF notes, the ingredient list with quantities, and step-by-step cooking instructions.
- **Add your own dinners** — the "➕ Add dinner" button lets you create a new meal (name, description, GF status, ingredients with stores/quantities, and cooking steps). Custom dinners appear as selectable options on their day, flow into the grocery list, and are saved on the device.
- **Gluten-free aware** — every meal is GF as written or flagged "GF swap" with the exact substitution (a household requirement).
- **Consolidated grocery list** — pick one dinner per day and the app builds a deduplicated shopping list grouped by store.
- **Family-of-4 quantities** that scale per meal; pantry staples are treated as buy-once.
- **Thistle integration** — mark nights the adults eat Thistle; that dinner's quantities drop to kids-only portions.
- **Household goods & staples** — a checklist (paper, cleaning, dairy, pantry, etc.) that flows into the grocery list.
- **Add-your-own items** and **per-item store dropdowns** that the app remembers (learned preferences).
- **Barcode scanning** — tap "📷 Scan", point the camera at a product barcode, and it's added to this week's list. Product names come from Open Food Facts (free); anything not found (or any non-food item) you just name yourself. Scanned barcodes are remembered (and shared) so re-scanning auto-fills instantly.
- **Stores:** Smiths, Whole Foods, Walmart, Amazon.
- **Shared family login + live sync** — one shared password; everyone sees and edits the same menu, updating in real time across phones and computers. A sync indicator shows Synced / Offline.

## Run it locally

Requires Node 18+ (no Python needed).

```
npm install
npm start            # serves on http://localhost:3000
```

Open `http://localhost:3000` and sign in. With no `FAMILY_PASSWORD` set, the dev default password is **`moorefamily`**. Locally the shared record is stored in `.data/household.json` (gitignored); on Replit it's stored in the Replit Database automatically.

## Deploy on Replit (Reserved VM)

Live sync needs an always-on server, so deploy as a **Reserved VM** (not Static). Full step-by-step is in [`DEPLOY-SYNC.md`](DEPLOY-SYNC.md). Short version:

1. Push to GitHub, then in Replit **Import from GitHub**.
2. Add two **Secrets**: `FAMILY_PASSWORD` (the family's shared password) and `SESSION_SECRET` (any long random string).
3. **Run** to preview, then **Deploy → Reserved VM** with run command `npm start`.
4. Open the deployed URL on phones, sign in once, and **Add to Home Screen**.

## Project structure

```
index.html         # the app: HTML + CSS + JavaScript (vanilla), incl. login, sync & scanner
server.js          # Node/Express server: shared login, shared record, live sync, barcode lookup
lib/store.js       # storage layer: Replit DB in production, local JSON file in dev
public/vendor/     # vendored ZXing barcode library (served at /vendor for the iPhone fallback)
package.json       # dependencies (express, ws)
README.md          # this file
CLAUDE.md          # guide for editing with Claude Code
DEPLOY-SYNC.md     # Replit Reserved VM deployment + Secrets walkthrough
PUBLISH-GUIDE.md   # older single-file phone/hosting notes (pre-sync)
.replit            # Replit run/deploy config
.gitignore
```

## Data & how sync works

- The shared family record (selections, Thistle nights, household checks, learned stores, custom dinners) lives **on the server** — one record for the whole household.
- Each device also keeps a **localStorage cache** (key: `mooreMenu`) so the app loads instantly and keeps working offline; edits made offline are pushed when the connection returns.
- Live updates travel over a **WebSocket**. Simultaneous edits are last-write-wins (rare for a small household).
- No real ordering yet (see roadmap).

## Roadmap

1. ✅ Single-file planner (static).
2. ✅ Backend + database so selections sync across devices, plus a shared family login.
3. ⬜ Instacart integration so the finished grocery list becomes a real cart.
4. ⬜ (Optional) Per-person accounts within the household.
