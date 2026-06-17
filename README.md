# Moore Family Meal & Grocery Planner

A simple, repeatable weekly dinner planner with a consolidated, store-by-store grocery list. Built as a single, self-contained web page — no build step, no dependencies, works offline once loaded.

## What it does

- **Alliterative weekly menu** — 7 days, each with a theme (Taco Tuesday, Thai Thursday, etc.) and 5 dinner options to choose from.
- **Gluten-free aware** — every meal is GF as written or flagged "GF swap" with the exact substitution (a household requirement).
- **Consolidated grocery list** — pick one dinner per day and the app builds a deduplicated shopping list grouped by store.
- **Family-of-4 quantities** that scale per meal; pantry staples are treated as buy-once.
- **Thistle integration** — mark nights the adults eat Thistle; that dinner's quantities drop to kids-only portions.
- **Household goods & staples** — a checklist (paper, cleaning, dairy, pantry, etc.) that flows into the grocery list.
- **Add-your-own items** and **per-item store dropdowns** that the app remembers (learned preferences).
- **Stores:** Smiths, Whole Foods, Walmart, Amazon.

## Run it locally

It's just one file. Either:

- Double-click `index.html` to open it in a browser, **or**
- Serve the folder: `python3 -m http.server 8080` then visit `http://localhost:8080`.

## Deploy on Replit (static hosting)

1. Push this repo to GitHub.
2. In Replit: **Create Repl → Import from GitHub** → select this repo.
3. Click **Run** to preview (uses the command in `.replit`).
4. To publish a public URL: **Deploy → Static**, set the public directory to `.` (the repo root). Replit serves `index.html` automatically.
5. Open the deployed URL on phones and **Add to Home Screen** (see `PUBLISH-GUIDE.md`).

## Project structure

```
index.html        # the entire app: HTML + CSS + JavaScript (vanilla)
README.md         # this file
CLAUDE.md         # guide for editing with Claude Code
PUBLISH-GUIDE.md  # step-by-step phone/hosting walkthrough
.replit           # Replit run/deploy config
.gitignore
```

## Data & limitations

- All selections, household checks, custom items, and learned store choices are saved in the **browser's localStorage** (key: `mooreMenu`). Data lives on each device — **it does not sync between phones yet.**
- No backend, no accounts, no real ordering yet.

## Roadmap

1. ✅ Single-file planner, hosted as a static site (now).
2. ⬜ Backend + database so selections sync across devices, plus a family login.
3. ⬜ Instacart integration so the finished grocery list becomes a real cart.
