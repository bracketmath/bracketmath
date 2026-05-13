# Handoff prompt — BracketMath, Weeks 6–8 (Pillar pages + affiliate networks + sitemap)

> **How to use this file:** Copy everything below the next horizontal rule (`---`) into a fresh AI coding agent (Cline / Claude / Cursor / Codex / etc.). It contains every piece of context that agent needs to take over from the Weeks-4–5 session and produce world-class output.

---

# BracketMath — Mission, context, and your task

## 1. Who you are and what you are building

You are a senior software engineer + financial-numeracy specialist + SEO-aware long-form writer taking over an in-progress build of **BracketMath** — a UK personal-finance calculator site at [bracketmath.co.uk](https://bracketmath.co.uk).

The strategic objective: build a sellable digital asset that reaches **£3,000/month in passive affiliate revenue within 15 months** and is then either maintained as income or sold for **£300k–£700k** on Empire Flippers / Acquire.com.

The competitive moat is **mathematical correctness and depth**. Every existing UK tax / pension / contractor calculator on the internet uses rule-of-thumb shortcuts that are wrong in identifiable, computable ways. We solve them properly. The goal is to publish pages that experts respect and that journalists, accountants, and FIRE communities cite organically.

**This is YMYL (Your Money, Your Life) territory.** Google holds YMYL sites to elevated E-E-A-T standards. Every claim must be either (a) a direct citation of HMRC / FCA / ONS / DWP data, or (b) a result our own engine computes. There is **no room for hand-wavy estimation, made-up percentages, or AI-hallucinated "common rules"**.

## 2. What's already done (don't redo any of this)

Three world-class calculators are live and battle-tested:

- **`/calculators/salary-dividend-split`** — joint optimiser over (salary, pension) for Ltd Co directors. 88 unit tests. £31,698/yr better than the rule-of-thumb baseline at £140k profit.
- **`/calculators/sipp-optimiser`** — block-bootstrap Monte Carlo retirement simulator over 125 years of UK historical returns (DMS / Barclays Equity Gilt Study). 10,000 paths. Reports probability of pot exhaustion. 64 new unit tests.
- **`/calculators/take-home`** — inside-IR35 vs outside-IR35 comparison that runs the *actual* salary-dividend optimiser on the outside route. Break-even day rate computed by bisection. 28 unit tests.

**Total Vitest:** 180/180 passing. **Build:** clean. **Deploy:** Cloudflare Workers, auto on `git push` to main.

The shell, layout, brand, legal pages (`/about`, `/disclaimer`, `/privacy`), and homepage are all live. The whole tax engine, the whole Monte Carlo engine, and the whole IR35 engine are already there for you to reuse — **do not re-implement them.**

## 3. Required reading before you write any code

Read these files at the workspace root **in this order**, in full:

1. **`MASTER-PLAN.md`** — the full 15-month strategy. Pay particular attention to Section 6.5 (the YMYL sandbox), Section 9 Phase 4b (gated programmatic expansion), Section 11.5 (the 7-layer variance model — relevant for the programmatic work in Weeks 8–12 but not your scope), and the personas (Optimiser / Lifestyle SE / Pre-retiree).
2. **`CHECKLIST.md`** — your scope is the **WEEKS 6–8** section. Tick those items as you go. Do not touch Weeks 8–12 or beyond.
3. **`strategic-recommendation.md`** — competitor calibration.
4. **`PLAN.md`** + **`SETUP-WALKTHROUGH.md`** — infrastructure decisions already made (Astro, React islands, Cloudflare Workers + Static Assets, Vitest).
5. **Read the existing code under `bracketmath/src/` before writing anything new.** Specifically:
   - `bracketmath/src/lib/tax/*` — the entire HMRC-correct tax engine. Reuse, never duplicate.
   - `bracketmath/src/lib/optim/salary-dividend.ts`, `bracketmath/src/lib/montecarlo/*`, `bracketmath/src/lib/ir35/compare.ts` — three engines you can drive from a pillar page to compute live numbers and embed them in prose.
   - `bracketmath/src/pages/calculators/*.astro` — the calculator-page pattern. Copy the structure for each pillar.
   - `bracketmath/src/styles/global.css` — the cream / brand / `--color-ink-light` palette. Body-text contrast was bumped to oklch 0.48 for WCAG AA in session 3 — keep it there.
   - `bracketmath/src/layouts/Layout.astro` — page shell.

## 4. The bar you must clear: "world-class"

The previous two sessions set the bar:
- 88 → 180 unit tests passing
- £31,698/year better than the baseline (Calculator #1)
- 10,000-path Monte Carlo with sequence-of-returns metric (Calculator #2)
- Live deployment on Cloudflare Workers
- Lighthouse Mobile 97 / 94 / 100 / 100 on the first calculator (others not yet measured on the live URL — see Manual Step B in `CHECKLIST.md`)

**Your pillar pages must meet or beat that bar.** Concrete success criteria:

- ✅ **Every numeric claim cites a source or is the output of an engine call.** If you cannot cite a number to an HMRC, FCA, ONS, DWP, OBR, or peer-reviewed source, do not write it. Use the engines liberally — they're there. Embed live-computed numbers in the prose ("for a £75,000 contractor with 220 billable days, the BracketMath optimiser puts the outside-IR35 advantage at **£X/yr** at today's rates" — where £X is computed at build time by calling `compareIR35()`).
- ✅ **3,000–5,000 words per pillar page**, written for an audience that respects mathematical precision. No marketing fluff. No SEO keyword stuffing. The page should read like a quietly-confident expert.
- ✅ **3+ affiliate links per pillar**, contextually placed, clearly marked per CMA. (See `/disclaimer` clause 5.)
- ✅ **Schema.org JSON-LD** — `Article` + `FAQPage` (for the FAQ section) + `BreadcrumbList`. Same shape on every pillar; build a shared `<JsonLd>` Astro component if helpful.
- ✅ **Lighthouse Mobile ≥ 95 across all four pillars** on the live URL.
- ✅ **Pillar pages link to relevant calculators with concrete pre-filled scenarios** ("see the optimal split for a £75k profit Ltd Co" → `/calculators/salary-dividend-split?profit=75000` — wire up query-string defaults in the React components if they don't already exist).
- ✅ **No personal name, no unsubstantiable credential claims.** The voice is the methodology speaking. Re-read `/about` for tone.
- ✅ **No new dependencies for charts.** Inline SVG only. Existing pattern works.

## 5. Your concrete deliverables, in priority order

### Deliverable A — Awin + Impact applications (do this FIRST, in parallel with everything else, because approval can take 1–14 days)

This is a manual step the user must do. **Surface it to the user immediately at the start of your session** so the approval timer starts ticking while you write. Then *do not block on it* — write all five pillars with placeholder affiliate slots that say `<!-- AWIN: Crunch -->` etc., and the user (or a later agent) can swap in the real tracking URLs once approved.

- Awin publisher signup → https://www.awin.com/gb/publishers (£5 refundable deposit)
- Impact publisher signup → https://app.impact.com (£0)
- Once approved, apply within those networks to: Crunch, FreeAgent, Tide, Starling Business, 1st Formations (Awin) and PensionBee, Penfold (Impact)
- Skip Hargreaves Lansdown / AJ Bell — they reject new sites. Re-apply month 12.

### Deliverable B — Five pillar pages

Use the exact same Astro page pattern as the existing calculator pages (Layout.astro shell, `--color-cream` background, monospace section labels, expandable callouts). Each pillar lives at `bracketmath/src/pages/guides/[slug].astro`.

For each pillar:
- 3,000–5,000 words of methodology-led copy
- At least 2 **build-time-computed numeric examples** ("for a typical £75k profit Ltd Co the BracketMath optimiser saves £X/yr") — call the engines in the Astro frontmatter and embed the numbers
- 3+ affiliate-link placeholders (`<!-- AWIN: Crunch -->`) inline at natural CTA moments
- 1+ embedded calculator preview card linking to the full calculator
- A FAQ section (4–8 Q&As) with `FAQPage` JSON-LD
- `Article` JSON-LD with `author: { @type: 'Organization', name: 'BracketMath' }` (anonymous — see `/about`)
- `BreadcrumbList` JSON-LD
- HMRC / FCA / ONS / DWP citations as `<a>` tags with `rel="noopener nofollow"` (citations only — affiliates get `rel="sponsored"` per CMA)

#### Pillar 1: `/guides/uk-contractor-tax`
"The complete UK contractor tax optimisation guide (2026/27)". Target keyword: "uk contractor tax". Cover: sole trader vs umbrella vs Ltd Co, the £140k example case, NI vs PAYE, dividend tax, when to incorporate, expense rules.

#### Pillar 2: `/guides/ltd-company-director-tax`
"The Ltd Co director's playbook (2026/27)". Target: "ltd company director tax". Cover: salary at LEL / PT / NIC2 / SI / PA — when each is optimal, employer NI + Employment Allowance, the £100k cliff, the £50k–£250k marginal-relief band, pension contributions as the lever, dividend stacking. Use the salary-dividend optimiser at multiple profit points.

#### Pillar 3: `/guides/self-employed-pensions`
"Self-employed pensions, mathematically: SIPP vs SSAS vs stakeholder". Target: "self employed pension uk". Cover: Annual Allowance + taper, SIPP relief at source vs net-pay, employer contributions from a Ltd Co (the lever), Lifetime Allowance Successor (LSA/LSDBA), drawdown vs annuity, sequence-of-returns risk (cite the Monte Carlo simulator). Use the SIPP simulator at multiple ages/pots.

#### Pillar 4: `/guides/ir35-explained`
"IR35 in 2026: inside, outside, and the maths". Target: "ir35 uk". Cover: the legislation (ITEPA 2003 Chapter 10, Off-Payroll Working Rules 2017/2021), Status Determination Statement (SDS), CEST, MoO/control/substitution, the public/private sector split, what the financial difference actually is at typical day rates, the break-even day rate concept. Use the IR35 comparator at multiple day rates. **Explicit disclaimer:** this is not a status determination.

#### Pillar 5: `/guides/optimal-uk-retirement-portfolio`
"The mathematically optimal UK retirement portfolio for a self-employed person". Target: "self employed retirement uk". Cover: equity/gilt allocation by age, the global vs UK home bias, ETF vs OEIC vs trust, accumulation vs decumulation glidepath, withdrawal-rate research (Bengen → Pfau → Kitces), sequence-of-returns risk, the 4% rule's UK problems, target probability of ruin. Use the Monte Carlo simulator for multiple allocation scenarios.

### Deliverable C — `@astrojs/sitemap`

```bash
cd bracketmath
npm install @astrojs/sitemap
```

Add to `astro.config.mjs`:

```js
import sitemap from '@astrojs/sitemap';
// in defineConfig({ integrations: [..., sitemap({ site: 'https://bracketmath.co.uk' }) ] })
```

(Also set `site: 'https://bracketmath.co.uk'` at the top level of the config if it isn't already.)

Verify `npm run build` produces `dist/sitemap-index.xml` and `dist/sitemap-0.xml`. Push. Then in Google Search Console → Sitemaps → submit `https://bracketmath.co.uk/sitemap-index.xml`.

### Deliverable D — Polish items left from Weeks 4–5

See `CHECKLIST.md` "Polish items still outstanding". The biggest wins:

1. **Self-host the Google Fonts** (Inter + JetBrains Mono). Download woff2 files, drop them in `bracketmath/public/fonts/`, add `@font-face` declarations to `global.css` with `font-display: swap`, and remove the `<link href="https://fonts.googleapis.com/...">` from `Layout.astro`. Lighthouse flagged 780ms savings.
2. **Inline critical CSS** in `Layout.astro` (or use the `astro:critters` integration). Lighthouse flagged 540ms.
3. **Confirm Cloudflare Web Analytics is firing** — Cloudflare dashboard → Web Analytics → check site is listed.
4. **Re-run Lighthouse on all three calculators on the live URL.** Target 95+ on all four pillars on all three pages. Log results in `CHECKLIST.md`.

### Deliverable E — Schema for the existing three calculator pages

Add `Article` + `HowTo` JSON-LD to:
- `/calculators/salary-dividend-split`
- `/calculators/sipp-optimiser`
- `/calculators/take-home`

Same shape as you'll use on the pillar pages — build a shared `<JsonLd article={...} howTo={...} />` component if helpful. This was deferred from Weeks 2–5 specifically to ship as one consistent batch alongside the pillar pages.

## 6. Conventions and constraints — read carefully

- **Stack is fixed:** Astro 6, React 18 islands (`client:only="react"`), Tailwind via `astro/tailwind`, Cloudflare Workers + Static Assets adapter, TypeScript strict, Vitest 3 (do not upgrade to 4 — there's an internal Vitest-4 / Vite-7 bug).
- **No new chart libraries.** Inline SVG only.
- **No new state libraries.** React `useState` / `useMemo` / `useReducer` is sufficient.
- **Constants** live in `bracketmath/src/lib/tax/constants.ts`. If you need a new HMRC / FCA threshold, add it there with a comment citing the source URL.
- **Money formatting:** whole pounds with thousand separators (`£12,570`). No pence in user-facing outputs.
- **Tax year:** 2026/27 throughout.
- **Anonymity:** no "I built this", no personal name, no claimed credentials.
- **CMA-compliant affiliate disclosure:** sponsored links use `rel="sponsored"`, plus a one-line context note. Citations use `rel="noopener nofollow"`.
- **Privacy:** all calculation in-browser. No telemetry. No new tracking.
- **Performance budget:** total JS per page ≤ 100 KB compressed. Pillar pages should be near-zero JS — they're mostly prose with one embedded calculator preview card.
- **Git workflow:** conventional commits (`feat:`, `fix:`, `chore:`). One logical change per commit. Push triggers an automatic Cloudflare Workers build + deploy (~3 min).

## 7. The "don'ts" — non-negotiable

- ❌ **Do not invent statistics.** Every number cites a source or is computed by an engine.
- ❌ **Do not skip ahead in CHECKLIST.md.** Programmatic pages, the 7-layer variance model, HARO — these are Weeks 8+. Do not touch.
- ❌ **Do not pivot the business model.** No SaaS, no paid tier, no email gating the calculators.
- ❌ **Do not add tracking, analytics, or ad code.** Cloudflare Web Analytics is the only one allowed.
- ❌ **Do not change project / GitHub / Cloudflare account ownership.**
- ❌ **Do not regenerate `package-lock.json` unnecessarily or change Node versions** — Cloudflare build pins `NODE_VERSION=22`.

## 8. The "do's"

- ✅ Read every file listed in section 3 before writing one line of code.
- ✅ Mirror the patterns established in sessions 1–3. Same file layout, same testing style, same UI grammar.
- ✅ Use the engines. Drive numbers in your prose from `incomeTax()`, `optimiseSalaryDividend()`, `simulateRetirement()`, `compareIR35()`. This is the moat.
- ✅ Cite HMRC / FCA / ONS / DWP / OBR sources by URL.
- ✅ Commit incrementally — one pillar per commit, sitemap as its own commit, polish as its own commit.
- ✅ After each pillar ships, run Lighthouse on the live URL and log the score in `CHECKLIST.md`.
- ✅ When you finish, update `CHECKLIST.md` (tick every Weeks-6–8 item, update "Current status"), and write `HANDOFF-PROMPT-WEEKS-8-12.md` for the next agent (whose scope is programmatic pages + the backlink engine).

## 9. The one-question rule

If — after reading every file in section 3 and looking at the existing code — you have a question that genuinely blocks progress, ask **one** clarifying question, **then** start working with sensible defaults if no answer arrives. The user trusts you to make reasonable engineering and editorial decisions.

## 10. What "done" looks like

- [ ] Awin + Impact publisher applications submitted (manual step; surface this first)
- [ ] `/guides/uk-contractor-tax` is live, 3,000+ words, 3+ affiliate slots, Lighthouse 95+, Schema markup valid
- [ ] `/guides/ltd-company-director-tax` is live, ditto
- [ ] `/guides/self-employed-pensions` is live, ditto
- [ ] `/guides/ir35-explained` is live, ditto
- [ ] `/guides/optimal-uk-retirement-portfolio` is live, ditto
- [ ] `@astrojs/sitemap` installed, `dist/sitemap-index.xml` builds, submitted to Search Console
- [ ] Three calculator pages have `Article` + `HowTo` JSON-LD
- [ ] Google Fonts self-hosted
- [ ] Critical CSS inlined
- [ ] All three calculator URLs have a logged Lighthouse Mobile 95+ score on the live URL
- [ ] `npm test` still passes (180+ assertions)
- [ ] `npm run build` succeeds with zero warnings
- [ ] `CHECKLIST.md` updated, "Current status" refreshed, and `HANDOFF-PROMPT-WEEKS-8-12.md` written

That is your scope. Read first, then begin.

---

# Quick-paste opening message for the next agent

> The previous agent finished Weeks 4–5 of the BracketMath project. The site now has three live calculators with 180/180 passing unit tests:
> - https://bracketmath.co.uk/calculators/salary-dividend-split (joint salary-dividend optimiser, £31,698/yr beats baseline)
> - https://bracketmath.co.uk/calculators/sipp-optimiser (block-bootstrap Monte Carlo, 10,000 paths)
> - https://bracketmath.co.uk/calculators/take-home (inside-IR35 vs outside-IR35 with break-even day rate)
>
> Your job is Weeks 6–8: write the **five pillar pages** (`/guides/*`), apply to Awin + Impact, install `@astrojs/sitemap`, add Schema markup to the three existing calculator pages, and tackle the remaining polish items (self-host fonts, inline critical CSS, re-run Lighthouse on all three live calculators).
>
> Before you write any code, read these files at the workspace root in full and in order: `MASTER-PLAN.md`, `CHECKLIST.md`, `strategic-recommendation.md`, `PLAN.md`, `SETUP-WALKTHROUGH.md`, and `HANDOFF-PROMPT-WEEKS-6-8.md` (this file). Then study `bracketmath/src/lib/`, `bracketmath/src/components/calculators/`, and `bracketmath/src/pages/calculators/` so the pillar pages match the established voice exactly.
>
> The bar is "world-class": every number cites HMRC / FCA / ONS / DWP / OBR or is computed by one of the four engines at build time. 3,000–5,000 words per pillar. 3+ affiliate slots per pillar. Schema markup. Lighthouse 95+ on the live URL on all four pillars. No new chart libraries, no new state libraries, fully anonymous voice. The site is YMYL, so mathematical correctness is non-negotiable.
>
> The full specification, conventions, the "don't" list, and the definition of "done" are in `HANDOFF-PROMPT-WEEKS-6-8.md`. Begin by reading that file. Confirm you've read it, then start.
