# CLAUDE.md — editing guide for this project

This is guidance for making changes to the Moore Family Meal & Grocery Planner with Claude Code.

## The big picture

- **Everything is in `index.html`.** One self-contained file: HTML markup, a `<style>` block, and a `<script>` block of vanilla JavaScript. No frameworks, no build step, no npm, no dependencies.
- Keep it that way unless explicitly asked. The single-file design is what makes hosting and deployment trivial.
- Test by opening `index.html` in a browser (or `python3 -m http.server`). Check the browser console for errors, then verify the menu renders, the grocery list builds, and quantities scale.

## Data structures (all near the top of the `<script>`)

- `STORES` — object of store name → `{color, role}`. The four stores: Smiths, Whole Foods, Walmart, Amazon.
- `STORE_ORDER` — array controlling the order stores appear in the grocery list and dropdowns.
- `DAYS` — array of 7 day objects: `{day, theme, meals:[...]}`. Each meal is `{name, gf, note?, desc, ing:[[item, store], ...]}`.
  - `gf` is `"native"` (GF as written) or `"adapt"` (needs a swap — `note` must explain it).
  - Each ingredient is `[itemName, defaultStore]`; `defaultStore` **must** be a key in `STORES`.
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
- `customItems` — user-added items `[{n, s}]`.
- `save()` / `load()` handle persistence; `resetWeek()` clears weekly choices but **keeps** `storePrefs`; `resetPrefs()` clears learned stores.

## Common changes (recipes)

- **Add/edit a meal:** edit the relevant day's `meals` array in `DAYS`. Ensure each ingredient's store is a valid `STORES` key, and add a `QTY` entry for any new ingredient. Keep it gluten-free or set `gf:"adapt"` with a `note`.
- **Add a store:** add it to `STORES` (with a `--color` CSS variable), add it to `STORE_ORDER`, and add a legend `<span>` in the markup.
- **Add a household/staple item:** add to the appropriate `HOUSEHOLD` category with a valid default store.
- **Change family size / portions:** edit `ADULTS` and `KIDS`.

## Conventions & gotchas

- Gluten-free is a hard requirement (one parent is GF) — never introduce a meal that can't be made GF.
- Store keys are strings and must match exactly across `STORES`, `STORE_ORDER`, meal `ing`, and `HOUSEHOLD` defaults.
- The grocery list shows a quantity for items used in meals; checked staples with no meal use show a "staple" tag instead.
- Data is browser-local only — there is no backend yet. Don't add code that assumes a server unless building the sync milestone.
- After any data edit, sanity-check that every meal ingredient resolves to a valid store and has a QTY entry.

## Roadmap context

Current = static single-file app. Next milestones (not built yet): a backend + database for cross-device sync and a family login, then an Instacart integration to turn the grocery list into a real cart.
