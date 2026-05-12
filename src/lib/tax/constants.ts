/**
 * UK Tax Constants — 2026/27 Tax Year
 *
 * Single source of truth for all calculators on the site.
 * If HMRC publishes a change, update it here and every calculator on the site
 * inherits the new value via build-time imports.
 *
 * Sources: HMRC rates and allowances (gov.uk), Spring Budget 2025, Autumn Budget 2025.
 * Last reviewed: November 2025 (assume 2026/27 figures locked from April 2026).
 */

export const TAX_YEAR = '2026/27' as const;
export const TAX_YEAR_START = new Date('2026-04-06');
export const TAX_YEAR_END = new Date('2027-04-05');

// ─────────────────────────────────────────────────────────────────────────────
// INCOME TAX (England, Wales, NI — Scotland has different bands)
// ─────────────────────────────────────────────────────────────────────────────

export const INCOME_TAX = {
  personalAllowance: 12_570,
  /** Personal allowance tapers by £1 for every £2 over this threshold. */
  paTaperThreshold: 100_000,
  /** PA fully eroded at this income level. */
  paFullyTaperedAt: 125_140,
  bands: [
    { from: 0,        to: 12_570,   rate: 0.00, label: 'Personal Allowance' },
    { from: 12_570,   to: 50_270,   rate: 0.20, label: 'Basic Rate' },
    { from: 50_270,   to: 125_140,  rate: 0.40, label: 'Higher Rate' },
    { from: 125_140,  to: Infinity, rate: 0.45, label: 'Additional Rate' },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// NATIONAL INSURANCE — Employee (Class 1 primary)
// ─────────────────────────────────────────────────────────────────────────────

export const NI_EMPLOYEE = {
  primaryThreshold: 12_570,
  upperEarningsLimit: 50_270,
  /** Main rate between PT and UEL. Reduced from 10% to 8% in April 2024. */
  mainRate: 0.08,
  /** Above UEL. */
  additionalRate: 0.02,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// NATIONAL INSURANCE — Employer (Class 1 secondary)
// Major change in Autumn 2024 budget: ST dropped to £5k, rate up to 15%.
// ─────────────────────────────────────────────────────────────────────────────

export const NI_EMPLOYER = {
  secondaryThreshold: 5_000,
  rate: 0.15,
  /** Employment Allowance — most Ltd Co single-director companies CANNOT claim this. */
  employmentAllowance: 10_500,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// NATIONAL INSURANCE — Self-employed (Class 2 + Class 4)
// ─────────────────────────────────────────────────────────────────────────────

export const NI_SELF_EMPLOYED = {
  /** Class 2 abolished as a mandatory liability from April 2024.
   *  Still voluntarily payable to maintain state pension credits. */
  class2Voluntary: 3.45 * 52,
  class4: {
    lowerProfitsLimit: 12_570,
    upperProfitsLimit: 50_270,
    /** Reduced from 8% to 6% in April 2024. */
    mainRate: 0.06,
    additionalRate: 0.02,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CORPORATION TAX
// ─────────────────────────────────────────────────────────────────────────────

export const CORPORATION_TAX = {
  smallProfitsRate: 0.19,
  /** Profits at or below this get the small profits rate. */
  smallProfitsLimit: 50_000,
  mainRate: 0.25,
  /** Profits at or above this get the main rate. */
  mainRateThreshold: 250_000,
  /** Marginal relief fraction (3/200) — applied between the two thresholds. */
  marginalReliefFraction: 3 / 200,
  /** Effective marginal CT rate in the marginal relief band. */
  effectiveMarginalRate: 0.265,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDEND TAX
// ─────────────────────────────────────────────────────────────────────────────

export const DIVIDEND_TAX = {
  /** Frozen at £500 from April 2024. */
  allowance: 500,
  rates: {
    basic: 0.0875,
    higher: 0.3375,
    additional: 0.3935,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CAPITAL GAINS TAX
// ─────────────────────────────────────────────────────────────────────────────

export const CGT = {
  annualExemptAmount: 3_000,
  rates: {
    /** Rates raised at Autumn 2024 budget. */
    basic: 0.18,
    higher: 0.24,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// PENSIONS — SIPP / Workplace pension allowances
// ─────────────────────────────────────────────────────────────────────────────

export const PENSIONS = {
  /** Standard Annual Allowance. */
  annualAllowance: 60_000,
  /** Money Purchase Annual Allowance — triggered if you flexibly access a DC pension. */
  mpaa: 10_000,
  /** Tapered AA: reduces by £1 per £2 over this adjusted income, floor at minAA. */
  taperedThreshold: 260_000,
  taperedMinimum: 10_000,
  /** Lump Sum Allowance — replaces the LTA from April 2024. */
  lumpSumAllowance: 268_275,
  /** Lump Sum and Death Benefit Allowance. */
  lumpSumDeathBenefitAllowance: 1_073_100,
  /** Carry-forward window: up to 3 prior tax years' unused AA. */
  carryForwardYears: 3,
  /** Minimum age to access a personal pension (rising to 57 in 2028). */
  normalMinimumPensionAge: 55,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ISA / LISA
// ─────────────────────────────────────────────────────────────────────────────

export const ISA = {
  annualAllowance: 20_000,
  lisa: {
    annualAllowance: 4_000,
    /** Government adds 25% bonus. */
    bonusRate: 0.25,
    /** Penalty for unauthorised withdrawal (effectively claws back the bonus + a bit more). */
    withdrawalPenalty: 0.25,
    /** Open until age 39, contribute until age 49. */
    maxOpenAge: 39,
    maxContributeAge: 49,
  },
  juniorISA: {
    annualAllowance: 9_000,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// STATE PENSION (new flat-rate)
// ─────────────────────────────────────────────────────────────────────────────

export const STATE_PENSION = {
  /** Weekly rate for 2026/27 — full new state pension assuming 35 qualifying NI years. */
  weeklyFull: 230.25,
  annualFull: 230.25 * 52,
  /** Years of NI contributions needed for full new state pension. */
  qualifyingYearsFull: 35,
  /** Minimum years for any state pension. */
  qualifyingYearsMinimum: 10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// VAT
// ─────────────────────────────────────────────────────────────────────────────

export const VAT = {
  standardRate: 0.20,
  reducedRate: 0.05,
  /** Compulsory VAT registration if turnover exceeds this in any rolling 12-month period. */
  registrationThreshold: 90_000,
  deregistrationThreshold: 88_000,
  flatRate: {
    /** First-year discount on flat rate. */
    firstYearDiscount: 0.01,
    /** Common percentages (industry-specific — these are examples, not exhaustive). */
    commonPercentages: {
      itConsultancy: 0.145,
      management: 0.14,
      labour: 0.145,
      anyOther: 0.12,
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHILD BENEFIT / HICBC (High Income Child Benefit Charge)
// ─────────────────────────────────────────────────────────────────────────────

export const CHILD_BENEFIT = {
  /** Weekly rate per first/eldest child. */
  weeklyFirstChild: 26.05,
  /** Weekly rate per each additional child. */
  weeklySubsequentChild: 17.25,
  /** HICBC starts tapering at this adjusted net income (raised April 2024 from £50k). */
  hicbcThreshold: 60_000,
  /** Fully clawed back at this income. */
  hicbcFullyClawedBackAt: 80_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT LOANS
// ─────────────────────────────────────────────────────────────────────────────

export const STUDENT_LOAN = {
  plan1: { threshold: 26_065, rate: 0.09 },
  plan2: { threshold: 28_470, rate: 0.09 },
  plan4: { threshold: 32_745, rate: 0.09 }, // Scotland
  plan5: { threshold: 25_000, rate: 0.09 }, // Post-2023 starters
  postgraduate: { threshold: 21_000, rate: 0.06 },
} as const;
