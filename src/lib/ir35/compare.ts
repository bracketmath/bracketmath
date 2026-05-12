/**
 * IR35 inside-vs-outside take-home comparison engine.
 *
 * The economics of contracting through a Ltd Co changed materially in
 * April 2021 (private sector reform of off-payroll working / IR35), which
 * shifted status determination from the contractor to the client. We don't
 * make status determinations here — see the methodology copy on the page.
 *
 * What we compute, for a given (day rate, days, expenses, pension %):
 *
 *   • INSIDE IR35 — umbrella / deemed-employment route.
 *       The end-client or agency pays the contract value to an umbrella, the
 *       umbrella pays employer NI + Apprenticeship Levy from that pot, then
 *       pays the rest as salary, on which PAYE income tax + employee NI are
 *       deducted. Optional pension via salary sacrifice (the most efficient
 *       way to save inside-IR35).
 *
 *   • OUTSIDE IR35 — Ltd Co route.
 *       Day rate × days = company turnover. Subtract reasonable business
 *       expenses. Whatever's left is "profit before director pay" and is
 *       fed to the existing salary-dividend optimiser, which produces the
 *       best legal extraction plan (salary + dividend + employer pension).
 *
 * Then we compute the day-rate uplift the inside-IR35 contract would need
 * in order to break even with the outside-IR35 net.
 *
 * Sources:
 *   • HMRC ESM — Employment Status Manual: https://www.gov.uk/hmrc-internal-manuals/employment-status-manual
 *   • HMRC CEST tool: https://www.gov.uk/guidance/check-employment-status-for-tax
 *   • Off-payroll working rules (Chapter 10 ITEPA 2003): https://www.gov.uk/guidance/understanding-off-payroll-working-ir35
 *   • Apprenticeship Levy: https://www.gov.uk/guidance/pay-apprenticeship-levy
 */

import { incomeTax } from '../tax/income-tax';
import { niEmployee, niEmployer } from '../tax/ni';
import {
  optimiseSalaryDividend,
  type OptimiserResult,
} from '../optim/salary-dividend';
import { NI_EMPLOYER, PENSIONS } from '../tax/constants';

/** Apprenticeship Levy rate (0.5%). Applies above £3M annual paybill, so
 *  most umbrellas don't pay it at the margin BUT pass-through models often
 *  pre-deduct it from the assignment rate anyway. We model it as a config
 *  option so users see both views; default OFF.
 *
 *  Source: https://www.gov.uk/guidance/pay-apprenticeship-levy
 */
const APPRENTICESHIP_LEVY_RATE = 0.005;

export interface TakeHomeInput {
  /** Day rate (£/day). */
  dayRate: number;
  /** Billable days per year (typical 220 for a full-time contractor). */
  billableDays: number;
  /** Reasonable business expenses per year (insurance, accountancy, software, training etc.). */
  annualBusinessExpenses: number;
  /** Annual umbrella fee charged inside-IR35 (typical £25–£35/wk = £1,300–£1,800/yr). */
  umbrellaFeeAnnual: number;
  /** Percentage of gross contract value to direct into pension (salary-sacrifice inside, employer-contribution outside). 0..1. */
  pensionPercent: number;
  /** Director age. */
  age: number;
  /** Other personal income outside this contract. */
  otherIncome?: number;
  /** Include the 0.5% Apprenticeship Levy in the umbrella stack (some agencies pass it through). */
  passThroughApprenticeshipLevy?: boolean;
}

export interface TakeHomeScenario {
  scenario: 'inside-ir35' | 'outside-ir35';
  /** Gross contract value before any deductions. */
  contractValue: number;
  /** Gross taxable income that lands in the director's tax return (salary + dividend, or umbrella salary). */
  grossTaxableIncome: number;
  /** Pension contribution made into the pot. */
  pensionContribution: number;
  /** Net cash to the contractor. */
  netCash: number;
  /** Net cash + pension (assumes pension £1 = cash £1 — pure wealth view). */
  netWealth: number;
  /** Total tax + NI + corp tax + umbrella fee paid through the chain. */
  totalDeductions: number;
  /** Effective tax rate = totalDeductions / contractValue. */
  effectiveTaxRate: number;
  /** Itemised breakdown for transparency. */
  breakdown: {
    employerNI: number;
    employeeNI: number;
    incomeTax: number;
    dividendTax: number;
    corporationTax: number;
    umbrellaFee: number;
    apprenticeshipLevy: number;
    businessExpenses: number;
  };
}

export interface TakeHomeResult {
  inside: TakeHomeScenario;
  outside: TakeHomeScenario;
  /** £ difference: outside.netCash − inside.netCash. Positive = outside better. */
  netCashDifference: number;
  /** £ difference in net wealth (incl. pension). */
  netWealthDifference: number;
  /**
   * The day rate the inside-IR35 contract would need to match the
   * outside-IR35 net cash. Null if outside is worse (then inside doesn't
   * need an uplift; if anything, outside needs one).
   */
  insideBreakevenDayRate: number | null;
  /** Same break-even but on a net-wealth basis (factoring in pension). */
  insideBreakevenDayRateWealth: number | null;
  /** Pass-through to the underlying Ltd Co optimiser, for the chart. */
  outsideOptimiserResult: OptimiserResult;
  warnings: string[];
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * INSIDE IR35 — Umbrella / deemed employment.
 *
 * The umbrella receives the assignment value, deducts:
 *   • its own fee (flat £/yr, agreed in advance)
 *   • optional Apprenticeship Levy
 *   • employer NI on the rest
 *   • the gross "deemed salary" is then run through PAYE: income tax +
 *     employee NI on what's left, with the rest paid to the contractor.
 *
 * Pension via salary sacrifice: the contractor agrees to give up part of
 * the gross-salary equivalent, which goes pre-tax/pre-NI into a pension.
 * This saves the contractor income tax + employee NI AND saves the
 * umbrella employer NI (often passed back to the contractor).
 */
export function computeInsideIR35(input: TakeHomeInput): TakeHomeScenario {
  const contractValue = input.dayRate * input.billableDays;

  // 1. Umbrella fee comes off the top.
  const umbrellaFee = input.umbrellaFeeAnnual;
  let afterFee = contractValue - umbrellaFee;
  if (afterFee < 0) afterFee = 0;

  // 2. Optional Apprenticeship Levy on the gross-salary equivalent (0.5%).
  const apprenticeshipLevy = input.passThroughApprenticeshipLevy
    ? afterFee * APPRENTICESHIP_LEVY_RATE
    : 0;
  afterFee -= apprenticeshipLevy;

  // 3. Pension via salary sacrifice — comes off the gross before employer NI.
  //    The salary sacrifice reduces the deemed-salary base, so employer NI is
  //    levied on (afterFee − pensionSacrifice). The pensionSacrifice itself
  //    is the full amount going into the pot (because the employer NI saving
  //    is implicit — there's nothing skimmed off it).
  //
  //    We bound pension at the Annual Allowance because going above it would
  //    trigger an AA tax charge that wipes out the saving.
  const desiredPension = input.pensionPercent * contractValue;
  const pensionContribution = Math.min(
    desiredPension,
    PENSIONS.annualAllowance,
    Math.max(0, afterFee - 1), // can't sacrifice everything; leave at least £1 of pay
  );
  const grossSalaryBase = afterFee - pensionContribution;

  // 4. Employer NI on the gross-salary base.
  const emplrNI = niEmployer(grossSalaryBase, { claimEA: false });

  // 5. Gross deemed-salary = grossSalaryBase − employer NI.
  //    The employer NI is paid out of the umbrella's pot before it gets to
  //    the contractor, so it effectively comes out of the contractor's
  //    economic share.
  const grossDeemedSalary = grossSalaryBase - emplrNI.ni;

  // 6. PAYE: income tax + employee NI on the gross deemed salary.
  const employeeNIRes = niEmployee(grossDeemedSalary);
  const totalNonDividendIncome = grossDeemedSalary + (input.otherIncome ?? 0);
  const itRes = incomeTax(totalNonDividendIncome, {});

  // Allocate the income tax to the deemed-salary portion (the share belonging
  // to this contract). If there's no other income, all the tax belongs here.
  const myShareOfTax =
    totalNonDividendIncome > 0
      ? itRes.tax * (grossDeemedSalary / totalNonDividendIncome)
      : 0;

  const netSalary = grossDeemedSalary - employeeNIRes.ni - myShareOfTax;
  const netCash = netSalary;
  const netWealth = netCash + pensionContribution;
  const totalDeductions =
    umbrellaFee +
    apprenticeshipLevy +
    emplrNI.ni +
    employeeNIRes.ni +
    myShareOfTax;

  return {
    scenario: 'inside-ir35',
    contractValue,
    grossTaxableIncome: grossDeemedSalary,
    pensionContribution,
    netCash,
    netWealth,
    totalDeductions,
    effectiveTaxRate: contractValue > 0 ? totalDeductions / contractValue : 0,
    breakdown: {
      employerNI: emplrNI.ni,
      employeeNI: employeeNIRes.ni,
      incomeTax: myShareOfTax,
      dividendTax: 0,
      corporationTax: 0,
      umbrellaFee,
      apprenticeshipLevy,
      businessExpenses: 0,
    },
  };
}

/**
 * OUTSIDE IR35 — Ltd Co.
 *
 * Run the existing salary-dividend optimiser on the post-expenses profit pot.
 * Pension is modelled as employer contribution (CT-deductible).
 */
export function computeOutsideIR35(input: TakeHomeInput): {
  scenario: TakeHomeScenario;
  optimiserResult: OptimiserResult;
} {
  const contractValue = input.dayRate * input.billableDays;
  const expenses = input.annualBusinessExpenses;
  const profits = Math.max(0, contractValue - expenses);

  // Edge case: zero (or sub-£1) profits — nothing to extract, no tax.
  // The underlying optimiser requires positive profits, so short-circuit.
  if (profits < 1) {
    const empty: TakeHomeScenario = {
      scenario: 'outside-ir35',
      contractValue,
      grossTaxableIncome: 0,
      pensionContribution: 0,
      netCash: 0,
      netWealth: 0,
      totalDeductions: expenses,
      effectiveTaxRate: 0,
      breakdown: {
        employerNI: 0,
        employeeNI: 0,
        incomeTax: 0,
        dividendTax: 0,
        corporationTax: 0,
        umbrellaFee: 0,
        apprenticeshipLevy: 0,
        businessExpenses: expenses,
      },
    };
    // Build a minimal dummy optimiser result so the type contract holds.
    // Callers should not chart this; the UI checks contractValue > 0.
    const dummyOpt = {} as OptimiserResult;
    return { scenario: empty, optimiserResult: dummyOpt };
  }

  // Target pension as employer contribution. We force this into the
  // optimiser via manualBaseline so we can compare apples-to-apples — but
  // actually we want the optimiser to handle the salary side optimally,
  // so we *don't* force a baseline. Instead, we want to *constrain* pension
  // to the user's choice. The simplest way: set the AA cap to the user's
  // desired pension level — then the grid will optimise salary/dividend
  // with pension fixed at the cap (which is what the user requested).
  //
  // Edge case: user specifies 0% pension. Then AA cap = 0, no pension is
  // chosen, fully cash-extracted.
  const desiredPension = Math.min(
    input.pensionPercent * contractValue,
    PENSIONS.annualAllowance,
    profits, // can't pension more than the company has
  );

  const optimiserResult = optimiseSalaryDividend({
    profits,
    age: input.age,
    otherIncome: input.otherIncome ?? 0,
    claimEmploymentAllowance: false,
    pensionWeight: 1.0,
    // We use annualAllowance to cap pension at the user's desired amount.
    // This makes the optimiser choose pension = AA cap exactly (because
    // pension is always tax-efficient at pensionWeight=1.0 if there's room).
    annualAllowance: desiredPension,
  });
  const opt = optimiserResult.optimum;

  const totalDeductions =
    opt.taxes.corporationTax +
    opt.taxes.employerNI +
    opt.taxes.employeeNI +
    opt.taxes.incomeTax +
    opt.taxes.dividendTax +
    expenses; // technically expenses aren't tax — but they reduce take-home

  const scenario: TakeHomeScenario = {
    scenario: 'outside-ir35',
    contractValue,
    grossTaxableIncome: opt.salary + opt.dividend,
    pensionContribution: opt.pension,
    netCash: opt.netCash,
    netWealth: opt.netCash + opt.pension,
    totalDeductions,
    effectiveTaxRate: contractValue > 0 ? totalDeductions / contractValue : 0,
    breakdown: {
      employerNI: opt.taxes.employerNI,
      employeeNI: opt.taxes.employeeNI,
      incomeTax: opt.taxes.incomeTax,
      dividendTax: opt.taxes.dividendTax,
      corporationTax: opt.taxes.corporationTax,
      umbrellaFee: 0,
      apprenticeshipLevy: 0,
      businessExpenses: expenses,
    },
  };

  return { scenario, optimiserResult };
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Compute both scenarios and the break-even day rate.
 */
export function compareIR35(input: TakeHomeInput): TakeHomeResult {
  validateInput(input);

  const inside = computeInsideIR35(input);
  const { scenario: outside, optimiserResult: outsideOptimiserResult } =
    computeOutsideIR35(input);

  const netCashDifference = outside.netCash - inside.netCash;
  const netWealthDifference = outside.netWealth - inside.netWealth;

  // Break-even calc: find the inside-IR35 day rate at which net cash matches
  // the outside-IR35 net cash. Inside-IR35 net cash is reasonably
  // linear-ish above the personal allowance, but the bands break that. We
  // use bisection.
  const insideBreakevenDayRate = bisectInsideBreakeven(
    input,
    outside.netCash,
    'netCash',
  );
  const insideBreakevenDayRateWealth = bisectInsideBreakeven(
    input,
    outside.netWealth,
    'netWealth',
  );

  const warnings: string[] = [];
  if (input.billableDays > 240) {
    warnings.push(
      `${input.billableDays} billable days is unusually high — most full-time contractors bill 200–230 days/year after holiday, sickness, and bench time.`,
    );
  }
  if (input.annualBusinessExpenses > 0.20 * (input.dayRate * input.billableDays)) {
    warnings.push(
      `Business expenses of £${Math.round(
        input.annualBusinessExpenses,
      ).toLocaleString('en-GB')} are >20% of contract value. HMRC may scrutinise expenses this high — keep meticulous records.`,
    );
  }
  if (input.umbrellaFeeAnnual > 2_500) {
    warnings.push(
      `Umbrella fee of £${Math.round(input.umbrellaFeeAnnual).toLocaleString(
        'en-GB',
      )}/yr is high. The market is roughly £25–£35/week (£1,300–£1,800/yr) for a clean PAYE umbrella.`,
    );
  }
  if (input.pensionPercent > 0.5) {
    warnings.push(
      `Pension contribution >50% of gross contract is extreme — likely to exceed the £${PENSIONS.annualAllowance.toLocaleString(
        'en-GB',
      )} Annual Allowance and risk an AA tax charge.`,
    );
  }
  if (
    input.passThroughApprenticeshipLevy &&
    input.dayRate * input.billableDays < 500_000
  ) {
    warnings.push(
      'You have Apprenticeship Levy passed through. Legally, the levy only applies above a £3M annual paybill; many umbrellas pass it through anyway. Check your KID (Key Information Document).',
    );
  }

  return {
    inside,
    outside,
    netCashDifference,
    netWealthDifference,
    insideBreakevenDayRate,
    insideBreakevenDayRateWealth,
    outsideOptimiserResult,
    warnings,
  };
}

function validateInput(input: TakeHomeInput): void {
  if (!Number.isFinite(input.dayRate) || input.dayRate < 0) {
    throw new Error('dayRate must be a non-negative finite number');
  }
  if (
    !Number.isFinite(input.billableDays) ||
    input.billableDays < 0 ||
    input.billableDays > 365
  ) {
    throw new Error('billableDays must be in [0, 365]');
  }
  if (!Number.isFinite(input.annualBusinessExpenses) || input.annualBusinessExpenses < 0) {
    throw new Error('annualBusinessExpenses must be non-negative');
  }
  if (!Number.isFinite(input.umbrellaFeeAnnual) || input.umbrellaFeeAnnual < 0) {
    throw new Error('umbrellaFeeAnnual must be non-negative');
  }
  if (!Number.isFinite(input.pensionPercent) || input.pensionPercent < 0 || input.pensionPercent > 1) {
    throw new Error('pensionPercent must be in [0, 1]');
  }
  if (input.age < 16 || input.age > 100) {
    throw new Error('age must be in [16, 100]');
  }
}

/**
 * Bisection on day rate to find the inside-IR35 break-even.
 *
 * Inside-IR35 net cash is monotonically increasing in day rate (more in,
 * more out). So bisection is well-defined.
 */
function bisectInsideBreakeven(
  base: TakeHomeInput,
  target: number,
  metric: 'netCash' | 'netWealth',
): number | null {
  // Quick reject: if the inside-IR35 at the upper bound (£10,000/day, say)
  // can't reach the target, return null.
  let lo = 0;
  let hi = Math.max(base.dayRate * 4, 5_000);
  const insideAt = (dr: number) =>
    computeInsideIR35({ ...base, dayRate: dr })[metric];

  if (insideAt(hi) < target) return null;
  if (insideAt(lo) > target) return 0; // already paying-zero gives more than target → degenerate

  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    const v = insideAt(mid);
    if (Math.abs(v - target) < 0.5) return mid;
    if (v < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
