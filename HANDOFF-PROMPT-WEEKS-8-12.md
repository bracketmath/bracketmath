# Handoff prompt — BracketMath, Weeks 8–12 (Programmatic pages + backlink engine + Calculator #4)

> **How to use this file:** Copy everything below the next horizontal rule (`---`) into a fresh AI coding agent (Cline / Claude / Cursor / Codex / etc.). It contains every piece of context that agent needs to take over from the Weeks-6–8 session and produce world-class output.

---

# BracketMath — Mission, context, and your task

## 1. Who you are and what you are building

You are a senior software engineer + financial-numeracy specialist + SEO-aware long-form writer taking over an in-progress build of **BracketMath** — a UK personal-finance calculator site at [bracketmath.co.uk](https://bracketmath.co.uk).

The strategic objective is unchanged: build a sellable digital asset that reaches **£3,000/month in passive affiliate revenue within 15 months** and is then maintained as income or sold for **£300k–£700k** on Empire Flippers / Acquire.com.

The competitive moat is unchanged: **mathematical correctness and depth**. Every page on BracketMath either cites HMRC / FCA / ONS / DWP / OBR / Bank of England, or computes its numbers from one of the engines (`incomeTax`, `optimiseSalaryDividend`, `simulateRetirement`, `compareIR35`). YMYL means no estimation, no hallucination, no shortcuts.

## 2. What's already done (don't redo any of this)

Three live calculators (each with full unit tests, deployed to Cloudflare Workers):

- `/calculators/salary-dividend-split` — joint optimiser over (salary, pension) for Ltd Co directors. £31,698/yr better than baseline at £140k profit. Lighthouse 97/94/100/100 mobile.
- `/calculators/sipp-optimiser` — 10,000-path block-bootstrap Monte Carlo over 125 years of UK historical returns. Reports probability of pot exhaustion.
- `/calculators/take-home` — inside-IR35 vs outside-IR35 with break-even day rate by bisection.

Five live pillar guides (each 3,000–5,000 words, methodology-led, build-time-computed numbers from real engine calls, full Schema markup):

- `/guides/uk-contractor-tax` — Sole trader vs Umbrella vs Ltd Co, optimiser at £40k / £75k / £140k.
- `/guides/ltd-company-director-tax` — Four-band salary decision, £100k cliff, £50k–£250k CT marginal-relief, optimiser at £60k / £100k / £180k.
- `/guides/self-employed-pensions` — Annual Allowance + taper, employer-vs-personal mechanics, Monte Carlo at three ages × two pots.
- `/guides/ir35-explained` — Ready Mixed Concrete tests, SDS, CEST, `compareIR35` at £400/£600/£850/day with bisection break-even.
- `/guides/optimal-uk-retirement-portfolio` — Allocation comparison 30/60/90, withdrawal-rate stress 3.0/3.5/4.0%.

A shared `<JsonLd>` Astro component emits Article + FAQPage + HowTo + BreadcrumbList JSON-LD. The site has an XML sitemap (`@astrojs/sitemap`). The build is clean, 180/180 Vitest assertions pass, deploy is automatic on push to `main`.

## 3. Required reading before you write any code

Read these files at the workspace root **in this order**, in full:

1. **`MASTER-PLAN.md`** — the full 15-month strategy. Pay particular attention to:
   - **Section 6.5** (the YMYL sandbox and why programmatic expansion is gated)
   - **Section 9 Phase 4b** (gated programmatic expansion — the indexing-rate gate)
   - **Section 11.5** (the **7-layer variance model**) — **this is the heart of your scope**
   - The three personas (Optimiser / Lifestyle SE / Pre-retiree)
2. **`CHECKLIST.md`** — your scope is the **WEEKS 8–12** section. Tick those items as you go. Do not touch Months 3–6 or beyond.
3. **`strategic-recommendation.md`** — competitor calibration. Read the bit on duplicate-content thresholds.
4. **`PLAN.md`** + **`SETUP-WALKTHROUGH.md`** — infra decisions already made.
5. **The existing code under `bracketmath/src/`** before writing anything new. Specifically:
   - `bracketmath/src/lib/tax/*` and `bracketmath/src/lib/optim/salary-dividend.ts` — the joint optimiser you'll drive from every programmatic page.
   - `bracketmath/src/lib/montecarlo/*` and `bracketmath/src/lib/ir35/compare.ts` — the other two engines.
   - `bracketmath/src/pages/calculators/*.astro` and `bracketmath/src/pages/guides/*.astro` — the established page patterns.
   - `bracketmath/src/components/JsonLd.astro` — reuse for the programmatic pages.
   - `bracketmath/astro.config.mjs` — `@astrojs/sitemap` is wired and `inlineStylesheets: 'always'` is set.
   - `bracketmath/src/styles/global.css` — body-text contrast at oklch 0.48 for WCAG AA. Keep it there.

## 4. The bar you must clear

Set by previous sessions:
- 180/180 unit tests passing, clean build, zero warnings.
- £31,698/yr better than the rule-of-thumb baseline.
- 10,000-path Monte Carlo with seeded RNG and exhaustion probability.
- Five world-class pillar pages, every number sourced or computed.

Your programmatic pages must clear the **same** bar:
- ✅ Every page computes its own numbers from the engines (no static lookup tables).
- ✅ Each page has **at least 1,200 words of genuinely unique content** (not boilerplate with a name swap — see Section 11.5 of MASTER-PLAN.md for the 7-layer variance model).
- ✅ Each page has its own `Article` + `FAQPage` + `BreadcrumbList` JSON-LD with persona-specific FAQ.
- ✅ Each page passes Lighthouse Mobile 95+ on the live URL (sample 5 random pages, log scores).
- ✅ No new chart libraries, no new state libraries, no new dependencies for prose generation.
- ✅ Voice is consistent with the guides: methodology speaking, no first person, no claimed credentials, no marketing fluff.

## 5. Your concrete deliverables, in priority order

### Deliverable A — `pages.csv` schema + seed data (do this FIRST)

Create `bracketmath/src/data/pages.csv` with this column schema:

```
slug, profession, profession_label, gross_income, age, age_band, structure, ir35_status, pension_pref, other_income, region, persona
```

- `slug` — URL slug, e.g. `software-contractor-ltd-outside-ir35-75k-london`
- `profession` — short code, e.g. `software_contractor`
- `profession_label` — human label, e.g. `Software contractor`
- `gross_income` — integer £
- `age` — integer, used by the optimiser for AA taper
- `age_band` — `under_30` | `30_to_45` | `45_to_55` | `55_plus`
- `structure` — `sole_trader` | `umbrella` | `ltd_co`
- `ir35_status` — `inside` | `outside` | `n_a`
- `pension_pref` — `none` | `modest` | `aggressive` (drives the `pensionWeight` passed to the optimiser: 0 / 0.5 / 1)
- `other_income` — integer £, stacks below the engine's tax calc
- `region` — `eng_ni_wales` | `scotland` (Scotland TODO — see Section 7)
- `persona` — `optimiser` | `lifestyle_se` | `pre_retiree`

Hand-curate the **first 200 rows** to reflect the three personas. Don't randomise — pick high-search-volume combos. Examples of good seed rows:

- `software-contractor-ltd-outside-ir35-75k`
- `software-contractor-ltd-outside-ir35-100k`
- `software-contractor-ltd-outside-ir35-140k`
- `software-contractor-umbrella-inside-ir35-500-day-rate`
- `freelance-designer-sole-trader-40k`
- `electrician-sole-trader-50k`
- `consultant-ltd-outside-ir35-100k`
- `nurse-paye-plus-locum-30k-plus-15k`
- etc.

### Deliverable B — `src/pages/pay/[...slug].astro` route + the 7-layer variance engine

This is the meat. Implement Section 11.5 of `MASTER-PLAN.md` faithfully. Specifically:

- **Layer 1 — unique computed numerics** (automatic). At build time, run `optimiseSalaryDividend()` (or `compareIR35()` or `simulateRetirement()` depending on structure) for each CSV row and bake the resulting numbers into the page. These are by definition unique per row.
- **Layer 2 — narrative templates** (start with **10**, design for growth). Each row picks a template by `hash(slug) mod templates.length`. Each template renders the computed numbers in a different prose style: "scenario-led", "mechanism-led", "comparison-led", "warning-led", "stepwise", "FAQ-style", "case-study", "rule-of-thumb-debunk", "decision-tree", "history-of-bracket".
- **Layer 3 — FAQ pool** (start with **50 Q&As**, tagged by persona / structure / income band). Each page draws 4–6 FAQs from the pool whose tags match the row. Render them as `FAQPage` JSON-LD plus an HTML FAQ section.
- **Layer 4 — "Why your situation is different" computed paragraph**. Use the row's deltas vs nearest peer profile (e.g. "compared to a £75k contractor your dividend stack is £X bigger / smaller because …") computed from the optimiser output, not hand-written.
- **Layer 5 — comparison table rows selected by persona**. Optimiser persona gets the (salary, dividend, pension) breakdown vs the rule-of-thumb baseline. Lifestyle persona gets net cash / hours-equivalent. Pre-retiree gets the SIPP projection table.
- **Layer 6 — 5 most-similar internal links**. Compute on build using a simple distance function over (profession, income, structure). Forces a genuine cross-link graph rather than every page linking to the same 5.
- **Layer 7 — per-persona JSON-LD**. Optimiser pages get a `HowTo` block. Lifestyle pages get nothing extra. Pre-retiree pages get a `FinancialProduct` block for the pension scheme they're projecting against.

**Build time should stay under 60 seconds for 200 pages.** If it doesn't, profile and parallelise.

### Deliverable C — Indexing gate documentation

Per Section 9 Phase 4b of `MASTER-PLAN.md`: **do not push more than 200 pages**. Stop at 200, push, wait for indexing. Add a section to `CHECKLIST.md` "Current status" reminding the operator to wait 4 weeks before Batch 2 and to check Search Console → Coverage → Valid pages.

### Deliverable D — Backlink engine kickoff (mostly documentation)

You can't actually run HARO / Reddit / Twitter from a coding agent. What you **can** do:

- Add a `BACKLINK-PLAYBOOK.md` to the workspace root documenting the standard responses, link-building scripts, and tracking spreadsheet template.
- Identify 20 specific HARO / Featured-type targets (UK personal finance / contracting / pensions) for the site owner to monitor.
- Draft three reusable pitch templates for journalists: "the maths behind X", "we ran the calculator for 200 personas — here's what's surprising", "this commonly-cited rule is wrong by £Y/yr at typical incomes".
- Identify 5 UK personal-finance blogs (Monevator, Banker on FIRE, Mr. Money Mustache UK clones, Be Clever With Your Cash, Finumus) for guest-post outreach with draft pitch emails.

### Deliverable E — Calculator #4: Sole Trader Tax

The next calculator to ship per MASTER-PLAN.md cadence. Path: `/calculators/sole-trader-tax`.

- Reuse `incomeTax()` and `niSelfEmployed()` from `src/lib/tax/`.
- Add Class 2 voluntary contribution logic if it isn't already there (it was added in Weeks 4–5 — verify).
- Optimise the trading-allowance vs actual-expenses decision (£1,000 trading allowance is sometimes better for very-low-expense self-employed).
- Compare sole-trader vs Ltd Co at the same gross income (drive Ltd Co side through the optimiser). This is the "should I incorporate?" question — output the break-even profit level.
- Same UI grammar as the other three calculators. Same testing standard (target 50+ Vitest assertions for the new engine code).
- Same Schema markup pattern using `<JsonLd>`.

### Deliverable F — Self-host Google Fonts (carried over from Weeks 6–8)

The Layout.astro still loads Inter + JetBrains Mono from `fonts.googleapis.com`. Lighthouse flagged ~780ms savings. Download woff2 from https://gwfh.mranftl.com/fonts (Inter 400/500/600/700 + JetBrains Mono 400/500), drop in `bracketmath/public/fonts/`, register `@font-face` with `font-display: swap` in `global.css`, remove the Google Fonts `<link>` from `Layout.astro`. Verify Lighthouse improvement on the live URL.

## 6. Conventions and constraints — read carefully

(Unchanged from Weeks 6–8 handoff. Reproduced for completeness.)

- **Stack is fixed:** Astro 6, React 18 islands, Tailwind, Cloudflare Workers + Static Assets, TypeScript strict, Vitest 3.
- **No new chart libraries.** Inline SVG only.
- **No new state libraries.** React `useState` / `useMemo` / `useReducer` is sufficient.
- **Constants** live in `bracketmath/src/lib/tax/constants.ts`. New thresholds get a source-URL comment.
- **Money formatting:** whole pounds with thousand separators. No pence in user-facing outputs.
- **Tax year:** 2026/27 throughout.
- **Anonymity:** no "I built this", no personal name, no claimed credentials.
- **CMA-compliant affiliate disclosure:** sponsored links use `rel="sponsored"`, plus a one-line context note.
- **Privacy:** all calculation in-browser (or at build time). No telemetry. No new tracking.
- **Performance budget:** total JS per page ≤ 100 KB compressed. Programmatic pages should be near-zero JS — prose plus one or two embedded calculator preview cards.
- **Git workflow:** conventional commits. One logical change per commit.

## 7. The "don'ts" — non-negotiable

- ❌ **Do not push more than 200 programmatic pages in this session.** The indexing gate exists for a reason. Section 9 Phase 4b of MASTER-PLAN.md is explicit.
- ❌ **Do not generate placeholder / lorem-ipsum / GPT-flavour prose.** Every word on a programmatic page is methodology- or computation-led, just like the pillars.
- ❌ **Do not skip the 7-layer variance model.** A flat template with name swaps will get the site sandboxed.
- ❌ **Do not add Scotland tax rates yet** unless you're willing to implement them properly (separate band schedule with Starter / Basic / Intermediate / Higher / Advanced / Top). Stub `region: 'scotland'` rows to a "Scotland TODO" page that 200s correctly but doesn't pretend to compute, OR exclude Scotland rows from the seed batch entirely.
- ❌ **Do not invent statistics.** Every number cites HMRC / FCA / ONS / DWP / OBR or is the output of an engine.
- ❌ **Do not pivot the business model.**
- ❌ **Do not add tracking, analytics, or ad code.**

## 8. The "do's"

- ✅ Read every file in Section 3 before writing one line of code.
- ✅ Mirror established patterns. Same file layout, same testing style.
- ✅ Drive every number in prose from `incomeTax()`, `optimiseSalaryDividend()`, `simulateRetirement()`, `compareIR35()` — that's the moat.
- ✅ Cite HMRC / FCA / ONS / DWP / OBR sources by URL.
- ✅ Commit incrementally — `pages.csv` as its own commit, route + variance engine as its own, Calculator #4 as its own, etc.
- ✅ After Batch 1 ships, sample 5 random pages on the live URL and run Lighthouse — log results in CHECKLIST.md.
- ✅ When you finish, update `CHECKLIST.md` (tick Weeks 8–12 items, refresh "Current status"), and write `HANDOFF-PROMPT-MONTHS-3-6.md` for the next agent (whose scope is Batches 2–4 + Calculators #5 + #6 + newsletter setup).

## 9. The one-question rule

If — after reading every file in Section 3 — you have a question that genuinely blocks progress, ask **one** clarifying question, then start working with sensible defaults if no answer arrives.

## 10. What "done" looks like

- [ ] `bracketmath/src/data/pages.csv` has 200 hand-curated rows (no random generation)
- [ ] `src/pages/pay/[...slug].astro` route renders 200 unique pages at build time
- [ ] 7-layer variance model implemented: 10 templates, 50 FAQs, persona-specific tables/Schema
- [ ] Sample 5 pages have Lighthouse Mobile ≥ 95 on the live URL
- [ ] `BACKLINK-PLAYBOOK.md` exists with 20 targets, 3 pitch templates, 5 guest-post pitches
- [ ] `/calculators/sole-trader-tax` is live with full tests + Schema markup
- [ ] Google Fonts are self-hosted; the Google Fonts `<link>` is removed; Lighthouse re-measured
- [ ] `npm test` still passes (180+ tests, ideally 230+ once Calculator #4 adds its tests)
- [ ] `npm run build` succeeds with zero warnings; sitemap regenerated with the 200 new URLs
- [ ] `CHECKLIST.md` updated, `HANDOFF-PROMPT-MONTHS-3-6.md` written

That is your scope. Read first, then begin.

---

# Quick-paste opening message for the next agent

> The previous agent finished Weeks 6–8 of BracketMath. The site now has three live calculators (180/180 tests), five live pillar guides at `/guides/*`, schema markup on every public page via the shared `<JsonLd>` component, and a built XML sitemap.
>
> Your job is Weeks 8–12: ship the **first 200 programmatic pages** at `/pay/[...slug]` via a hand-curated `pages.csv` and the 7-layer variance engine from MASTER-PLAN.md Section 11.5, draft the **backlink playbook** (HARO + guest posts + Reddit + Twitter), build **Calculator #4 (Sole Trader Tax)**, and **self-host the Google Fonts**.
>
> Before you write any code, read these files at the workspace root in full and in order: `MASTER-PLAN.md` (Section 11.5 in particular), `CHECKLIST.md`, `strategic-recommendation.md`, `PLAN.md`, `SETUP-WALKTHROUGH.md`, and `HANDOFF-PROMPT-WEEKS-8-12.md` (this file). Then study `bracketmath/src/lib/`, `bracketmath/src/components/`, `bracketmath/src/pages/calculators/`, and `bracketmath/src/pages/guides/` so the programmatic pages match the established voice exactly.
>
> The bar is "world-class": every number on every page computed by one of the engines at build time. Each programmatic page must have ≥ 1,200 words of genuinely unique content (the 7-layer model — flat templating gets sandboxed). 200 pages, then STOP and wait for the indexing gate per Section 9 Phase 4b. No new chart libraries, no new state libraries, fully anonymous voice. YMYL, so mathematical correctness is non-negotiable.
>
> The full specification, conventions, the "don't" list, and the definition of "done" are in `HANDOFF-PROMPT-WEEKS-8-12.md`. Begin by reading that file. Confirm you've read it, then start.
