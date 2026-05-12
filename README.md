# BracketMath

> Mathematically-correct UK personal-finance calculators that respect HMRC source documents.
> Live at **https://bracketmath.co.uk**.

This is a YMYL (Your Money, Your Life) content site. Every published number is either a direct citation of HMRC / FCA / ONS / DWP / OBR data or the output of an engine in `src/lib/`. There are no hand-wavy estimates.

---

## 🟢 Live calculators

| URL | Description | Tests |
|---|---|---:|
| `/calculators/salary-dividend-split` | Joint optimiser over (salary, pension) for Ltd Co directors. At £140k profit it saves £31,698/yr vs the rule-of-thumb baseline. | 88 |
| `/calculators/sipp-optimiser` | Block-bootstrap Monte Carlo retirement simulator over 125 years of UK historical returns. 10,000 paths. Reports probability of pot exhaustion. | 64 |
| `/calculators/take-home` | Inside-IR35 vs outside-IR35 comparison that runs the actual joint salary-dividend optimiser on the outside route. Break-even day rate via bisection. | 28 |

**Total Vitest assertions:** 180 / 180 passing.

## 🛠 Stack

- **Astro 6** with the `@astrojs/cloudflare` adapter (Workers + Static Assets, server mode with prerendered routes)
- **React 18** islands (`client:only="react"` — Cloudflare Workers dev-mode doesn't support React's CJS in SSR)
- **Tailwind** via `astro/tailwind`
- **TypeScript** strict
- **Vitest 3** for unit tests (do NOT upgrade to 4 — Vitest 4 has an internal config bug with Vite 7)
- **Cloudflare Workers** for hosting (auto-deploys on push to `main`)
- **No new chart libraries** — every chart is inline SVG. The JS bundle for each page is < 100 KB compressed.

## 🧮 Engine modules

All maths lives under `src/lib/`. Every HMRC rate is centralised in `src/lib/tax/constants.ts` — reuse, never duplicate.

```
src/lib/
├── tax/
│   ├── constants.ts     # every HMRC threshold for 2026/27, with source URLs in comments
│   ├── income-tax.ts    # PA + bands, £100k taper with optional additionalIncomeForPA
│   ├── ni.ts            # Class 1 EE / ER, Class 2 / Class 4
│   ├── corp-tax.ts      # exact HMRC marginal-relief formula, associatedCompanies factor
│   └── dividend.ts      # band stacking with £500 dividend allowance
├── optim/
│   └── salary-dividend.ts   # joint grid search, pensionWeight slider, returns optimum / cashOptimum / ruleOfThumb / salaryCurve / warnings
├── montecarlo/
│   ├── rng.ts           # Mulberry32 deterministic seeded PRNG
│   ├── returns.ts       # blockBootstrap (12-month contiguous blocks)
│   └── simulate.ts      # 10,000-path accumulation + decumulation, percentile fan
├── ir35/
│   └── compare.ts       # inside-PAYE vs outside-LtdCo (reuses everything above)
└── __tests__/           # Vitest specs, one per module
```

## 🚀 Commands

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview build locally |
| `npm test` | Run Vitest unit tests |

## 🔁 Deploy

Pushing to `main` on **github.com/bracketmath/bracketmath** triggers Cloudflare to build + deploy (~3 min). `wrangler.jsonc` and `astro.config.mjs` are the source-of-truth config. `NODE_VERSION=22` is pinned in the Cloudflare project settings.

```sh
git add -A
git commit -m "feat: ..."
git push origin main
```

## 📜 Conventions

- **No personal name, no credential claims** — anonymous voice on legal / CMA / E-E-A-T grounds. See `/about`.
- **CMA-compliant affiliate disclosure** — sponsored links use `rel="sponsored"`. See `/disclaimer` clause 5.
- **Privacy** — all calculation in-browser. No telemetry, no logging of user inputs. Cloudflare Web Analytics only (cookieless, declared on `/privacy`).
- **Money formatting** — whole pounds with thousand separators (`£12,570`). No pence in user-facing outputs. Banker's rounding for tie-breaks.
- **Tax year** — 2026/27 throughout.
- **Conventional commits** — `feat:`, `fix:`, `chore:`. One logical change per commit.

## 🗺 Where things are documented

| File | Purpose |
|---|---|
| `../MASTER-PLAN.md` | 15-month strategic plan |
| `../CHECKLIST.md` | Tactical execution path, ticked as work progresses |
| `../HANDOFF-PROMPT-WEEKS-N-N.md` | Specifications for each session's scope |
| `../SETUP-WALKTHROUGH.md` | Infrastructure decisions and the manual cloud-setup steps |
| `src/data/README.md` | Provenance of `historical-returns.json` |

The workspace-root markdown docs sit *outside* the deployed repo intentionally — they are project state, not site content.
