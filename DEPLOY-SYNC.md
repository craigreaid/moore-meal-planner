# Deploying the synced version on Replit

This version has a small server so the whole family shares one menu that updates live. Because it needs to stay running, it's deployed as a **Reserved VM** (the free "Static" hosting can't keep a live connection open).

You'll do this once. After that, pushing new code + redeploying is a couple of clicks.

---

## 1. Get the code into Replit

If you already imported the repo, just **pull** the latest (Git pane → Pull). Otherwise: **Create Repl → Import from GitHub → `craigreaid/moore-meal-planner`**.

Replit will see `package.json` and treat it as a Node app.

## 2. Set two Secrets

In the Repl, open the **Secrets** tool (lock icon) and add:

| Key | Value |
|-----|-------|
| `FAMILY_PASSWORD` | the password your family will type to sign in (pick something easy to share, e.g. `MooreDinners2026`) |
| `SESSION_SECRET` | any long random string (used to sign login cookies — just mash the keyboard, 30+ characters) |

> If you skip these, the app still runs but uses an insecure dev password (`moorefamily`). Always set real Secrets before sharing the link.

## 3. Preview it

Click **Run**. Replit installs dependencies and starts the server. In the preview window you should see the **login screen** — sign in with your `FAMILY_PASSWORD`. The status pill should say **Synced**.

## 4. Deploy (Reserved VM)

1. Click **Deploy**.
2. Choose **Reserved VM** (not Autoscale, not Static — a reserved VM stays on so the live connection works).
3. Run command: **`npm start`** (this is already in `.replit`).
4. Confirm and deploy. You'll get a public URL like `moore-meal-planner.replit.app`.

> Reserved VM is a paid Replit feature. That's the trade-off for instant, always-on sync.

## 5. Put it on everyone's phones

On each phone, open the deployed URL, **sign in once** (it stays signed in), then **Add to Home Screen** (see `PUBLISH-GUIDE.md` for the exact taps). Now any change one person makes shows up for everyone.

---

## Updating later

When the app changes:

1. Push the new code to GitHub (or it's already there).
2. In Replit: **Pull**, then **Redeploy** from the Deploy panel.

## Changing the family password

Edit the `FAMILY_PASSWORD` secret and redeploy. Everyone will need to sign in again with the new password. (Changing `SESSION_SECRET` also signs everyone out — only do that if you think a cookie leaked.)

## Where the data lives

On Replit the shared record is stored automatically in the **Replit Database** (no setup needed). Locally during development it's a file at `.data/household.json`. Either way it's one shared record for the household.

## Troubleshooting

- **Stuck on the login screen / "Could not reach the server":** the server isn't running — make sure you used **Run** / a Reserved VM deploy, not Static.
- **Pill says "Offline — will sync":** the live connection dropped; it reconnects automatically and pushes any changes you made meanwhile.
- **Everyone got signed out:** the `SESSION_SECRET` changed (or the deploy was recreated). Just sign in again.
