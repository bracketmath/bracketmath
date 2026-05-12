/**
 * Salary–Dividend–Pension Joint Optimiser — UK Ltd Co 2026/27
 *
 * The headline calculator. Solves for the (salary, dividend, pension) tuple
 * that maximises the director's net wealth given a target company profit.
 *
 * The problem
 * ───────────
 * A Ltd Co director can extract money three ways:
 *
 *   1. Salary  — deductible from CT, but triggers employer NI (15% over £5k),
 *                employee NI (8%), and income tax (20–45%).
 *   2. Dividend — paid from post-CT profit, taxed at 8.75–39.35% personally,
 *                no NI.
 *   3. Pension (employer contribution) — deductible from CT, no NI either side,
 *                no income tax — but locked up until age 55/57.
 *
 * The choice is non-trivial because:
 *   • Salary uses up the Personal Allowance, which is more efficient at PA
 *     (effectively 0% — but only up to £5k due to employer NI; up to £12,570
 *     once you cross secondary threshold and accept 15% NI).
 *   • Above £12,570, every £1 of salary costs ~28% (NI+IT) vs dividend's 8.75%.
 *   • Dividend extraction is bounded by *post-CT* profit, and CT itself depends
 *     on what we paid as salary/pension (because those are deductible).
 *   • The £100k Personal Allowance taper (60% effective marginal rate)
 *     creates a sharp cliff that rule-of-thumb advice misses.
 *
 * Strategy
 * ────────
 * We do a coarse grid search over salary (£0 → cap, step £100) × pension
 * (£0 → AA, step £500). For each cell:
 *   1. Compute employer NI on salary.
 *   2. Pre-CT profit = profits − salary − employerNI − pension.
 *   3. Corporation tax on pre-CT profit (handles marginal relief).
 *   4. Post-CT profit → all paid as dividend (max-extraction model).
 *   5. Personal tax: employee NI, income tax on salary, dividend tax stacked
 *      on top.
 *   6. Wealth = (net cash) + pensionWeight × (pension contribution).
 *
 * Then we pick the cell with the highest wealth. We also report:
 *   • The rule-of-thumb baseline (£12,570 salary, no pension, max dividend).
 *   • The pure cash optimum (pensionWeight = 0).
 *   • The savings vs rule-of-thumb.
 *
 * Performance: ~60,000 cells × O(microseconds) = sub-100ms in browser.
 *
 * What we DON'T do (out of scope for v1)
 * ─────────────────────────────────────
 *   • Multi-year planning (carry-forward, smoothing into retirement).
 *   • Retention in company for later extraction.
 *   • Student loans / HICBC (modelled separately; can layer on later).
 *   • Salary sacrifice into employee personal pension (we use employer
 *     contributions only — equivalent net effect for a director).
 *   • Scotland (rUK only for v1).
 */

import { incomeTax, type IncomeTaxResult } from '../tax/income-tax';
import {
  niEmployee,
  niEmployer,
  type NIResult,
  type NIEmployerOptions,
} from '../tax/ni';
import { corporationTax, type CorporationTaxResult } from '../tax/corp-tax';
import { dividendTax, type DividendTaxResult } from '../tax/dividend';
import { PENSIONS } from '../tax/constants';

export interface OptimiserInput {
  /** Company profits BEFORE deducting director salary, employer NI, or pension contributions. */
  profits: number;
  /** Director age (used for pension limits, MPAA, etc.). */
  age: number;
  /**
   * Other personal taxable income outside this company (rental, salary from
   * a separate job, savings interest, etc.). Defaults to 0.
   * Excludes dividends from this company (we model those).
   */
  otherIncome?: number;
  /**
   * Other dividend income outside this company. Stacked alongside this
   * company's dividends. Defaults to 0.
   */
  otherDividends?: number;
  /**
   * Can the company claim the £10,500 Employment Allowance?
   * Defaults to false — single-director Ltd Cos are NOT eligible. Only set
   * true for genuine multi-employee setups.
   */
  claimEmploymentAllowance?: boolean;
  /** Number of associated companies (CT thresholds divide by 1 + this). */
  associatedCompanies?: number;
  /** Maximum salary to consider in the grid (cap). Defaults to £60,000. */
  salaryCap?: number;
  /** Grid step for salary (£). Defaults to £100. */
  salaryStep?: number;
  /** Grid step for pension contribution (£). Defaults to £500. */
  pensionStep?: number;
  /**
   * How much should the optimiser value £1 inside the pension wrapper vs
   * £1 of net cash today? 1.0 = treat them as equal. 0.7 = pension £1 is worth
   * 70p today (rough estimate after future decumulation tax + illiquidity discount).
   * Defaults to 1.0 — the maximum-wealth view.
   */
  pensionWeight?: number;
  /**
   * Override the pension annual allowance (£). Defaults to £60,000.
   * Useful for MPAA-triggered users or tapered allowance.
   */
  annualAllowance?: number;
  /**
   * Should the rule-of-thumb baseline use the "£12,570 salary, no pension"
   * pattern (true, default) or accept whatever the user manually proposes
   * via `manualBaseline`?
   */
  manualBaseline?: {
    salary: number;
    pension: number;
  };
}

export interface ExtractionPlan {
  salary: number;
  dividend: number;
  pension: number;
  netCash: number;
  netWealth: number; // cash + pension × pensionWeight
  /** Sum of all tax/NI: employee+employer NI, IT, dividend tax, corp tax. */
  totalTaxAndNI: number;
  effectiveTotalTaxRate: number; // (taxes) / profits
  /** Break-down of taxes (for tooltips / transparency). */
  taxes: {
    corporationTax: number;
    employerNI: number;
    employeeNI: number;
    incomeTax: number;
    dividendTax: number;
  };
  /** Underlying full results from each sub-engine (for UI). */
  detail: {
    incomeTax: IncomeTaxResult;
    employerNI: NIResult;
    employeeNI: NIResult;
    corporationTax: CorporationTaxResult;
    dividendTax: DividendTaxResult;
  };
}

export interface OptimiserResult {
  /** The joint optimum (cash + weighted pension). */
  optimum: ExtractionPlan;
  /** Cash-only optimum (ignores pension entirely — sometimes equals optimum). */
  cashOptimum: ExtractionPlan;
  /** Rule-of-thumb baseline: £12,570 salary, no pension, max dividend. */
  ruleOfThumb: ExtractionPlan;
  /** Net wealth gain vs the rule-of-thumb baseline. */
  savingsVsRuleOfThumb: number;
  /** Net cash gain vs the rule-of-thumb baseline (ignoring pension). */
  cashSavingsVsRuleOfThumb: number;
  /** Salary–vs–wealth curve (for chart). One point per salary in the grid. */
  salaryCurve: Array<{
    salary: number;
    bestDividend: number;
    bestPension: number;
    netWealth: number;
    netCash: number;
  }>;
  /** Soft warnings (e.g. low salary won't earn a state-pension qualifying year). */
  warnings: string[];
  /** Echo of the inputs used (after defaulting). */
  resolvedInput: Required<Omit<OptimiserInput, 'manualBaseline'>> & {
    manualBaseline?: OptimiserInput['manualBaseline'];
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

const DEFAULTS = {
  otherIncome: 0,
  otherDividends: 0,
  claimEmploymentAllowance: false,
  associatedCompanies: 0,
  salaryCap: 60_000,
  salaryStep: 100,
  pensionStep: 500,
  pensionWeight: 1.0,
  // We use PENSIONS.annualAllowance lazily inside the function.
};

/**
 * Compute extraction plan for a fixed (salary, pension) tuple. Dividend is
 * implied: take everything left of post-CT profit.
 */
export function evaluatePlan(
  input: OptimiserInput,
  salary: number,
  pension: number,
): ExtractionPlan | null {
  const otherIncome = input.otherIncome ?? DEFAULTS.otherIncome;
  const otherDividends = input.otherDividends ?? DEFAULTS.otherDividends;
  const associatedCompanies = input.associatedCompanies ?? DEFAULTS.associatedCompanies;
  const claimEA = input.claimEmploymentAllowance ?? DEFAULTS.claimEmploymentAllowance;
  const pensionWeight = input.pensionWeight ?? DEFAULTS.pensionWeight;

  // 1. Company side
  const employerNIRes = niEmployer(salary, { claimEA } satisfies NIEmployerOptions);
  const preCTProfit = input.profits - salary - employerNIRes.ni - pension;
  if (preCTProfit < 0) return null;

  const ctRes = corporationTax(preCTProfit, { associatedCompanies });
  const postCTProfit = preCTProfit - ctRes.tax;
  const dividend = Math.max(0, postCTProfit);

  // 2. Personal side
  const employeeNIRes = niEmployee(salary);
  const personalNonDividendIncome = salary + otherIncome;
  const totalDividend = dividend + otherDividends;

  // CRITICAL: income tax on salary depends on the PA, which tapers based on
  // *total* income including dividends. So we pass dividends as
  // `additionalIncomeForPA` even though they're not taxed by incomeTax().
  const itRes = incomeTax(personalNonDividendIncome, {
    additionalIncomeForPA: totalDividend,
  });

  // Dividend tax stacks. We pass *all* dividend income (this co + others) and
  // *all* non-dividend income, then attribute proportionally if the user wants
  // to see a breakdown. For now we lump it.
  const dtTotalRes = dividendTax(totalDividend, personalNonDividendIncome);

  // Allocate the dividend tax to *this company's* dividend in proportion.
  // (Tax is genuinely proportional across stacked bands since rates are linear.)
  const myShareOfDividend = totalDividend > 0 ? dividend / totalDividend : 0;
  const myDividendTax = dtTotalRes.tax * myShareOfDividend;

  // 3. Net cash to director
  const netSalary = salary - employeeNIRes.ni - itRes.tax;
  const netDividend = dividend - myDividendTax;
  const netCash = netSalary + netDividend;

  const totalTaxAndNI =
    ctRes.tax +
    employerNIRes.ni +
    employeeNIRes.ni +
    itRes.tax +
    myDividendTax;

  const netWealth = netCash + pension * pensionWeight;

  return {
    salary,
    dividend,
    pension,
    netCash,
    netWealth,
    totalTaxAndNI,
    effectiveTotalTaxRate: input.profits > 0 ? totalTaxAndNI / input.profits : 0,
    taxes: {
      corporationTax: ctRes.tax,
      employerNI: employerNIRes.ni,
      employeeNI: employeeNIRes.ni,
      incomeTax: itRes.tax,
      dividendTax: myDividendTax,
    },
    detail: {
      incomeTax: itRes,
      employerNI: employerNIRes,
      employeeNI: employeeNIRes,
      corporationTax: ctRes,
      dividendTax: dtTotalRes,
    },
  };
}

/**
 * Joint optimisation of salary/dividend/pension.
 */
export function optimiseSalaryDividend(input: OptimiserInput): OptimiserResult {
  if (input.profits <= 0) throw new Error('profits must be positive');
  if (input.age < 16 || input.age > 100) {
    throw new Error('age must be between 16 and 100');
  }

  const salaryCap = Math.min(input.salaryCap ?? DEFAULTS.salaryCap, input.profits);
  const salaryStep = input.salaryStep ?? DEFAULTS.salaryStep;
  const pensionStep = input.pensionStep ?? DEFAULTS.pensionStep;
  const annualAllowance = input.annualAllowance ?? PENSIONS.annualAllowance;
  const pensionWeight = input.pensionWeight ?? DEFAULTS.pensionWeight;

  // Pension cap is min(AA, profits - whatever can't go below zero pre-CT).
  // We let the grid naturally bound it via the null-return on negative pre-CT profit.
  const pensionCap = Math.min(annualAllowance, input.profits);

  let best: ExtractionPlan | null = null;
  let bestCash: ExtractionPlan | null = null;
  const salaryCurve: OptimiserResult['salaryCurve'] = [];

  // Candidate salary anchors — pre-load to ensure we hit known sweet spots
  // even if salaryStep wouldn't land on them exactly.
  const salaryAnchors = new Set<number>([0, 5_000, 6_500, 12_570, 50_270]);

  // Build salary list: every `salaryStep` from 0 up to cap, plus anchors.
  const salaries: number[] = [];
  for (let s = 0; s <= salaryCap; s += salaryStep) salaries.push(s);
  for (const anchor of salaryAnchors) {
    if (anchor <= salaryCap && !salaries.includes(anchor)) salaries.push(anchor);
  }
  salaries.sort((a, b) => a - b);

  for (const salary of salaries) {
    let bestAtThisSalary: ExtractionPlan | null = null;

    // For each salary, try pension from 0 to cap.
    for (let pension = 0; pension <= pensionCap; pension += pensionStep) {
      const plan = evaluatePlan(input, salary, pension);
      if (!plan) break; // higher pension would also be infeasible
      if (!bestAtThisSalary || plan.netWealth > bestAtThisSalary.netWealth) {
        bestAtThisSalary = plan;
      }
      if (!bestCash || plan.netCash > bestCash.netCash) {
        bestCash = plan;
      }
      if (!best || plan.netWealth > best.netWealth) {
        best = plan;
      }
    }

    if (bestAtThisSalary) {
      salaryCurve.push({
        salary,
        bestDividend: bestAtThisSalary.dividend,
        bestPension: bestAtThisSalary.pension,
        netWealth: bestAtThisSalary.netWealth,
        netCash: bestAtThisSalary.netCash,
      });
    }
  }

  if (!best || !bestCash) {
    throw new Error('Could not find any feasible plan');
  }

  // Rule of thumb baseline: £12,570 salary, no pension, max dividend.
  // If the user has overridden via `manualBaseline`, use that.
  const baselineSalary = input.manualBaseline?.salary ?? Math.min(12_570, input.profits);
  const baselinePension = input.manualBaseline?.pension ?? 0;
  const baseline = evaluatePlan(input, baselineSalary, baselinePension) ?? best;

  // Warnings
  const warnings: string[] = [];
  if (best.salary < 6_500) {
    warnings.push(
      'Optimal salary is below the Lower Earnings Limit for NI credits — you will NOT earn a qualifying year for the State Pension at this salary. Consider lifting salary to at least £6,500 (the LEL boundary) to bank a qualifying year.',
    );
  }
  if (best.pension > annualAllowance * 0.95) {
    warnings.push(
      'You are at or near the £60,000 Annual Allowance for pensions. If you have unused allowance from the prior three years, you can carry forward.',
    );
  }
  if (input.claimEmploymentAllowance && input.profits > 50_000) {
    warnings.push(
      'You have claimed the Employment Allowance. A single-director Ltd Co with no other employees earning above the secondary threshold is NOT eligible. Confirm eligibility with your accountant.',
    );
  }
  if (input.profits > 50_000 && input.profits < 250_000) {
    warnings.push(
      `Your profit (£${formatGBP(input.profits)}) falls in the corporation-tax marginal relief band. Effective marginal CT rate is 26.5% — pension contributions are unusually tax-efficient here.`,
    );
  }

  return {
    optimum: best,
    cashOptimum: bestCash,
    ruleOfThumb: baseline,
    savingsVsRuleOfThumb: best.netWealth - baseline.netWealth,
    cashSavingsVsRuleOfThumb: bestCash.netCash - baseline.netCash,
    salaryCurve,
    warnings,
    resolvedInput: {
      profits: input.profits,
      age: input.age,
      otherIncome: input.otherIncome ?? 0,
      otherDividends: input.otherDividends ?? 0,
      claimEmploymentAllowance: input.claimEmploymentAllowance ?? false,
      associatedCompanies: input.associatedCompanies ?? 0,
      salaryCap,
      salaryStep,
      pensionStep,
      pensionWeight,
      annualAllowance,
      manualBaseline: input.manualBaseline,
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

function formatGBP(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}
