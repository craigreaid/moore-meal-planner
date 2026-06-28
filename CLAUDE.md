# CLAUDE.md — editing guide for this project

This is guidance for making changes to the Moore Family Meal & Grocery Planner with Claude Code.

## The big picture

- **Frontend is `index.html`** — one self-contained page: HTML markup, a `<style>` block, and a `<script>` block of vanilla JavaScript (no framework, no build step). Keep the frontend a single file unless there's a strong reason not to.
- **Backend is `server.js`** (Node + Express + `ws`) with `lib/store.js` for storage. It serves `index.html`, handles a single shared family login, holds one shared household record, and pushes live updates to every device over a WebSocket. Dependencies: `express`, `ws` only.
- **Storage** (`lib/store.js`): the Replit Database in production (auto-detected via `REPLIT_DB_URL`), or a local `.data/household.json` file in development. Same `getHousehold()` / `saveHousehold()` API either way.
- **Run/test locally:** `npm install` then `npm start` → http://localhost:3000. Dev login password defaults to `moorefamily` (override with the `FAMILY_PASSWORD` env var). Check the browser console for errors, then verify: login gate works, the menu renders, the grocery list builds, quantities scale, and the sync pill shows "Synced".
- **Deploy:** Replit **Reserved VM** (always-on, for the WebSocket). See `DEPLOY-SYNC.md`. Secrets: `FAMILY_PASSWORD`, `SESSION_SECRET`.

## Sync & login (how the shared state flows)

- The whole shared record is `{selections, thistleNights, householdSel, storePrefs, customItems, customMeals, customQty, barcodeMap, sides}` (plus server-managed `rev`/`updatedAt`). `collectDoc()` bundles it; `assignDoc(o)` loads it into the module vars (and re-registers `HH_DEFAULT` + `QTY`).
- **`save()`** writes the localStorage cache, marks `dirty`, and `flush()`es to the server over the WebSocket (unless offline or `awaitingAck` — then it flushes later). All existing call sites keep working unchanged.
- **`applyDoc(doc)`** applies an authoritative copy received from the server and re-renders. Incoming `state` messages are ignored while `awaitingAck` (so a change you just sent isn't clobbered by an older broadcast).
- **`load()`** still loads the localStorage cache for an instant first paint; the server's `state` message then replaces it once connected.
- **Auth:** `initSync()` calls `/api/me`; if signed in → `startApp()` (connect WS), else `showLogin()`. If there's no server at all (e.g. file opened directly), it falls back to local-only mode. Login posts to `/api/login`; the server sets a signed httpOnly session cookie. The password is checked server-side against the `FAMILY_PASSWORD` secret — never shipped to the client.
- **Server (`server.js`):** on each `update` it bumps `rev`, persists, broadcasts `state` to *other* clients, and `ack`s the sender. Last-write-wins; fine for a small household.

## Barcode scanning

- **Button:** "📷 Scan" in the household add-row → `openScanner()`.
- **Camera:** prefers the native `BarcodeDetector` (Android/desktop Chrome); on iPhone Safari it lazy-loads the **vendored** ZXing library from `/vendor/zxing-browser.min.js` (served by `server.js` from `public/vendor/`, copied from the `@zxing/browser` package — not a CDN). If the camera is unavailable/denied, `manualFallback()` lets the user type the item name.
- **Lookup:** `GET /api/lookup?code=<barcode>` (auth-gated) calls **Open Food Facts** server-side and returns `{found, name}`. Food-focused; non-food/unknown items fall back to manual naming.
- **Adding:** scanned items go through `addItemToList(name, store)` — the same path as the manual add-row — so they become checked custom items that flow into the grocery list and sync. `addCustom()` is now a thin wrapper over it.
- **Memory:** `barcodeMap` (synced state: barcode → `{n,s}`) auto-fills name+store on re-scan for the whole family. It's in `collectDoc`/`assignDoc` and the server's `defaultDoc`.
- **Note:** camera scanning needs a secure context (HTTPS or localhost) — fine on the Replit deploy. The vendored library is committed (`node_modules` is gitignored), so don't delete `public/vendor/`.

## Data structures (all near the top of the `<script>`)

- `STORES` — object of store name → `{color, role}`. The four stores: Smiths, Whole Foods, Walmart, Amazon.
- `STORE_ORDER` — array controlling the order stores appear in the grocery list and dropdowns.
- `DAYS` — array of 7 day objects: `{day, meals:[...]}` (no cuisine theme/category — options can be diverse per day). Each meal is `{name, gf, note?, desc, ing:[[item, store], ...]}`.
  - `gf` is `"native"` (GF as written) or `"adapt"` (needs a swap — `note` must explain it).
  - Each ingredient is `[itemName, defaultStore]`; `defaultStore` **must** be a key in `STORES`.
- `RECIPES` — map of `mealName → [step, step, ...]` (cooking instructions). Keyed by the exact meal `name`; built-in meals look up here. **Add a `RECIPES` entry whenever you add a built-in meal** (custom meals carry their own `steps` instead — see below).
- `QTY` — map of `itemName → [amount, unit, staple]`, calibrated for a full dinner for 4.
  - `staple: 0` = perishable/protein/produce → amount is multiplied by a serving factor and summed across meals.
  - `staple: 1` = pantry item (oil, spices, sauces) → bought once regardless of how many meals use it.
  - **Every meal ingredient must have a QTY entry.**
- `ADULTS`, `KIDS`, `FULL` — household sizes. A Thistle night cooks for `KIDS` instead of `FULL` (serving factor = serves/FULL).
- `HOUSEHOLD` — array of `{cat, items:[{n:name, s:defaultStore}]}` for household goods + food staples checklist.
- `HH_DEFAULT` — derived map of household/staple item → default store (custom items get registered here too).

## State (persisted to localStorage key `mooreMenu`)

- `selections` — day index → chosen meal index.
- `thistleNights` — day index → true when adults eat Thistle that night.
- `householdSel` — household/staple item name → true (checked this week).
- `storePrefs` — item name → preferred store. This is the "learning": a dropdown change writes here and overrides defaults everywhere.
- `customItems` — user-added household items `[{n, s}]`.
- `customMeals` — day index → array of user-added dinners `[{name, gf, note?, desc, ing, steps, custom:true}]`. Merged into a day's options by `mealsFor(di)`, which returns `DAYS[di].meals.concat(customMeals[di]||[])`. **Selections index into this combined list**, so always use `mealsFor(di)` (not `DAYS[di].meals`) when resolving a selected meal.
- `sides` — day index → array of side dishes `[{name, ing:[[item,store]], steps}]`. Independent of the radio-selected dinner (a day can have any number of sides). Side ingredients flow into the grocery list scaled to that day's servings (Thistle-aware). Added via `openAddSide(di)`/`saveSide()`, viewed via `openSideRecipe(di,si)` (which calls the shared `showRecipe(m, opts)`), removed via `deleteSide(di,si)`.
- `customQty` — ingredient name → `[amount, unit, 0]` for ingredients introduced by custom meals. Merged into `QTY` (via `Object.assign(QTY, customQty)`) on load and on save so the grocery list can show quantities. Built-in `QTY` entries are never overwritten.
- `save()` / `load()` handle persistence (all of the above live under the `mooreMenu` key); `resetWeek()` clears weekly choices but **keeps** `storePrefs`, `customMeals`, and `customQty` (they're part of the "database", not the week); `resetPrefs()` clears learned stores.

## Recipes & custom dinners

- **Viewing a recipe:** every meal renders a "📖 View recipe" button (`button.link[data-recipe]`) that calls `openRecipe(di, mi)`. The handler uses `e.stopPropagation()` so clicking it does **not** also select the meal. Steps come from `m.steps` (custom) or `RECIPES[m.name]` (built-in).
- **Adding a dinner:** the "➕ Add dinner" toolbar button opens `#addMealModal` via `openAddMeal()`. `saveMeal()` reads the form, builds a meal object (with `custom:true`), pushes it to `customMeals[di]`, and registers any new ingredient quantities into `customQty`/`QTY`.
- **Deleting a custom dinner:** `deleteCustomMeal(di, mi)` (button shown inside the recipe modal for custom meals) splices it from `customMeals[di]` and **fixes up `selections[di]`** (clears it if it pointed at the deleted meal, decrements it if it pointed later). Built-in meals can't be deleted.
- **Modals:** generic `openModal(id)` / `closeModal(id)` toggle the `.show` class and lock body scroll; Escape closes both. The recipe viewer (`#recipeModal`) and add-meal form (`#addMealModal`) are plain overlay `<div>`s near the end of the markup.

## Common changes (recipes)

- **Add/edit a built-in meal:** edit the relevant day's `meals` array in `DAYS`. Ensure each ingredient's store is a valid `STORES` key, add a `QTY` entry for any new ingredient, and add a `RECIPES["<exact meal name>"]` entry with the cooking steps. Keep it gluten-free or set `gf:"adapt"` with a `note`. (End users can add their own dinners from the UI — that path writes to `customMeals`/`customQty`, not `DAYS`/`RECIPES`.)
- **Add a store:** add it to `STORES` (with a `--color` CSS variable), add it to `STORE_ORDER`, and add a legend `<span>` in the markup.
- **Add a household/staple item:** add to the appropriate `HOUSEHOLD` category with a valid default store.
- **Change family size / portions:** edit `ADULTS` and `KIDS`.

## Conventions & gotchas

- Gluten-free is a hard requirement (one parent is GF) — never introduce a meal that can't be made GF.
- Store keys are strings and must match exactly across `STORES`, `STORE_ORDER`, meal `ing`, and `HOUSEHOLD` defaults.
- The grocery list shows a quantity for items used in meals; checked staples with no meal use show a "staple" tag instead.
- Data syncs through the server, with localStorage as a per-device cache. When you add a new piece of saved state, add it to **both** `collectDoc()` and `assignDoc()` (and to `defaultDoc()` in `server.js`) so it syncs and persists — not just to localStorage.
- After any data edit, sanity-check that every meal ingredient resolves to a valid store and has a QTY entry.

## Roadmap context

Done: static single-file app → backend + shared family login + live cross-device sync (current). Next milestones (not built yet): an Instacart integration to turn the grocery list into a real cart, and optionally per-person accounts within the household.
