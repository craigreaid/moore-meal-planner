# Putting the Meal Planner on Your Phones

Goal: get the planner at a web address (URL) you can open and "Add to Home Screen" on any iPhone or Android, so it feels like an app.

The planner is a single file, which makes this easy. You don't need Replit, Claude Code, or any coding for this step.

---

## Step 1 — Rename the file (30 seconds)

In your "Meal and Grocery Order Planning" folder, rename:

`weekly-meal-planner.html`  →  `index.html`

(Right-click the file → Rename.) Web hosts automatically serve a file named `index.html` as the main page. *Some hosts below don't require this, but it never hurts.*

---

## Step 2 — Upload it to get a link

Pick **one** of these. Both are free and need no coding.

### Option A — Fastest, no account (good for trying it today)
1. Go to **tiiny.host** (or **host-html.com**).
2. Drag your `index.html` onto the page.
3. Pick a name → you get a link like `moore-menu.tiiny.site`.
4. Done — open that link on any phone.

*Trade-off: free links on these services can expire or be limited. Fine for testing; use Option B for something you'll keep.*

### Option B — Best to keep and update (recommended)
1. Go to **app.netlify.com/drop**.
2. Drag your `index.html` onto the drop zone — you instantly get a live link.
3. Create a free account when prompted (so the site stays up and you can update it).
4. You'll get a URL like `moore-menu.netlify.app`. You can rename the site in the dashboard.

**To push an update later:** just drag the new `index.html` onto the same Netlify site — it replaces the old one. (This is how we'll ship new features.)

---

## Step 3 — Add it to your home screen

Once you have the link, open it on each phone:

**iPhone / iPad (use Safari):**
1. Open the link in **Safari**.
2. Tap the **Share** button (square with an up-arrow).
3. Scroll down → **Add to Home Screen** → **Add**.
4. The "Moore Menu" icon appears like an app.

**Android (use Chrome):**
1. Open the link in **Chrome**.
2. Tap the **⋮** menu (top-right).
3. Tap **Add to Home screen** → **Add**.

---

## Good to know

- **It works offline-ish.** Once loaded, the planner runs entirely on the phone. Your meal picks, household items, and store choices are saved on **that device**.
- **Picks don't sync between phones yet.** Your phone and your wife's phone each keep their own selections. Syncing across devices (and a shared family login) is the next big step — that's when a platform like Replit, with a database, comes in.
- **Store integrations (Instacart, etc.)** also belong to that later, hosted version — a published static link can't place real orders by itself.

## When you're ready for the "real app" version
The natural upgrade path, in order:
1. **Now:** publish the single file (this guide) so everyone can use it.
2. **Next:** rebuild on a host like Replit with a small database so selections sync and you get a family login.
3. **Then:** wire up Instacart so the finished grocery list becomes a real cart.

Just say the word when you want to start step 2.
