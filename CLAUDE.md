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
- Data is browser-local only — there is no backend yet. Don't add code that assumes a server unless building the sync milestone.
- After any data edit, sanity-check that every meal ingredient resolves to a valid store and has a QTY entry.

## Roadmap context

Current = static single-file app. Next milestones (not built yet): a backend + database for cross-device sync and a family login, then an Instacart integration to turn the grocery list into a real cart.
