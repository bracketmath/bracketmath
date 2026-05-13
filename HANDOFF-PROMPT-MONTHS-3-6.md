# Handoff prompt — BracketMath, Months 3–6 (Batches 2–4 + Calculators #5 + #6 + newsletter)

> **How to use this file:** Copy everything below the next horizontal rule (`---`)
> into a fresh AI coding agent (Cline / Claude / Cursor / Codex / etc.). It
> contains every piece of context that agent needs to take over from the
> Weeks 8–12 session.

---

# BracketMath — Mission, context, and your task

## 1. Who you are and what you are building

You are a senior software engineer + financial-numeracy specialist + SEO-aware
long-form writer taking over an in-progress build of **BracketMath** — a UK
personal-finance calculator site at [bracketmath.co.uk](https://bracketmath.co.uk).

The strategic objective is unchanged: build a sellable digital asset that
reaches **£3,000/month in passive affiliate revenue within 15 months** and is
then maintained as income or sold for **£300k–£700k** on Empire Flippers /
Acquire.com.

The competitive moat is unchanged: **mathematical correctness and depth**.
Every page either cites HMRC / FCA / ONS / DWP / OBR / Bank of England, or
computes its numbers from one of the engines (`incomeTax`,
`optimiseSalaryDividend`, `simulateRetirement`, `compareIR35`,
`optimiseSoleTrader`). YMYL means no estimation, no hallucination, no shortcuts.

## 2. What's already done (don't redo any of this)

**Four live calculators:**
- `/calculators/salary-dividend-split`
- `/calculators/sipp-optimiser`
- `/calculators/take-home`
- `/calculators/sole-trader-tax` *(Weeks 8–12 — Calculator #4)*

**Five live pillar guides:**
- `/guides/uk-contractor-tax`
- `/guides/ltd-company-director-tax`
- `/guides/self-employed-pensions`
- `/guides/ir35-explained`
- `/guides/optimal-uk-retirement-portfolio`

**200 live programmatic pages** at `/pay/[...slug]` driven from
`src/data/pages.csv` (200 hand-curated rows). The 7-layer variance engine
(MASTER-PLAN.md Section 11.5) is implemented under `src/lib/pseo/`:

- **Layer 1** — every numeric on every page is engine-computed at build time.
- **Layer 2** — `src/lib/pseo/templates.ts` has **10 narrative templates**.
- **Layer 3** — `src/lib/pseo/faqs.ts` has a **50-Q&A pool** tag-matched to
  (persona, structure, income band).
- **Layer 4** — a "why your situation is different" computed paragraph.
- **Layer 5** — persona-specific comparison tables.
- **Layer 6** — 5 most-similar internal links per page via distance over
  (profession, income, structure).
- **Layer 7** — per-persona JSON-LD (Optimiser → `HowTo`; Pre-retiree →
  `FinancialProduct`; Lifestyle → none extra).

**Operational artefacts already in the repo:**
- `BACKLINK-PLAYBOOK.md` at the workspace root with 20 outreach targets,
  three pitch templates and five guest-post drafts.
- Shared `<JsonLd>` Astro component at `src/components/JsonLd.astro`.
- Self-hosted Inter + JetBrains Mono in `public/fonts/`. No Google Fonts
  `<link>` remains.
- `@astrojs/sitemap` produces `dist/client/sitemap-index.xml` covering all
  214 prerendered pages.

**Build / test status:** `npm run build` succeeds with zero warnings,
`npm test` reports **201/201 Vitest assertions passing**, total build time
~ 21 seconds (~12 seconds for the 200 `/pay/*` pages).

## 3. Required reading before you write any code

Read these files at the workspace root **in this order**, in full:

1. **`MASTER-PLAN.md`** — the full 15-month strategy. Pay particular attention to:
   - **Section 6.5** (the YMYL sandbox and why programmatic expansion is gated)
   - **Section 9 Phases 4b → 4c → 4d** (gated programmatic expansion — the indexing-rate gate is the single hardest rule in your scope)
   - **Section 11.5** (the 7-layer variance model — you'll extend it to 15 templates and 80 FAQs in Batch 2)
   - The three personas (Optimiser / Lifestyle SE / Pre-retiree)
2. **`CHECKLIST.md`** — your scope is **MONTHS 3–6**. Read § "🟠 INDEXING
   GATE" carefully. **The indexing gate is the most important rule in your
   scope. Do not violate it.**
3. **`BACKLINK-PLAYBOOK.md`** — drafted by the previous agent. You are not
   the operator — you do not execute outreach — but you will reference this
   file when adding any "we computed X" data finding to the newsletter or
   to the next batch of programmatic pages.
4. **`strategic-recommendation.md`** — competitor calibration. Re-read the
   duplicate-content threshold section in light of expanding to 700+ pages.
5. **`PLAN.md`** + **`SETUP-WALKTHROUGH.md`** — infrastructure baseline.
6. **`HANDOFF-PROMPT-WEEKS-8-12.md`** (the previous handoff) — same target
   format, useful as a reference for how the previous agent operated.
7. **The existing code under `bracketmath/src/`** before writing anything new:
   - `bracketmath/src/lib/pseo/` — the 7-layer variance engine. **Mirror this
     pattern** when adding new templates / FAQs / persona logic.
   - `bracketmath/src/lib/optim/sole-trader.ts` — Calculator #4's engine
     (you'll reuse its incorporation-break-even logic for Calculator #5).
   - `bracketmath/src/lib/tax/*` and `bracketmath/src/lib/optim/salary-dividend.ts`.
   - `bracketmath/src/pages/pay/[...slug].astro` + `src/pages/pay/index.astro`.
   - `bracketmath/src/pages/calculators/sole-trader-tax.astro` and
     `src/components/calculators/SoleTraderTax.tsx` — pattern for Calc #5/#6.
   - `bracketmath/astro.config.mjs` and `bracketmath/src/layouts/Layout.astro`.

## 4. The bar you must clear

Set by previous sessions:
- 201/201 unit tests passing, clean build, zero warnings.
- £31,698/yr better than the rule-of-thumb baseline at £140k.
- 10,000-path Monte Carlo with seeded RNG and exhaustion probability.
- Five world-class pillar pages.
- 200 programmatic pages — Layer-1 numerics from real engine calls, Layers
  2–7 enforced.
- Self-hosted fonts, schema markup on every public page, sitemap clean.

Your Months 3–6 work must clear the **same** bar.

## 5. Your concrete deliverables, in priority order

### Deliverable A — Indexing gate first (READ CHECKLIST.md § INDEXING GATE)

**You do not push Batch 2 until the operator confirms ≥ 50% of Batch 1 (the
200 `/pay/*` pages) are indexed in Google Search Console.** Concretely:

- The operator monitors Search Console weekly per the checklist.
- They will report the indexing rate to you when they switch you into ACT mode.
- If they report ≥ 50% indexed → proceed with Batch 2.
- If they report ≥ 30% but < 50% → proceed with Batch 2 cautiously, but
  **strictly improve the variance model** (more templates, more FAQs) before
  adding more rows.
- If they report < 30% at day 28 → **do not add any new `/pay/*` rows.**
  Instead audit the existing 200 pages: sample 10 random URLs, confirm that
  Layers 2 / 3 / 6 / 7 produce visibly different output across rows; open
  Search Console "Crawl stats" and inspect for `noindex` / `404` / soft 404 /
  `Excluded by robots.txt`. Fix whatever is throttling, push, and reset the
  observation window. Use the **one-question rule** if you need clarification.

### Deliverable B — Batch 2: expand `pages.csv` to 700 rows (gated)

**Only execute if Deliverable A's gate passes.**

- Expand `src/data/pages.csv` from 200 rows to 700 rows.
- The 500 new rows must include genuinely new persona slices, not just income
  variants of existing rows:
  - **Scotland tax-band rows.** Implement Scottish income tax in
    `src/lib/tax/income-tax.ts` *first* — Starter 19% / Basic 20% /
    Intermediate 21% / Higher 42% / Top 47% with PA taper above £100k.
    Add ≥ 25 Vitest assertions for the Scottish-band logic. Then add 100+
    Scotland rows to `pages.csv` with `region = 'scotland'`. Per HMRC the
    Scottish bands apply to non-savings / non-dividend income only — get
    the dividend interaction right.
  - **Time-series persona pages.** "Your optimal pay over the next 5 years."
    Run the optimiser at year-zero income, then at +3%/yr nominal income for
    5 years; render the five-year delta in a build-time table. ~150 rows.
  - **More umbrella / inside-IR35 day-rate combinations.** Particularly at
    sub-£400/day and £1,000+/day where existing coverage is thin. ~75 rows.
  - **More lifestyle SE slices.** Especially female-dominated trades (cleaner,
    childminder, mobile beautician at multiple incomes), creative trades
    (musician, illustrator, podcaster), and the "side-hustle on PAYE" slice
    (40–60 rows). ~150 rows.

- Bump `src/lib/pseo/templates.ts` from 10 to **15 narrative templates**. The
  five new templates should cover: "regional comparison" (England vs Scotland
  side by side), "5-year projection", "marginal £ analysis" (what does the
  next £1k of income do to the tax bill?), "real-life-scenario" (week-in-the-
  life of the persona), "historical-rate-changes" (how would these numbers
  have differed in 2019 / 2024 — useful as drift signal for the operator
  rather than as advice).

- Bump `src/lib/pseo/faqs.ts` from 50 to **80 FAQs**. The 30 new Q&As should
  be Scotland-specific (10), retirement-drawdown-specific (10), and
  side-hustle/incorporation-specific (10).

- Reuse the same `[...slug].astro` route and same JSON-LD pipeline.

- Build budget: **2 minutes for 700 pages** (~ 170 ms each is the current
  rate). If you blow this, profile and parallelise; do not skip variance.

- **Stop at 700.** Phase 4c of MASTER-PLAN.md Section 9 is explicit.

### Deliverable C — Calculator #5: Should I Incorporate?

Path: `/calculators/should-i-incorporate`.

- Promotes the incorporation-break-even logic that lives inside
  `src/lib/optim/sole-trader.ts` to its own first-class calculator.
- Sweep profit £20k → £300k, find the break-even level by bisection,
  show side-by-side net-£/yr at three user-chosen profit points.
- Surface accountancy-fee assumption as an explicit input (~£1,500/yr for a
  Ltd Co micro-entity in 2026 per ACCA + AccountingWeb survey data;
  reference that source in the page copy).
- Surface "salary route only" (no dividend) and "max-extraction" Ltd Co
  scenarios — the optimiser already returns both as `cashOptimum` /
  `optimum`.
- Same UI grammar as the other four calculators. **40+ new Vitest assertions**
  for `src/lib/optim/incorporate.ts`. Schema markup via `<JsonLd>`.

### Deliverable D — Calculator #6: VAT Scheme Selector

Path: `/calculators/vat-scheme`.

- Flat Rate Scheme vs Standard VAT vs Cash Accounting vs Annual Accounting.
- Inputs: turnover, mix of zero-rated/reduced/standard supplies, mix of B2B
  vs B2C, current VAT-able expenses.
- FRS rates from HMRC VAT Notice 733 (table at
  `https://www.gov.uk/guidance/vat-flat-rate-scheme-for-small-businesses`) —
  bake the rate table as a constant in `src/lib/tax/vat-rates.ts` with a
  source-URL comment.
- "Limited cost trader" 16.5% override logic implemented per HMRC.
- Output: total VAT due per scheme + net effective rate.
- **50+ new Vitest assertions** in `src/lib/__tests__/vat.test.ts`.

### Deliverable E — Newsletter infrastructure

Per `MASTER-PLAN.md` Section 9 Phase 5 and CHECKLIST.md "Months 6–9".

- Add a single email-capture component (`src/components/EmailCapture.astro`).
  One line of copy: "Monthly UK tax & pension optimisation tips. No fluff."
  Static HTML form posting to a same-origin Cloudflare Worker endpoint that
  forwards to Resend / Buttondown / ConvertKit.
- Add a `/newsletter` page that explains what the list is, links to the
  privacy page, and includes a tasteful sample of a previous send (once one
  exists; until then, link to the first three planned pieces).
- Cookie banner: still not required (PECR Reg 6(4)(b) applies — the form is
  strictly necessary for the user-requested service). Update the privacy
  page to mention the list explicitly.
- Add a build-time `src/data/newsletter-issue-001.md` outline for the
  operator's first send: theme is the data finding "We ran the optimiser
  for 200 personas; here are the four that broke the rule of thumb hardest".
  Concrete numbers from the existing `pages.csv` rows. **Do not draft the
  whole issue** — leave the operator to write it; you supply structure +
  the worked numbers.

### Deliverable F — Batch 3: expand to 2,200 rows (gated on Batch 2)

Only executed if Batch 2 is ≥ 75% indexed at the 4-week observation point.
**Stop at 2,200.** Per MASTER-PLAN.md Section 9 Phase 4c.

- New rows must add three new dimensions:
  - **Wales + Northern Ireland tax handling**. Currently `eng_ni_wales` is a
    single bucket. Wales has the WRIT mechanism (Welsh Rates of Income Tax)
    which is identical to rUK in 2026/27 — but the *option* to diverge means
    we should give the bucket a real page rather than glossing it.
  - **More retirement-drawdown personas** at ages 55 / 60 / 65 / 70.
  - **Higher-income contractor / dentist / private GP rows up to £500k profit.**

### Deliverable G — Schema validation harness

Write `scripts/validate-schema.mjs` that:
- Walks the prerendered HTML in `dist/client/**/*.html`.
- Extracts every `<script type="application/ld+json">` block.
- Validates each block against schema.org structure: required `@context`,
  `@type` is recognised, no orphaned `@id` references.
- Errors out the build if any page is missing the expected blocks for its
  persona class.

This is the missing third-party-validation step from CHECKLIST.md's "Polish"
section. Wire it into the `npm run build` pipeline as a post-build step so
broken schema can't ship.

## 6. Conventions and constraints — read carefully

(Reproduced from Weeks 8–12 handoff for completeness.)

- **Stack is fixed:** Astro 6, React 18 islands, Tailwind, Cloudflare
  Workers + Static Assets, TypeScript strict, Vitest 3.
- **No new chart libraries.** Inline SVG only.
- **No new state libraries.** React `useState` / `useMemo` / `useReducer`
  is sufficient.
- **Constants** live in `bracketmath/src/lib/tax/constants.ts`. New
  thresholds get a source-URL comment.
- **Money formatting:** whole pounds with thousand separators. No pence in
  user-facing outputs.
- **Tax year:** 2026/27 throughout — but **start tagging numbers as 2026/27
  explicitly** because the next tax year's announcements will land mid-build
  and we'll need to support both side-by-side.
- **Anonymity:** no "I built this", no personal name, no claimed credentials.
- **CMA-compliant affiliate disclosure:** sponsored links use
  `rel="sponsored"`, plus a one-line context note.
- **Privacy:** all calculation in-browser (or at build time). Newsletter
  capture is the *only* exception — and we'll need to update
  `/privacy.astro` accordingly.
- **Performance budget:** total JS per page ≤ 100 KB compressed. Programmatic
  pages remain near-zero JS.
- **Git workflow:** conventional commits. One logical change per commit.
- **Build budget for 2,200 pages:** ≤ 5 minutes total. If you exceed this,
  profile and parallelise — but do not weaken the variance model.

## 7. The "don'ts" — non-negotiable

- ❌ **Do not push Batch 2 / 3 / 4 unless the indexing gate has passed.**
  Section 9 Phase 4b / 4c / 4d is explicit. The gate is the most important
  rule in the whole project.
- ❌ **Do not generate placeholder / lorem-ipsum / GPT-flavour prose.**
- ❌ **Do not flatten the variance model.** Templates must produce
  observably different page structure at the sentence / paragraph / heading
  level, not just at the {{ slot }} replacement level. If you find yourself
  copy-pasting paragraphs across templates, stop and rethink.
- ❌ **Do not ship Scotland rates without unit tests.** A wrong Scottish
  Higher-rate threshold is a YMYL failure.
- ❌ **Do not invent statistics.**
- ❌ **Do not pivot the business model.**
- ❌ **Do not add tracking, analytics, or ad code** other than the
  Cloudflare Web Analytics that's already live (zero-cookie, server-side).
- ❌ **Do not add a JS framework, state manager, or chart library.**
- ❌ **Do not run more than one outreach / HARO / Reddit task yourself.**
  Those are operator-only. Your job is to *enable* them by shipping the
  product and the documentation.

## 8. The "do's"

- ✅ Read every file in Section 3 before writing one line of code.
- ✅ Mirror established patterns. Same file layout, same testing style.
- ✅ Drive every number in prose from `incomeTax()`,
  `optimiseSalaryDividend()`, `simulateRetirement()`, `compareIR35()`,
  `optimiseSoleTrader()` — that's the moat.
- ✅ Cite HMRC / FCA / ONS / DWP / OBR / Bank of England sources by URL.
- ✅ Commit incrementally — Scottish income-tax engine as its own commit,
  Batch 2 `pages.csv` as its own commit, Calculator #5 as its own, etc.
- ✅ After Batch 2 ships, sample 10 random pages on the live URL and run
  Lighthouse — log results in CHECKLIST.md's existing Lighthouse table.
- ✅ When you finish, update `CHECKLIST.md` (tick Months-3–6 items, refresh
  "Current status"), and write `HANDOFF-PROMPT-MONTHS-6-9.md` for the next
  agent (whose scope is Batches 5–6 + Calculators #7–#9 + the first
  Mediavine application).

## 9. The one-question rule

If — after reading every file in Section 3 — you have a question that
genuinely blocks progress, ask **one** clarifying question, then start
working with sensible defaults if no answer arrives.

## 10. What "done" looks like

- [ ] Indexing-gate signal verified with the operator before Batch 2.
- [ ] Scottish income-tax engine implemented with ≥ 25 new Vitest
      assertions; total tests ≥ 230.
- [ ] Batch 2 of `pages.csv` (700 rows) live; 15 templates; 80 FAQs.
- [ ] `/calculators/should-i-incorporate` live with ≥ 40 new Vitest
      assertions.
- [ ] `/calculators/vat-scheme` live with ≥ 50 new Vitest assertions.
- [ ] Newsletter infrastructure live (capture component, `/newsletter`
      page, privacy-page update, Worker endpoint).
- [ ] Batch 3 of `pages.csv` (2,200 rows) live *if* Batch 2 cleared its
      gate. (If not, document why in CHECKLIST.md and stop.)
- [ ] `scripts/validate-schema.mjs` wired into the build; fails on any
      schema regression.
- [ ] Sample 10 random pages have Lighthouse Mobile ≥ 95 on the live URL.
- [ ] `npm test` passes (~ 320+ tests once Calculators #5 + #6 + Scottish
      bands have added their assertions).
- [ ] `npm run build` succeeds with zero warnings; sitemap regenerated.
- [ ] `CHECKLIST.md` updated, `HANDOFF-PROMPT-MONTHS-6-9.md` written.

That is your scope. Read first, then begin.

---

# Quick-paste opening message for the next agent

> The previous agent finished Weeks 8–12 of BracketMath. The site now has
> four live calculators (201/201 tests), five live pillar guides, **200
> live programmatic `/pay/*` pages built via the 7-layer variance engine
> from MASTER-PLAN.md Section 11.5**, self-hosted Inter + JetBrains Mono,
> a full backlink playbook at `BACKLINK-PLAYBOOK.md`, and an indexing
> gate in CHECKLIST.md that holds Batch 2 until Google has indexed
> ≥ 50% of Batch 1.
>
> Your job is Months 3–6: gate on the indexing signal, ship **Batch 2
> (700 rows total) and Batch 3 (2,200 rows total) of `/pay/*` pages**,
> implement **Scottish income tax** with full unit tests, build
> **Calculator #5 (Should I Incorporate?)** and **Calculator #6
> (VAT Scheme Selector)**, stand up the **newsletter capture
> infrastructure**, and write a **schema-validation harness** that
> runs on every build.
>
> Before you write any code, read these files at the workspace root in
> full and in order: `MASTER-PLAN.md` (Sections 6.5, 9 Phases 4b/4c/4d,
> 11.5), `CHECKLIST.md` (your scope is "MONTHS 3–6" and read the
> "🟠 INDEXING GATE" section twice), `BACKLINK-PLAYBOOK.md`,
> `strategic-recommendation.md`, `PLAN.md`, `SETUP-WALKTHROUGH.md`,
> `HANDOFF-PROMPT-WEEKS-8-12.md`, and `HANDOFF-PROMPT-MONTHS-3-6.md`
> (this file). Then study `bracketmath/src/lib/pseo/`,
> `bracketmath/src/lib/optim/sole-trader.ts`,
> `bracketmath/src/pages/pay/[...slug].astro`, and the calculator
> pattern so new work matches the established voice exactly.
>
> The bar is "world-class": every number on every page computed by one
> of the engines at build time. Each programmatic page must have ≥ 1,200
> words of genuinely unique content. The indexing gate exists for a
> reason — Section 9 Phase 4b/4c/4d gates Batches 2/3/4 on prior-batch
> indexing rate. YMYL, so mathematical correctness is non-negotiable.
> Anonymous voice. No new chart libraries, no new state libraries.
>
> The full specification, conventions, the "don't" list, and the
> definition of "done" are in `HANDOFF-PROMPT-MONTHS-3-6.md`. Begin by
> reading that file. Confirm you've read it, then start.
