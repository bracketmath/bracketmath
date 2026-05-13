# BracketMath — Execution Checklist

> **From here (domain not yet bought) to the finish line (£3,000/month).**
> Every step has a tick box. Tick them in order. Don't skip ahead.

**Companion to:** `MASTER-PLAN.md` (the strategy)
**This file:** the tactical execution path

---

## Legend

- **[ ]** = to do
- **[x]** = done
- **⏱** = expected time
- **💰** = expected cost
- **✅ Done when:** = clear definition of completion (no ambiguity)

---

# ✅ STEP 0 — Account hygiene (COMPLETE — 12 May 2026)

> **Why this mattered:** BracketMath is being built as a sellable asset (target: £300k–£700k exit). Sellable assets need clean separation from your other businesses (Optimal Chain). All BracketMath infrastructure now lives under a dedicated identity that you can hand over wholesale at sale time.

## Identity setup

- [x] **Dedicated Gmail for BracketMath** — `[email protected]`
- [x] **Dedicated GitHub user account** — `bracketmath` (registered to the new Gmail, separate from `optimalchain1`)
- [x] **Empty repo created** at `github.com/bracketmath/bracketmath` (initial typo `braketmath` renamed before pushing)
- [x] **Local code initialised as git repo and pushed** — `git init` → `git add .` → `git commit` → `git remote add origin` → `git push -u origin main`
- [x] **Auth migrated to new account** — old `optimalchain1` Windows cached creds cleared; `gh auth login` (web flow) completed as `bracketmath`. All future pushes silent.
- [x] **Dedicated Cloudflare account** created using `[email protected]`

**🎯 Step 0 milestone HIT: BracketMath is now fully separable from Optimal Chain — a future buyer takes the Gmail + GitHub password and they have everything.**

---

# ✅ WEEK 1 — Site live (COMPLETE — 12 May 2026)

## Day 1 — Domain & Cloudflare

- [x] **Cloudflare account created** under `[email protected]`
- [x] **Bought `bracketmath.co.uk`** via Cloudflare Registrar — $5.30/yr (~£4), auto-renew on, registered to "Luke Bell" with WHOIS privacy
- [x] **Domain added as Cloudflare zone** (automatic via registrar)

## Day 1 (continued) — Deploy pipeline

- [x] **Cloudflare project created** — set up as Workers + Static Assets (the modern successor to Pages), `bracketmath` project name
- [x] **Build configured** — Astro framework, `npm run build`, output `dist`, `NODE_VERSION=22`. Root directory `/` (Astro lives at repo root, not in subfolder as originally planned)
- [x] **First deploy succeeded** — preview URL `bracketmath.bracketmath2.workers.dev` loaded the homepage
- [x] **Cloudflare auto-generated PR merged** — added `@astrojs/cloudflare` adapter + `wrangler.jsonc` to the repo
- [x] **Local synced** — `git pull` pulled the adapter changes, `npm install` added 29 new packages, 0 vulnerabilities

## Day 1 (continued) — Custom domain

- [x] **Added `bracketmath.co.uk` + `www.bracketmath.co.uk`** as custom domains in the Workers project
- [x] **HTTPS auto-provisioned** by Cloudflare
- [x] **VERIFIED LIVE: `https://bracketmath.co.uk`** shows the homepage with padlock 🎉

## ✅ Day 2 — Search Console + analytics

- [x] **Google Search Console added & verified** — Domain property for `bracketmath.co.uk` verified via DNS TXT (Cloudflare one-click). Data starts flowing 24-72h.
- [ ] **Sitemap submission** — deferred to Week 6 when `@astrojs/sitemap` integration is installed. Submitting a 404 now is worse than waiting.
- [ ] **Confirm Cloudflare Web Analytics is active** ⏱ 5 min
  - Cloudflare → **Analytics → Web Analytics**
  - Confirm the site is being tracked (free, privacy-friendly, no cookie banner needed)
  - ✅ **Done when:** Web Analytics dashboard shows the site listed

## ✅ Day 2 (continued) — Legal/admin pages

- [x] **`/about` page** — written, deployed, anonymised. Focuses on methodology (HMRC rates, block-bootstrap Dimson-Marsh-Staunton, joint optimisation) rather than author credentials. No personal name, no unsubstantiable claims.
- [x] **`/disclaimer` page** — 8 numbered clauses covering no-advice / estimates-only / past-performance / HMRC rate changes / CMA-compliant affiliate disclosure / liability limitation / third-party links / get-advice-for-big-decisions. Anonymous.
- [x] **`/privacy` page** — UK GDPR + PECR compliant. No cookies, no tracking, calculator inputs stay in browser. Cloudflare Web Analytics declared. Cookie banner explicitly justified as unnecessary under PECR Reg 6(4)(b). Anonymous ("site operator" + contact email).

**🎯 End of Week 1 milestone HIT: live site at `bracketmath.co.uk` with about/disclaimer/privacy pages live and Search Console verified.**

---

# ✅ WEEKS 2–3 — Build the Salary–Dividend Split Optimiser (CODE COMPLETE — 12 May 2026)

This is the single most important calculator on the site. It's the headline page. It must be world-class.

## Step 1: Build the maths engine (no UI yet)

- [x] **Build `src/lib/tax/income-tax.ts`** — 24 tests passing
  - `incomeTax(taxableIncome, opts?)` returns `{ tax, breakdown, effectivePA, taxableAfterPA, averageRate, marginalRate }`
  - Handles PA taper above £100k correctly (and `additionalIncomeForPA` for joint taper with dividends)
  - Per-band breakdown returned for visualisation
  - Edge cases tested: £0, £12,570, £50,270, £100k, £110k, £125,140, £150k, £1M

- [x] **Build `src/lib/tax/ni.ts`** — 19 tests passing
  - `niEmployee(salary)` — Class 1 employee NI for 2026/27 (8% main, 2% above £50,270)
  - `niEmployer(salary, opts)` — Class 1 employer NI 15% with Employment Allowance support
  - `niSelfEmployed(profits)` — Class 2 (voluntary) + Class 4 (6% / 2%)

- [x] **Build `src/lib/tax/corp-tax.ts`** — 15 tests passing
  - Exact HMRC marginal-relief formula (`3/200 × (£250k − profits) × N/A` factor)
  - Handles `associatedCompanies` (divides thresholds) and short accounting periods
  - Boundary tests at £49,999 / £50,000 / £50,001 / £249,999 / £250,000 / £250,001

- [x] **Build `src/lib/tax/dividend.ts`** — 11 tests passing
  - Stacks above non-dividend income to determine band slices
  - £500 dividend allowance applied to lowest-taxed slice
  - 8.75% / 33.75% / 39.35% rates for 2026/27

- [x] **Build `src/lib/optim/salary-dividend.ts`** — 19 tests passing
  - Joint grid search over (salary, pension) — dividend is implied (max-extraction of post-CT profit)
  - Configurable `pensionWeight` slider (0 = cash-only, 1 = treat pension £ = cash £)
  - Returns `optimum`, `cashOptimum`, `ruleOfThumb` baseline (£12,570 salary, no pension), `salaryCurve` for charting, `warnings` (LEL / £100k taper / CT marginal-relief band)
  - For £140k profit: optimum yields **£31,698/yr better** than rule-of-thumb baseline

## Step 2: Build the UI

- [x] **Build `src/components/calculators/SalaryDividendSplit.tsx`**
  - Sidebar form with currency inputs, age, pension-weight slider, Employment-Allowance checkbox
  - Recomputes on every keystroke (optimiser runs in ~30-60ms)
  - Results panel: headline card (salary/dividend/pension/netCash/netWealth/effective tax rate)
  - Colour-coded tax-breakdown table (optimum vs rule-of-thumb, green/red Δ column)
  - Inline-SVG salary-vs-net-wealth curve with optimum marker (no external chart library)
  - Warnings panel + expandable assumptions/limitations
  - Fully responsive (single-column on mobile, sidebar layout on desktop)

- [x] **Build `src/pages/calculators/salary-dividend-split.astro`**
  - Page wrapper around the React component (`client:only="react"` to dodge Cloudflare-Workers/CJS-React dev incompatibility)
  - ~1,500 words of supporting copy: how-it-works, why £12,570 isn't always right (£100k taper, £50–250k marginal-relief band, £125,140 cliff), HMRC source links
  - No-JS fallback content for the React island
  - 🟡 **Still TODO before launch:** Schema.org `Article` + `HowTo` markup, 3+ affiliate links to Crunch/FreeAgent/Xero, internal links to (future) other calculators

## Step 3: Test, ship, verify

- [x] **Write Vitest unit tests** — **88 assertions total** (target was 50+)
  - 5 spec files in `bracketmath/src/lib/__tests__/`
  - **Note:** had to pin Vitest to ^3 — Vitest 4 has an internal config bug with Vite 7
  - `npm test` passes 88/88 in ~2 seconds

- [x] **Push to GitHub → auto-deploy → verify live** — Live at https://bracketmath.co.uk/calculators/salary-dividend-split

- [x] **Run Lighthouse audit (Mobile)** — **97 / 94 / 100 / 100**
  - Performance: **97** ✅
  - Accessibility: **94** 🟡 (one below 95 target — fixable: 1 heading-order issue + 1 contrast issue, ~10 min)
  - Best Practices: **100** ✅
  - SEO: **100** ✅
  - Captured 5:17 PM, 12 May 2026 on emulated Moto G Power, Lighthouse 13.0.2

- [ ] **Submit the URL to Google for indexing** ⏱ 2 min — *only manual step left*
  - Search Console → **URL Inspection** → paste calculator URL → **Request indexing**
  - ✅ **Done when:** Search Console says "URL submitted to Google"

**🎯 End of Week 3 milestone HIT: calculator live, mathematically correct, Lighthouse green (modulo one 94 sub-score), only URL indexing submission remaining.**

---

# ✅ WEEKS 4–5 — Calculator #2: SIPP Optimiser + Calculator #3: Take-Home (CODE COMPLETE — 12 May 2026)

Same template as the salary-dividend optimiser. Pattern repeated.

## SIPP Contribution Optimiser

- [x] **Source UK historical returns data**
  - 125 years (1900–2024) of UK equity TR, UK gilt TR, UK CPI inflation
  - Sourced from the Dimson-Marsh-Staunton / Barclays Equity Gilt Study series cross-referenced with ONS CPI and FTSE All-Share total-return data
  - Saved at `bracketmath/src/data/historical-returns.json` with provenance documented in `bracketmath/src/data/README.md`
  - Empirical UK equity real return ≈ 5.0%/yr, gilts ≈ 1.4%/yr — within published DMS bands

- [x] **Build `src/lib/montecarlo/rng.ts`** — 9 Vitest tests
  - Mulberry32 deterministic seeded PRNG (no Math.random anywhere in the engine)
  - Boundary tests for uniform / int-in-range distribution

- [x] **Build `src/lib/montecarlo/returns.ts`** — 28 Vitest tests
  - `blockBootstrap(opts)`: draws 12-month contiguous blocks from the historical series to preserve return autocorrelation (sequence-of-returns risk is the whole point)
  - Returns `yearsToSimulate × 12` real monthly returns net of CPI
  - Empirical mean / variance within 1 SE of input series at n=10,000

- [x] **Build `src/lib/montecarlo/simulate.ts`** — 27 Vitest tests
  - `simulateRetirement(opts)`: 10,000 paths through accumulation (age → retirement) and decumulation (retirement → age 95)
  - Returns 5/25/50/75/95 percentile fan of pot value, probability of pot exhaustion, probability of meeting target income with ≥ 95% confidence
  - Sanity test: 35yo, £50k pot, £20k/yr contribution, retire 65, £25k/yr target → median terminal pot inside £400k–£900k corridor
  - Determinism verified with seeded RNG (two runs produce identical results)

- [x] **Build `src/components/calculators/SippOptimiser.tsx`**
  - Sidebar inputs (age, pot, annual contribution, retirement age, target real income, equity weight)
  - Compute-on-submit button (10k paths is ~1.5s — no live-update)
  - Inline-SVG percentile fan chart, no new chart library
  - Probability headline cards (pot exhaustion + target-income success)
  - Warnings panel (Annual Allowance, AA taper, retiring before 57 SPA cliff, contribution > earnings)

- [x] **Build `src/pages/calculators/sipp-optimiser.astro`** — live at `/calculators/sipp-optimiser`
  - 1,500+ words of methodology copy (sequence-of-returns risk, why block bootstrap > Gaussian, Annual Allowance taper, what to do if probability of ruin is high)
  - HMRC + FCA source links inline
  - No-JS fallback content

## Take-Home Calculator (Inside vs Outside IR35)

- [x] **Build `src/lib/ir35/compare.ts`** — 28 Vitest tests
  - Reuses `income-tax.ts` + `ni.ts` + `corp-tax.ts` + `dividend.ts` + `optim/salary-dividend.ts` — no new tax library code
  - Inside-IR35 / umbrella PAYE route: day-rate × days → ER NI haircut → EE NI + PAYE, optional pension salary sacrifice
  - Outside-IR35 / Ltd Co route: turnover → expenses → run joint salary-dividend optimiser
  - Break-even inside-IR35 day rate via bisection (matches outside cash within £0.50)
  - Boundary tests at £49,999 / £50,000.01, £100k taper, £200k+ Annual Allowance taper, zero-day edge

- [x] **Build `src/components/calculators/TakeHome.tsx`**
  - Side-by-side comparison card (Inside vs Outside)
  - Headline: net take-home £/yr each, effective rate each, break-even day rate
  - Linked to the Salary–Dividend Split Optimiser as a "drill-down" CTA

- [x] **Build `src/pages/calculators/take-home.astro`** — live at `/calculators/take-home`
  - 1,200+ words of IR35 methodology copy (off-payroll-working rules, SDS, CEST, sensitivity to assumed expenses, explicit caveat that this is NOT a status determination)
  - HMRC ESM / ITEPA 2003 Chapter 10 source links

- [x] **Update the homepage hero CTAs to link to the three real calculator URLs**
  - `bracketmath/src/pages/index.astro` now links to all three live calculator pages (no more 404s)

**🎯 End of Week 5 milestone HIT: three world-class calculators live, 180/180 Vitest assertions passing, deployed via Cloudflare Workers.**

---

# ✅ WEEKS 6–8 — Pillar pages + affiliate network applications (CODE COMPLETE — 13 May 2026)

## Apply to affiliate networks (do these in parallel — most take 1–14 days for approval)

> **Status:** the five pillar pages ship with placeholder `<!-- AWIN: ... -->` and `<!-- IMPACT: ... -->` markers at every affiliate slot. Once the user is approved, swapping placeholder URLs for tracking URLs is a 30-minute find-and-replace. The applications themselves remain a manual step for the site owner.

- [ ] **Apply to Awin** ⏱ 30 min · 💰 £5 refundable deposit
  - https://www.awin.com/gb/publishers
  - You'll need: site URL, traffic estimate (be honest: "<1,000/m, new site"), niche description
  - ✅ **Done when:** approved (often instant for content sites)

- [ ] **Apply to Impact.com** ⏱ 30 min · 💰 £0
  - https://app.impact.com/secure/login.ihtml
  - Same info as Awin
  - ✅ **Done when:** approved (often 1–7 days)

- [ ] **Once Awin approved, apply to these advertisers within Awin:**
  - [ ] Crunch
  - [ ] FreeAgent
  - [ ] Tide
  - [ ] Starling Business
  - [ ] 1st Formations / Companies Made Simple
  - ✅ **Done when:** at least 3 of 5 are approved

- [ ] **Once Impact approved, apply to these brands within Impact:**
  - [ ] PensionBee
  - [ ] Penfold
  - ✅ **Done when:** at least 1 of 2 approved

- [ ] **Skip Hargreaves Lansdown / AJ Bell for now** — they reject new sites. Re-apply at month 12.

## Write the five pillar pages

Each pillar is 3,000–5,000 words, takes ~6–10 hours, includes embedded calculator widgets, 3+ affiliate links, and Schema markup.

- [x] **Pillar 1: "The complete UK contractor tax optimisation guide (2026/27)"**
  - Path: `/guides/uk-contractor-tax` — **LIVE**
  - 3,500+ words. Sole trader vs Umbrella vs Ltd Co with build-time-computed numbers from `optimiseSalaryDividend()` at £40k, £75k and £140k profit. Article + FAQ + Breadcrumb JSON-LD. 4 affiliate slots (Crunch, Tide × 2, FreeAgent).

- [x] **Pillar 2: "Ltd Co director's playbook"**
  - Path: `/guides/ltd-company-director-tax` — **LIVE**
  - 4,000+ words. The four-band salary decision, the £100k cliff, the £50k–£250k CT marginal-relief band, dividend stacking — with the optimiser run at £60k, £100k and £180k. Article + FAQ + Breadcrumb JSON-LD. Crunch + FreeAgent + 1st Formations affiliate slots.

- [x] **Pillar 3: "Self-employed pensions: SIPP, SSAS, stakeholder, mathematically"**
  - Path: `/guides/self-employed-pensions` — **LIVE**
  - 4,000+ words. Annual Allowance, taper, employer-vs-personal contribution mechanics, sequence-of-returns risk citing the live SIPP Monte Carlo at three ages × two pots. Article + FAQ + Breadcrumb JSON-LD. PensionBee + Penfold affiliate slots.

- [x] **Pillar 4: "IR35 in 2026: inside, outside, and the maths"**
  - Path: `/guides/ir35-explained` — **LIVE**
  - 3,800+ words. Ready Mixed Concrete tests, SDS, CEST, with `compareIR35()` driven at £400/£600/£850/day — break-even rate computed by bisection. Article + FAQ + Breadcrumb JSON-LD. Crunch affiliate slot.

- [x] **Pillar 5: "The mathematically optimal UK retirement portfolio"**
  - Path: `/guides/optimal-uk-retirement-portfolio` — **LIVE**
  - 4,500+ words. Allocation comparison (30/60/90) and withdrawal-rate stress test (3.0/3.5/4.0%), Monte Carlo run at build time. The 4% rule's UK problems documented. Article + FAQ + Breadcrumb JSON-LD. PensionBee + Penfold affiliate slots.

## Generate the XML sitemap

- [x] **Install `@astrojs/sitemap` integration**
  - `npm install @astrojs/sitemap` done. Added to `astro.config.mjs` with `site: 'https://bracketmath.co.uk'`, weekly changefreq, priority 0.7, and a draft/preview filter.
  - ✅ **Verified:** `npm run build` produces `dist/client/sitemap-index.xml` and `dist/client/sitemap-0.xml` listing all 13 public URLs.

- [ ] **Re-submit sitemap to Search Console** ⏱ 5 min
  - https://search.google.com/search-console → Sitemaps → submit `https://bracketmath.co.uk/sitemap-index.xml`
  - ✅ **Done when:** Search Console shows "Success" for the sitemap fetch

## Schema markup for existing calculators

- [x] **Article + HowTo + BreadcrumbList JSON-LD added** to all three calculator pages via shared `<JsonLd>` component (`src/components/JsonLd.astro`). Schema validated by parsing the rendered HTML against schema.org structure.

**🎯 End of Week 8 milestone: 3 calculators + 5 pillars live, sitemap built, schema markup on every public page, 180/180 tests passing.**


---

# ✅ WEEKS 8–12 — First 200 programmatic pages + Calculator #4 + backlink playbook (CODE COMPLETE — 13 May 2026)

## Programmatic page generator (Deliverables A + B + C)

- [x] **Designed `src/data/pages.csv` schema**
  - Columns finalised: `slug, profession, profession_label, gross_income, age, age_band, structure, ir35_status, pension_pref, other_income, region, persona`
  - Schema documented at the top of the CSV and in `src/lib/pseo/types.ts`

- [x] **Populated first 200 rows of `pages.csv`** (exact, hand-curated, no random generation)
  - All three personas represented: Optimiser (Ltd Co director / contractor), Lifestyle SE (sole-trader tradespeople / freelancers), Pre-retiree (Ltd Co director 50+ approaching SIPP drawdown)
  - All three structures represented: `ltd_co` (~110 rows), `sole_trader` (~55 rows), `umbrella` (~20 rows), plus PAYE + side-income rows (~15)
  - High-search-volume combos: software-contractor-ltd-outside-ir35 across £60k → £220k in £15-25k steps; umbrella-inside-IR35 day-rate variants £400 → £1000; sole-trader tradespeople £25k → £85k
  - Region: all rows use `eng_ni_wales` for Batch 1 (Scotland intentionally deferred — see "Don'ts" in HANDOFF-PROMPT-WEEKS-8-12.md § 7)

- [x] **Built `src/pages/pay/[...slug].astro`** with the full 7-layer variance engine (`MASTER-PLAN.md` Section 11.5):
  - **Layer 1** — unique computed numerics. Every row calls one of: `optimiseSalaryDividend()` (Ltd Co), `incomeTax()` + `niSelfEmployed()` (sole trader + PAYE+side), `compareIR35()` (umbrella inside-IR35). Engines live in `src/lib/pseo/compute.ts`.
  - **Layer 2** — **10 narrative templates** in `src/lib/pseo/templates.ts`: scenario-led, mechanism-led, comparison-led, warning-led, stepwise, FAQ-style, case-study, rule-of-thumb-debunk, decision-tree, history-of-bracket. Picked per row by `hash(slug) mod templates.length` from `src/lib/pseo/hash.ts`.
  - **Layer 3** — **50 FAQs** in `src/lib/pseo/faqs.ts`, tagged by persona / structure / income band. Each page draws 4–6 FAQs whose tags match the row.
  - **Layer 4** — "Why your situation is different" computed paragraph: each row reports the absolute and percentage delta vs the rule-of-thumb baseline for the same structure + income band, computed from the optimiser output, not hand-written.
  - **Layer 5** — comparison table rows selected by persona. Optimiser pages get (salary, dividend, pension) breakdown vs the rule-of-thumb baseline. Lifestyle pages get net-cash / hours-equivalent breakdown. Pre-retiree pages get a build-time SIPP projection table.
  - **Layer 6** — 5 most-similar internal links per page, computed by a simple distance function over (profession, income, structure) in `src/lib/pseo/render.ts`. Forces a genuine cross-link graph rather than a uniform link target.
  - **Layer 7** — per-persona JSON-LD. Optimiser pages get an additional `HowTo` block; lifestyle pages get nothing extra; pre-retiree pages get a `FinancialProduct` block. All pages get `Article` + `FAQPage` + `BreadcrumbList` via the shared `<JsonLd>` component.
  - `/pay/index.astro` index page lists all 200 with grouping by persona.
  - Build time: **~12 seconds for 200 pages** (well inside the 60-second budget).

- [x] **Calculator #4 — Sole Trader Tax** (Deliverable E) live at `/calculators/sole-trader-tax`
  - Engine: `src/lib/optim/sole-trader.ts` reuses `incomeTax()` and `niSelfEmployed()`. Class 2 voluntary contributions logic preserved.
  - Trading-allowance vs actual-expenses decision: optimiser picks £1,000 trading allowance when expenses < £1,000 + Class 4 NI impact.
  - "Should I incorporate?" — compares sole-trader against Ltd Co at same gross income via `optimiseSalaryDividend()`. Outputs the break-even profit level by bisection.
  - **21 new Vitest assertions** (`src/lib/__tests__/sole-trader.test.ts`), total now **201/201 passing**.
  - React island UI (`src/components/calculators/SoleTraderTax.tsx`), Schema markup via shared `<JsonLd>`.

- [x] **Self-hosted Google Fonts** (Deliverable F)
  - `scripts/download-fonts.mjs` downloads Inter 400/500/600/700 and JetBrains Mono 400/500 woff2 files (Latin subset) from `fonts.gstatic.com` into `public/fonts/`.
  - `@font-face` rules registered in `src/styles/global.css` with `font-display: swap`.
  - Google Fonts `<link rel="stylesheet">` and the two `preconnect` lines removed from `Layout.astro`. Replaced with two `preload` lines for the regular-weight Inter faces.
  - Total font payload ~ 256 KB (6 files), all served same-origin under Cloudflare's cache.
  - Net Lighthouse Performance improvement to be measured on the live URL by the operator (see § C below).

- [x] **Backlink playbook drafted** (Deliverable D) — `BACKLINK-PLAYBOOK.md` at the workspace root contains:
  - 20 specific UK personal-finance / contracting / pensions journalist + outlet targets, tiered by leverage.
  - Three reusable pitch templates: "methodology", "we ran 200 personas — here's what's surprising", "this commonly-cited rule is wrong".
  - Five UK personal-finance blog guest-post drafts (Monevator, Banker on FIRE, Be Clever With Your Cash, an active UK-FIRE blog of the operator's choosing, Finumus).
  - A tracking-spreadsheet schema, Reddit / Bluesky / Twitter cadence, and quarterly review cadence.

## 🟠 INDEXING GATE — DO NOT EXCEED 200 PROGRAMMATIC PAGES UNTIL THIS REPORTS ≥ 50% INDEXED

> Per `MASTER-PLAN.md` Section 9 Phase 4b. **This is the single most important
> guardrail in the whole project.** Sandboxing happens because we shipped low-
> quality content faster than Google could verify quality. Adding Batch 2
> before Batch 1 is indexed will tank the whole site.

### How to monitor — operator instructions

- [ ] **Push the Batch 1 commit and wait 7 days** before doing anything else
  with `/pay/`.
- [ ] **At day 7**, Search Console → "Pages" → "All known pages" → filter on
  URL contains `/pay/`. Note the count of "Indexed" pages.
- [ ] **Repeat at day 14, day 21, day 28.** The trend matters more than any
  single number — indexed count should be monotonically increasing.
- [ ] **Indexing-rate threshold for Batch 2:** ≥ 100 of the 200 pages
  reported as indexed (50%). MASTER-PLAN.md Section 9 Phase 4b uses 50% as
  the gate threshold for Batch 2.
- [ ] **If at day 28 the indexing rate is < 30%**, *do not* add Batch 2.
  Instead audit the variance: pick 10 random `/pay/` pages, confirm they
  are visibly different (template, FAQ subset, internal links). Open
  Search Console "Crawl stats" and inspect for `noindex` / `404` / soft
  404 / `Excluded by robots.txt` reasons. Fix whatever is throttling, push
  the fix, *then* reset the 4-week observation window.

### Why "no more than 200" matters

The competitor calibration in `strategic-recommendation.md` is unambiguous:
duplicate-content sandboxing is *the* failure mode for new programmatic UK
finance sites in 2024–2026. The 7-layer variance model exists specifically
to defeat this signal. Adding more pages before Google has verified the
existing 200 dilutes the signal-to-noise ratio.

## Start the backlink engine

- [ ] **Sign up for HARO (Help A Reporter Out / Featured)** ⏱ 10 min · 💰 £0
  - https://featured.com  (HARO was acquired and rebranded as Featured)
  - ✅ **Done when:** receiving 3 daily emails of journalist queries
  - Use the pitch templates in `BACKLINK-PLAYBOOK.md` § 4

- [ ] **Reply to 3–5 Featured / Qwoted queries per week** ⏱ 30 min/reply
  - Filter for UK personal finance, tax, contracting, pensions
  - Use the "methodology" template from `BACKLINK-PLAYBOOK.md` § 4.1
  - Goal: 1 pickup per month in months 2–4, 2–3 per month thereafter
  - ✅ **Done when:** first journalist quotes you with a backlink

- [ ] **Create a Reddit account if you don't have one with karma** ⏱ ongoing
  - Spend 2 weeks lurking and commenting genuinely (no link drops)
  - Build to 100+ karma on /r/UKPersonalFinance, /r/contracting, /r/FIREUK
  - Once trusted, link to a calculator only when *genuinely* the most helpful answer
  - See `BACKLINK-PLAYBOOK.md` § 7 for cadence rules
  - ✅ **Done when:** 200+ karma across the relevant subreddits

- [ ] **Set up Bluesky + Twitter/X accounts `@bracketmath`** ⏱ 30 min · 💰 £0
  - Two posts per week each: surprising calculator findings, sourced
  - Same content, separate accounts (Bluesky is now higher-engagement for UK PF)
  - ✅ **Done when:** account is active and looks like a real expert

**🎯 End of Week 12 milestone HIT: 200 programmatic pages built, Calculator #4 live, fonts self-hosted, backlink playbook drafted.**

---

# MONTHS 3–6 — Tiered pSEO expansion (gated)

**The critical rule from `MASTER-PLAN.md` Section 9 Phase 4b: only add the next batch of pages if the previous batch is indexing above the threshold. If indexing drops, STOP and audit variance.**

## Indexing check before every batch

- [ ] **Weekly: check Search Console → Coverage → Valid pages**
  - Compare against total pages submitted in sitemap
  - Compute indexing rate = valid / submitted
  - ✅ **Always done before adding more pages**

## Batch 2 — Month 4 (+500 pages → 700 total)

- [ ] **Indexing gate check:** is the 200-seed batch ≥80% indexed?
  - YES → proceed
  - NO → audit variance, improve the 7-layer model, do not expand

- [ ] **Expand `pages.csv` to 700 rows** ⏱ 4 hours
  - Add 500 more personas
  - Increase narrative template pool from 10 to 15
  - Increase FAQ pool from 50 to 80
  - ✅ **Done when:** build produces 700 unique pages

- [ ] **Push & wait 4 weeks** ⏱ passive

## Batch 3 — Month 5 (+1,500 pages → 2,200 total)

- [ ] **Indexing gate check:** is Batch 2 ≥75% indexed?
- [ ] **Add region variants (Scotland tax bands, Wales, NI)** ⏱ 6 hours
  - 1,500 new rows in `pages.csv`
  - ✅ **Done when:** 2,200 pages live

## Batch 4 — Month 6 (+2,500 pages → 4,700 total)

- [ ] **Indexing gate check:** is Batch 3 ≥70% indexed AND ≥1,000 monthly organic clicks?
- [ ] **Add time-series persona pages** ("your optimal pay over the next 5 years") ⏱ 8 hours
  - ✅ **Done when:** 4,700 pages live

## Backlink work continues (still 1–2 hours per week)

- [ ] **Reply to HARO 3–5× per week** (ongoing)
- [ ] **Write 1 guest post per month** — target Monevator, Banker on FIRE, Mr. Money Mustache UK ⏱ 6 hours/month
- [ ] **Reddit answers — 2 per week max, only when genuinely best answer**
- [ ] **Twitter — 2 tweets per week**

## Add Calculator #4 in Month 4, #5 in Month 5, #6 in Month 6

Same template as the first three. One per month.

- [ ] **Month 4 calculator: Self-Employed Sole Trader Tax** ⏱ 1 week of evenings
- [ ] **Month 5 calculator: Should I Incorporate? (sole trader → Ltd Co break-even)** ⏱ 1 week
- [ ] **Month 6 calculator: VAT Scheme Selector** ⏱ 1 week

**🎯 End of Month 6 milestone: 4,700 pages, 6 calculators, 5 pillar pages, ~1,500 visitors/m, ~£150/m revenue.**

(Yes, revenue is small here. The YMYL sandbox is still active. Section 6.5 of `MASTER-PLAN.md` calibrated for this. Don't panic.)

---

# MONTHS 6–9 — Sandbox lifts, growth accelerates

## Batch 5 — Month 7 (+3,000 pages → ~7,700 total)
## Batch 6 — Month 9 (+5,000 pages → ~12,000 total)

- [ ] **Same gate checks each time**
- [ ] **One new calculator per month** (R&D Tax Credit, Capital Allowances, HICBC, Marriage Allowance)
- [ ] **Continue HARO + guest posts + Reddit (now have some authority)**

## Newsletter launch — Month 7

- [ ] **Add email capture to every page** ⏱ 2 hours
  - Use Resend or Buttondown or ConvertKit free tier
  - Simple bar/popup: "Monthly UK tax & pension optimisation tips. No fluff."
  - ✅ **Done when:** email capture is on every page and works end-to-end

- [ ] **Send your first newsletter** ⏱ 4 hours
  - Even if you have 20 subscribers
  - One genuinely useful insight per month
  - ✅ **Done when:** first send goes out

## Re-apply to premium affiliates — Month 9

- [ ] **Apply to Hargreaves Lansdown** ⏱ 1 hour
- [ ] **Apply to AJ Bell** ⏱ 1 hour
- [ ] **Apply to Interactive Investor** ⏱ 1 hour
  - You now have 6+ months of traffic data → much higher approval odds
  - ✅ **Done when:** at least one of the three is approved

**🎯 End of Month 9 milestone: ~12,000 pages, ~8,000 visitors/m, ~£700/m revenue, newsletter started, sandbox lifting.**

---

# MONTHS 9–15 — The push to £3,000/m

This is the home stretch. The mathematical moat now starts paying because Google trusts you enough to rank you alongside the big sites.

## Batch 7 — Month 12 (+12,000 pages → ~25,000 total)

- [ ] **Indexing gate check:** ≥60% indexed and ≥30k monthly clicks?

## Calculators per month: keep going

- [ ] **Month 10: Pension Lump Sum (LSA) Optimiser**
- [ ] **Month 11: LISA vs SIPP Comparison**
- [ ] **Month 12: CGT Planner**
- [ ] **Month 13: BTL Yield Calculator (with Section 24)**
- [ ] **Month 14: SDLT Calculator**
- [ ] **Month 15: IHT Estimator**

## Apply to Mediavine for display ads (when traffic hits 50k/m)

- [ ] **Mediavine application** ⏱ 1 hour
  - https://www.mediavine.com/apply/
  - Required: 50,000 sessions in the trailing 30 days
  - Expected approval: 30–60 days
  - ✅ **Done when:** approved + ad code installed
  - Adds £15–£35 RPM = potentially £750–£1,750 extra per 50k visitors

## Direct affiliate outreach for the £100+ products

- [ ] **Reach out to Wealthify, Moneybox, Vanguard UK for direct affiliate deals** ⏱ 2 hours per outreach
  - Once you have ~30k visitors/m, these become viable
  - Direct deals often pay 2× the network rate
  - ✅ **Done when:** at least 1 direct deal in place

**🎯 Month 12–15 milestone: £2,400–£3,200/month revenue. THE £3K/M TARGET HIT.**

---

# After the finish line — Months 15+

You hit £3k/m. The site now runs on 6 hours/week of maintenance. From here, three optional paths:

## Path A: Keep building → £10k–£20k/m

- [ ] Add 1 calculator per month forever
- [ ] Add 10,000 programmatic pages per quarter (gated)
- [ ] Apply to Raptive (premium display network, 100k+ sessions)
- [ ] Launch quarterly sponsored newsletter (£200–£800 per send)
- [ ] Hit £10k/m around month 18, £20k/m around month 24

## Path B: Maintain at £3k/m → pure income

- [ ] Annual tax update each April (4 hours of work)
- [ ] Weekly Search Console check (15 min)
- [ ] HARO replies (1 hour/week)
- [ ] **Total ongoing time: 4–6 hours/week for £3k/m forever**

## Path C: Sell the asset

- [ ] **Month 18+ minimum** — buyers want a 12-month track record
- [ ] List on Empire Flippers (10% commission) or Acquire.com
- [ ] Expected sale price: 30–35× monthly profit
- [ ] At £3k/m profit, that's £90k–£105k cash
- [ ] At £10k/m profit (month 18 target), that's £300k–£350k
- [ ] At £20k/m (month 24 target), that's £600k–£700k

---

# Weekly cadence summary (so you know what "a week of work" looks like)

## Months 1–3 (build sprint)
- 15–25 hours per week
- Almost all coding + writing pillar pages

## Months 3–6 (expansion + backlinks)
- 8–12 hours per week
- 1 new calculator per month (6 hours)
- 2 hours backlinks (HARO + Reddit + guest posts)
- 2 hours pSEO batch additions

## Months 6–12 (compound mode)
- 6–8 hours per week
- 1 new calculator per month
- Backlinks + newsletter

## Months 12+ (maintenance mode)
- 4–6 hours per week
- Quarterly tax update, newsletter, HARO replies
- Watch the £ accumulate

---

# Quick reference: every paid expense across the whole 15-month journey

| Item | Cost | When |
|---|---:|---|
| Domain `bracketmath.co.uk` | £8 | Day 1 |
| Cloudflare Pages | £0 | Always free |
| GitHub | £0 | Always free |
| Awin deposit | £5 (refundable) | Week 6 |
| Ahrefs trial (optional) | £99 | Month 1–2 only |
| Email (Resend free tier) | £0 | Month 7+ |
| Plausible Analytics (optional) | £9/m | Month 7+ |
| One-off PPC validation experiment | £200–£400 | Month 3–4 (OPTIONAL) |
| Sponsored newsletter send to Monevator (optional) | £300–£500 | Month 9+ (OPTIONAL) |
| **Total spend over 15 months** | **£100–£800** | depending on optional items |

---

# The mental model

**Your job for the next 90 days:** ship code and write content.
**Your job for months 3–9:** add pages slowly, build backlinks, wait for Google's sandbox to lift.
**Your job for months 9–15:** ride the compounding curve and hit £3k/m.
**After that:** decide whether to keep building, maintain, or sell.

**Don't:**
- Skip ahead in this checklist
- Add pages faster than the indexing gate allows
- Buy expensive PPC traffic (see chat — it's a trap)
- Pivot before month 9 unless catastrophic signal
- Talk to customers (this is a no-human-interaction business)

**Do:**
- Tick boxes in order
- Update this file as you complete things
- Re-read `MASTER-PLAN.md` Section 6.5 when you panic in month 4 about low traffic (you will)
- Trust the maths moat — it's real and durable

---

# 🎯 Current status (13 May 2026, end of session 5 — Weeks 8–12 code complete)

## ✅ DONE
- ✅ **Step 0** — account hygiene (Gmail, GitHub user `bracketmath`, Cloudflare account)
- ✅ **Week 1** — domain live, deploy pipeline, HTTPS, Search Console, `/about` + `/disclaimer` + `/privacy`
- ✅ **WEEKS 2–3** — Salary–Dividend Split Optimiser **LIVE + LIGHTHOUSE 97/94/100/100**
- ✅ **WEEKS 4–5** — SIPP Monte Carlo Optimiser + IR35 Take-Home Calculator **LIVE**
- ✅ **WEEKS 6–8** — Five pillar guides + sitemap + Schema markup **LIVE**
- ✅ **WEEKS 8–12** — 200 programmatic `/pay/*` pages + Calculator #4 + self-hosted fonts + backlink playbook **CODE COMPLETE**:
  - `src/data/pages.csv` — 200 hand-curated rows across all three personas, three structures, English/NI/Welsh tax regime only
  - `src/pages/pay/[...slug].astro` + `src/pages/pay/index.astro` — full 7-layer variance engine (10 templates × 50 FAQs × persona-specific tables, links, JSON-LD)
  - `src/lib/pseo/` — types, hash, compute, templates, faqs, render, load — all engine-driven, no static lookup
  - `/calculators/sole-trader-tax` — Calculator #4 live with trading-allowance-vs-actual-expenses optimiser + "should I incorporate?" break-even
  - Inter + JetBrains Mono self-hosted from `public/fonts/`; Google Fonts `<link>` removed; preload added for above-the-fold faces
  - `BACKLINK-PLAYBOOK.md` — 20 outreach targets, 3 pitch templates, 5 guest-post drafts, tracking-spreadsheet schema, indexing-gate-aware cadence
  - Build clean: **214 prerendered pages** (13 site pages + 200 programmatic + sitemap), **201/201 Vitest assertions passing**, zero warnings
  - Build time: **~21 seconds total**, of which **~12 seconds for the 200 programmatic pages** (well inside the 60-second budget)

## 🟠 INDEXING GATE — operator must monitor before any further programmatic expansion

See the dedicated section above (under "✅ WEEKS 8–12"). **Summary: push Batch 1 (these 200 pages), then wait 4 weeks before doing anything else with `/pay/`.** Threshold for Batch 2 is ≥ 50% of the 200 pages indexed in Search Console. Less than 30% indexed at day 28 means stop and audit the variance model.

## 🟢 MANUAL STEPS LEFT FOR THE SITE OWNER

### A. Apply to Awin + Impact (the only block on revenue going live)
- [ ] Awin publisher signup — https://www.awin.com/gb/publishers (£5 refundable deposit)
- [ ] Impact publisher signup — https://app.impact.com (£0)
- [ ] Awin advertisers, once approved: Crunch, FreeAgent, Tide, Starling Business, 1st Formations
- [ ] Impact advertisers, once approved: PensionBee, Penfold

### B. Submit URLs + sitemap to Google Search Console
- [ ] Sitemaps panel → submit `https://bracketmath.co.uk/sitemap-index.xml` (now includes the 200 `/pay/*` URLs + Calculator #4)
- [ ] URL Inspection → request indexing for the top 20 programmatic pages (the highest-search-volume `/pay/*` rows by income band)
- [ ] URL Inspection → request indexing for `/calculators/sole-trader-tax`
- [ ] URL Inspection → request indexing for `/pay/` index

### C. Re-run Lighthouse on the live URL across a sample of pages
- [ ] Three calculator pages (incl. `/calculators/sole-trader-tax`)
- [ ] Five guide pages
- [ ] Five random `/pay/*` pages (pick one per persona/structure mix). Suggested:
  - `/pay/software-contractor-ltd-outside-ir35-140k` (optimiser, mid)
  - `/pay/software-contractor-umbrella-inside-ir35-500-day-rate` (umbrella inside)
  - `/pay/electrician-sole-trader-50k` (lifestyle SE)
  - `/pay/freelance-developer-sole-trader-90k` (lifestyle SE, high-income)
  - `/pay/senior-it-contractor-ltd-outside-ir35-200k-aged-52` (pre-retiree)
- Target **Performance ≥ 95** (font self-hosting should give roughly +5 to performance on mobile).
- Log the scores back here under § E.

### D. Confirm Cloudflare Web Analytics is firing
- [ ] Cloudflare dashboard → Web Analytics → confirm `bracketmath.co.uk` is listed and accruing pageviews.

### E. Lighthouse log (operator-filled)

| URL | Performance | Accessibility | Best Practices | SEO | Captured |
|---|---:|---:|---:|---:|---|
| `/calculators/salary-dividend-split` | _ | _ | _ | _ | _ |
| `/calculators/sipp-optimiser` | _ | _ | _ | _ | _ |
| `/calculators/take-home` | _ | _ | _ | _ | _ |
| `/calculators/sole-trader-tax` | _ | _ | _ | _ | _ |
| `/guides/uk-contractor-tax` | _ | _ | _ | _ | _ |
| `/guides/ltd-company-director-tax` | _ | _ | _ | _ | _ |
| `/guides/self-employed-pensions` | _ | _ | _ | _ | _ |
| `/guides/ir35-explained` | _ | _ | _ | _ | _ |
| `/guides/optimal-uk-retirement-portfolio` | _ | _ | _ | _ | _ |
| `/pay/software-contractor-ltd-outside-ir35-140k` | _ | _ | _ | _ | _ |
| `/pay/software-contractor-umbrella-inside-ir35-500-day-rate` | _ | _ | _ | _ | _ |
| `/pay/electrician-sole-trader-50k` | _ | _ | _ | _ | _ |
| `/pay/freelance-developer-sole-trader-90k` | _ | _ | _ | _ | _ |
| `/pay/senior-it-contractor-ltd-outside-ir35-200k-aged-52` | _ | _ | _ | _ | _ |

## 🟡 Polish items still outstanding (will fold into Months 3–6)

- [ ] **Schema validation in production.** Run each live page through https://validator.schema.org and https://search.google.com/test/rich-results to confirm Article + FAQPage + HowTo + BreadcrumbList are picked up correctly. The component output has been spot-checked but third-party validation is the gold standard. Especially important for the new `/pay/*` pages where Layer 7 emits a persona-specific JSON-LD block.
- [ ] **Swap affiliate placeholders for tracking URLs** once Awin / Impact are approved.
- [ ] **Scotland tax bands** — currently deferred. Adding `region: 'scotland'` rows requires implementing the full Scottish rates (Starter 19% / Basic 20% / Intermediate 21% / Higher 42% / Top 47% with the £125,140 cap). Plan: add to Batch 2 only after Scottish band schedule is unit-tested.

## 🚀 NEXT MAJOR SESSION — see `HANDOFF-PROMPT-MONTHS-3-6.md`

A fresh handoff document for the next AI agent has been created at the workspace root:
**`HANDOFF-PROMPT-MONTHS-3-6.md`** — covers **Batches 2–4 of programmatic pages (gated on indexing rate)**, **Calculators #5 (Should I Incorporate?) and #6 (VAT Scheme Selector)**, **newsletter launch**, and **the start of the guest-post + HARO campaign per `BACKLINK-PLAYBOOK.md`**.

### What you built this session, in plain English

**200 programmatic pages at `/pay/*`** that are world-class by the same standard as the pillars: every numeric claim on every page is computed at build time by one of `optimiseSalaryDividend()`, `compareIR35()`, `incomeTax()` or `niSelfEmployed()`. None of them are static lookup tables. They are differentiated by the 7-layer variance model from MASTER-PLAN.md Section 11.5: 10 narrative templates, a 50-question FAQ pool tag-matched to (persona, structure, income band), persona-specific comparison tables, persona-specific Schema.org, and 5 most-similar internal links computed by a distance function over (profession, income, structure).

**Calculator #4 — Sole Trader Tax** answers the two questions sole-trader readers actually search for: "should I take the £1,000 trading allowance or claim my real expenses?" and "should I incorporate as a Ltd Co?". The trading-allowance decision is dominated by Class 4 NI mechanics; the incorporation decision is dominated by the £50k–£250k CT marginal-relief band — both are computed not estimated.

**Self-hosted Google Fonts.** The `<link>` to `fonts.googleapis.com` is gone. Latin-subset Inter (400/500/600/700) and JetBrains Mono (400/500) serve from `public/fonts/` under Cloudflare's cache. Above-the-fold faces are preloaded. Net Lighthouse Performance improvement is expected to be 3–5 points on mobile and to remove the "preconnect to third-party origins" diagnostic.

**Backlink playbook** is a 10-section operator document covering everything from the tracking-spreadsheet schema, through three reusable pitch templates with the actual subject lines, to five guest-post drafts ready to send. It is calibrated for the indexing-gate observation period so the operator has a productive task during the 4-week wait.

All 201 unit tests pass. `npm run build` produces 214 pages (13 site + 200 programmatic + sitemap) in ~21 seconds, zero warnings, sitemap regenerated.


