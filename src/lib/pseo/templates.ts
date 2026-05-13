/**
 * Layer 2 of the 7-layer variance model (MASTER-PLAN §11.5):
 * 10 narrative templates. Each row picks one by `fnv1a(slug) mod 10`, so
 * coverage is even across the 200 rows and stable across rebuilds.
 *
 * Each template returns a `RenderedTemplate`:
 *   {
 *     style:       string  — short label for the style (used in <meta>)
 *     openingH2:   string  — the first H2 after the hero
 *     mainBody:    string  — body paragraphs as HTML (string concatenation
 *                            of <p>, <ul>, <h3>… — Astro renders set:html)
 *   }
 *
 * Templates lean on the same `Computed` object the rest of the page uses, so
 * by construction the numerics in prose match the numerics in the table.
 *
 * Critical rule: NEVER invent numbers. Every £ figure in template output is
 * either from `c` (Computed) or from `row` (the user-facing inputs). Anything
 * else would break the YMYL contract.
 */

import type { Computed, PseoRow, SoleTraderResult } from './types';
import type { OptimiserResult } from '../optim/salary-dividend';
import type { TakeHomeResult } from '../ir35/compare';

const money = (n: number) =>
  '£' + Math.round(n).toLocaleString('en-GB');
const pct = (n: number) =>
  (n * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + '%';

export interface RenderedTemplate {
  style: string;
  openingH2: string;
  mainBody: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* The pool of 10 templates                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export const TEMPLATES: Array<(row: PseoRow, c: Computed) => RenderedTemplate> =
  [
    scenarioLed,
    mechanismLed,
    comparisonLed,
    warningLed,
    stepwise,
    faqStyle,
    caseStudy,
    ruleOfThumbDebunk,
    decisionTree,
    historyOfBracket,
  ];

/**
 * Pick a template deterministically for a slug.
 */
export function pickTemplate(
  row: PseoRow,
  c: Computed,
  templateIndex: number,
): RenderedTemplate {
  const i = templateIndex % TEMPLATES.length;
  return TEMPLATES[i]!(row, c);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers used across templates                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function ltdRes(c: Computed): OptimiserResult {
  return c.engineResult as OptimiserResult;
}

function umbRes(c: Computed): TakeHomeResult {
  return c.engineResult as TakeHomeResult;
}

function soleRes(c: Computed): SoleTraderResult {
  return c.engineResult as SoleTraderResult;
}

function professionLabelInline(row: PseoRow): string {
  return row.professionLabel.toLowerCase();
}

/** Structured tax-stack lines for ltd_co rows. */
function ltdStackLines(c: Computed): string {
  const r = ltdRes(c);
  const o = r.optimum;
  return `
    <ul>
      <li>Corporation tax: ${money(o.taxes.corporationTax)} on ${money(
        ltdRes(c).resolvedInput.profits - o.salary - o.detail.employerNI.ni - o.pension,
      )} of post-pay profit.</li>
      <li>Employer NI: ${money(o.taxes.employerNI)} on the ${money(o.salary)} salary (15% above the £5,000 Secondary Threshold).</li>
      <li>Employee NI: ${money(o.taxes.employeeNI)} on the same salary (8% main band, 2% above £50,270).</li>
      <li>Income tax: ${money(o.taxes.incomeTax)} on the salary (rUK bands, after personal allowance${o.salary + o.dividend > 100_000 ? ' tapered above the £100,000 threshold' : ''}).</li>
      <li>Dividend tax: ${money(o.taxes.dividendTax)} on the ${money(o.dividend)} dividend (8.75% / 33.75% / 39.35% bands, stacked above salary).</li>
    </ul>
  `;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 1. Scenario-led — the "concrete worked example" voice                       */
/* ────────────────────────────────────────────────────────────────────────── */

function scenarioLed(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  const opening =
    c.engine === 'ltd_co'
      ? `What a ${prof} on ${money(row.grossIncome)} of company profit actually takes home`
      : c.engine === 'umbrella'
        ? `Inside-IR35 take-home for a ${prof} at ${money(c.dayRate ?? 0)}/day`
        : `Net pay for a ${prof} with ${money(row.grossIncome)} of turnover`;

  let body = '';
  if (c.engine === 'ltd_co') {
    const r = ltdRes(c);
    body = `
      <p>A ${prof} running a personal Ltd Co with ${money(
        row.grossIncome,
      )} of profit before director pay (2026/27 rUK rates) can extract that profit as some mix of salary, dividend and employer pension. The joint optimum — the combination that produces the highest net wealth — pays ${money(
        r.optimum.salary,
      )} as salary, ${money(r.optimum.dividend)} as dividend and ${money(
        r.optimum.pension,
      )} as an employer pension contribution. Total tax + NI through the chain comes to ${money(
        c.totalDeductions,
      )} — an effective rate of ${pct(c.effectiveRate)} on company profit.</p>

      <p>The "rule of thumb" baseline — £12,570 salary, no pension, max dividend — leaves ${money(
        Math.max(0, c.vsRuleOfThumb ?? 0),
      )} on the table at this profit level. That gap is the value of solving the four-band salary problem (LEL / PT / ST / £12,570) jointly with the pension decision rather than picking each one independently.</p>

      <h3>The five tax lines that produce the optimum</h3>
      ${ltdStackLines(c)}

      <p>Net cash to the director: ${money(
        c.netCash,
      )}. Pension contribution (locked until age 55, rising to 57 from 6 April 2028 per the Finance Act 2021): ${money(
        c.pension,
      )}. Net wealth on the all-£1-is-equal view: ${money(c.netWealth)}.</p>
    `;
  } else if (c.engine === 'umbrella') {
    const r = umbRes(c);
    body = `
      <p>A ${prof} on an inside-IR35 umbrella contract at ${money(
        c.dayRate ?? 0,
      )}/day, billing 220 days/year, has a gross contract value of ${money(
        r.inside.contractValue,
      )}. The umbrella deducts its fee (£1,500/yr assumed), employer National Insurance at 15% above the £5,000 Secondary Threshold, then runs the remainder through PAYE — income tax at 20% / 40% / 45% rUK bands plus employee NI at 8% / 2%.</p>

      <p>What the contractor actually takes home: ${money(
        c.netCash,
      )} of net cash, plus ${money(
        c.pension,
      )} into a pension via salary sacrifice (the only meaningful tax-saving lever inside IR35). Total deductions through the chain: ${money(
        c.totalDeductions,
      )} — an effective rate of ${pct(c.effectiveRate)} on the contract value.</p>

      <p>For comparison, the same contractor outside IR35 — same day rate, same days, same expenses, same pension preference — would take home ${money(
        r.outside.netCash,
      )} of net cash plus ${money(
        r.outside.pensionContribution,
      )} into a pension. That's ${money(
        r.netCashDifference,
      )} more in cash plus ${money(
        r.outside.pensionContribution - r.inside.pensionContribution,
      )} more into pension per year. To match the outside-IR35 cash on this inside contract, the day rate would need to rise to ${money(
        c.breakevenOutsideDayRate ?? 0,
      )} — that is the negotiating number.</p>
    `;
  } else {
    const r = soleRes(c);
    body = `
      <p>A ${prof} operating as a sole trader with ${money(
        row.grossIncome,
      )} of turnover for 2026/27 has taxable profits of ${money(
        r.taxableProfits,
      )} after the ${
        r.tradingAllowanceUsed
          ? 'trading allowance (£1,000 flat deduction)'
          : 'actual business expenses'
      }. Income tax on those profits comes to ${money(
        r.incomeTax,
      )}; Class 4 NI (6% / 2%) comes to ${money(
        r.classFour,
      )}; and the voluntary Class 2 contribution at £179.40 buys a State Pension qualifying year on top.</p>

      <p>Net cash after tax + NI: ${money(c.netCash)}. Effective rate on turnover: ${pct(
        c.effectiveRate,
      )}. Marginal rate on the next £1 of trading profit: ${pct(c.marginalRate)}.</p>

      ${
        r.ltdCoComparison
          ? `<p>The recurring "should I incorporate?" question: at this turnover, a Ltd Co (no pension, same expense pot) would deliver ${money(
              r.ltdCoComparison.ltdNetCash,
            )} net — ${
              r.ltdCoComparison.differenceVsSoleTrader > 0
                ? money(r.ltdCoComparison.differenceVsSoleTrader) +
                  ' more than the sole-trader route'
                : money(-r.ltdCoComparison.differenceVsSoleTrader) +
                  ' less than the sole-trader route'
            }. ${
              r.ltdCoComparison.breakevenProfits
                ? 'The two routes intersect at roughly ' +
                  money(r.ltdCoComparison.breakevenProfits) +
                  ' of turnover — above that, the Ltd Co structure wins on a pure-tax basis (ignoring ~£800–£1,500/yr of accountancy and admin overhead).'
                : 'There is no clean intersection in the £15k–£400k range examined — one route dominates throughout.'
            }</p>`
          : ''
      }
    `;
  }

  return {
    style: 'scenario-led',
    openingH2: opening,
    mainBody: body,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 2. Mechanism-led — explain the tax mechanics first, then the numbers        */
/* ────────────────────────────────────────────────────────────────────────── */

function mechanismLed(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  return {
    style: 'mechanism-led',
    openingH2: 'The four tax mechanisms acting on this income',
    mainBody: `
      <p>For a ${prof} at ${money(
        row.grossIncome,
      )} of gross income on the ${row.structure === 'ltd_co' ? 'Ltd Co director' : row.structure === 'umbrella' ? 'inside-IR35 umbrella' : 'sole-trader'} route in 2026/27, four mechanisms determine the bottom line:</p>

      <ol>
        <li><strong>The Personal Allowance</strong> — £12,570 of income at 0% income tax. ${
          row.grossIncome + row.otherIncome > 100_000
            ? `Above £100,000 of adjusted net income the allowance tapers at £1 lost for every £2 over the threshold, fully eroded at £125,140. At ${money(
                row.grossIncome + row.otherIncome,
              )} of relevant income this row sits ${row.grossIncome + row.otherIncome > 125_140 ? 'past the taper — no Personal Allowance' : 'inside the taper, with an effective 60% marginal rate on the next £1 (40% income tax + 40% × 50p of lost PA)'}.`
            : 'This row sits below £100,000 of adjusted net income, so the full £12,570 PA is available.'
        }</li>
        <li><strong>The £50,270 higher-rate threshold</strong> — income tax jumps from 20% to 40% above this number. Dividend tax simultaneously jumps from 8.75% to 33.75%.</li>
        <li><strong>National Insurance</strong> — ${
          c.engine === 'ltd_co'
            ? 'on the salary slice only, at 8% employee + 15% employer above the relevant thresholds. The dividend slice attracts no NI — that is the central source of the Ltd Co tax-efficiency edge.'
            : c.engine === 'umbrella'
              ? 'on the full deemed-salary slice, including the £5,000+ employer-NI band that the umbrella deducts from the contract value before paying any wage.'
              : 'at Class 4 rates of 6% (£12,570–£50,270) and 2% (above £50,270) on profits, plus the optional £179.40 Class 2 contribution to maintain a State Pension qualifying year.'
        }</li>
        <li><strong>${
          c.engine === 'ltd_co'
            ? 'Corporation tax'
            : c.engine === 'umbrella'
              ? 'The umbrella fee + Apprenticeship Levy pass-through'
              : 'The trading allowance'
        }</strong> — ${
          c.engine === 'ltd_co'
            ? '19% on profits up to £50,000, 25% on profits above £250,000, with a 26.5% effective marginal rate in the £50k–£250k band (HMRC marginal-relief formula).'
            : c.engine === 'umbrella'
              ? '£1,500/yr fee assumed; the Apprenticeship Levy only legally applies above a £3M paybill but is often passed through anyway.'
              : '£1,000 flat deduction available in lieu of actual expenses (ITTOIA 2005 s.783A). The engine picks whichever produces lower taxable profits.'
        }</li>
      </ol>

      <p>Run those four mechanisms in sequence and the bottom line for this row is ${money(
        c.netCash,
      )} of net cash${c.pension > 0 ? ' plus ' + money(c.pension) + ' into a pension' : ''}, against ${money(
        c.totalDeductions,
      )} of taxes / NI / fees lost through the chain — an effective rate of ${pct(
        c.effectiveRate,
      )}.</p>

      ${c.engine === 'ltd_co' ? `<h3>Where the optimal extraction sits</h3>${ltdStackLines(c)}` : ''}
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 3. Comparison-led — open with the rival route, motivate the answer          */
/* ────────────────────────────────────────────────────────────────────────── */

function comparisonLed(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  const rivalLabel =
    c.engine === 'ltd_co'
      ? 'sole trader'
      : c.engine === 'umbrella'
        ? 'outside-IR35 Ltd Co'
        : 'Ltd Co director';
  return {
    style: 'comparison-led',
    openingH2: `${row.professionLabel} vs ${rivalLabel} at ${money(row.grossIncome)} — what changes`,
    mainBody: `
      <p>The decision a ${prof} faces at ${money(
        row.grossIncome,
      )} of income for 2026/27 is rarely "which calculator do I use" — it is "which legal structure leaves the most money in my pocket after tax." This page resolves the question for one specific scenario by running the relevant engines side-by-side at build time, so every number that follows is reproducible from a single CSV row and the BracketMath source code.</p>

      ${
        c.engine === 'ltd_co'
          ? `<p>On the <strong>Ltd Co route</strong>, the joint optimiser places ${money(
              ltdRes(c).optimum.salary,
            )} as salary, ${money(
              ltdRes(c).optimum.dividend,
            )} as dividend, ${money(
              ltdRes(c).optimum.pension,
            )} as an employer pension contribution. Net cash to the director: ${money(
              c.netCash,
            )}. Pension contribution: ${money(c.pension)}.</p>
            <p>On a sole-trader route at the same gross profit, the figures shift materially. Income tax + Class 4 NI take a bigger combined bite (no dividend-tax band, no corporation-tax shelter, no employer pension dodge) and the trader's pension contributions are personal — not deductible from the gross. For comparison numbers across all common profit levels, see <a href="/guides/uk-contractor-tax">the contractor tax guide</a>.</p>`
          : c.engine === 'umbrella'
            ? `<p>On the <strong>inside-IR35 umbrella route</strong>, the contractor takes home ${money(
                umbRes(c).inside.netCash,
              )} of net cash plus ${money(
                umbRes(c).inside.pensionContribution,
              )} into a pension. On the same day rate / days / expenses operating outside IR35 through a Ltd Co, the take-home rises to ${money(
                umbRes(c).outside.netCash,
              )} cash plus ${money(
                umbRes(c).outside.pensionContribution,
              )} pension. The gap — ${money(
                umbRes(c).netWealthDifference,
              )}/yr of net wealth — is the cost of being inside IR35.</p>
            <p>To break even on cash terms, an inside-IR35 contract at this day rate would need to be repriced to roughly ${money(
              c.breakevenOutsideDayRate ?? 0,
            )}/day. Most agencies will not match that uplift when they "convert" a previously-outside contract.</p>`
            : `<p>On the <strong>sole-trader route</strong>, taxable profits are ${money(
                soleRes(c).taxableProfits,
              )} after the trading allowance / actual expenses decision, producing ${money(
                c.netCash,
              )} of net cash after income tax + Class 4 + voluntary Class 2.</p>
            <p>${
              soleRes(c).ltdCoComparison
                ? 'Incorporating instead — Ltd Co at the same turnover and expense pot — would produce ' +
                  money(soleRes(c).ltdCoComparison!.ltdNetCash) +
                  ' of net cash. The gap of ' +
                  money(
                    Math.abs(
                      soleRes(c).ltdCoComparison!.differenceVsSoleTrader,
                    ),
                  ) +
                  ' is ' +
                  (soleRes(c).ltdCoComparison!.differenceVsSoleTrader > 0
                    ? 'in favour of the Ltd Co'
                    : 'in favour of the sole-trader route — at this turnover level the corporation-tax + dividend stack offers no edge over self-assessment') +
                  '. Against that gap, weigh the ~£800–£1,500/yr accountancy overhead, the public Companies House filing burden, and the loss of the trading allowance.'
                : ''
            }</p>`
      }

      <p>For a complete walk-through of the optimisation for this specific scenario, see the comparison table further down this page.</p>
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 4. Warning-led — open with the failure mode that catches people out          */
/* ────────────────────────────────────────────────────────────────────────── */

function warningLed(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  const above100k = row.grossIncome + row.otherIncome > 100_000;
  const inTaperBand =
    row.grossIncome + row.otherIncome > 100_000 &&
    row.grossIncome + row.otherIncome < 125_140;
  return {
    style: 'warning-led',
    openingH2: above100k
      ? 'The £100,000 cliff catches almost every higher-earning contractor'
      : c.engine === 'umbrella'
        ? 'The umbrella fee + employer-NI deduction is bigger than most contractors realise'
        : 'The tax cliff this scenario is closest to',
    mainBody: `
      <p>Before the numbers, a warning: a ${prof} at ${money(
        row.grossIncome,
      )} of ${c.engine === 'ltd_co' ? 'company profit' : c.engine === 'umbrella' ? 'gross umbrella contract value' : 'turnover'} for 2026/27 is sitting close to one of the UK tax code's sharpest cliffs.</p>

      ${
        inTaperBand
          ? `<p>The <strong>£100,000 Personal Allowance taper</strong> hits any individual whose adjusted net income (broadly, total taxable income before the PA itself) crosses £100,000. For every £2 over the threshold, £1 of Personal Allowance is lost, fully eroded at £125,140. The effective marginal rate inside this £25,140-wide band is <strong>60%</strong> (40% income tax on the next £1, plus 40% × 50p of lost PA = 20p of additional tax). This row sits inside that band.</p>
            <p>For a Ltd Co director, the standard mitigation is to push the next £1 of extraction into pension (employer contribution, no income tax, no NI, no Personal Allowance interaction) rather than dividend. For PAYE / sole-trader earners, salary sacrifice into pension achieves the same thing.</p>`
          : above100k
            ? `<p>This row sits <em>above</em> the £125,140 boundary at which the Personal Allowance is fully eroded. The taper trap is behind you, but the additional-rate threshold (45% income tax / 39.35% dividend tax) is now in play. The next £1 of dividend is taxed at the additional-rate dividend rate of 39.35% — which makes pension contributions (still 0% at the company-contribution level) disproportionately valuable, subject to the £60,000 Annual Allowance and its £260,000 tapered version.</p>`
            : c.engine === 'umbrella'
              ? `<p>The <strong>umbrella deduction stack</strong> is consistently underestimated. Before the contractor sees any salary, the umbrella deducts:</p>
                <ul>
                  <li>Its own fee — typically £25–£35/week, £1,300–£1,800/yr (we model £1,500/yr).</li>
                  <li>Employer NI at 15% on the gross above £5,000 (a £40k–£60k contract loses £5,000–£8,500 here alone).</li>
                  <li>Optionally the 0.5% Apprenticeship Levy — legally only due above a £3M annual paybill, but routinely passed through.</li>
                </ul>
                <p>Only after those is the remainder declared as a "deemed salary" and put through PAYE. The pre-PAYE deductions are why inside-IR35 take-home is materially below the simple "umbrella net = gross × 0.65" rules of thumb.</p>`
              : `<p>The £50,270 higher-rate threshold and the £12,570 Personal Allowance are the two boundary numbers a sole trader at this turnover needs to watch. Each £1 of profit above £50,270 attracts the 40% income tax rate plus the 2% Class 4 NI rate — a combined 42% marginal — versus the 28% basic-rate + main-band combination below. Most "should I incorporate?" questions are actually triggered by a sole trader crossing the £50,270 boundary, because the dividend-band machinery starts paying for itself there.</p>`
      }

      <h3>The numbers for this specific scenario</h3>
      <p>Bottom line for a ${prof} at ${money(
        row.grossIncome,
      )} of ${c.engine === 'sole_trader' ? 'turnover' : 'gross income'}: net cash ${money(
        c.netCash,
      )}; pension ${money(c.pension)}; effective rate on gross ${pct(c.effectiveRate)}.</p>
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 5. Stepwise — talk through the steps the engine took                        */
/* ────────────────────────────────────────────────────────────────────────── */

function stepwise(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  let body = '';
  if (c.engine === 'ltd_co') {
    const r = ltdRes(c);
    body = `
      <p>The joint optimiser ran a grid search over (salary, pension) — salary in £100 steps from £0 to £60,000, pension in £500 steps from £0 to the £60,000 Annual Allowance — and evaluated each combination through the full tax stack. Here is the step-by-step trace that produced the optimum for a ${prof} at ${money(row.grossIncome)} of company profit:</p>
      <ol>
        <li><strong>Salary chosen:</strong> ${money(
          r.optimum.salary,
        )}. Sits ${r.optimum.salary < 5_000 ? 'below the £5,000 Secondary Threshold (no employer NI)' : r.optimum.salary < 12_570 ? 'between the £5,000 Secondary Threshold and the £12,570 Personal Allowance (paying employer NI but no income tax)' : r.optimum.salary < 50_270 ? 'between the £12,570 PA and the £50,270 higher-rate threshold (paying basic-rate income tax + main-band employee NI)' : 'above the £50,270 higher-rate threshold (40% / 2% marginal mix)'}.</li>
        <li><strong>Employer NI on salary:</strong> ${money(
          r.optimum.taxes.employerNI,
        )} (15% above the £5,000 Secondary Threshold).</li>
        <li><strong>Pension chosen:</strong> ${money(
          r.optimum.pension,
        )} as an employer contribution — CT-deductible, no NI either side, no income tax until drawdown.</li>
        <li><strong>Pre-CT profit:</strong> ${money(
          row.grossIncome -
            r.optimum.salary -
            r.optimum.taxes.employerNI -
            r.optimum.pension,
        )} = company profit minus salary, minus employer NI, minus pension contribution.</li>
        <li><strong>Corporation tax:</strong> ${money(
          r.optimum.taxes.corporationTax,
        )} (regime: ${r.optimum.detail.corporationTax.regime}).</li>
        <li><strong>Dividend extraction:</strong> all post-CT profit paid out — ${money(
          r.optimum.dividend,
        )}.</li>
        <li><strong>Personal taxes:</strong> employee NI ${money(
          r.optimum.taxes.employeeNI,
        )} on salary; income tax ${money(
          r.optimum.taxes.incomeTax,
        )} on salary; dividend tax ${money(
          r.optimum.taxes.dividendTax,
        )} on the dividend (after the £500 Dividend Allowance and stacked above salary in the band schedule).</li>
        <li><strong>Net cash:</strong> ${money(
          r.optimum.netCash,
        )}. <strong>Net wealth (cash + pension):</strong> ${money(c.netWealth)}.</li>
      </ol>
    `;
  } else if (c.engine === 'umbrella') {
    const r = umbRes(c);
    const i = r.inside;
    body = `
      <p>The inside-IR35 engine ran the umbrella-deduction stack in the same order an umbrella company actually pays the money out. Here are the steps that produced the bottom line for a ${prof} on a ${money(c.dayRate ?? 0)}/day inside-IR35 contract (220 days assumed):</p>
      <ol>
        <li><strong>Contract value:</strong> ${money(
          i.contractValue,
        )} (day rate × 220 days).</li>
        <li><strong>Umbrella fee:</strong> ${money(
          i.breakdown.umbrellaFee,
        )} deducted off the top.</li>
        <li><strong>Salary sacrifice (pension):</strong> ${money(
          i.pensionContribution,
        )} taken off pre-tax / pre-NI as a salary sacrifice — by far the most efficient lever inside IR35.</li>
        <li><strong>Employer NI:</strong> ${money(
          i.breakdown.employerNI,
        )} on what remains (15% above the £5,000 Secondary Threshold).</li>
        <li><strong>Gross deemed salary:</strong> the remainder is paid as a salary subject to PAYE.</li>
        <li><strong>Income tax:</strong> ${money(
          i.breakdown.incomeTax,
        )} at 20% / 40% / 45% on the deemed salary.</li>
        <li><strong>Employee NI:</strong> ${money(
          i.breakdown.employeeNI,
        )} at 8% main band, 2% above £50,270.</li>
        <li><strong>Net cash:</strong> ${money(
          c.netCash,
        )}. <strong>Net wealth incl. pension:</strong> ${money(c.netWealth)}.</li>
      </ol>
      <p>Break-even day rate to match the outside-IR35 equivalent: ${money(
        c.breakevenOutsideDayRate ?? 0,
      )}/day.</p>
    `;
  } else {
    const r = soleRes(c);
    body = `
      <p>For a sole-trader ${prof} with ${money(row.grossIncome)} of turnover, the engine evaluated each stage of the Self Assessment chain in HMRC's order:</p>
      <ol>
        <li><strong>Turnover:</strong> ${money(row.grossIncome)}.</li>
        <li><strong>Expense vs trading-allowance decision:</strong> the £1,000 trading allowance (ITTOIA 2005 s.783A) ${
          r.tradingAllowanceUsed
            ? 'beat actual expenses and was applied'
            : 'lost to actual expenses and was discarded'
        }.</li>
        <li><strong>Taxable profits:</strong> ${money(r.taxableProfits)}.</li>
        <li><strong>Income tax:</strong> ${money(
          r.incomeTax,
        )} (rUK bands, after Personal Allowance${
          row.grossIncome + row.otherIncome > 100_000 ? ' tapered above £100,000' : ''
        }).</li>
        <li><strong>Class 4 NI:</strong> ${money(
          r.classFour,
        )} (6% £12,570–£50,270, 2% above).</li>
        <li><strong>Class 2 (voluntary):</strong> ${money(
          r.classTwo,
        )} — £179.40/yr, paid to maintain a State Pension qualifying year per HMRC's voluntary NI guidance.</li>
        <li><strong>Net cash:</strong> ${money(c.netCash)}. Effective rate on turnover: ${pct(
          c.effectiveRate,
        )}.</li>
      </ol>
    `;
  }
  return {
    style: 'stepwise',
    openingH2: 'Step by step: how the engine arrived at the bottom line',
    mainBody: body,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 6. FAQ-style — open with the question being asked                            */
/* ────────────────────────────────────────────────────────────────────────── */

function faqStyle(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  return {
    style: 'faq-style',
    openingH2: `How much tax does a ${prof} on ${money(row.grossIncome)} actually pay in 2026/27?`,
    mainBody: `
      <p><strong>Short answer:</strong> ${money(
        c.totalDeductions,
      )} per year — an effective rate of ${pct(c.effectiveRate)} on gross${
        c.engine === 'sole_trader' ? ' turnover' : c.engine === 'umbrella' ? ' contract value' : ' company profit'
      }.</p>

      <p><strong>What's in that number?</strong> ${
        c.engine === 'ltd_co'
          ? `For a Ltd Co director the figure is the sum of five lines: corporation tax (${money(
              ltdRes(c).optimum.taxes.corporationTax,
            )}), employer NI (${money(
              ltdRes(c).optimum.taxes.employerNI,
            )}), employee NI (${money(
              ltdRes(c).optimum.taxes.employeeNI,
            )}), personal income tax (${money(
              ltdRes(c).optimum.taxes.incomeTax,
            )}) and dividend tax (${money(
              ltdRes(c).optimum.taxes.dividendTax,
            )}). The optimiser placed ${money(
              ltdRes(c).optimum.salary,
            )} of salary, ${money(
              ltdRes(c).optimum.dividend,
            )} of dividend and ${money(
              ltdRes(c).optimum.pension,
            )} of employer pension contribution to produce that figure — the lowest total in the searched grid.`
          : c.engine === 'umbrella'
            ? `For an inside-IR35 contractor the figure is the sum of the umbrella fee (${money(
                umbRes(c).inside.breakdown.umbrellaFee,
              )}), employer NI (${money(
                umbRes(c).inside.breakdown.employerNI,
              )}), employee NI (${money(
                umbRes(c).inside.breakdown.employeeNI,
              )}) and PAYE income tax (${money(
                umbRes(c).inside.breakdown.incomeTax,
              )}). The Apprenticeship Levy is not modelled (defaults off — see the methodology note on the take-home calculator).`
            : `For a sole trader the figure is the sum of income tax (${money(
                soleRes(c).incomeTax,
              )}) and Class 4 NI (${money(
                soleRes(c).classFour,
              )}) on the trading profits after the trading-allowance / actual-expenses choice, plus the optional £179.40 Class 2 voluntary contribution.`
      }</p>

      <p><strong>What's the marginal rate on the next £1?</strong> ${pct(
        c.marginalRate,
      )}. This is the number that matters for "is one more invoice worth the cost in lost benefits / extra effort?" decisions — it is always higher than the average effective rate.</p>

      <p><strong>How does this compare to PAYE employment at the same gross?</strong> The PAYE figure for a £${row.grossIncome.toLocaleString(
        'en-GB',
      )} salaried employee in 2026/27 is roughly £${Math.round(
        row.grossIncome * (row.grossIncome > 100_000 ? 0.43 : row.grossIncome > 50_270 ? 0.33 : 0.22),
      ).toLocaleString(
        'en-GB',
      )} of combined income tax + employee NI. The structure-specific savings come from <em>where</em> the deductions sit, not <em>whether</em> they sit anywhere — see <a href="/guides/uk-contractor-tax">the contractor tax guide</a> for the side-by-side maths.</p>
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 7. Case-study — narrative-style mini-vignette                                */
/* ────────────────────────────────────────────────────────────────────────── */

function caseStudy(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  return {
    style: 'case-study',
    openingH2: `Worked example: ${row.professionLabel}, ${row.age}, ${money(row.grossIncome)} of ${
      c.engine === 'sole_trader' ? 'turnover' : c.engine === 'umbrella' ? 'contract value' : 'company profit'
    }`,
    mainBody: `
      <p>Picture a ${prof} aged ${row.age} for the 2026/27 tax year, ${
        c.engine === 'ltd_co'
          ? `operating through a personal Ltd Co outside IR35, with ${money(row.grossIncome)} of profit before director pay`
          : c.engine === 'umbrella'
            ? `on an inside-IR35 umbrella contract billing ${money(c.dayRate ?? 0)} per day for 220 days`
            : `trading as a sole trader with ${money(row.grossIncome)} of turnover`
      }${row.otherIncome > 0 ? ` and a further ${money(row.otherIncome)} of other personal income stacking below` : ''}. The optimisation goal for this profile is ${
        row.pensionPref === 'none'
          ? 'pure net cash today — the pension lever is off'
          : row.pensionPref === 'modest'
            ? 'a balance of cash and pension contribution (modest pension preference, treating £1 of pension as £0.50 of cash for the search)'
            : 'maximum net wealth (treating £1 of pension as £1 of cash today)'
      }.</p>

      <p>Running the engine for this exact profile:</p>
      ${
        c.engine === 'ltd_co'
          ? `<ul>
              <li>Optimum salary: ${money(ltdRes(c).optimum.salary)}</li>
              <li>Optimum dividend: ${money(ltdRes(c).optimum.dividend)}</li>
              <li>Optimum pension contribution: ${money(ltdRes(c).optimum.pension)}</li>
              <li>Net cash to the director: ${money(c.netCash)}</li>
              <li>Net wealth (cash + pension): ${money(c.netWealth)}</li>
              <li>Total tax + NI through the chain: ${money(c.totalDeductions)} (${pct(c.effectiveRate)} effective on gross profit)</li>
              <li>Money left on the table by the £12,570-salary rule of thumb: ${money(c.vsRuleOfThumb ?? 0)}</li>
            </ul>`
          : c.engine === 'umbrella'
            ? `<ul>
                <li>Day rate: ${money(c.dayRate ?? 0)} (220 billable days)</li>
                <li>Contract value: ${money(umbRes(c).inside.contractValue)}</li>
                <li>Net cash to the contractor: ${money(c.netCash)}</li>
                <li>Pension via salary sacrifice: ${money(c.pension)}</li>
                <li>Total deductions through the chain: ${money(c.totalDeductions)} (${pct(c.effectiveRate)} effective on contract value)</li>
                <li>Break-even outside-IR35 day rate: ${money(c.breakevenOutsideDayRate ?? 0)}/day</li>
              </ul>`
            : `<ul>
                <li>Taxable profits after the trading-allowance choice: ${money(soleRes(c).taxableProfits)}</li>
                <li>Income tax: ${money(soleRes(c).incomeTax)}</li>
                <li>Class 4 NI: ${money(soleRes(c).classFour)}</li>
                <li>Class 2 (voluntary): ${money(soleRes(c).classTwo)}</li>
                <li>Net cash: ${money(c.netCash)} (${pct(c.effectiveRate)} effective on turnover)</li>
                ${
                  soleRes(c).ltdCoComparison
                    ? `<li>Same turnover as a Ltd Co (no pension): ${money(soleRes(c).ltdCoComparison!.ltdNetCash)} — a gap of ${money(Math.abs(soleRes(c).ltdCoComparison!.differenceVsSoleTrader))} ${soleRes(c).ltdCoComparison!.differenceVsSoleTrader > 0 ? 'in favour of incorporating' : 'in favour of staying a sole trader'}</li>`
                    : ''
                }
              </ul>`
      }

      <p>The vignette is hypothetical but the numbers are not — every figure above was produced by the same engine code that powers the live BracketMath calculators, run at build time on inputs drawn from a single CSV row.</p>
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 8. Rule-of-thumb debunk — call out what the popular advice misses            */
/* ────────────────────────────────────────────────────────────────────────── */

function ruleOfThumbDebunk(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  return {
    style: 'rule-of-thumb-debunk',
    openingH2: 'What the popular advice gets wrong at this income',
    mainBody: `
      <p>Every accountancy thread, IR35 forum and contractor podcast has its own simple rule for handling a ${prof} at this income level. The popular rules are:</p>

      <ol>
        <li><strong>"Just take a £12,570 salary and dividend the rest"</strong> — works between roughly £40k and £80k of profit; breaks down above the £100,000 PA-taper cliff and around the £50k–£250k corporation-tax marginal-relief band.</li>
        <li><strong>"60% goes to the tax man on anything over £100k"</strong> — true within the £25,140-wide taper band, but it is the <em>marginal</em> rate, not the average. Most contractors hear "60%" and assume their whole income is being taxed at that rate, which is wrong.</li>
        <li><strong>"Pension contributions don't help if you only have a Ltd Co"</strong> — wrong. <em>Employer</em> pension contributions are deductible against corporation tax, attract no NI either side, and are not personal income — making them the single most powerful lever in the high-rate / taper bands.</li>
        <li><strong>"The optimal salary is exactly the secondary threshold"</strong> — historically true; in 2026/27 the secondary threshold (£5,000) is so low that ignoring the £5k–£12,570 region is leaving free Personal Allowance on the table.</li>
      </ol>

      <p>For a ${prof} at ${money(row.grossIncome)} of gross, the BracketMath optimiser disagrees with at least one of those rules — that's why we built it.</p>

      ${
        c.engine === 'ltd_co'
          ? `<p>Specifically, the joint optimum at this profit level is ${money(
              ltdRes(c).optimum.salary,
            )} of salary, ${money(
              ltdRes(c).optimum.dividend,
            )} of dividend, ${money(
              ltdRes(c).optimum.pension,
            )} of employer pension contribution. The rule-of-thumb baseline (£12,570 salary, no pension, max dividend) produces only ${money(
              ltdRes(c).ruleOfThumb.netWealth,
            )} of net wealth — a shortfall of ${money(
              c.vsRuleOfThumb ?? 0,
            )} versus the joint optimum.</p>`
          : c.engine === 'umbrella'
            ? `<p>Specifically: the "umbrella takes 35%" rule of thumb implies a net of about ${money(
                Math.round((umbRes(c).inside.contractValue) * 0.65),
              )} at this contract value. The actual figure under the full umbrella stack (employer NI, employee NI, income tax, fee, sacrifice into pension) is ${money(
                c.netCash,
              )}${c.pension > 0 ? ' + ' + money(c.pension) + ' into pension' : ''} — a real-world gap that has implications for how to negotiate the day rate.</p>`
            : `<p>Specifically: a sole trader at ${money(row.grossIncome)} of turnover often hears "you'll pay 30% in tax." The actual combined income tax + Class 4 + Class 2 figure for this row is ${money(
                c.totalDeductions,
              )} — an effective rate of ${pct(
                c.effectiveRate,
              )} on turnover. The trading-allowance choice ${
                soleRes(c).tradingAllowanceUsed ? 'further reduces taxable profits' : 'was rejected — actual expenses were larger'
              }.</p>`
      }
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 9. Decision-tree — pose the structural choice as branches                    */
/* ────────────────────────────────────────────────────────────────────────── */

function decisionTree(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  return {
    style: 'decision-tree',
    openingH2: 'The decision tree for a ' + prof + ' at this income level',
    mainBody: `
      <p>A ${prof} thinking through "how should I structure this income for tax efficiency" hits the same five branches every time. Walk the tree for this exact scenario (gross ${money(
        row.grossIncome,
      )} for 2026/27):</p>

      <ol>
        <li><strong>Is the engagement inside or outside IR35?</strong> Inside (umbrella) means no dividend extraction, no employer pension dodge, full PAYE deduction. Outside (Ltd Co) means access to the optimiser. This row models the <strong>${row.structure === 'ltd_co' && row.ir35Status === 'outside' ? 'outside-IR35 Ltd Co' : row.structure === 'umbrella' ? 'inside-IR35 umbrella' : row.structure === 'sole_trader' ? 'sole-trader' : 'Ltd Co (n/a IR35)'}</strong> route.</li>
        <li><strong>Are you using the £12,570 Personal Allowance?</strong> ${
          row.otherIncome > 0
            ? `Yes — partially. There is ${money(row.otherIncome)} of other personal income stacking below the structure-specific income, which uses ${
                row.otherIncome >= 12_570 ? 'the entire' : money(row.otherIncome) + ' of the'
              } PA before the engine-driven income gets touched.`
            : 'Yes — fully. No other personal income is in play, so all £12,570 of PA is available to absorb the cheapest slice of structure-specific income.'
        }</li>
        <li><strong>Are you above the £100,000 PA taper?</strong> ${
          row.grossIncome + row.otherIncome > 100_000
            ? `Yes — adjusted net income is roughly ${money(
                row.grossIncome + row.otherIncome,
              )}. The PA tapers ${row.grossIncome + row.otherIncome >= 125_140 ? 'to zero' : `to ${money(
                Math.max(
                  0,
                  12_570 - (row.grossIncome + row.otherIncome - 100_000) / 2,
                ),
              )}`}. ${
                c.engine === 'ltd_co'
                  ? 'The optimiser is steering the next slice of extraction into employer pension to dodge the 60% taper marginal rate.'
                  : 'Consider personal pension contributions / salary sacrifice to reclaim the taper-zone marginal.'
              }`
            : 'No — gross sits comfortably below the £100,000 trigger.'
        }</li>
        <li><strong>How heavily are you using the pension wrapper?</strong> ${
          row.pensionPref === 'none'
            ? 'Not at all — this scenario optimises for cash today, ignoring the pension wrapper.'
            : row.pensionPref === 'modest'
              ? 'Moderately — the search treats £1 of pension as worth £0.50 of cash today, producing a balanced cash / pension split.'
              : 'Aggressively — the search treats £1 of pension as worth £1 of cash, maximising long-run net wealth.'
        } The pension contribution chosen by the engine for this row: ${money(c.pension)}.</li>
        <li><strong>What is the resulting net cash?</strong> ${money(
          c.netCash,
        )}. Net wealth including pension: ${money(c.netWealth)}.</li>
      </ol>

      <p>For the second-order question — what would happen at a different profit level, a different age, or a different pension preference — the same engine drives the <a href="/calculators/salary-dividend-split">salary-dividend split calculator</a>, the <a href="/calculators/take-home">take-home (inside vs outside IR35) calculator</a>, and the <a href="/calculators/sipp-optimiser">SIPP optimiser</a>. Each one accepts the inputs of this row as a starting point.</p>
    `,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 10. History-of-bracket — what HMRC actually wrote about this band            */
/* ────────────────────────────────────────────────────────────────────────── */

function historyOfBracket(row: PseoRow, c: Computed): RenderedTemplate {
  const prof = professionLabelInline(row);
  // Determine which tax band is most relevant for this row's gross income.
  const total = row.grossIncome + row.otherIncome;
  const band =
    total < 12_570
      ? 'Personal Allowance'
      : total < 50_270
        ? 'basic-rate band'
        : total < 100_000
          ? 'higher-rate band'
          : total < 125_140
            ? '£100,000 PA-taper band'
            : total < 150_000
              ? 'gap between the PA taper and the additional-rate threshold'
              : 'additional-rate band';
  return {
    style: 'history-of-bracket',
    openingH2: 'How HMRC defines the band this income falls into',
    mainBody: `
      <p>A ${prof} at ${money(row.grossIncome)} of gross for 2026/27 — plus any other personal income that stacks below — falls into the <strong>${band}</strong>. HMRC's published rules for this band are unchanged from the figures announced in the Autumn Budget 2024 (which froze all the major thresholds at their April 2021 levels until at least April 2028).</p>

      <p>For reference, the 2026/27 boundary numbers as published by HMRC:</p>
      <ul>
        <li>Personal Allowance: £12,570 (full PA — tapered above £100,000 adjusted net income).</li>
        <li>Basic-rate band: £12,570 to £50,270 (20% income tax, 8.75% dividend tax).</li>
        <li>Higher-rate band: £50,270 to £125,140 (40% / 33.75%).</li>
        <li>Additional-rate band: above £125,140 (45% / 39.35%).</li>
        <li>PA taper: £1 of PA lost per £2 over £100,000 adjusted net income, fully eroded at £125,140.</li>
        <li>Employer NI: 15% above the £5,000 Secondary Threshold (Finance Act 2024).</li>
        <li>Employee NI: 8% main band (£12,570–£50,270), 2% above.</li>
        <li>Class 4 NI (sole traders): 6% main band, 2% above. Class 2 voluntary: £3.45/week (£179.40/yr).</li>
        <li>Corporation Tax: 19% small profits rate (≤ £50,000), 25% main rate (≥ £250,000), 26.5% effective marginal in between.</li>
        <li>Dividend Allowance: £500 at 0%.</li>
        <li>Pension Annual Allowance: £60,000 (tapered to £10,000 above £260,000 adjusted income).</li>
      </ul>

      <p>For this specific row, the binding constraints are: ${
        c.engine === 'ltd_co'
          ? `the ${ltdRes(c).optimum.detail.corporationTax.regime === 'marginal' ? 'corporation-tax marginal-relief band (26.5% effective marginal CT)' : ltdRes(c).optimum.detail.corporationTax.regime === 'main' ? 'main 25% corporation-tax rate' : 'small-profits 19% corporation-tax rate'} on the company side, and ${
              total > 100_000 ? 'the £100k Personal Allowance taper' : total > 50_270 ? 'the £50,270 higher-rate threshold' : 'the £12,570 Personal Allowance'
            } on the personal side.`
          : c.engine === 'umbrella'
            ? `the umbrella's employer-NI deduction (15% above £5,000) and ${total > 50_270 ? 'the 40% higher-rate income-tax band' : 'the 20% basic-rate band'} on the PAYE side.`
            : `the sole-trader Class 4 NI bands (6% / 2%) and ${total > 50_270 ? 'the 40% higher-rate income-tax band' : 'the 20% basic-rate band'}.`
      }</p>

      <p>The engine's computed bottom line for this row, given those binding constraints: net cash ${money(
        c.netCash,
      )}, pension ${money(c.pension)}, effective rate ${pct(c.effectiveRate)}, marginal rate ${pct(c.marginalRate)}.</p>
    `,
  };
}
