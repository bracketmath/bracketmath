/**
 * Drives the right engine for each pSEO row and produces a uniform `Computed`
 * shape that the templates / table / FAQ pickers all consume.
 *
 * Dispatch:
 *
 *   structure = 'ltd_co'      → optimiseSalaryDividend (joint optimiser)
 *   structure = 'umbrella'    → compareIR35 (with day rate = gross / 220)
 *   structure = 'sole_trader' → computeSoleTrader (+ Ltd-Co comparison)
 *
 * Layer 1 of the 7-layer variance model (MASTER-PLAN §11.5): the unique
 * computed numerics that anchor every page. Templates *render* these
 * numbers but cannot invent them.
 */

import {
  optimiseSalaryDividend,
  type OptimiserResult,
} from '../optim/salary-dividend';
import { compareIR35, type TakeHomeResult } from '../ir35/compare';
import {
  computeSoleTrader,
  compareIncorporation,
} from '../optim/sole-trader';
import type { Computed, PseoRow, SoleTraderResult } from './types';
import { pensionWeightFor } from './load';

/** Assumed annual billable days for inside-IR35 day-rate-based rows. */
const ASSUMED_BILLABLE_DAYS = 220;

/** Standard outside-IR35 business-expense assumption (insurance + accountancy + software + training). */
const DEFAULT_LTD_CO_EXPENSES = 3_500;

/** Standard sole-trader actual-expenses assumption (low-overhead service business). */
const DEFAULT_SOLE_TRADER_EXPENSES = 800;

/**
 * Compute the canonical engine result for a row. Caches by slug.
 */
const computedCache = new Map<string, Computed>();

export function computeFor(row: PseoRow): Computed {
  const cached = computedCache.get(row.slug);
  if (cached) return cached;
  const result = compute(row);
  computedCache.set(row.slug, result);
  return result;
}

function compute(row: PseoRow): Computed {
  switch (row.structure) {
    case 'ltd_co':
      return computeLtdCo(row);
    case 'umbrella':
      return computeUmbrella(row);
    case 'sole_trader':
      return computeSoleTraderRow(row);
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Ltd Co — joint optimiser (cash + pension-weighted)                          */
/* ────────────────────────────────────────────────────────────────────────── */

function computeLtdCo(row: PseoRow): Computed {
  const pensionWeight = pensionWeightFor(row.pensionPref);
  const res: OptimiserResult = optimiseSalaryDividend({
    profits: row.grossIncome,
    age: row.age,
    otherIncome: row.otherIncome,
    pensionWeight,
    salaryStep: 100,
    pensionStep: 500,
  });

  const plan = pensionWeight > 0 ? res.optimum : res.cashOptimum;

  return {
    netCash: plan.netCash,
    pension: plan.pension,
    netWealth: plan.netCash + plan.pension,
    totalDeductions: plan.totalTaxAndNI,
    effectiveRate: plan.effectiveTotalTaxRate,
    marginalRate: marginalFromPlan(plan),
    salary: plan.salary,
    dividend: plan.dividend,
    vsRuleOfThumb:
      pensionWeight > 0 ? res.savingsVsRuleOfThumb : res.cashSavingsVsRuleOfThumb,
    engine: 'ltd_co',
    engineResult: res,
  };
}

/** Pull a representative marginal rate out of an ExtractionPlan. */
function marginalFromPlan(plan: {
  detail: {
    incomeTax: { marginalRate: number };
    dividendTax: { marginalRate: number };
  };
}): number {
  // Combined personal-side marginal: dividend (top slice) + income-tax effect
  // on the same £1 if pushed through salary. We report the dividend marginal
  // because that's how the next pound is *actually* extracted in the optimum.
  return plan.detail.dividendTax.marginalRate;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Umbrella inside IR35 — drive compareIR35 with day rate derived from gross   */
/* ────────────────────────────────────────────────────────────────────────── */

function computeUmbrella(row: PseoRow): Computed {
  const dayRate = Math.round(row.grossIncome / ASSUMED_BILLABLE_DAYS);
  const pensionPercent =
    row.pensionPref === 'none'
      ? 0
      : row.pensionPref === 'modest'
        ? 0.05 // 5% sacrifice — typical conservative inside-IR35 sacrifice
        : 0.15; // aggressive — 15% sacrifice
  const res: TakeHomeResult = compareIR35({
    dayRate,
    billableDays: ASSUMED_BILLABLE_DAYS,
    annualBusinessExpenses: DEFAULT_LTD_CO_EXPENSES,
    umbrellaFeeAnnual: 1_500,
    pensionPercent,
    age: row.age,
    otherIncome: row.otherIncome,
  });

  const inside = res.inside;
  return {
    netCash: inside.netCash,
    pension: inside.pensionContribution,
    netWealth: inside.netWealth,
    totalDeductions: inside.totalDeductions,
    effectiveRate: inside.effectiveTaxRate,
    marginalRate: 0.42, // IT 40% + employee NI 2% at the typical inside-IR35 marginal slice
    dayRate,
    breakevenOutsideDayRate:
      res.insideBreakevenDayRate !== null
        ? Math.round(res.insideBreakevenDayRate)
        : undefined,
    engine: 'umbrella',
    engineResult: res,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sole trader (Lifestyle SE)                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function computeSoleTraderRow(row: PseoRow): Computed {
  const turnover = row.grossIncome;
  const expensesGuess = Math.max(
    DEFAULT_SOLE_TRADER_EXPENSES,
    Math.round(turnover * 0.05), // ~5% of turnover for the typical service sole trader
  );

  const r = computeSoleTrader({
    turnover,
    actualExpenses: expensesGuess,
    otherIncome: row.otherIncome,
    voluntaryClass2: true,
    age: row.age,
  });

  // "Should I incorporate?" comparison — embedded in the Computed object
  // because lifestyle-SE pages routinely surface this as a sidebar.
  const incorporation = compareIncorporation({
    turnover,
    actualExpenses: expensesGuess,
    age: row.age,
    otherIncome: row.otherIncome,
    pensionPercent: 0,
  });

  const soleResult: SoleTraderResult = {
    taxableProfits: r.taxableProfits,
    incomeTax: r.incomeTax.tax,
    classFour: r.ni.class4,
    classTwo: r.ni.class2,
    netCash: r.netCash,
    effectiveRate: r.effectiveRate,
    marginalRate: r.marginalRate,
    tradingAllowanceUsed: r.tradingAllowanceUsed,
    ltdCoComparison: {
      ltdNetCash: incorporation.ltdCoNetCash,
      differenceVsSoleTrader: incorporation.differenceVsSoleTrader,
      breakevenProfits: incorporation.breakevenProfits,
    },
  };

  return {
    netCash: r.netCash,
    pension: 0,
    netWealth: r.netCash,
    totalDeductions: r.incomeTax.tax + r.ni.ni,
    effectiveRate: r.effectiveRate,
    marginalRate: r.marginalRate,
    engine: 'sole_trader',
    engineResult: soleResult,
  };
}
