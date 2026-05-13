# Handoff prompt — BracketMath, Weeks 4–5 (Calculators #2 & #3)

> **🟢 SUPERSEDED — every deliverable in this file is complete (end of session 3, 12 May 2026).**
>
> - Calculator #2 (SIPP Monte Carlo Optimiser) is live at https://bracketmath.co.uk/calculators/sipp-optimiser
> - Calculator #3 (Take-Home Inside vs Outside IR35) is live at https://bracketmath.co.uk/calculators/take-home
> - Vitest is at 180 / 180 passing (was 88 at start of session)
> - Polish: body-text contrast bumped for WCAG AA, homepage hero links to all three calculator URLs
> - Deferred items (self-host Google Fonts, inline critical CSS, Schema markup) are folded into Weeks 6–8 alongside the pillar-page rollout
>
> **For the next agent: use `HANDOFF-PROMPT-WEEKS-6-8.md` instead.** This file is retained for project history.

---

> **How to use this file:** Copy everything below the next horizontal rule (`---`) into a fresh AI coding agent (Cline / Claude / Cursor / Codex / etc.). It contains every piece of context that agent needs to take over from the previous session and produce world-class output.

---

# BracketMath — Mission, context, and your task

## 1. Who you are and what you are building

You are a senior software engineer + financial-numeracy specialist taking over an in-progress build of **BracketMath** — a UK personal-finance calculator site at [bracketmath.co.uk](https://bracketmath.co.uk).

The strategic objective: build a sellable digital asset that reaches **£3,000/month in passive affiliate revenue within 15 months** and is then either maintained as income or sold for **£300k–£700k** on Empire Flippers / Acquire.com.

The competitive moat is **mathematical correctness and depth**. Every existing UK tax / pension / contractor calculator on the internet uses rule-of-thumb shortcuts that are wrong in identifiable, computable ways. We solve them properly. The goal is to publish tools that experts respect and that journalists, accountants, and FIRE communities cite organically.

**This is YMYL (Your Money, Your Life) territory.** Google holds YMYL sites to elevated E-E-A-T standards. Every calculator output must be defensible against HMRC source documents. Every claim in supporting copy must be either (a) a direct citation of HMRC / FCA / ONS data or (b) a result our own engine computes. There is **no room for hand-wavy estimation, made-up percentages, or AI-hallucinated "common rules"**.

## 2. Required reading before you write any code

Read these files at the workspace root **in this order**, in full:

1. **`MASTER-PLAN.md`** — the full 15-month strategy (~30k words). Pay particular attention to:
   - Section 6.5 (revenue calibration — the YMYL sandbox is real, low traffic months 1–6 is expected, do not panic)
   - Section 9 Phase 4b (gated programmatic expansion)
   - Section 11.5 (the 7-layer variance model for programmatic pages)
   - Section on personas (Optimiser / Lifestyle SE / Pre-retiree)

2. **`CHECKLIST.md`** — the tactical execution path. Find the section **"WEEKS 4–5 — Calculator #2: SIPP Optimiser + Calculator #3: Take-Home"**. That is your scope. Every other section is either complete (✅) or strictly future work — do not touch those.

3. **`strategic-recommendation.md`** — the case for this niche over the competitors (calibrate your understanding of who we're up against).

4. **`PLAN.md`** + **`SETUP-WALKTHROUGH.md`** — infrastructure decisions already made (Astro, React islands, Cloudflare Workers + Static Assets, Vitest).

5. **Read the existing code under `bracketmath/src/` before writing anything new.** Specifically:
   - `bracketmath/src/lib/tax/constants.ts` — every HMRC rate is centralised here. **Reuse, never duplicate**.
   - `bracketmath/src/lib/tax/{income-tax,ni,corp-tax,dividend}.ts` — Calculator #1's tax engine. Your Take-Home calculator MUST reuse these; do not re-implement.
   - `bracketmath/src/lib/optim/salary-dividend.ts` — see how the optimiser is structured (deterministic grid search, returns a result object with `optimum`, baseline, warnings, chart data). Apply the same pattern to your SIPP optimiser.
   - `bracketmath/src/lib/__tests__/*.test.ts` — the testing style. 88 assertions across 5 files. **Match or exceed that bar.**
   - `bracketmath/src/components/calculators/SalaryDividendSplit.tsx` — the UI pattern. Sidebar form, headline card, breakdown table, inline-SVG chart (no chart library), warnings panel, expandable assumptions section. Re-use it.
   - `bracketmath/src/pages/calculators/salary-dividend-split.astro` — the page pattern. `client:only="react"` for the React island (Cloudflare Workers dev-mode doesn't support React's CJS in SSR), ~1,500 words of methodology copy, no-JS fallback, HMRC source links.

## 3. The bar you must clear: "world-class"

The previous calculator (Salary–Dividend Split Optimiser) achieved:
- **88/88 Vitest assertions passing** (target was 50+)
- **£31,698/year better than the rule-of-thumb baseline** for a £140k-profit Ltd Co
- **Lighthouse Mobile: 97 / 94 / 100 / 100** (Performance / Accessibility / Best Practices / SEO)
- Live in production on Cloudflare Workers at https://bracketmath.co.uk/calculators/salary-dividend-split

**Your two calculators (SIPP Optimiser + Take-Home) must meet or beat that bar.** Concrete success criteria:

- ✅ **Mathematical correctness:** every output traceable to an HMRC / FCA / ONS source. For Monte-Carlo retirement simulation, use the **Dimson-Marsh-Staunton UK long-run returns dataset** (1900–2024) with **block bootstrap** (not parametric draws — autocorrelation matters for sequence-of-returns risk). For Take-Home, mirror the parallel inside-IR35 PAYE vs outside-IR35 Ltd-Co calculation that real contractor accountants use.
- ✅ **Test coverage:** ≥ 20 Vitest assertions per calculator (so ≥ 40 new ones across the two). All passing.
- ✅ **Lighthouse Mobile ≥ 95 across all four pillars**, on real production. Re-test on the live URL after deploy.
- ✅ **1,500+ words of supporting copy per calculator page**, written for an audience that respects mathematical precision. No marketing fluff. Cite HMRC source pages. Anchor every numeric claim to a calculator output or a published statistic.
- ✅ **No personal name, no unsubstantiable credential claims, no "as an expert I…"** — the site is anonymised on legal/CMA/E-E-A-T grounds. See how `/about`, `/disclaimer`, `/privacy` are written.
- ✅ **Mobile-first responsive design** in the existing visual language (cream `--color-cream` background, brand accent, monospace section labels in uppercase tracking-widest, Layout.astro shell).
- ✅ **Zero new runtime dependencies for charting** — the existing SVG-by-hand pattern works and keeps the JS bundle tiny. Use it.

## 4. Your concrete deliverables (in priority order)

### Deliverable A — Calculator #2: SIPP Contribution Optimiser

**Path:** `/calculators/sipp-optimiser`

**Inputs:** age, current SIPP pot, annual contribution, target retirement age, target retirement income (real, today's £), risk tolerance / equity weight.

**Core engine:**
1. `bracketmath/src/data/historical-returns.json` — UK All-Share TR + UK Gilts TR + UK CPI, 1900-present (Dimson-Marsh-Staunton / Barclays Equity Gilt Study). 124+ rows. **Do not invent numbers.** Source the actual published series — DMS is the canonical academic dataset. If you cannot access it directly, document your source clearly in a `README.md` in `src/data/` and use a publicly-cited approximation, flagging it.
2. `bracketmath/src/lib/montecarlo/returns.ts` — `blockBootstrap(opts)`: draws **12-month contiguous blocks** from the historical series to preserve autocorrelation. Returns `yearsToSimulate × 12` simulated monthly real returns.
3. `bracketmath/src/lib/montecarlo/simulate.ts` — `simulateRetirement(opts)`: runs **10,000 paths** through accumulation (contributions + returns until retirement) then decumulation (target real income withdrawals until age 95). Returns:
   - Percentile fan of pot value through time (5th, 25th, 50th, 75th, 95th)
   - Probability of pot exhaustion before age 95 (the sequence-of-returns metric that matters)
   - Probability of meeting the target retirement income with a 95% success rate
4. `bracketmath/src/components/calculators/SippOptimiser.tsx` — sidebar form + inline-SVG fan chart + probability headlines + warnings. Recompute on submit (10k paths is too slow for live-update; use a button + spinner, or run in a Web Worker).
5. `bracketmath/src/pages/calculators/sipp-optimiser.astro` — page wrapper, 1,500+ words of context explaining sequence-of-returns risk, why block bootstrap > Gaussian, the FCA-required pension-Annual-Allowance taper, what to do if probability of ruin is high.

**Testing — ≥ 25 Vitest assertions:**
- `blockBootstrap` empirical mean and variance match the input series within 1 SE for n=10,000 draws
- Output shape is correct (years × months matrix)
- `simulateRetirement` for a "default reasonable" input (35yo, £50k pot, £20k/yr contribution, retire 65, £25k/yr target) produces median terminal pot in **£400k–£900k** range (sanity check)
- Probability of ruin monotonically increases as target income increases
- Probability of ruin monotonically decreases as starting pot increases
- Determinism: passing a seeded RNG produces identical results twice in a row

### Deliverable B — Calculator #3: Take-Home (Inside vs Outside IR35)

**Path:** `/calculators/take-home`

**Inputs:** day rate, billable days per year, percentage of revenue paid into pension, current age, other income.

**Core engine:** `bracketmath/src/components/calculators/TakeHome.tsx`. **Re-uses the existing tax engine** (`income-tax.ts`, `ni.ts`, `corp-tax.ts`, `dividend.ts`, `optim/salary-dividend.ts`). No new tax library code should be needed.

**Compute two scenarios in parallel:**
1. **Inside IR35 / umbrella PAYE:** day-rate × days = gross. Apply employer NI deemed-employer haircut, then employee NI + income tax. Optional pension contribution via salary sacrifice.
2. **Outside IR35 / Ltd Co:** day-rate × days = company turnover. Subtract reasonable business costs. Then run the existing `optimiseSalaryDividend` engine to get the best legal extraction plan.

**Headline output:**
- Net take-home £/year under each scenario
- Effective tax rate under each
- The day-rate uplift required for inside-IR35 to break even with outside-IR35 (a number contractors actually care about)

**Page copy:** 1,200+ words on what IR35 is, how status determination works (SDS, CEST), the off-payroll-working rules, why the break-even number depends sensitively on assumed business expenses, and a calibration note that this calculator does not make a status determination — it just compares the two financial scenarios for someone who already knows their status.

**Testing — ≥ 15 Vitest assertions** focused on the comparison logic + edge cases (zero days, very high day rates triggering additional-rate, pension contributions interacting with the £100k taper).

### Deliverable C — Polish & cleanup that must ship with Weeks 4–5

These are the items the previous agent flagged in `CHECKLIST.md` "Polish items the next agent should tackle alongside Weeks 4-5":

1. **Lift Accessibility from 94 → 95+** on `/calculators/salary-dividend-split` and the new pages:
   - Audit heading order (one issue flagged on the existing page — probably `<h3>` before `<h2>` somewhere in `SalaryDividendSplit.tsx` or `salary-dividend-split.astro`)
   - Audit colour contrast — likely `--color-ink-light` against `--color-cream` is below WCAG AA 4.5:1 for body text. Darken `--color-ink-light` in `global.css` until the ratio passes
2. **Self-host the Google Font** (Lighthouse flagged ~780ms savings). Download the woff2 files and serve from `public/fonts/`. Apply `font-display: swap`.
3. **Inline critical CSS** in `Layout.astro` to eliminate the render-blocking stylesheet (Lighthouse flagged ~540ms savings).
4. **Update homepage hero CTAs** (`bracketmath/src/pages/index.astro`) to link to all three calculator URLs (currently some are placeholder 404s).

After all the above, re-run Lighthouse on **all three calculator pages** on the live URL. Target: **95+ on all four pillars, on all three pages.**

## 5. Conventions and constraints — read carefully

- **Stack is fixed:** Astro 6, React 18 islands (`client:only="react"`), Tailwind via `astro/tailwind`, Cloudflare Workers + Static Assets adapter, TypeScript strict, Vitest 3 (do not upgrade to 4 — there's an internal Vitest-4 / Vite-7 bug).
- **No new chart libraries.** Recharts, Chart.js, d3 — none. The existing inline-SVG pattern in `SalaryDividendSplit.tsx` is the reference. Keep the JS bundle tiny.
- **No new state libraries.** React `useState` / `useMemo` / `useReducer` is sufficient.
- **Constants:** every HMRC rate, threshold, allowance lives in `bracketmath/src/lib/tax/constants.ts`. If your work needs a new constant (e.g., the State Pension age trajectory, the pension Lifetime Allowance Successor regime, the Annual Allowance taper), add it there with a comment citing the HMRC / DWP source URL.
- **Money formatting:** always whole pounds with thousand separators (`£12,570`). No pence in user-facing outputs. Rounding: banker's rounding for tie-breaks; otherwise round to the nearest pound at display time only — keep calculation precision internally.
- **Tax year:** 2026/27 for everything. If a value is unannounced/uncertain (rare), comment the assumption in the constants file.
- **Anonymity:** no "I built this" copy, no personal name, no claimed credentials. The voice is the methodology speaking. Re-read `/about` for tone.
- **CMA-compliant affiliate disclosure:** any affiliate-linked element must be clearly marked. See `/disclaimer` clause 5.
- **Privacy:** all calculation must happen in-browser. No telemetry, no logging of user inputs. The Privacy page is explicit about this — do not break that promise.
- **Performance budget:** total JS for any calculator page ≤ 100 KB compressed. The current salary-dividend page is ~70 KB. The SIPP page will be heavier (10k Monte Carlo paths) — if it exceeds 100 KB, push the simulation into a Web Worker so the main bundle stays small.
- **Git workflow:** commit messages are conventional commits (`feat:`, `fix:`, `chore:`). One logical change per commit. The repo is at https://github.com/bracketmath/bracketmath. Push triggers an automatic Cloudflare Workers build + deploy (~3 min).

## 6. The "don'ts" — these are non-negotiable

- ❌ **Do not invent statistics.** If you cannot cite a number to an HMRC, FCA, ONS, or peer-reviewed source, do not put it on the site.
- ❌ **Do not skip ahead in CHECKLIST.md.** Pillar pages, programmatic pages, affiliate applications, sitemap — these are Weeks 6+. Do not touch them.
- ❌ **Do not pivot the business model.** No SaaS, no paid tier, no email gating the calculators. The site is a free public-good calculator that monetises via contextual affiliate links — see `MASTER-PLAN.md` Section 3.
- ❌ **Do not add tracking, analytics scripts, or ad code.** Cloudflare Web Analytics is the only one allowed (it's cookieless / GDPR-clean / declared on `/privacy`).
- ❌ **Do not change the project / GitHub / Cloudflare account ownership.** Everything must remain under the dedicated `bracketmath` GitHub user and `[email protected]` Gmail / Cloudflare account — this is for resaleability.
- ❌ **Do not regenerate `package-lock.json` unnecessarily or change `Node` versions** — the deployed Cloudflare build pins `NODE_VERSION=22`.
- ❌ **Do not block on user input** for things you can reasonably decide. If the user says "go", produce working code, then surface decisions you made in a final summary.

## 7. The "do's"

- ✅ Read every file listed in section 2 before writing one line of code.
- ✅ Mirror the patterns in Calculator #1. Same file layout, same testing style, same UI grammar, same Astro page structure. Consistency across calculators = compound trust signal for both users and Google.
- ✅ Cite HMRC / FCA / ONS source URLs in code comments and on the page itself.
- ✅ Write Vitest tests **as you go**, not at the end. Boundary conditions matter more than happy paths in YMYL — test £49,999.99 and £50,000.01, test negative inputs, test £0, test £999,999,999.
- ✅ Use the `task_progress` / equivalent todo-list mechanism your host editor offers, so the user can see incremental progress.
- ✅ When you finish each deliverable (A, B, C), report a one-paragraph summary including: live URL once pushed, Lighthouse scores from the live URL, number of tests passing, anything that went outside the spec and why.
- ✅ After all three deliverables ship, **update CHECKLIST.md** — tick every item under "WEEKS 4–5", update the "Current status" section at the bottom of the file, and add a fresh handoff prompt for the next agent (Weeks 6–8 = pillar pages + affiliate network applications).

## 8. The one-question rule

If — after reading every file in section 2 and looking at the existing code — you have a question that genuinely blocks progress, ask **one** clarifying question, **then** start working with sensible defaults if no answer arrives. Do not ask the user a dozen questions in a row; their attention is the scarcest resource and they trust you to make reasonable engineering decisions.

## 9. What "done" looks like

When you finish, the following must all be true:

- [ ] `/calculators/sipp-optimiser` is live on https://bracketmath.co.uk, renders a Monte Carlo fan chart, displays probability of pot exhaustion + probability of meeting target income, has 1,500+ words of methodology copy, Lighthouse Mobile 95+ across all four pillars
- [ ] `/calculators/take-home` is live, shows the inside-IR35 vs outside-IR35 comparison + break-even day rate, has 1,200+ words of methodology copy, Lighthouse Mobile 95+
- [ ] `/calculators/salary-dividend-split` Accessibility score is now 95+ (heading + contrast fixed)
- [ ] Homepage hero CTAs link to all three real calculator URLs (no more 404s)
- [ ] `npm test` passes — total assertions ≥ 130 (previous baseline was 88; you added ≥ 40 across SIPP + Take-Home)
- [ ] `npm run build` succeeds with zero warnings
- [ ] All three calculator URLs submitted to Google Search Console for indexing
- [ ] `CHECKLIST.md` updated with every Weeks 4-5 item ticked, "Current status" section refreshed, and a new `HANDOFF-PROMPT-WEEKS-6-8.md` created at the workspace root

That is your scope. Read first, then begin.

---

# Quick-paste opening message for the next agent

> The previous agent finished Weeks 2-3 of the BracketMath project. The Salary–Dividend Split Optimiser is now live at https://bracketmath.co.uk/calculators/salary-dividend-split with 88 passing unit tests and Lighthouse Mobile 97/94/100/100.
>
> Your job is Weeks 4-5: build the **SIPP Optimiser** (Monte Carlo retirement simulator) and the **Take-Home (IR35 inside vs outside) calculator**, plus the polish items the previous agent left.
>
> Before you write any code, read these files at the workspace root in full and in order: `MASTER-PLAN.md`, `CHECKLIST.md`, `strategic-recommendation.md`, `PLAN.md`, `SETUP-WALKTHROUGH.md`, and `HANDOFF-PROMPT-WEEKS-4-5.md` (this file). Then study the existing code in `bracketmath/src/lib/`, `bracketmath/src/components/calculators/`, and `bracketmath/src/pages/calculators/` so you match the established patterns exactly.
>
> The bar is "world-class": every number must cite an HMRC / FCA / ONS source, ≥ 20 Vitest tests per calculator, Lighthouse Mobile 95+ on all four pillars on the live URLs, no new chart libraries, no new state libraries, fully anonymous voice. The site is YMYL (Your Money, Your Life) so mathematical correctness is non-negotiable.
>
> The full specification, conventions, the "don't" list, and the definition of "done" are in `HANDOFF-PROMPT-WEEKS-4-5.md`. Begin by reading that file. Confirm you've read it, then start.
