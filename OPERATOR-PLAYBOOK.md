# BracketMath — Operator Playbook (gate window)

**Audience:** you, the human operator. Not an AI agent.
**Purpose:** every manual task that must be done between *commit 264e663*
(Weeks 8–12 ship) and the moment you summon the next AI agent for Batch 2.
**Time budget:** ~4–6 weeks of indexing wait, with ~3–6 hours of your time
spread across it.
**Single source of truth:** until you tick the gate-pass criteria at the end
of this file, **no further code changes are pushed to bracketmath.co.uk**.

---

## ⛔ STOP — read this before anything else

You just pushed 200 programmatic pages, four calculators, five guides and a
new Sole Trader Tax calculator to bracketmath.co.uk. The site is now in the
single most fragile state of its lifecycle: it has 215 brand-new URLs that
Google hasn't seen, on a domain with no link authority, in a YMYL
(Your Money Your Life) category that Google scrutinises harder than any
other. The next 4–8 weeks decide whether the site gets indexed cleanly or
gets sandboxed.

**The non-negotiables for this window:**

1. **No new pages.** Not 1, not 5, not 50. The next AI agent has been
   instructed in `HANDOFF-PROMPT-MONTHS-3-6.md` to refuse to push anything
   until you confirm this playbook's gate-pass criteria.
2. **No spammy indexing tricks.** No auto-indexing services. No buying links.
   No mass-submitting URLs more than once. These are all Google penalty
   triggers in YMYL.
3. **No domain settings changes.** Don't touch DNS, don't switch CDNs, don't
   reorganise URL paths. Google needs URL stability while it crawls.
4. **No content edits to existing pages except typos.** Don't restructure
   guides, don't rewrite calculator titles, don't change H1s.
   The crawl is happening; let it finish.

**What this playbook IS:**
- Verification that the deploy is healthy.
- The cheapest, most effective indexing-acceleration steps.
- The affiliate-signup work that funds the project (revenue-side).
- The technical QA (Lighthouse + Schema) that any sale-side due-diligence
  would do.
- The site-polish work (E-E-A-T, about page, disclaimer fine-tuning) that
  matters for both Google trust and sale-side trust.
- The backlink-engine groundwork.

**What this playbook is NOT:** an excuse to start building Batch 2 early.
The gate exists for a reason. Trust the plan.

---

## 0. Day-1 smoke test (do this within 1 hour of the push)

Confirm Cloudflare deployed cleanly and the new pages render. Skip nothing.

### 0.1 Confirm Cloudflare deploy

1. Open https://dash.cloudflare.com → Workers & Pages → `bracketmath`.
2. The most recent deployment should be marked **Success** with commit
   `264e663` (or whatever the latest is). If it says **Failed**, click in
   and read the build log — most likely cause is a Node version mismatch or
   a Wrangler config drift.
3. Note the deploy URL (something like `https://264e663.bracketmath.pages.dev`).
   Verify the custom domain `https://bracketmath.co.uk` resolves to the
   same content (CTRL+F5 to bust cache).

### 0.2 Smoke-test five live URLs

Open each in a private/incognito window. Each should load < 2 seconds, no
console errors (open DevTools → Console), no 404s on assets:

- [ ] `https://bracketmath.co.uk/` — home
- [ ] `https://bracketmath.co.uk/calculators/sole-trader-tax` — newest calc
- [ ] `https://bracketmath.co.uk/calculators/salary-dividend-split` — original
- [ ] `https://bracketmath.co.uk/guides/uk-contractor-tax` — pillar guide
- [ ] `https://bracketmath.co.uk/pay/software-contractor-ltd-outside-ir35-75k`
      — pSEO page (any other `/pay/...` slug from `pages.csv` is fine)
- [ ] `https://bracketmath.co.uk/pay` — pSEO index
- [ ] `https://bracketmath.co.uk/sitemap-index.xml` — should list ~215 URLs

### 0.3 Confirm the fonts are self-hosted

In DevTools → Network tab, refresh a page and filter by "Font". You should
see `inter-*.woff2` and `jetbrains-mono-*.woff2` loading from
`bracketmath.co.uk`. There should be **zero requests** to `fonts.googleapis.com`
or `fonts.gstatic.com`. If you see one, the Google Fonts removal was
incomplete — open an issue in `CHECKLIST.md` "Found issues" and the next
AI session will fix it before Batch 2.

### 0.4 Confirm Schema markup

For three different page types, paste the URL into
https://search.google.com/test/rich-results and confirm:

- Calculator page: detects `Article` + `BreadcrumbList` + (where applicable)
  `HowTo`.
- Guide page: detects `Article` + `FAQPage` + `BreadcrumbList`.
- `/pay/...` page: detects `Article` + `FAQPage` + `BreadcrumbList`
  (Optimiser persona pages also `HowTo`; Pre-retiree pages also
  `FinancialProduct`).
- **No errors.** Warnings are tolerable; errors are not. If you see errors,
  screenshot them and add them to `CHECKLIST.md` "Found issues".

If 0.1–0.4 all pass, the deploy is healthy. Proceed to indexing.

---

## 1. PRIORITY 0 — Search engine indexing (this is the gate)

This is the entire reason you're here for 4–8 weeks. Your goal is to get
≥ 50% of the 215 URLs indexed in Google before pushing Batch 2.
You do NOT need 100%, you do NOT need fast — you need *clean*. One slow,
clean crawl beats three frantic ones.

### 1.1 Google Search Console — set-up sanity check (15 mins, one-time)

If you set up GSC during Weeks 4–5 (per `SETUP-WALKTHROUGH.md`), skip to 1.2.
If not:

1. Open https://search.google.com/search-console.
2. Add property → "URL prefix" → `https://bracketmath.co.uk`.
3. Verify via the DNS TXT record method (you already control DNS via Cloudflare).
4. In Cloudflare → DNS → add a TXT record with the value GSC gives you. Wait
   2–5 minutes, click Verify.
5. Add a second property with "Domain" type for `bracketmath.co.uk` — this
   covers all subdomains and protocols.

### 1.2 Submit the sitemap (5 mins)

1. GSC → left sidebar → Indexing → Sitemaps.
2. Add new sitemap: `sitemap-index.xml`.
3. Submit. Status should show "Success" within 24 hours.
4. After 48 hours, the "Discovered URLs" number should approach 215.

### 1.3 Bing Webmaster Tools (15 mins, one-time)

Most people skip this; that's a mistake. Bing also powers DuckDuckGo, Yahoo,
ChatGPT search, and Ecosia. Indexing there is fast and free.

1. Open https://www.bing.com/webmasters and sign in with a Microsoft account.
2. Add site → enter `https://bracketmath.co.uk`.
3. **Easy path**: choose "Import from Google Search Console". One click,
   pulls everything across including the verification.
4. Submit the sitemap at `https://bracketmath.co.uk/sitemap-index.xml`.
5. Enable **IndexNow** (Bing's instant-indexing protocol). Bing → Settings
   → IndexNow → generate an API key.

> IndexNow is genuinely useful and is the *only* "instant indexing" thing
> that's safe to use. Cloudflare offers a one-click IndexNow integration:
> Cloudflare dashboard → bracketmath.co.uk → Crawler Hints → Enable.
> This automatically pings Bing/Yandex every time you push.

### 1.4 Manually request indexing for the top 20 URLs (45 mins)

GSC's URL Inspection tool lets you nudge Google to crawl a specific URL.
Limit is roughly **10–12 per day** before you get a soft rate-limit warning.
Spread it over two days.

**The 20 priority URLs (in this order):**

```
1.  https://bracketmath.co.uk/
2.  https://bracketmath.co.uk/calculators
3.  https://bracketmath.co.uk/calculators/salary-dividend-split
4.  https://bracketmath.co.uk/calculators/sipp-optimiser
5.  https://bracketmath.co.uk/calculators/take-home
6.  https://bracketmath.co.uk/calculators/sole-trader-tax
7.  https://bracketmath.co.uk/guides
8.  https://bracketmath.co.uk/guides/uk-contractor-tax
9.  https://bracketmath.co.uk/guides/ltd-company-director-tax
10. https://bracketmath.co.uk/guides/self-employed-pensions
11. https://bracketmath.co.uk/guides/ir35-explained
12. https://bracketmath.co.uk/guides/optimal-uk-retirement-portfolio
13. https://bracketmath.co.uk/pay
14. https://bracketmath.co.uk/pay/software-contractor-ltd-outside-ir35-75k
15. https://bracketmath.co.uk/pay/software-contractor-ltd-outside-ir35-100k
16. https://bracketmath.co.uk/pay/software-contractor-ltd-outside-ir35-140k
17. https://bracketmath.co.uk/pay/consultant-ltd-outside-ir35-100k
18. https://bracketmath.co.uk/pay/freelance-designer-sole-trader-40k
19. https://bracketmath.co.uk/pay/electrician-sole-trader-50k
20. https://bracketmath.co.uk/pay/software-contractor-umbrella-inside-ir35-500-day-rate
```

(Substitute any of the `/pay/...` slugs above with real ones from
`pages.csv` if those don't exist — the column 1 of the CSV is the slug.)

**For each URL:**
1. GSC → top search bar → paste the URL.
2. Click "Test live URL". This forces Googlebot to fetch it now.
3. If "URL is available to Google" → click "Request indexing".
4. If "URL is not available to Google" → screenshot the error. Most common
   cause: robots.txt or a 5xx response. Log it in `CHECKLIST.md` "Found
   issues" and tell the next AI session before unblocking Batch 2.

### 1.5 Generate external crawl signals (gentle, no spam — 1–2 hours over 2 weeks)

Googlebot crawls more aggressively when external signals tell it your site
is being read. You generate these signals by:

**Reddit (the highest-quality signal for UK personal finance):**

- /r/UKPersonalFinance — a single high-quality comment per week where a
  BracketMath calculator URL is *genuinely the best answer*. Not promotion.
  Example: someone asks "how do I split salary vs dividend at £100k?" — you
  link `/calculators/salary-dividend-split` and explain why the optimiser
  output differs from the £12,570 rule of thumb.
- /r/HENRYUK — same pattern, weighted toward optimiser pages.
- /r/contracting and /r/UKContracting — IR35 and Ltd Co content.
- /r/FIREUK — the SIPP optimiser and retirement guides.

**Rules so you don't get banned:**
- Comment, don't post. Top-level promotional posts get nuked.
- Your link must answer the question more completely than the existing
  top comment. If it doesn't, don't link.
- Wait until you have an account with > 100 karma before linking. If
  you don't have one, spend a week answering UKPF questions *without*
  linking; build karma first.

**Twitter/X:**
- One post per week from `@bracketmath` (or your personal account, if no
  branded account exists yet) sharing a single non-obvious finding from a
  pSEO page. Example: "Ltd Co director at £140k, salary £12,570, divs
  £45k, pension £35k → £31,698/yr more take-home than the textbook
  £12,570-salary + max-divs answer. Show your working: ..."
- Tag 1–2 UK personal finance accounts that might reshare (Banker on FIRE,
  Finumus, Be Clever With Your Cash, Monevator). Don't @-spam.

**Hacker News:**
- Skip unless you have a *technical* angle. The calculator engines
  (block-bootstrap Monte Carlo, bisection break-even) could anchor a
  "Show HN" post if the audience there cares — but UK personal finance is
  niche on HN. Lower-priority than Reddit.

### 1.6 Daily indexing check (5 mins / day, weeks 1–4)

Each morning:

1. GSC → Pages.
2. Note the "Indexed" count. Add to the indexing log table in `CHECKLIST.md`
   (template below in section 9).
3. If a page is in "Not indexed" with reason "Crawled — not indexed",
   that's the page Google has *seen* but decided is too thin. Reasons
   from most-likely to least:
   - Page is near-duplicate of another `/pay/...` page (the variance
     model isn't varying enough — log it; the next AI session expands
     templates).
   - Page is under 1,200 words after stripping nav/footer (engine
     output is too short).
   - FAQ block looks templated (FAQs aren't matching tags).
4. If a page is in "Not indexed" with reason "Discovered — not crawled",
   that means Google is rate-limiting. Patience.
5. **Stop requesting indexing.** Past day 2, you don't manually
   request anything. Google's rate-limiter penalises sites that try to
   accelerate themselves.

### 1.7 The gate-pass test

You can push Batch 2 when **all five** of these are true:

- [ ] ≥ 50% of submitted URLs (≥ 108 of 215) show as "Indexed" in GSC →
      Pages.
- [ ] Average position for your home page is < 50 for the query
      "uk salary dividend calculator" (or any of the top-5 keywords
      you targeted).
- [ ] No "Manual action" penalty in GSC → Security & Manual Actions.
- [ ] No "Soft 404" warnings on any `/pay/...` URL in GSC → Pages.
- [ ] At least 7 days have elapsed since the last indexed-count delta
      changed by more than 5 pages (means crawl has stabilised).

If any of those fails, **wait another week** before re-checking. Do not push
Batch 2 prematurely. The penalty for spam-flagged programmatic content is
months, sometimes permanent.

---

## 2. PRIORITY 1 — Lighthouse + technical QA (~ 2 hours, do in week 1)

The previous session claimed Lighthouse Mobile ≥ 95 but only sampled three
pages of the original five guides. You haven't verified the 200 pSEO pages.

### 2.1 Sample 5 random pages and run Lighthouse (1 hour)

Use https://pagespeed.web.dev — runs Lighthouse on Google infrastructure,
no local environment noise.

**Sample plan:** one of each page type:

- `https://bracketmath.co.uk/` (home)
- `https://bracketmath.co.uk/calculators/sole-trader-tax` (newest interactive)
- `https://bracketmath.co.uk/guides/optimal-uk-retirement-portfolio` (longest pillar)
- A random `/pay/...` URL from Batch 1 — pick one yourself
- A second random `/pay/...` URL — different persona than the first

For each, log the **mobile** Lighthouse scores in `CHECKLIST.md` (table
template below):

| URL | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` |  |  |  |  |
| `/calculators/sole-trader-tax` |  |  |  |  |
| `/guides/optimal-uk-retirement-portfolio` |  |  |  |  |
| `/pay/__random_1__` |  |  |  |  |
| `/pay/__random_2__` |  |  |  |  |

### 2.2 What to do with the results

- Any score **≥ 95** → tick and move on.
- Any score **90–94** → log the specific Lighthouse audits that failed
  (right column of the Lighthouse report). Add them to `CHECKLIST.md`
  "Polish backlog" for the next AI session.
- Any score **< 90** → that's a regression. Investigate why before Batch 2.
  Most likely cause for a programmatic page: image not optimised,
  layout-shifting embed, or a font preload race. **Do not push code yourself
  to fix it** — log it for the next AI session.

### 2.3 Accessibility manual check (30 mins)

Lighthouse misses some accessibility issues. Do these manual checks on
the home page and one calculator:

- Tab through the page with only the keyboard. Every interactive element
  (links, buttons, inputs) must be reachable, and the focus ring must be
  visible. If a button is "tabbed past" without a visible focus state,
  log it.
- Run the page through https://wave.webaim.org — flag any contrast
  errors. Body text was set to `oklch(0.48 ...)` for WCAG AA contrast.
- Resize the browser to 320px wide (DevTools → Device Toolbar →
  iPhone SE 1st gen, 320×568). Layout must not break, no horizontal scroll.

### 2.4 Schema validation (10 mins)

Re-run the rich-results test from step 0.4 on the same three page types,
but this time use https://validator.schema.org as the second check. The
Google test catches Google-specific issues; the schema.org validator
catches structural issues Google might silently ignore but other crawlers
(Bing, OpenAI, Brave Search) won't.

Log any errors in `CHECKLIST.md`.

---

## 3. PRIORITY 2 — Affiliate signups (~ 2 hours, do in week 1–2)

This is the income side. Until you have approved affiliate links, the site
generates zero revenue. The signups themselves can be done while indexing
is in progress — no Google interaction needed.

> **Important caveat.** I cannot guarantee any specific merchant's affiliate
> programme will accept your site in week 1 — most require some traffic
> history. Apply anyway; rejection is rare for clearly legitimate UK
> finance sites, and many programmes accept and then re-review at the
> first commission. Have the disclaimer, about and privacy pages live
> *before* applying — they all are.

### 3.1 Awin Publisher — the primary network (45 mins)

Awin is the largest affiliate network in the UK; it hosts most personal
finance merchants you'd want.

1. Open https://www.awin.com/gb/publisher.
2. Click **Sign up** as Publisher → fill in the form.
3. **Required field gotchas:**
   - Company name: your trading name; if sole trader, just your name.
   - Promotional method: tick "Content" and "SEO".
   - Website URL: `https://bracketmath.co.uk`.
   - Brief description: "UK personal finance calculator site for
     self-employed and limited-company directors. Provides mathematical
     decision tools (tax optimisation, retirement modelling, IR35
     comparison) backed by HMRC / FCA citations. Monetises via affiliate
     links to FCA-regulated providers."
4. **Awin charges a £5 refundable deposit** to register. Pay it. You get
   it back with your first commission payout.
5. Wait 2–5 business days for approval.
6. Once approved, search the merchant directory for:
   - **Hargreaves Lansdown** (SIPP + ISA — top priority for SIPP optimiser
     traffic)
   - **AJ Bell** (SIPP + ISA — second-tier provider, often higher
     conversion rate than HL)
   - **Interactive Investor** (SIPP + ISA — fixed-fee model is the
     differentiator)
   - **Vanguard Investor UK** — apply but expect rejection; Vanguard rarely
     runs affiliate programmes. If rejected, use unaffiliated link with no
     `rel="sponsored"`.
   - **Crunch Accounting** (accounting software for contractors)
   - **FreeAgent** (accounting software, owned by NatWest)
   - **Coconut** (banking + tax for self-employed)
   - **Wise** (international transfers — secondary)
   - **TopCashback** (meta-comparison; high acceptance rate)

For each merchant, click "Join programme" and write a one-paragraph
context note in the application: "BracketMath ranks for `[merchant
keyword]` and competitors. Calculator output naturally introduces the
need for a provider; merchant fits the user profile of [optimiser
persona / pre-retiree persona]."

### 3.2 Impact (impact.com) — secondary network (30 mins)

Impact hosts merchants Awin doesn't, particularly tech-forward fintechs.

1. https://impact.com/partners/ → Sign up as Partner (their term for
   Publisher).
2. Same form pattern as Awin.
3. Once approved, search for:
   - **Penfold** (modern SIPP — high-conversion for self-employed)
   - **PensionBee** (SIPP consolidation — common via Impact, occasionally
     direct)
   - **Moneybox** (ISA + SIPP — lower commission but high brand trust)
   - **Plum** (savings + investing app)
   - **Tide** (business banking for Ltd Co — high commission)
   - **Starling Business** (business banking)

### 3.3 Direct merchant programmes (30 mins)

A few merchants run programmes outside the networks. Apply directly to:

- **PensionBee Affiliate** — https://www.pensionbee.com/uk/partners
- **Wealthify Affiliate** — usually via Awin but check direct.
- **Hargreaves Lansdown Affiliate** — primary application is via Awin;
  no separate direct programme.

### 3.4 What to do with the approved links (15 mins setup, then ongoing)

When approvals start coming in, **do NOT immediately edit the site to add
links**. The next AI session will integrate them as a single coherent
update (with proper `rel="sponsored"`, CMA-compliant disclosure, and
correct placement). Just record each approval in the tracker:

**Affiliate tracker template** (paste into a Google Sheet):

```
Date applied | Network | Merchant | Programme name | Commission % or £ | Status | Approval date | Tracking link template | Notes
2026-05-15   | Awin    | HL       | HL Brand        | tbc               | Pending |              |                         |
2026-05-15   | Awin    | AJ Bell  | AJ Bell SIPP    | tbc               | Pending |              |                         |
... etc
```

When all your priority approvals are in (target: ≥ 6 merchants live), the
next AI session will do an integration pass: for each calculator and
guide, pick the most relevant 1–2 merchants and add a single sponsored
link with a one-sentence context note. Per the MASTER-PLAN's CMA
compliance rules: `rel="sponsored"` + visible disclosure.

---

## 4. PRIORITY 3 — Site polish (~ 1–2 hours, week 2)

The site is mathematically solid. Sale-side due diligence (Empire Flippers,
Acquire.com) will inspect every public page. These are the bits that
typically fail a buyer's checklist:

### 4.1 About page — credibility without making claims (30 mins manual review)

Open `https://bracketmath.co.uk/about` (or whatever the about page URL is —
check `bracketmath/src/pages/about.astro`).

**Reads to check (no edits without the next AI session):**

- ❌ Does it claim qualifications I don't have? (CFA, CFP, ICAEW, etc.)
- ❌ Does it use first-person? ("I built this") — the voice is anonymous
  methodology-speaking. If first-person appears, that's a regression from
  Weeks 4–5. Log it.
- ✅ Does it explain the methodology (engine-computed, sourced)?
- ✅ Does it explain *why* the site exists (rule-of-thumb optimisation
  gap)?
- ✅ Does it disclose monetisation (affiliate revenue from FCA-regulated
  providers)?

If any of the ❌s fail, log in `CHECKLIST.md` "Found issues" with a quote
of the offending sentence. The next AI session rewrites.

### 4.2 Disclaimer page — YMYL safety net (10 mins)

Open the disclaimer URL. Required elements:

- "Not regulated financial advice" wording.
- "Calculator outputs are for illustration, not recommendation."
- "Tax thresholds correct as of 2026/27."
- A pointer to MoneyHelper or Citizens Advice for actual advice.
- Tax year date stamp ("Last updated: 2026/27 tax year").

If any are missing, log.

### 4.3 Privacy page — GDPR + cookie posture (10 mins)

- "We use no cookies, no analytics, no tracking" statement (if true).
- "All calculation is in-browser; no data leaves your device" statement
  (if true — confirm via DevTools → Application → Storage that no cookies
  are set; the site genuinely is zero-telemetry).
- Contact email for data requests.

### 4.4 Footer — required UK legal links (5 mins)

The footer should have:
- About
- Disclaimer
- Privacy
- Last updated date or "Tax year 2026/27" stamp

Open the site, scroll to the bottom, check.

### 4.5 Internal link audit (15 mins)

Open `https://bracketmath.co.uk/sitemap-index.xml` and click 5 random URLs.
For each:
- Click 3 internal links on the page.
- Each should return 200, not 404. If any 404s, log.
- Check anchor text is *descriptive* ("salary-dividend optimiser") and
  not generic ("click here"). If you find generic anchors, log.

### 4.6 Sale-side due-diligence pre-check (30 mins, optional but smart)

If you intend to sell at 15 months, doing this in week 2 saves headache
later. Empire Flippers' standard pre-sale checks:

- [ ] WHOIS not redacted (or company-owned, not personal name).
- [ ] No copyrighted images. Check `bracketmath/public/` — should only
      contain self-made SVGs / icons.
- [ ] No DMCA-risky content (none expected for a calc site).
- [ ] Tax-year date stamps visible on every YMYL claim.
- [ ] Sources cited (HMRC URL on every figure) — the previous sessions
      were strict about this; verify in spot checks.

---

## 5. PRIORITY 4 — Backlink work (start in week 2, ongoing — ~ 30 min/week)

`BACKLINK-PLAYBOOK.md` contains the full operational guide. Summary
relevant for this window:

### 5.1 HARO / Featured signups (one-time, 30 mins)

- HARO (Help A Reporter Out): https://www.helpareporter.com (or its
  successor, since HARO was renamed/restructured in 2024 — check
  `BACKLINK-PLAYBOOK.md` for the current platform). Free tier is enough.
  Subscribe to the **Business & Finance** category, daily email.
- Featured.com / Qwoted: secondary platforms. Worth signing up but lower
  hit rate for UK personal finance.

### 5.2 Reply cadence

When a relevant journalist query arrives (typically 3–5 / week in UK
finance), reply within 4 hours with one of the three pitch templates in
`BACKLINK-PLAYBOOK.md`. Roughly 1 in 8 replies converts to a backlink with
the BracketMath URL. Aim for 5 sent pitches/week.

### 5.3 Guest post outreach

`BACKLINK-PLAYBOOK.md` has five draft pitches to five UK personal finance
blogs (Monevator, Banker on FIRE, Be Clever With Your Cash, Finumus, plus a
fifth). In week 3, send one pitch / week — Monday morning, UK time.
Personalise each one; do not blast-copy.

---

## 6. ❌ Things to NOT do during the gate window

Read this list twice. Each item is the equivalent of a partial penalty.

- ❌ **Do not buy backlinks.** Not from any service, not from any
  "guest post network", not from any "SEO agency". Google's spam
  detection in 2026 catches paid links at near-100% recall and the
  penalty for YMYL is harsh.
- ❌ **Do not use auto-indexing services.** "GoogleBot-as-a-service" /
  "RankMath instant index" / etc are blackhat. The one safe one is
  IndexNow (covered in 1.3).
- ❌ **Do not mass-submit URLs to GSC.** ≤ 12 manual requests / day, then
  stop. Repeated submissions are flagged as manipulation.
- ❌ **Do not edit content "just to refresh".** Wholesale republishing
  signals manipulation. Only edit if you find a factual error.
- ❌ **Do not change URL paths.** A redirected URL during indexing is
  worse than no indexing.
- ❌ **Do not add analytics / tracking.** "Privacy: no telemetry" is part
  of the moat. Adding GA4 or Plausible later is the next-AI's call.
- ❌ **Do not add a popup, exit-intent, or any modal.** Lighthouse will
  penalise mobile UX and Google penalises intrusive interstitials in YMYL.
- ❌ **Do not push code yourself.** The PowerShell adventure from
  Weeks 8–12 should be an exception, not a habit. The next AI session
  handles all code from `C:\dev\bracketmath` (the OneDrive copy is
  read-only reference now).

---

## 7. Gate-pass criteria — when to summon the next AI

You can summon the next AI agent (using `HANDOFF-PROMPT-MONTHS-3-6.md`) when:

- [ ] ≥ 108 of 215 URLs show "Indexed" status in GSC → Pages.
- [ ] No "Manual action" or "Security issue" warnings in GSC.
- [ ] You've recorded at least 5 random Lighthouse Mobile scores ≥ 95
      in `CHECKLIST.md`.
- [ ] You have ≥ 6 approved affiliate links in the tracker spreadsheet.
- [ ] About / Disclaimer / Privacy / Footer are reviewed and any issues
      logged in `CHECKLIST.md`.
- [ ] At least 4 weeks have elapsed since 264e663 was pushed.

When all six are true, in a fresh AI agent session, paste the contents of
`HANDOFF-PROMPT-MONTHS-3-6.md`. That agent will read this playbook first to
verify the gate-pass criteria are met, then begin Batch 2.

**If you summon the next AI before all six are true,** it has been
instructed in `HANDOFF-PROMPT-MONTHS-3-6.md` to refuse. Don't fight it.
The gate exists to protect the asset.

---

## 8. What to do during the wait (the "I have spare evenings" list)

If you're impatient and want to make the asset better while indexing
runs, in order of value:

1. **Backlink work** (Section 5 above). High ROI.
2. **Curate Batch 2's 200 rows of `pages.csv` in a *draft* spreadsheet.**
   Not in the repo. Just a local CSV with the same columns. The next AI
   session imports it. Saves them 1–2 hours and frees them for the
   variance-engine extension.
3. **Read the indexed Search Console queries** (after week 2). Note the
   surprising ones — queries you didn't seed for. Those are your Batch 2
   priorities.
4. **Apply for the affiliate programmes you skipped** in 3.1–3.3 if
   you had cold feet. The next AI session can't apply for you; only you
   can sign the agreements.
5. **Read MASTER-PLAN.md sections you skimmed.** Section 12 (the sale
   playbook) and Section 14 (the 15-month milestone gates) are the ones
   most operators ignore.
6. **Buy `bracketmath.com` if it's available.** The `.com` is worth a
   defensive purchase at 15-month timeline; expect £8–£20 / year.

---

## 9. Tracking templates

### 9.1 Indexing log table (copy into CHECKLIST.md)

```
| Date       | Submitted URLs | Indexed | "Crawled - not indexed" | "Discovered - not crawled" | Notes |
|------------|----------------|---------|-------------------------|----------------------------|-------|
| 2026-05-14 | 215            |    0    |            0            |             0              | Day 0; sitemap submitted at 18:55 |
| 2026-05-15 | 215            |    ?    |            ?            |             ?              |       |
| ... etc, daily for 4 weeks ...                                                                                       |
```

### 9.2 Lighthouse log table (copy into CHECKLIST.md)

```
| Date       | URL                                          | Perf | A11y | BP | SEO | Issues |
|------------|----------------------------------------------|------|------|----|-----|--------|
| 2026-05-14 | https://bracketmath.co.uk/                   |      |      |    |     |        |
| 2026-05-14 | /calculators/sole-trader-tax                 |      |      |    |     |        |
| 2026-05-14 | /guides/optimal-uk-retirement-portfolio      |      |      |    |     |        |
| 2026-05-14 | /pay/<random_1>                              |      |      |    |     |        |
| 2026-05-14 | /pay/<random_2>                              |      |      |    |     |        |
```

### 9.3 Affiliate tracker (Google Sheet)

```
Date applied | Network  | Merchant       | Programme            | Commission       | Status   | Approval date | Tracking link | Notes
2026-05-15   | Awin     | Hargreaves L.  | HL Brand             | ~£30/SIPP signup | Pending  |               |               |
2026-05-15   | Awin     | AJ Bell        | AJ Bell SIPP         | ~£30/SIPP signup | Pending  |               |               |
2026-05-15   | Awin     | Interactive I. | ii SIPP              | tbc              | Pending  |               |               |
2026-05-15   | Awin     | Crunch         | Crunch Accounting    | tbc              | Pending  |               |               |
2026-05-15   | Awin     | FreeAgent      | FreeAgent SaaS       | tbc              | Pending  |               |               |
2026-05-15   | Awin     | Coconut        | Coconut              | tbc              | Pending  |               |               |
2026-05-15   | Impact   | Penfold        | Penfold              | tbc              | Pending  |               |               |
2026-05-15   | Impact   | PensionBee     | PensionBee Partner   | tbc              | Pending  |               |               |
2026-05-15   | Impact   | Tide           | Tide Business        | tbc              | Pending  |               |               |
2026-05-15   | Direct   | (other)        |                      |                  | Pending  |               |               |
```

Numbers in "Commission" column above are illustrative ranges only — the
real commission appears on the merchant's Awin/Impact page once approved.

---

## 10. Final note

The site is in genuinely strong shape. The hardest creative work
(calculators, optimisers, the 7-layer variance engine, the pillar guides)
is done. The work remaining in this playbook is **operational, not
creative** — it's the stuff that turns a good codebase into a sellable
asset.

The single most common failure mode at this stage is impatience. You
will be tempted, around week 2, to push "just a small tweak" to a calc
page, or "just one more batch of pSEO pages because indexing looks
healthy". Don't. Google's algorithm rewards URL and content stability
during the bedding-in period; the marginal value of one extra batch in
week 3 is negative.

Do this checklist, wait the four weeks, then summon the next AI agent
with `HANDOFF-PROMPT-MONTHS-3-6.md`. The site will be ready to compound
from there.

Good luck.
