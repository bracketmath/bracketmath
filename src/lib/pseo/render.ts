/**
 * Layers 4, 5, 6 and 7 of the 7-layer variance model (MASTER-PLAN §11.5).
 *
 *   • Layer 4 (whatsDifferent) — a computed "your situation is different from
 *     a nearest peer" paragraph driven by the optimiser deltas.
 *   • Layer 5 (personaTable) — comparison-table rows chosen by persona
 *     (optimiser vs lifestyle vs pre-retiree get different breakdowns).
 *   • Layer 6 (similarPages) — 5 nearest-neighbour internal links computed
 *     by a simple distance function over (profession, income, structure).
 *   • Layer 7 (personaJsonLd) — persona-specific Schema.org block (HowTo
 *     for optimisers, FinancialProduct for pre-retirees, nothing extra
 *     for lifestyle).
 */

import type { Computed, PseoRow, SoleTraderResult } from './types';
import type { OptimiserResult } from '../optim/salary-dividend';
import type { TakeHomeResult } from '../ir35/compare';

const money = (n: number) =>
  '£' + Math.round(n).toLocaleString('en-GB');
const pct = (n: number) =>
  (n * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + '%';

/* ────────────────────────────────────────────────────────────────────────── */
/* Layer 4 — "Why your situation is different" computed paragraph              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Compare this row to its nearest peer (same structure, closest grossIncome)
 * and surface the most interesting delta in plain prose. The numbers are
 * always engine outputs — never hand-coded.
 */
export function whatsDifferent(
  row: PseoRow,
  c: Computed,
  peers: Array<{ row: PseoRow; c: Computed }>,
): string {
  // Find the nearest-income peer with the same structure.
  const candidates = peers.filter(
    (p) =>
      p.row.slug !== row.slug && p.row.structure === row.structure,
  );
  candidates.sort(
    (a, b) =>
      Math.abs(a.row.grossIncome - row.grossIncome) -
      Math.abs(b.row.grossIncome - row.grossIncome),
  );
  const peer = candidates[0];
  if (!peer) {
    return '';
  }

  const dCash = c.netCash - peer.c.netCash;
  const dPension = c.pension - peer.c.pension;
  const dEffective = c.effectiveRate - peer.c.effectiveRate;
  const dGross = row.grossIncome - peer.row.grossIncome;

  let extra = '';
  if (c.engine === 'ltd_co' && peer.c.engine === 'ltd_co') {
    const a = (c.engineResult as OptimiserResult).optimum;
    const b = (peer.c.engineResult as OptimiserResult).optimum;
    extra = ` The optimiser shifts ${money(
      Math.abs(a.dividend - b.dividend),
    )} of the extraction ${
      a.dividend > b.dividend ? 'into' : 'out of'
    } the dividend slice, and ${money(
      Math.abs(a.pension - b.pension),
    )} ${a.pension > b.pension ? 'into' : 'out of'} pension contributions.`;
  } else if (c.engine === 'umbrella' && peer.c.engine === 'umbrella') {
    extra = ` The break-even outside-IR35 day rate moves from ${money(
      peer.c.breakevenOutsideDayRate ?? 0,
    )} to ${money(c.breakevenOutsideDayRate ?? 0)} per day.`;
  } else if (c.engine === 'sole_trader' && peer.c.engine === 'sole_trader') {
    const a = c.engineResult as SoleTraderResult;
    const b = peer.c.engineResult as SoleTraderResult;
    extra = ` Taxable profits change from ${money(b.taxableProfits)} to ${money(
      a.taxableProfits,
    )} (after the trading-allowance / actual-expenses choice).`;
  }

  return `
    <p>Compared to the closest peer profile — <a href="/pay/${peer.row.slug}">${
      peer.row.professionLabel
    } at ${money(peer.row.grossIncome)}</a> — this scenario sits ${money(
      Math.abs(dGross),
    )} ${dGross >= 0 ? 'higher' : 'lower'} on gross income. That moves net cash by ${
      dCash >= 0 ? '+' : '−'
    }${money(Math.abs(dCash))}, the pension contribution by ${
      dPension >= 0 ? '+' : '−'
    }${money(Math.abs(dPension))}, and the effective rate by ${
      dEffective >= 0 ? '+' : '−'
    }${pct(Math.abs(dEffective))}. ${
      Math.abs(dEffective) > 0.02
        ? 'The shift in effective rate is large enough that the binding tax constraint has changed — probably crossing a band boundary.'
        : 'The effective rate moves only modestly — both scenarios sit inside the same binding tax band.'
    }${extra}</p>
  `;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Layer 5 — persona-specific comparison table                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export interface PersonaTableRow {
  label: string;
  value: string;
}

export function personaTable(row: PseoRow, c: Computed): PersonaTableRow[] {
  switch (row.persona) {
    case 'optimiser':
      return optimiserTable(row, c);
    case 'lifestyle_se':
      return lifestyleTable(row, c);
    case 'pre_retiree':
      return preRetireeTable(row, c);
  }
}

function optimiserTable(row: PseoRow, c: Computed): PersonaTableRow[] {
  if (c.engine === 'ltd_co') {
    const r = c.engineResult as OptimiserResult;
    return [
      { label: 'Optimum salary', value: money(r.optimum.salary) },
      { label: 'Optimum dividend', value: money(r.optimum.dividend) },
      { label: 'Optimum pension', value: money(r.optimum.pension) },
      { label: 'Net cash (optimum)', value: money(r.optimum.netCash) },
      { label: 'Net wealth (cash + pension)', value: money(c.netWealth) },
      { label: 'Rule-of-thumb net cash', value: money(r.ruleOfThumb.netCash) },
      { label: 'Rule-of-thumb net wealth', value: money(r.ruleOfThumb.netWealth) },
      { label: 'Saving vs rule of thumb', value: money(c.vsRuleOfThumb ?? 0) },
      { label: 'Effective rate on profit', value: pct(c.effectiveRate) },
      { label: 'Marginal rate (next £1 dividend)', value: pct(c.marginalRate) },
    ];
  }
  if (c.engine === 'umbrella') {
    const r = c.engineResult as TakeHomeResult;
    return [
      { label: 'Day rate', value: money(c.dayRate ?? 0) },
      { label: 'Contract value (220 days)', value: money(r.inside.contractValue) },
      { label: 'Inside-IR35 net cash', value: money(r.inside.netCash) },
      { label: 'Inside-IR35 pension', value: money(r.inside.pensionContribution) },
      { label: 'Outside-IR35 net cash', value: money(r.outside.netCash) },
      { label: 'Outside-IR35 pension', value: money(r.outside.pensionContribution) },
      { label: 'Cost of being inside IR35 (net wealth)', value: money(r.netWealthDifference) },
      { label: 'Break-even outside-IR35 day rate', value: money(c.breakevenOutsideDayRate ?? 0) },
    ];
  }
  // sole_trader fallback
  return defaultTable(row, c);
}

function lifestyleTable(row: PseoRow, c: Computed): PersonaTableRow[] {
  const r = c.engineResult as SoleTraderResult;
  const monthly = c.netCash / 12;
  // Hours-equivalent at the National Living Wage (£12.21/hr as at April 2025
  // — the binding 2025 figure pending 2026 announcement at Spring Budget 2026).
  const nlw = 12.21;
  const hoursEquiv = Math.round(c.netCash / nlw);
  const rows: PersonaTableRow[] = [
    { label: 'Turnover', value: money(row.grossIncome) },
    { label: 'Taxable profits', value: money(r.taxableProfits) },
    {
      label: 'Trading allowance vs actual expenses',
      value: r.tradingAllowanceUsed ? 'Trading allowance (£1,000)' : 'Actual expenses',
    },
    { label: 'Income tax', value: money(r.incomeTax) },
    { label: 'Class 4 NI', value: money(r.classFour) },
    { label: 'Class 2 NI (voluntary)', value: money(r.classTwo) },
    { label: 'Net cash (year)', value: money(c.netCash) },
    { label: 'Net cash (monthly)', value: money(monthly) },
    { label: 'Hours-equivalent at NLW (£12.21/hr)', value: hoursEquiv.toLocaleString('en-GB') + ' hrs' },
    { label: 'Effective rate', value: pct(c.effectiveRate) },
  ];
  if (r.ltdCoComparison) {
    rows.push({
      label: 'Same turnover as Ltd Co (no pension)',
      value: money(r.ltdCoComparison.ltdNetCash),
    });
    rows.push({
      label: 'Incorporate vs stay sole trader',
      value:
        r.ltdCoComparison.differenceVsSoleTrader > 0
          ? '+' + money(r.ltdCoComparison.differenceVsSoleTrader) + ' for Ltd Co'
          : money(-r.ltdCoComparison.differenceVsSoleTrader) + ' for staying sole trader',
    });
  }
  return rows;
}

function preRetireeTable(row: PseoRow, c: Computed): PersonaTableRow[] {
  const base = optimiserTable(row, c);
  const yearsToPension = Math.max(0, 57 - row.age);
  // Crude projection — 5% real growth on the row's annual pension contribution,
  // compounded for yearsToPension. The SIPP optimiser at /calculators/sipp-optimiser
  // is the right tool for the Monte Carlo answer; this is a single-path teaser.
  const realGrowth = 0.05;
  const futureValue = c.pension > 0 && yearsToPension > 0
    ? (c.pension * (Math.pow(1 + realGrowth, yearsToPension) - 1)) / realGrowth
    : 0;
  // 4% Safe Withdrawal Rate sustainable income (US-derived; UK historical
  // record is closer to 3.0–3.5% — see /guides/optimal-uk-retirement-portfolio).
  const swr40 = futureValue * 0.04;
  return [
    ...base,
    { label: 'Years to age-57 pension access', value: yearsToPension.toString() },
    { label: 'Annual pension contribution (this row)', value: money(c.pension) },
    {
      label: 'Projected pot at 57 (5% real, single-path)',
      value: money(futureValue),
    },
    {
      label: 'Sustainable income @ 4% SWR',
      value: money(swr40) + '/yr',
    },
  ];
}

function defaultTable(row: PseoRow, c: Computed): PersonaTableRow[] {
  return [
    { label: 'Gross income', value: money(row.grossIncome) },
    { label: 'Net cash', value: money(c.netCash) },
    { label: 'Pension contribution', value: money(c.pension) },
    { label: 'Total deductions', value: money(c.totalDeductions) },
    { label: 'Effective rate', value: pct(c.effectiveRate) },
    { label: 'Marginal rate', value: pct(c.marginalRate) },
  ];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Layer 6 — similarity (top-5 nearest neighbours)                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Simple weighted distance in (profession, structure, age band, income).
 * Profession + structure matches dominate; income is the tiebreaker.
 *
 * We keep this *not* parameterised by anything fancy — the goal is just to
 * produce a non-star-pattern internal-link graph that search engines read as
 * a real topical cluster.
 */
function distance(a: PseoRow, b: PseoRow): number {
  let d = 0;
  if (a.profession !== b.profession) d += 1_000;
  if (a.structure !== b.structure) d += 2_000;
  if (a.persona !== b.persona) d += 500;
  if (a.ageBand !== b.ageBand) d += 200;
  if (a.pensionPref !== b.pensionPref) d += 100;
  // Normalised income distance (max 1 unit per £1k).
  d += Math.abs(a.grossIncome - b.grossIncome) / 1_000;
  return d;
}

export function similarPages(row: PseoRow, allRows: PseoRow[], k = 5): PseoRow[] {
  return allRows
    .filter((r) => r.slug !== row.slug)
    .map((r) => ({ row: r, d: distance(row, r) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((x) => x.row);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Layer 7 — persona-specific Schema.org JSON-LD blocks                         */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Returns a JSON object suitable for `<script type="application/ld+json">`.
 * Optimiser rows get a HowTo block (the step-by-step extraction plan).
 * Pre-retiree rows get a FinancialProduct block (the pension scheme they're
 * projecting against). Lifestyle rows get null (no extra Schema).
 */
export function personaJsonLd(
  row: PseoRow,
  c: Computed,
  pageUrl: string,
): Record<string, unknown> | null {
  if (row.persona === 'lifestyle_se') return null;

  if (row.persona === 'optimiser') {
    if (c.engine === 'ltd_co') {
      const r = c.engineResult as OptimiserResult;
      return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to optimise ${row.professionLabel} extraction at ${money(row.grossIncome)} profit`,
        description: `Step-by-step extraction plan for a ${row.professionLabel} running a personal Ltd Co with £${row.grossIncome.toLocaleString('en-GB')} of profit, 2026/27 rUK rates.`,
        totalTime: 'PT15M',
        estimatedCost: {
          '@type': 'MonetaryAmount',
          currency: 'GBP',
          value: Math.round(c.totalDeductions),
        },
        url: pageUrl,
        step: [
          {
            '@type': 'HowToStep',
            name: 'Set the director salary',
            text: `Pay yourself ${money(r.optimum.salary)} as a director salary. This sits ${r.optimum.salary > 12_570 ? 'above' : r.optimum.salary >= 5_000 ? 'between the £5k Secondary Threshold and the £12,570 Personal Allowance' : 'below the £5k Secondary Threshold'}.`,
          },
          {
            '@type': 'HowToStep',
            name: 'Make the employer pension contribution',
            text: `Have the company contribute ${money(r.optimum.pension)} to your pension as an employer contribution — deductible against corporation tax, no NI either side.`,
          },
          {
            '@type': 'HowToStep',
            name: 'Settle corporation tax on the residual',
            text: `Corporation tax on the remaining post-pay, post-pension profit: ${money(r.optimum.taxes.corporationTax)} (${r.optimum.detail.corporationTax.regime} rate).`,
          },
          {
            '@type': 'HowToStep',
            name: 'Pay the dividend',
            text: `Declare and pay a ${money(r.optimum.dividend)} dividend. The first £500 is tax-free (Dividend Allowance); the remainder is taxed at 8.75% / 33.75% / 39.35% in the rUK band schedule.`,
          },
          {
            '@type': 'HowToStep',
            name: 'Net result',
            text: `Net cash: ${money(c.netCash)}. Pension contribution: ${money(c.pension)}. Total tax + NI through the chain: ${money(c.totalDeductions)} (${pct(c.effectiveRate)} effective on gross profit).`,
          },
        ],
      };
    }
  }

  if (row.persona === 'pre_retiree' && c.pension > 0) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: 'UK Self-Invested Personal Pension (SIPP)',
      description:
        'Defined-contribution personal pension subject to the 2026/27 £60,000 Annual Allowance (tapered above £260,000 of adjusted income). Funds locked until age 55 (rising to 57 on 6 April 2028 per the Finance Act 2021).',
      provider: {
        '@type': 'Organization',
        name: 'Multiple UK SIPP providers (Vanguard, Interactive Investor, Hargreaves Lansdown, AJ Bell, etc.)',
      },
      url: pageUrl,
      annualPercentageRate: 0,
      interestRate: 0,
      feesAndCommissionsSpecification:
        'Typical low-cost SIPP fees: 0.15%–0.25% platform fee plus 0.07%–0.22% fund OCF. Total ~0.30%/yr at low-cost end.',
    };
  }

  return null;
}
