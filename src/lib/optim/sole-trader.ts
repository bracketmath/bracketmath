/**
 * Sole-trader engine — UK 2026/27 (rUK).
 *
 * Solves three problems on one trip through the tax stack:
 *
 *   1. **Trading allowance vs actual expenses.** A sole trader can either deduct
 *      actual business expenses or claim the flat £1,000 trading allowance under
 *      ITTOIA 2005 s.783A. The trading allowance wins iff actual expenses are
 *      below £1,000 *and* turnover exceeds £1,000 (below that, the allowance
 *      simply zeroes the income with no further benefit).
 *
 *   2. **Net take-home.** Income tax + Class 4 NI (+ optional Class 2 voluntary
 *      contribution at £179.40/yr to preserve a State Pension qualifying year)
 *      on the profits that survive (1).
 *
 *   3. **"Should I incorporate?" break-even.** At the same *gross* turnover, what
 *      would a Ltd Co director net? And at what profit level does sole-trader
 *      catch up with (or overtake) Ltd Co?
 *
 * Sources:
 *   • Trading allowance: HMRC BIM86000, ITTOIA 2005 s.783A
 *     https://www.gov.uk/hmrc-internal-manuals/business-income-manual/bim86000
 *   • Class 2 voluntary: https://www.gov.uk/voluntary-national-insurance-contributions
 *   • Class 4 NI: HMRC NIM24001
 *   • State pension qualifying years: https://www.gov.uk/new-state-pension/your-national-insurance-record-and-your-state-pension
 */

import { incomeTax, type IncomeTaxResult } from '../tax/income-tax';
import { niSelfEmployed, type NISelfEmployedResult } from '../tax/ni';
import { optimiseSalaryDividend } from './salary-dividend';

/** Statutory flat trading allowance (£). HMRC has held this at £1,000 since 2017/18. */
export const TRADING_ALLOWANCE = 1_000;

export interface SoleTraderInput {
  /** Turnover — gross income from the self-employment activity. */
  turnover: number;
  /** Actual deductible business expenses for the year (£). */
  actualExpenses: number;
  /** Other personal income that stacks below (rental, PAYE salary, etc.). */
  otherIncome?: number;
  /** Pay voluntary Class 2 (£179.40/yr) to preserve a State Pension year? */
  voluntaryClass2?: boolean;
  /** Director age (used only by the Ltd-Co comparison branch for AA logic). */
  age?: number;
}

export interface SoleTraderOutput {
  /** Tax-adjusted profits actually charged to income tax + Class 4 NI. */
  taxableProfits: number;
  /** Trading allowance was applied instead of actual expenses. */
  tradingAllowanceUsed: boolean;
  /** Marginal cost saved by picking the better of the two routes (£). */
  tradingAllowanceSaving: number;
  incomeTax: IncomeTaxResult;
  ni: NISelfEmployedResult;
  /** £ net cash after tax + NI (turnover − expensesOrAllowance − tax − NI). */
  netCash: number;
  /** Effective rate = (tax + NI) / turnover. */
  effectiveRate: number;
  /** Marginal rate on the next £1 of profit (income tax + Class 4 NI combined). */
  marginalRate: number;
  /** Notes / warnings (e.g. trading allowance vs expenses recommendation). */
  notes: string[];
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Compute sole-trader net cash including the trading-allowance choice.
 */
export function computeSoleTrader(input: SoleTraderInput): SoleTraderOutput {
  validate(input);

  const turnover = input.turnover;
  const actualExpenses = input.actualExpenses;
  const otherIncome = input.otherIncome ?? 0;

  // Branch A: use the trading allowance (notional £1,000 deduction, no
  // record-keeping). Only available if turnover > 0. If turnover ≤ £1,000 the
  // allowance simply zeroes the income — but you can also just not declare it
  // (HMRC's "trading allowance full relief" rule).
  const profitsViaAllowance = Math.max(
    0,
    turnover - Math.min(TRADING_ALLOWANCE, turnover),
  );

  // Branch B: deduct actual expenses.
  const profitsViaActual = Math.max(0, turnover - actualExpenses);

  // Pick whichever produces lower taxable profits — that's strictly better,
  // even if the saving is £0 (e.g. when actualExpenses ≥ £1,000).
  const tradingAllowanceUsed = profitsViaAllowance < profitsViaActual;
  const taxableProfits = tradingAllowanceUsed
    ? profitsViaAllowance
    : profitsViaActual;
  const tradingAllowanceSaving = tradingAllowanceUsed
    ? profitsViaActual - profitsViaAllowance
    : 0;

  // Income tax on (taxable profits + other income), with the share allocated
  // to this self-employment income on a pro-rata basis.
  const totalNonDividendIncome = taxableProfits + otherIncome;
  const itTotal = incomeTax(totalNonDividendIncome, {});
  const seShareOfTax =
    totalNonDividendIncome > 0
      ? itTotal.tax * (taxableProfits / totalNonDividendIncome)
      : 0;

  // Class 4 NI is on the trading profits only (not on other income).
  const ni = niSelfEmployed(taxableProfits, {
    voluntaryClass2: input.voluntaryClass2 ?? false,
  });

  // The IT marginal rate at the total-income level + the Class 4 marginal
  // rate at the trading-profit level is the right marginal for "another £1
  // of trading profit", which is what a sole trader cares about.
  const marginalRate = itTotal.marginalRate + ni.marginalRate;

  const netCash = taxableProfits - seShareOfTax - ni.ni;

  // Build an IncomeTaxResult-shaped object that reflects the SE share of tax.
  const seIt: IncomeTaxResult = {
    ...itTotal,
    tax: seShareOfTax,
    averageRate: taxableProfits > 0 ? seShareOfTax / taxableProfits : 0,
  };

  const notes: string[] = [];
  if (tradingAllowanceUsed && actualExpenses > 0) {
    notes.push(
      `Actual expenses of £${Math.round(
        actualExpenses,
      ).toLocaleString('en-GB')} are below the £1,000 trading allowance — using the allowance saves £${Math.round(
        tradingAllowanceSaving,
      ).toLocaleString('en-GB')} on taxable profits.`,
    );
  } else if (!tradingAllowanceUsed && actualExpenses < TRADING_ALLOWANCE + 200) {
    notes.push(
      `Actual expenses (£${Math.round(actualExpenses).toLocaleString(
        'en-GB',
      )}) only slightly exceed the £1,000 trading allowance. Keep meticulous records — the marginal saving over the allowance is only £${Math.round(
        actualExpenses - TRADING_ALLOWANCE,
      ).toLocaleString('en-GB')}/yr of taxable profit.`,
    );
  }
  if (!input.voluntaryClass2 && taxableProfits < 6_725 && taxableProfits > 0) {
    notes.push(
      'Profits below the Small Profits Threshold (£6,725 for 2026/27). Class 2 is not automatically applied — consider paying voluntarily at £179.40/yr to preserve a State Pension qualifying year.',
    );
  }

  return {
    taxableProfits,
    tradingAllowanceUsed,
    tradingAllowanceSaving,
    incomeTax: seIt,
    ni,
    netCash,
    effectiveRate: turnover > 0 ? (seShareOfTax + ni.ni) / turnover : 0,
    marginalRate,
    notes,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

export interface IncorporateComparisonInput {
  /** Turnover — same on both sides. */
  turnover: number;
  /** Actual sole-trader expenses (Ltd Co side gets the same expense pot). */
  actualExpenses: number;
  age: number;
  otherIncome?: number;
  /** Pension contribution % on the Ltd-Co side (0..1). Defaults to 0. */
  pensionPercent?: number;
}

export interface IncorporateComparisonOutput {
  soleTraderNetCash: number;
  ltdCoNetCash: number;
  /** Positive = Ltd Co is better. */
  differenceVsSoleTrader: number;
  /** Profit level at which the gap closes. Null if Ltd Co always (or never) wins. */
  breakevenProfits: number | null;
}

/**
 * Compare sole-trader and Ltd Co at the same turnover. Also bisects the
 * incorporation break-even on the profit axis: the turnover at which the gap
 * between the two routes is essentially zero.
 *
 * Used by both the `/calculators/sole-trader-tax` UI and the `/pay/*`
 * programmatic pages that target the "should I incorporate?" query.
 */
export function compareIncorporation(
  input: IncorporateComparisonInput,
): IncorporateComparisonOutput {
  const soleSide = computeSoleTrader({
    turnover: input.turnover,
    actualExpenses: input.actualExpenses,
    otherIncome: input.otherIncome,
    voluntaryClass2: true,
    age: input.age,
  });

  const ltd = ltdSideNetCash(input);

  const differenceVsSoleTrader = ltd - soleSide.netCash;

  // Bisect for break-even. We search on turnover (cap below at £15k, above
  // at £400k — covers all 2026/27 personas).
  const breakevenProfits = bisectBreakeven(input);

  return {
    soleTraderNetCash: soleSide.netCash,
    ltdCoNetCash: ltd,
    differenceVsSoleTrader,
    breakevenProfits,
  };
}

function ltdSideNetCash(input: IncorporateComparisonInput): number {
  const profits = Math.max(0, input.turnover - input.actualExpenses);
  if (profits < 1) return 0;
  const pensionPercent = input.pensionPercent ?? 0;
  const aaCap = Math.max(0, Math.min(60_000, profits * pensionPercent));
  const res = optimiseSalaryDividend({
    profits,
    age: input.age,
    otherIncome: input.otherIncome ?? 0,
    pensionWeight: pensionPercent > 0 ? 1.0 : 0,
    annualAllowance: aaCap,
    salaryStep: 100,
    pensionStep: 500,
  });
  // Use cash optimum for apples-to-apples comparison (sole trader has no
  // pension wrapper on this engine).
  return res.cashOptimum.netCash;
}

function bisectBreakeven(
  input: IncorporateComparisonInput,
): number | null {
  // Define f(t) = ltdNetCash(t) − soleTraderNetCash(t).
  // For small t (e.g. £15k), sole trader almost certainly wins (Ltd Co has
  // accountancy / admin fixed costs we don't model — but here we're purely
  // tax-based, so at very low turnover the two converge or sole trader wins
  // due to less complexity). Above ~£40k Ltd Co usually wins.
  // We look for the sign change.
  const lo = 15_000;
  const hi = 400_000;

  const fAt = (t: number): number => {
    const sole = computeSoleTrader({
      turnover: t,
      actualExpenses: input.actualExpenses,
      otherIncome: input.otherIncome,
      voluntaryClass2: true,
      age: input.age,
    }).netCash;
    const ltd = ltdSideNetCash({ ...input, turnover: t });
    return ltd - sole;
  };

  const fLo = fAt(lo);
  const fHi = fAt(hi);
  if (fLo > 0 && fHi > 0) return null; // Ltd Co always better in this range
  if (fLo < 0 && fHi < 0) return null; // Sole trader always better

  let a = lo;
  let b = hi;
  for (let iter = 0; iter < 35; iter++) {
    const mid = (a + b) / 2;
    const fMid = fAt(mid);
    if (Math.abs(fMid) < 50) return Math.round(mid);
    if (Math.sign(fMid) === Math.sign(fLo)) {
      a = mid;
    } else {
      b = mid;
    }
  }
  return Math.round((a + b) / 2);
}

/* ────────────────────────────────────────────────────────────────────────── */

function validate(input: SoleTraderInput): void {
  if (!Number.isFinite(input.turnover) || input.turnover < 0) {
    throw new Error('turnover must be a non-negative finite number');
  }
  if (!Number.isFinite(input.actualExpenses) || input.actualExpenses < 0) {
    throw new Error('actualExpenses must be non-negative');
  }
  if (input.otherIncome !== undefined && input.otherIncome < 0) {
    throw new Error('otherIncome must be non-negative');
  }
}
