/**
 * Layer 3 of the 7-layer variance model (MASTER-PLAN §11.5): the FAQ pool.
 *
 * Fifty Q&A pairs tagged by persona / structure / income band / engine
 * concept. Each page draws 4–6 FAQs whose tags match the row, deterministic
 * by `fnv1a(slug)` so the same slug always serves the same FAQs.
 *
 * Some answers are static (tax-band definitions, etc). Others are produced
 * by a small function that consumes `(row, c)` and renders engine numbers
 * into the answer — keeping the FAQ block firmly inside the YMYL contract.
 */

import type { Computed, PseoRow } from './types';
import { fnv1a } from './hash';

const money = (n: number) =>
  '£' + Math.round(n).toLocaleString('en-GB');

export interface FAQ {
  question: string;
  answer: string | ((row: PseoRow, c: Computed) => string);
  /** Tag the FAQ is eligible for. */
  tags: Array<
    | 'all'
    | 'ltd_co'
    | 'umbrella'
    | 'sole_trader'
    | 'optimiser'
    | 'lifestyle_se'
    | 'pre_retiree'
    | 'income_low' // gross < £40k
    | 'income_mid' // £40k–£100k
    | 'income_high' // > £100k
    | 'taper' // crosses £100k taper
    | 'pension'
  >;
}

const FAQ_POOL: FAQ[] = [
  // ── universal mechanics (tagged 'all') ───────────────────────────────────
  {
    question: 'What tax year do these figures use?',
    answer:
      '2026/27 UK tax year (6 April 2026 – 5 April 2027), England, Wales and Northern Ireland rates. Scottish tax bands are not modelled in this calculation — Scotland has a separate Starter / Basic / Intermediate / Higher / Advanced / Top band schedule that will be added in a future batch.',
    tags: ['all'],
  },
  {
    question: 'Are the numbers on this page computed live or pre-rendered?',
    answer:
      'They are pre-rendered at build time by running the BracketMath engine code against the inputs for this specific row. That means: zero JavaScript on the page for the calculation itself, the figures cannot drift if the engine is changed, and you can verify them by running the corresponding calculator with the same inputs.',
    tags: ['all'],
  },
  {
    question: 'What is the Personal Allowance and how is it used in this calculation?',
    answer:
      'The Personal Allowance is the first £12,570 of non-savings, non-dividend income on which no income tax is charged. It is consumed from the bottom up: salary first, then dividends. Above £100,000 of adjusted net income the allowance tapers at £1 lost for every £2 of income, fully eroded at £125,140 — producing the well-known 60% effective marginal rate inside that £25,140-wide band.',
    tags: ['all'],
  },
  {
    question: 'What does the "marginal rate" mean on this page?',
    answer: (_row, c) =>
      `It is the rate paid on the next £1 of gross income added to this scenario. For this row that figure is ${(c.marginalRate * 100).toFixed(1)}%. The marginal rate is always higher than the average effective rate — it is the right number for "is one more invoice worth it" decisions.`,
    tags: ['all'],
  },
  {
    question: 'Why is the effective rate lower than the headline tax brackets?',
    answer:
      'Because the headline 20% / 40% / 45% rates apply only to the income slice in each band — not the whole income. The Personal Allowance shelters the first £12,570 at 0%; the basic-rate band only charges 20% on the next £37,700; and so on. The effective rate on the entire income is the weighted average of every slice — typically much lower than the headline number people quote.',
    tags: ['all'],
  },

  // ── Ltd-Co specific ──────────────────────────────────────────────────────
  {
    question: 'Why does the optimiser pay a salary above £5,000 if employer NI starts there?',
    answer: (_row, c) => {
      const r = (c.engineResult as { optimum?: { salary: number } }) ?? null;
      if (!r || !r.optimum) return 'See the salary-dividend split calculator for details.';
      return `Because beyond the £5,000 Secondary Threshold, each £1 of salary still saves 19–25% of corporation tax and only costs 15% in employer NI plus 8% employee NI — a net 11–17% saving up to the £12,570 Personal Allowance. The 2026/27 optimum for this row is ${money(r.optimum.salary)} of salary, sitting in exactly this regime.`;
    },
    tags: ['ltd_co'],
  },
  {
    question: 'Should I take the £12,570 standard director salary?',
    answer: (_row, c) => {
      const r = c.engineResult as { optimum: { salary: number } };
      return r.optimum.salary >= 12_000 && r.optimum.salary <= 12_700
        ? 'For this row the optimiser settled on a salary very close to the £12,570 standard — confirming the rule of thumb works here.'
        : `For this row the optimiser disagrees with the £12,570 rule of thumb — it places the optimum salary at ${money(r.optimum.salary)}. Above ${money(r.optimum.salary)} the marginal cost (employer NI + employee NI + income tax) exceeds the marginal saving in corporation tax + dividend tax.`;
    },
    tags: ['ltd_co'],
  },
  {
    question: 'Are dividends "double taxed" because corporation tax was already paid?',
    answer:
      'Yes — but the dividend tax rates (8.75% / 33.75% / 39.35%) are set lower than the equivalent income-tax rates (20% / 40% / 45%) precisely to account for the corporation tax already paid at company level. The combined CT + dividend tax stack is usually still cheaper than the salary stack of income tax + employer NI + employee NI for any single £1, which is why the optimiser puts most extraction through dividends.',
    tags: ['ltd_co'],
  },
  {
    question: 'How is corporation tax calculated in this scenario?',
    answer: (row, c) => {
      const r = c.engineResult as { optimum: { detail: { corporationTax: { regime: string; tax: number } } } };
      const regime = r.optimum.detail.corporationTax.regime;
      if (regime === 'small') {
        return `At ${money(row.grossIncome - r.optimum.detail.corporationTax.tax)} of taxable post-pay profit, the company pays 19% corporation tax — the "small profits rate" for taxable profits ≤ £50,000.`;
      }
      if (regime === 'main') {
        return `The taxable post-pay profit exceeds £250,000, so the company pays 25% corporation tax — the "main rate".`;
      }
      return `The taxable post-pay profit falls in the £50,000–£250,000 "marginal-relief band". Corporation tax is computed as 25% of taxable profits minus marginal relief, producing an effective marginal rate of 26.5% on each pound between the two thresholds.`;
    },
    tags: ['ltd_co'],
  },
  {
    question: 'Why does the optimiser want such a large pension contribution?',
    answer: (_row, c) => {
      const r = c.engineResult as { optimum: { pension: number } };
      return r.optimum.pension > 5_000
        ? `Because employer pension contributions dodge three taxes simultaneously: corporation tax (deductible), employer NI (none), and personal income tax / NI / dividend tax (none until drawdown). For this row the optimiser allocates ${money(r.optimum.pension)} to pension — the largest tax shelter available to a director.`
        : `For this row the pension contribution sits at ${money(r.optimum.pension)} — the model preferred net cash today over the pension wrapper based on the pension-weight setting.`;
    },
    tags: ['ltd_co', 'pension'],
  },
  {
    question: 'Is the Employment Allowance available for a single-director company?',
    answer:
      'No. A company with only one director who is also the sole paid employee cannot claim the £10,500 Employment Allowance (HMRC manual ESM4017). For genuine multi-employee setups it is claimable and the optimiser can model it via the `claimEmploymentAllowance` flag.',
    tags: ['ltd_co'],
  },

  // ── Umbrella / IR35 specific ─────────────────────────────────────────────
  {
    question: 'Why does the umbrella deduct employer NI before paying me?',
    answer:
      'Because the umbrella is your legal employer for tax purposes inside IR35. The contract rate paid to the umbrella covers the umbrella\'s employer-side costs first (employer NI at 15% above £5,000, plus its own margin / fee), then the residual is paid to you as a "deemed salary" through PAYE. The contractor is the economic incidence of the employer NI — it always was, but inside IR35 it is explicit on the payslip.',
    tags: ['umbrella'],
  },
  {
    question: 'What is the cost of being inside IR35 vs outside at this day rate?',
    answer: (_row, c) => {
      const r = c.engineResult as { netWealthDifference: number; insideBreakevenDayRate: number | null };
      return `For this row, operating inside IR35 instead of outside costs ${money(r.netWealthDifference)} per year of net wealth (cash + pension). To match the outside-IR35 take-home at the same day rate, an inside contract would need to be priced at approximately ${money(r.insideBreakevenDayRate ?? 0)}/day.`;
    },
    tags: ['umbrella'],
  },
  {
    question: 'Is salary sacrifice into a pension worth it inside IR35?',
    answer:
      'Yes — by a wide margin. Salary sacrifice removes the pension contribution from the gross before the employer-NI / employee-NI / income-tax stack is applied. Each £1 sacrificed costs the contractor roughly 50–70p of cash today (depending on tax band) and lands £1 in the pension. There is no other comparable lever inside IR35.',
    tags: ['umbrella', 'pension'],
  },
  {
    question: 'Why does the take-home calculator default to 220 billable days?',
    answer:
      '220 is the conservative consultancy assumption for a working year after holiday (typically 25–28 days), bank holidays (8–9 days), illness (3–5 days) and unbillable time (training, business development, gaps between contracts). Many calculators use 230 or 240; we lean conservative because the gap between billable expectation and reality is a common contractor planning error.',
    tags: ['umbrella'],
  },
  {
    question: 'Is the Apprenticeship Levy actually due on my umbrella rate?',
    answer:
      'Legally, only if the umbrella\'s total annual paybill exceeds £3 million — and even then it falls on the umbrella, not the contractor. In practice many umbrellas pass it through as a 0.5% deduction. This page models the levy as off by default; toggle it on in the take-home calculator to see the effect.',
    tags: ['umbrella'],
  },

  // ── Sole-trader specific ─────────────────────────────────────────────────
  {
    question: 'What is the £1,000 trading allowance and when does it help?',
    answer:
      'The trading allowance (ITTOIA 2005 s.783A) lets a sole trader deduct a flat £1,000 from gross trading income in lieu of claiming actual expenses. It strictly beats actual expenses whenever expenses are less than £1,000. The engine picks whichever produces lower taxable profits — for this row the chosen route is shown in the comparison table.',
    tags: ['sole_trader'],
  },
  {
    question: 'Should I pay voluntary Class 2 NI even if my profits are below the threshold?',
    answer:
      'Usually yes. Class 2 voluntary contributions cost £179.40/yr (£3.45/week × 52) and buy a State Pension qualifying year. The Full New State Pension as of 2026 is £230.25/wk (£11,973/yr) and you need 35 qualifying years to get the full amount. One year of voluntary Class 2 buys roughly £342 of annual State Pension at retirement — a payback period of about 6 months on first claim.',
    tags: ['sole_trader'],
  },
  {
    question: 'Should I incorporate this sole-trader business into a Ltd Co?',
    answer: (_row, c) => {
      const r = c.engineResult as { ltdCoComparison?: { differenceVsSoleTrader: number; breakevenProfits: number | null } };
      if (!r.ltdCoComparison) return 'See the dedicated sole-trader-vs-ltd guide for the cost-benefit at any turnover.';
      const gap = r.ltdCoComparison.differenceVsSoleTrader;
      if (gap > 2_000) {
        return `At this turnover, the pure-tax saving from incorporating is approximately ${money(gap)}/year. Against that, weigh roughly £800–£1,500/yr of accountancy fees, the public Companies House filing burden, and the loss of the trading allowance. Above ${money(r.ltdCoComparison.breakevenProfits ?? 30_000)} of profit the Ltd Co structure tends to be worth the overhead.`;
      }
      return `At this turnover, the pure-tax saving from incorporating is only ${money(Math.max(0, gap))}/year — almost certainly less than the ~£800–£1,500/yr accountancy and admin overhead of running a Ltd Co. Stay a sole trader unless turnover scales materially.`;
    },
    tags: ['sole_trader'],
  },
  {
    question: 'When does the £50,270 higher-rate threshold start to bite a sole trader?',
    answer:
      'Once total taxable income (trading profits + other income, after the Personal Allowance) exceeds £37,700. At that point, each £1 of additional trading profit is taxed at 40% income tax + 2% Class 4 NI = 42% combined marginal. This is also the point at which "should I incorporate?" tends to start producing a meaningful answer.',
    tags: ['sole_trader'],
  },
  {
    question: 'Do I need to register for VAT?',
    answer:
      'Mandatory VAT registration kicks in once taxable turnover crosses £90,000 in any rolling 12-month period (the threshold as of 1 April 2024). Below that it is voluntary. Many sole traders register voluntarily anyway to recover input VAT on equipment — but this calculation does not model VAT cashflow; it sits on the income-tax side of the balance only.',
    tags: ['sole_trader'],
  },

  // ── Lifestyle SE (low/mid income, side hustles, work-life balance) ───────
  {
    question: 'How does my PAYE day job interact with this side-hustle income?',
    answer: (row, c) => {
      if (row.otherIncome <= 0) {
        return 'For this row there is no separately-stacking PAYE income — the figures above are pure self-employment / contract earnings.';
      }
      return `For this row there is ${money(row.otherIncome)} of other personal income stacking below the self-employment figure. The PAYE / other income uses the Personal Allowance first, then the basic-rate band, then the higher-rate band — the self-employment income is "stacked" on top and taxed at whichever marginal rate it lands in. That is why low self-employment income can still attract 40% tax if the PAYE income is large enough to push the marginal slice into higher rate.`;
    },
    tags: ['lifestyle_se'],
  },
  {
    question: 'Do I need to file a Self Assessment for this income?',
    answer:
      'Yes, if the gross self-employment income is over £1,000 (the threshold above which the trading allowance no longer provides "full relief"). Even below that, you may wish to file voluntarily to claim losses or to maintain a tax-payer record. The deadline is 31 January following the end of the tax year (so 31 January 2028 for 2026/27).',
    tags: ['lifestyle_se'],
  },
  {
    question: 'What expenses can I deduct as a sole trader?',
    answer:
      '"Wholly and exclusively" business costs — equipment, software, professional insurance, travel to non-permanent workplaces, training that maintains existing skills, a proportionate share of home-office costs (HMRC simplified flat rates available), and accountancy fees. Personal commuting, entertainment, training to acquire new skills, and clothing (unless protective / uniform) are not deductible.',
    tags: ['lifestyle_se', 'sole_trader'],
  },
  {
    question: 'How does the £1,000 trading allowance interact with rental income?',
    answer:
      'They are separate allowances. There is a £1,000 trading allowance for trading income and a separate £1,000 property allowance for rental income, both under FA 2017. You can claim both in the same year if you have both income streams.',
    tags: ['lifestyle_se'],
  },

  // ── Pre-retiree (45+, big pension push, decumulation framing) ────────────
  {
    question: 'How much can I put into pension this year?',
    answer: (row, c) => {
      const aaText =
        row.grossIncome + row.otherIncome > 260_000
          ? `Above £260,000 of adjusted income the Annual Allowance tapers from £60,000 down to £10,000 floor — for this row the effective AA is around £${Math.max(
              10_000,
              Math.round(60_000 - (row.grossIncome + row.otherIncome - 260_000) / 2),
            ).toLocaleString('en-GB')}.`
          : `Below £260,000 of adjusted income the full £60,000 Annual Allowance is available.`;
      return `The 2026/27 pension Annual Allowance is £60,000. ${aaText} Carry-forward of unused AA from the last three tax years is available subject to membership-in-each-year rules.`;
    },
    tags: ['pre_retiree', 'pension'],
  },
  {
    question: 'What happens to my pension at age 55 / 57?',
    answer:
      'From age 55 (rising to 57 from 6 April 2028 per the Finance Act 2021) you can access defined-contribution pensions. The first 25% of the pot is tax-free (the "Pension Commencement Lump Sum"), subject to the £268,275 Lump Sum Allowance. The remainder is drawable at your marginal income-tax rate — but you can phase it across decumulation years to keep most of it within the 20% basic-rate band.',
    tags: ['pre_retiree', 'pension'],
  },
  {
    question: 'Is the State Pension worth deferring?',
    answer:
      'For State Pensions claimed after 6 April 2016, deferring uplifts the entitlement by 1% for every 9 weeks deferred (about 5.8% per year). The break-even is approximately 17 years — if you expect to live materially longer than 17 years after State Pension Age, deferring marginally wins. Most people claim on time and invest the cash instead.',
    tags: ['pre_retiree'],
  },
  {
    question: 'How long will my pension pot last?',
    answer:
      'See the SIPP optimiser at /calculators/sipp-optimiser for a 10,000-path Monte Carlo answer. The widely-cited "4% safe withdrawal rate" comes from US data; the UK historical record produces a lower number (closer to 3.0–3.5%) due to inflation regime differences and slower equity returns. The calculator reports the probability of pot exhaustion explicitly.',
    tags: ['pre_retiree'],
  },

  // ── Optimiser (high earner, maximisation framing) ────────────────────────
  {
    question: 'Why does the optimiser disagree with my accountant?',
    answer:
      'Often because the accountant is optimising salary first, pension second, dividend as residual — three sequential one-variable problems. The BracketMath optimiser does the joint problem: every (salary, pension) cell evaluated through the full tax stack, accounting for the four-band salary problem, the £100k taper, the CT marginal-relief band, and the Annual Allowance taper simultaneously. The improvement is typically £2k–£35k/yr at typical income levels.',
    tags: ['optimiser'],
  },
  {
    question: 'Can I take more than the optimum out of the company?',
    answer:
      'Of course — every £1 above the optimum simply costs more in tax than it gains in cash. The optimiser tells you the maximum-net-wealth point, not a legal limit. Past the optimum the marginal cost of extraction climbs steeply (60% effective in the PA-taper band, 39.35% additional-rate dividend above £125,140).',
    tags: ['optimiser'],
  },
  {
    question: 'What happens if I retain profit in the company instead of extracting it?',
    answer:
      'The optimiser models full extraction (max-extraction mode). Retaining profits inside the company defers the dividend-tax slice but pays corporation tax now. If the retained cash is invested at company-level the returns face corporation tax annually. If the company is later sold and qualifies for Business Asset Disposal Relief, retained profits can be extracted at 10% CGT — but BADR rules and the lifetime allowance keep tightening (currently £1m lifetime cap). For most contractors, extract now is the right call.',
    tags: ['optimiser', 'ltd_co'],
  },

  // ── Taper-band specific ─────────────────────────────────────────────────
  {
    question: 'Is the 60% marginal rate inside the £100k taper really 60%?',
    answer:
      'Effectively yes. Inside the £100,000–£125,140 band, an extra £1 of adjusted income costs 40p in income tax plus the loss of 50p of Personal Allowance (which would have been taxed at 0%) — so the next £1 of PA that gets taxed at 40% is an extra 20p, total 60p of tax on £1 of income. If you also lose the Tax-Free Childcare / 30-hours-childcare entitlement at £100k, the effective cliff can be even sharper.',
    tags: ['taper'],
  },
  {
    question: 'How do I avoid the 60% taper?',
    answer:
      'For a salaried employee: salary sacrifice into pension. For a Ltd Co director: employer pension contribution. For a sole trader: personal pension contributions (which reduce adjusted net income). The taper-zone marginal of 60% means each £1 of pension contribution effectively costs the saver 40p of foregone cash — the strongest tax shelter the UK code currently offers.',
    tags: ['taper', 'pension'],
  },

  // ── State pension / NI qualifying years ──────────────────────────────────
  {
    question: 'How many qualifying years do I need for the full new State Pension?',
    answer:
      '35 qualifying years for the full new State Pension. With fewer, the pension is pro-rated (1/35 per year). A minimum of 10 qualifying years is required for any new State Pension. Voluntary Class 2 (sole traders) or Class 3 (everyone else) can plug gaps in the NI record.',
    tags: ['all'],
  },
  {
    question: 'Does taking a £nil salary cost me a State Pension year?',
    answer:
      'Yes, if you take £0 salary and pay no Class 2 (sole traders) or Class 3 (Ltd Co directors) you will not earn a qualifying year for that tax year. Take at least the Lower Earnings Limit (£6,500 in 2026/27) as salary to earn a qualifying year automatically. Most directors take £12,570 (full PA) anyway, well above the LEL.',
    tags: ['ltd_co'],
  },

  // ── More general / cross-cutting ─────────────────────────────────────────
  {
    question: 'Does this calculation include student loan repayments?',
    answer:
      'No. Student Loan repayments (Plan 1 / 2 / 4 / 5 / Postgraduate) are not modelled in the BracketMath engines. Plan 2 repayments at 9% above £27,295 add roughly 9p of marginal cost to each £1 of taxable income above the threshold. Add this to the marginal rate quoted on this page if you have an outstanding student loan.',
    tags: ['all'],
  },
  {
    question: 'Does this include the High Income Child Benefit Charge?',
    answer:
      'No. HICBC is not in the engine. If you or your partner earn over £60,000 and either of you claims Child Benefit, HICBC tapers the Child Benefit at 1% for every £200 of income over £60,000, fully eroded at £80,000 (2026/27 thresholds). This adds an effective 11% marginal between £60,000 and £80,000 for a one-child household, ~22% for two children, etc.',
    tags: ['income_high'],
  },
  {
    question: 'Does it include Scottish income tax?',
    answer:
      'No. Scotland has its own income-tax band schedule (Starter 19% / Basic 20% / Intermediate 21% / Higher 42% / Advanced 45% / Top 48% for 2026/27). National Insurance and corporation tax are still set at UK-wide rates. A Scotland-specific batch of programmatic pages is planned but is not in this batch.',
    tags: ['all'],
  },
  {
    question: 'What if I have rental income alongside this self-employment?',
    answer:
      'Add it to the `otherIncome` field of the calculator. Property income is taxed at non-savings, non-dividend rates (so stacks alongside salary in the band schedule). The first £1,000 of rental income can also be sheltered by the separate Property Allowance under FA 2017 s.16.',
    tags: ['all'],
  },
  {
    question: 'How does the Pension Annual Allowance taper work?',
    answer:
      'Above £260,000 of adjusted income, the £60,000 Annual Allowance reduces by £1 for every £2 over the threshold, down to a £10,000 floor at £360,000 of adjusted income. The taper bites later than the £100k Personal Allowance taper but is similarly punitive on pension contributions specifically.',
    tags: ['pension', 'income_high'],
  },
  {
    question: 'Are dividend tax rates rising in 2026/27?',
    answer:
      'No — the 8.75% / 33.75% / 39.35% rates were set in 2022 and have been held flat through 2026/27. The Dividend Allowance has been reduced from £2,000 (2022/23) to £500 (2024/25 onwards) which has the same effect as a ~£175 tax rise at any rate band. This figure is built into every dividend-related calculation on the site.',
    tags: ['ltd_co'],
  },
  {
    question: 'Should I take dividends now or wait until next tax year?',
    answer:
      'Tax-year-end timing matters: a dividend declared in March 2027 is taxed at 2026/27 rates; one declared in April 2027 falls into 2027/28 (potentially still in the same calendar year). If your 2026/27 personal income is bunched in basic-rate territory and 2027/28 will be in higher-rate, accelerate. If the reverse, defer. The mathematical structure is "level the tax-band utilisation across years if income is volatile."',
    tags: ['ltd_co'],
  },
  {
    question: 'Why does the page link to specific other professions?',
    answer:
      'The five linked pages at the bottom are computed by a similarity metric over (profession, income, structure, age band) — the closest five neighbours in that space, not the same five pages every row links to. The aim is a genuine cross-link graph rather than a star pattern that search engines correctly read as a pSEO signal.',
    tags: ['all'],
  },
  {
    question: 'Where does the BracketMath engine source its rates?',
    answer:
      'Income tax / NI / CT / dividend rates come from HMRC\'s published 2026/27 rate tables (gov.uk/government/publications/rates-and-allowances-income-tax). Pension rules come from FA 2004 and the FCA\'s consumer guidance. Historical investment returns used in the Monte Carlo engine come from a 125-year UK gilt + UK equity series stored in src/data/historical-returns.json. Every constant carries a source URL in the source code.',
    tags: ['all'],
  },
  {
    question: 'Is this calculation valid for the 2027/28 tax year?',
    answer:
      'Only partially. Thresholds (PA, basic-rate, higher-rate, NI thresholds) are frozen through April 2028 per the Autumn Budget 2024. Some rates may change at the Spring 2027 Budget. The figures here are accurate for 2026/27 and will be re-run after any future Finance Act changes — check the published-date footer of this page.',
    tags: ['all'],
  },
  {
    question: 'What is the £500 Dividend Allowance and how is it used?',
    answer:
      'The first £500 of dividends in 2026/27 is taxed at 0%. It does not reduce taxable income — it sits as a 0% slice within the band schedule. So a basic-rate dividend recipient with £500 of dividends pays £0; with £600 of dividends pays 8.75% × £100 = £8.75. The £500 is consumed in band order (cheapest band first).',
    tags: ['ltd_co'],
  },
  {
    question: 'What is the "deemed salary" inside IR35?',
    answer:
      'It is the figure the umbrella treats as your gross salary after deducting its own fee and employer NI from the contract value. Inside IR35, the contractor does not legally have a separate Ltd Co — the relationship is, for tax purposes, "deemed employment." The deemed salary is what PAYE income tax and employee NI are calculated on.',
    tags: ['umbrella'],
  },
  {
    question: 'Why do some columns of the table use cash and others use net wealth?',
    answer:
      'Net cash is the £ that arrive in your bank account. Net wealth includes pension contributions valued at face (£1 of pension = £1 of wealth, since it will eventually be spent — possibly at a lower marginal rate than today). The optimiser uses a `pensionWeight` parameter so the user can adjust the weight; this page sets it according to the row\'s `pensionPref` (0 / 0.5 / 1.0 for none / modest / aggressive).',
    tags: ['all', 'pension'],
  },
  {
    question: 'How do I model my partner\'s income alongside mine?',
    answer:
      'BracketMath models a single tax entity — there is no joint-couple calculation. For couples, the practical approach is to run each partner separately and consider income-splitting strategies (employing the lower-earning spouse for genuine work performed, sharing dividends if both are shareholders, etc). The Ltd Co spousal share pattern is sketched in /guides/ltd-company-director-tax.',
    tags: ['all'],
  },
  {
    question: 'Are charity donations modelled?',
    answer:
      'No, not directly. Gift Aid donations reduce adjusted net income (extending the basic-rate band) and are a legitimate way to reclaim the £100k taper marginal. The BracketMath engine does not model them automatically; subtract the gift-aided amount from the "other income" field if you want a closer match.',
    tags: ['income_high'],
  },
  {
    question: 'Is the figure on this page net of accountancy fees?',
    answer:
      'Yes when relevant — the take-home calculator deducts an umbrella fee for inside-IR35 rows (£1,500/yr assumed) and the optimiser allows for an arbitrary annual business expense pot (£3,500/yr default for Ltd Co rows). Sole-trader rows assume the higher of £800/yr or 5% of turnover as actual business expenses, which approximates a low-overhead service business.',
    tags: ['all'],
  },
  {
    question: 'Are the engine assumptions documented anywhere?',
    answer:
      'Yes — every constant lives in src/lib/tax/constants.ts with a source-URL comment. Every engine function is unit-tested against HMRC examples (180+ test cases). The full methodology is at /about and the per-engine assumptions are spelled out at the foot of each calculator.',
    tags: ['all'],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/* Picker — selects 5 FAQs whose tags match the row.                          */
/* ────────────────────────────────────────────────────────────────────────── */

function tagsFor(row: PseoRow): Set<string> {
  const tags = new Set<string>(['all']);
  tags.add(row.structure);
  tags.add(row.persona);
  if (row.grossIncome < 40_000) tags.add('income_low');
  else if (row.grossIncome < 100_000) tags.add('income_mid');
  else tags.add('income_high');
  if (row.grossIncome + row.otherIncome > 100_000 && row.grossIncome + row.otherIncome < 125_140) {
    tags.add('taper');
  }
  if (row.pensionPref !== 'none') tags.add('pension');
  return tags;
}

export interface RenderedFAQ {
  question: string;
  answer: string;
}

export function pickFaqs(
  row: PseoRow,
  c: Computed,
  count = 5,
): RenderedFAQ[] {
  const eligibleTags = tagsFor(row);
  // A FAQ matches if at least one of its tags is in the eligible set, BUT
  // any structure tag it carries must match the row's structure. This stops
  // a "ltd_co + pension"-tagged FAQ from being selected for an umbrella row
  // just because the row happens to have pensionPref != 'none'.
  const STRUCTURE_TAGS = new Set(['ltd_co', 'umbrella', 'sole_trader']);
  const eligible = FAQ_POOL.filter((f) => {
    const structureTags = f.tags.filter((t) => STRUCTURE_TAGS.has(t));
    if (structureTags.length > 0 && !structureTags.includes(row.structure)) {
      return false;
    }
    return f.tags.some((t) => eligibleTags.has(t));
  });
  // Deterministic rotation by slug.
  const h = fnv1a(row.slug);
  const picked: FAQ[] = [];
  for (let i = 0; i < count && picked.length < count; i++) {
    const idx = (h + i * 7919) % eligible.length;
    const candidate = eligible[idx];
    if (candidate && !picked.includes(candidate)) {
      picked.push(candidate);
    }
  }
  // Fallback fill (in case the modulo collided).
  for (const f of eligible) {
    if (picked.length >= count) break;
    if (!picked.includes(f)) picked.push(f);
  }
  return picked.map((f) => ({
    question: f.question,
    answer: typeof f.answer === 'string' ? f.answer : f.answer(row, c),
  }));
}

/** Test-only export to verify the pool size. */
export const FAQ_POOL_SIZE = FAQ_POOL.length;
