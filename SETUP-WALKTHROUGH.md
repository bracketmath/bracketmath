# BracketMath — Setup Walkthrough (CORRECTED, Plain English)

> **🟢 HISTORICAL — every step in this file is complete (Week 1, 12 May 2026).**
> The local repo is initialised, `github.com/bracketmath/bracketmath` exists, Cloudflare is connected, the domain is live with HTTPS. This file is retained as a reference for how the infrastructure was wired up — useful if a future buyer needs to understand the chain of custody, or if the project ever needs to be rebuilt from scratch.
>
> **For day-to-day work, see `CHECKLIST.md` and the `HANDOFF-PROMPT-WEEKS-*.md` files instead.**
>
> **The deploy loop** is now a single line: `git push origin main` from inside `bracketmath/` triggers a Cloudflare Workers build + deploy in ~3 minutes.

---

> **Original goal of this file:** by the end of it, your local Astro code is pushed up to a fresh empty GitHub repo under your new `bracketmath` GitHub account, and you have a Cloudflare account ready. ~15 minutes.

---

## What's already true (status as of now)

- ✅ Dedicated Gmail: `[email protected]` — done
- ✅ New dedicated GitHub user account: `bracketmath` — done (you're logged in)
- ✅ Local Astro project exists on your computer at `c:\Users\lukeb\OneDrive\Desktop\Business idea\bracketmath\`
- ❌ The local folder is **NOT yet a git repository** (no `.git` folder inside it)
- ❌ The new `bracketmath` GitHub account has **no repos yet** — its dashboard shows "Create your first project"
- ⚠️ There may be a stale empty repo at `optimalchain1/bracketmath` from earlier — **ignore it.** It's not connected to your local code and we'll delete it at the end if you want to.

So the actual job is simple: create a new empty repo on `bracketmath`, initialise git locally, push the code up.

---

## ✅ STEP 1 — Create the new empty repo on GitHub (1 minute)

You're already on the `bracketmath` dashboard. Do this:

1. Click the green **"Create repository"** button (on the left side of your dashboard, under "Create your first project")
2. Fill in the form:
   - **Repository name:** `bracketmath`
   - **Description (optional):** `UK tax & pension calculators`
   - **Public** ← leave selected (needed for free Cloudflare Pages)
   - **⚠️ Leave ALL THREE checkboxes UNCHECKED:**
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license

     (You already have a README and .gitignore locally. Ticking these creates a conflict.)
3. Scroll down. Click the green **"Create repository"** button.
4. You'll land on an empty repo page with setup instructions. ✅ **Done.** Leave this tab open.

---

## ✅ STEP 2 — Push your local code up (3 minutes)

In **VS Code**:

1. Open a fresh terminal: menu **Terminal → New Terminal**
2. Paste these commands **one at a time**. After each one, press **Enter** and wait for it to finish before pasting the next.

**Command 1 — navigate to your code folder:**
```
cd "c:\Users\lukeb\OneDrive\Desktop\Business idea\bracketmath"
```

**Command 2 — turn the folder into a git repository:**
```
git init
```
You'll see a message like `Initialized empty Git repository in .../.git/`. That's success.

**Command 3 — stage all your files for the first commit:**
```
git add .
```
No output = success.

**Command 4 — make the first commit:**
```
git commit -m "initial commit"
```
You'll see a list of all the files that were committed. Long output is normal.

**Command 5 — rename the default branch to `main` (modern convention):**
```
git branch -M main
```
No output = success.

**Command 6 — connect the local repo to the new GitHub repo:**
```
git remote add origin https://github.com/bracketmath/bracketmath.git
```
No output = success.

**Command 7 — push the code up:**
```
git push -u origin main
```

**🚨 What to expect when you run Command 7:**
- A **Windows credential popup** (or a browser window) will appear asking you to sign in to GitHub.
- Sign in as **`bracketmath`** (the new account), NOT as `optimalchain1`.
- If a browser opens, use the same `[email protected]` + password you set up earlier.
- After signing in, the push will continue and you'll see something like:
  ```
  Branch 'main' set up to track remote branch 'main' from 'origin'.
  ```

✅ **Done when:** refreshing `https://github.com/bracketmath/bracketmath` in your browser shows all your code files (you'll see folders like `src/`, `public/`, and files like `package.json`, `astro.config.mjs`).

---

## ✅ STEP 3 — Create the Cloudflare account (5 minutes)

1. Open an **incognito/private window**
2. Go to **https://dash.cloudflare.com/sign-up**
3. Sign up:
   - **Email:** `[email protected]`
   - **Password:** strong, save in password manager
4. Click **"Sign Up"**
5. Cloudflare emails a verification link → open the email → click the link
6. Skip onboarding popups — you'll buy the domain in the next phase
7. ✅ **Done when:** you can log into the Cloudflare dashboard

---

## ✅ STEP 4 (OPTIONAL — cleanup) — Delete the stale `optimalchain1/bracketmath` repo

Only do this once Step 2 above is fully working.

1. In your normal browser, log in as `optimalchain1`
2. Go to `https://github.com/optimalchain1/bracketmath/settings`
3. Scroll to **Danger Zone** at the bottom
4. Click **Delete this repository**
5. Confirm by typing `optimalchain1/bracketmath`

Now your old account is clean and BracketMath lives entirely under the new account.

---

## Recap of what you now have

- ✅ Dedicated Gmail: `[email protected]`
- ✅ Dedicated GitHub user: `bracketmath`
- ✅ Code lives at `github.com/bracketmath/bracketmath`
- ✅ Local VS Code pushes to that same URL
- ✅ Dedicated Cloudflare account using same Gmail
- ✅ Old `optimalchain1/bracketmath` deleted (or just ignored)

At sale time in 18+ months, you hand the buyer two passwords (Gmail + GitHub) and they have everything.

---

## What's next

Open `CHECKLIST.md` and go to **"WEEK 1 — Day 1 — Buy the domain & set up Cloudflare"**. The first action is buying `bracketmath.co.uk` (£8) via Cloudflare Registrar.

---

## Troubleshooting

### Q: `git push` says "Permission denied" or "Authentication failed"
**A:** You logged in as the wrong GitHub account. Run:
```
git config --global credential.helper manager-core
```
Then run `git push -u origin main` again. When the popup appears, sign in as `bracketmath` (NOT `optimalchain1`). If a previous wrong credential is cached, clear it: **Windows Settings → Credential Manager → Windows Credentials** → find any `git:https://github.com` entries → Remove → try again.

### Q: I get "remote origin already exists"
**A:** You ran `git remote add` twice. Fix by replacing instead:
```
git remote set-url origin https://github.com/bracketmath/bracketmath.git
```

### Q: I get "fatal: not a git repository" when I run later commands
**A:** You're in the wrong folder. Run `cd "c:\Users\lukeb\OneDrive\Desktop\Business idea\bracketmath"` first.

### Q: The push works but I only see a README, not my actual files
**A:** You ticked "Add a README" when creating the GitHub repo. Fix:
```
git pull origin main --allow-unrelated-histories
git push origin main
```
If you get merge conflicts, just delete the GitHub repo (Settings → Danger Zone) and re-do Step 1 with the README checkbox UNTICKED.

### Q: Will Cline still work on the code after this?
**A:** Yes — Cline edits local files. The git remote only matters when pushing/pulling. Nothing changes for your day-to-day work in VS Code with Cline.
