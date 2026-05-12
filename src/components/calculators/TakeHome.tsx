/**
 * TakeHome — UK contractor take-home calculator: Inside-IR35 vs Outside-IR35.
 *
 * Reuses the existing tax engine (income-tax, ni, corp-tax, dividend,
 * salary-dividend optimiser). All new logic lives in `lib/ir35/compare.ts`.
 *
 * UI grammar mirrors SalaryDividendSplit:
 *   • Sidebar form
 *   • Headline comparison card
 *   • Breakdown table for each scenario
 *   • Inline-SVG horizontal stacked bar chart for the breakdown
 *   • Warnings panel
 *   • Expandable assumptions
 */

import { useMemo, useState } from 'react';
import { compareIR35, type TakeHomeInput, type TakeHomeResult, type TakeHomeScenario } from '../../lib/ir35/compare';

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */
const gbpWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});
const money = (n: number) => gbpWhole.format(Math.round(n));
const pct = (x: number, dp = 1) =>
  `${(x * 100).toLocaleString('en-GB', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  })}%`;

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */
const DEFAULT_FORM: TakeHomeInput = {
  dayRate: 500,
  billableDays: 220,
  annualBusinessExpenses: 3_000,
  umbrellaFeeAnnual: 1_500,
  pensionPercent: 0.05,
  age: 38,
  otherIncome: 0,
  passThroughApprenticeshipLevy: false,
};

export default function TakeHome() {
  const [form, setForm] = useState<TakeHomeInput>(DEFAULT_FORM);

  const result = useMemo<TakeHomeResult | { error: string }>(() => {
    try {
      return compareIR35(form);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [form]);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-8">
      {/* ----- Sidebar ----- */}
      <aside className="bg-white rounded-lg border border-[color:var(--color-rule)] p-6 self-start lg:sticky lg:top-6">
        <h2 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
          Contract
        </h2>

        <Field label="Day rate (£)">
          <CurrencyInput
            value={form.dayRate}
            min={0}
            max={10_000}
            step={25}
            onChange={v => setForm({ ...form, dayRate: v })}
          />
        </Field>

        <Field label="Billable days per year">
          <NumberInput
            value={form.billableDays}
            min={0}
            max={365}
            step={1}
            onChange={v => setForm({ ...form, billableDays: v })}
          />
          <Hint>
            Most full-time contractors bill 200–230 days/year after holiday, sickness and bench
            time. The default is 220.
          </Hint>
        </Field>

        <Field label={`Pension contribution: ${pct(form.pensionPercent, 1)} of gross`}>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={form.pensionPercent}
            onChange={e => setForm({ ...form, pensionPercent: Number(e.target.value) })}
            className="w-full"
          />
          <Hint>
            Inside-IR35: via salary sacrifice. Outside-IR35: as an employer contribution from the
            Ltd Co. Capped at the £60,000 Annual Allowance either way.
          </Hint>
        </Field>

        <h2 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4 mt-6">
          Outside-IR35 (Ltd Co) Costs
        </h2>

        <Field label="Annual business expenses (£)">
          <CurrencyInput
            value={form.annualBusinessExpenses}
            min={0}
            max={100_000}
            step={500}
            onChange={v => setForm({ ...form, annualBusinessExpenses: v })}
          />
          <Hint>
            Accountancy fees, insurance, software subscriptions, training. Typical for a
            single-person Ltd Co: £2,000–£5,000/yr.
          </Hint>
        </Field>

        <h2 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4 mt-6">
          Inside-IR35 (Umbrella) Costs
        </h2>

        <Field label="Umbrella fee per year (£)">
          <CurrencyInput
            value={form.umbrellaFeeAnnual}
            min={0}
            max={5_000}
            step={100}
            onChange={v => setForm({ ...form, umbrellaFeeAnnual: v })}
          />
          <Hint>Typical market range is £1,300–£1,800/yr (£25–£35/week).</Hint>
        </Field>

        <Field label="" inline>
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={!!form.passThroughApprenticeshipLevy}
              onChange={e =>
                setForm({ ...form, passThroughApprenticeshipLevy: e.target.checked })
              }
              className="mt-1"
            />
            <span>
              <span className="font-medium">Pass-through Apprenticeship Levy (0.5%)</span>
              <Hint>
                Many umbrellas deduct this even though it's only legally due above a £3M
                paybill. Check your KID.
              </Hint>
            </span>
          </label>
        </Field>

        <h2 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4 mt-6">
          Personal
        </h2>

        <Field label="Age">
          <NumberInput
            value={form.age}
            min={16}
            max={100}
            step={1}
            onChange={v => setForm({ ...form, age: v })}
          />
        </Field>

        <Field label="Other taxable income (£/yr)">
          <CurrencyInput
            value={form.otherIncome ?? 0}
            min={0}
            max={1_000_000}
            step={1_000}
            onChange={v => setForm({ ...form, otherIncome: v })}
          />
          <Hint>
            Rental, savings, salaried job — anything outside this contract. Affects how the
            personal allowance is consumed.
          </Hint>
        </Field>

        <button
          type="button"
          onClick={() => setForm(DEFAULT_FORM)}
          className="text-sm text-[color:var(--color-accent)] hover:underline mt-2"
        >
          Reset to defaults
        </button>
      </aside>

      {/* ----- Results ----- */}
      <section className="space-y-6">
        {'error' in result ? (
          <div className="bg-red-50 border border-[color:var(--color-danger)] rounded-lg p-6">
            <p className="font-semibold text-[color:var(--color-danger)] mb-1">
              Can't compute that
            </p>
            <p className="text-sm">{result.error}</p>
          </div>
        ) : (
          <>
            <HeadlineCard result={result} />
            {result.warnings.length > 0 && (
              <div className="bg-[color:var(--color-accent-soft)]/50 border border-[color:var(--color-rule)] rounded-lg p-4 text-sm">
                <p className="font-semibold mb-2">Things to be aware of</p>
                <ul className="space-y-1 pl-4 list-disc">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <Comparison result={result} />
            <BreakdownChart result={result} />
            <BreakdownTable result={result} />
            <Caveats />
          </>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Headline                                                            */
/* ------------------------------------------------------------------ */

function HeadlineCard({ result }: { result: TakeHomeResult }) {
  const { inside, outside, netCashDifference, insideBreakevenDayRate } = result;
  const outsideBetter = netCashDifference > 0;
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <ScenarioStat
          label="Inside IR35 (Umbrella) — net cash"
          value={money(inside.netCash)}
          rate={inside.effectiveTaxRate}
          highlight={!outsideBetter}
        />
        <ScenarioStat
          label="Outside IR35 (Ltd Co) — net cash"
          value={money(outside.netCash)}
          rate={outside.effectiveTaxRate}
          highlight={outsideBetter}
        />
      </div>
      <div className="mt-6 pt-6 border-t border-[color:var(--color-rule)]">
        <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-2">
          Difference
        </p>
        <p className="text-3xl font-bold font-mono text-[color:var(--color-ink)] mb-1">
          {outsideBetter ? '+' : ''}{money(netCashDifference)}/yr
          <span className="text-sm font-normal text-[color:var(--color-ink-light)] ml-2">
            {outsideBetter ? 'in favour of outside-IR35' : 'in favour of inside-IR35'}
          </span>
        </p>
        {insideBreakevenDayRate !== null && outsideBetter && (
          <p className="text-sm text-[color:var(--color-ink-light)] leading-relaxed">
            To match the outside-IR35 net cash, the inside-IR35 day rate would need to be{' '}
            <strong className="text-[color:var(--color-accent)]">
              £{Math.round(insideBreakevenDayRate).toLocaleString('en-GB')}/day
            </strong>
            .
          </p>
        )}
        {result.outside.netCash > 0 && result.inside.netCash > 0 && (
          <p className="text-sm text-[color:var(--color-ink-light)] leading-relaxed mt-2">
            Or equivalently: the outside-IR35 effective tax rate is{' '}
            <strong>{pct(outside.effectiveTaxRate, 1)}</strong> vs inside-IR35's{' '}
            <strong>{pct(inside.effectiveTaxRate, 1)}</strong> — a{' '}
            {Math.abs((inside.effectiveTaxRate - outside.effectiveTaxRate) * 100).toFixed(1)} percentage-point
            spread.
          </p>
        )}
      </div>
    </div>
  );
}

function ScenarioStat({
  label,
  value,
  rate,
  highlight,
}: {
  label: string;
  value: string;
  rate: number;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded p-4 ${
        highlight
          ? 'bg-[color:var(--color-accent-soft)]/40 ring-1 ring-[color:var(--color-accent)]'
          : 'bg-[color:var(--color-paper)]'
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-[color:var(--color-ink-light)] mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold font-mono text-[color:var(--color-ink)]">{value}</p>
      <p className="text-sm text-[color:var(--color-ink-light)] mt-1">
        Effective tax rate: <strong>{pct(rate, 1)}</strong>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison summary                                                  */
/* ------------------------------------------------------------------ */

function Comparison({ result }: { result: TakeHomeResult }) {
  const { inside, outside, insideBreakevenDayRate } = result;
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
        What the numbers really mean
      </p>
      <div className="grid sm:grid-cols-2 gap-6 text-sm leading-relaxed">
        <div>
          <p className="font-medium mb-1">Inside IR35 (Umbrella)</p>
          <p className="text-[color:var(--color-ink-light)]">
            You're treated as an employee for tax. The umbrella deducts its fee, then employer NI,
            then runs the rest through PAYE — income tax + employee NI on the deemed salary.
            There is no corporation tax, no dividends. Pension via salary sacrifice is the only
            real planning lever.
          </p>
          <p className="text-[color:var(--color-ink-light)] mt-2">
            Net cash: <strong>{money(inside.netCash)}/yr</strong>
            <br />
            Pension: <strong>{money(inside.pensionContribution)}/yr</strong>
            <br />
            Total deductions: <strong>{money(inside.totalDeductions)}/yr</strong>
          </p>
        </div>
        <div>
          <p className="font-medium mb-1">Outside IR35 (Ltd Co)</p>
          <p className="text-[color:var(--color-ink-light)]">
            You're paid into your Ltd Co. After expenses and an employer pension contribution,
            corporation tax is levied; what remains is extracted as the
            mathematically-optimal salary + dividend split (using our joint optimiser engine).
          </p>
          <p className="text-[color:var(--color-ink-light)] mt-2">
            Net cash: <strong>{money(outside.netCash)}/yr</strong>
            <br />
            Pension: <strong>{money(outside.pensionContribution)}/yr</strong>
            <br />
            Total deductions: <strong>{money(outside.totalDeductions)}/yr</strong>
          </p>
        </div>
      </div>
      {insideBreakevenDayRate !== null && (
        <p className="text-sm text-[color:var(--color-ink-light)] mt-4 pt-4 border-t border-[color:var(--color-rule)]">
          <strong>Break-even day rate:</strong>{' '}
          <span className="font-mono">£{Math.round(insideBreakevenDayRate).toLocaleString('en-GB')}/day</span> — the
          inside-IR35 day rate that would deliver the same net cash as your current outside-IR35
          scenario. If you're being offered less than this on an inside-IR35 contract, the
          outside-IR35 route is materially better in cash terms.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown chart                                                     */
/* ------------------------------------------------------------------ */

function BreakdownChart({ result }: { result: TakeHomeResult }) {
  const { inside, outside } = result;
  const max = Math.max(inside.contractValue, outside.contractValue, 1);
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
        Where your £ goes
      </p>
      <div className="space-y-4">
        <ScenarioBar
          label="Inside IR35"
          scenario={inside}
          max={max}
          netCash={inside.netCash}
          pension={inside.pensionContribution}
        />
        <ScenarioBar
          label="Outside IR35"
          scenario={outside}
          max={max}
          netCash={outside.netCash}
          pension={outside.pensionContribution}
        />
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-[color:var(--color-ink-light)]">
        <LegendSwatch color="var(--color-success)" label="Net cash" />
        <LegendSwatch color="var(--color-accent)" label="Pension" />
        <LegendSwatch color="#92400e" label="Corp tax / employer costs" />
        <LegendSwatch color="#b45309" label="Income tax / dividend tax" />
        <LegendSwatch color="#d97706" label="Employee NI" />
        <LegendSwatch color="#a3a3a3" label="Fees / expenses" />
      </div>
    </div>
  );
}

function ScenarioBar({
  label,
  scenario,
  max,
  netCash,
  pension,
}: {
  label: string;
  scenario: TakeHomeScenario;
  max: number;
  netCash: number;
  pension: number;
}) {
  const W = 720;
  const H = 36;
  const innerW = W;
  const scale = (v: number) => (v / max) * innerW;

  const employerCosts =
    scenario.breakdown.employerNI +
    scenario.breakdown.corporationTax +
    scenario.breakdown.apprenticeshipLevy;
  const personalTax =
    scenario.breakdown.incomeTax + scenario.breakdown.dividendTax;
  const employeeNI = scenario.breakdown.employeeNI;
  const fees = scenario.breakdown.umbrellaFee + scenario.breakdown.businessExpenses;

  const segments = [
    { v: netCash, color: 'var(--color-success)', name: 'Net cash' },
    { v: pension, color: 'var(--color-accent)', name: 'Pension' },
    { v: employerCosts, color: '#92400e', name: 'Corp tax / employer NI' },
    { v: personalTax, color: '#b45309', name: 'Income tax / dividend tax' },
    { v: employeeNI, color: '#d97706', name: 'Employee NI' },
    { v: fees, color: '#a3a3a3', name: 'Fees / expenses' },
  ];

  let x = 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-[color:var(--color-ink-light)] font-mono">
          Contract value: {money(scenario.contractValue)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9" role="img" aria-label={`${label} breakdown`}>
        {segments.map((s, i) => {
          if (s.v <= 0) return null;
          const w = scale(s.v);
          const rect = (
            <g key={i}>
              <rect x={x} y={0} width={w} height={H} fill={s.color}>
                <title>{`${s.name}: ${money(s.v)}`}</title>
              </rect>
              {w > 60 && (
                <text
                  x={x + w / 2}
                  y={H / 2 + 4}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  fill="white"
                >
                  {money(s.v)}
                </text>
              )}
            </g>
          );
          x += w;
          return rect;
        })}
      </svg>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown table                                                     */
/* ------------------------------------------------------------------ */

function BreakdownTable({ result }: { result: TakeHomeResult }) {
  const rows: Array<{
    label: string;
    inside: number;
    outside: number;
    note?: string;
  }> = [
    { label: 'Contract value', inside: result.inside.contractValue, outside: result.outside.contractValue },
    { label: 'Umbrella fee', inside: result.inside.breakdown.umbrellaFee, outside: 0, note: 'Inside-IR35 only.' },
    {
      label: 'Apprenticeship Levy',
      inside: result.inside.breakdown.apprenticeshipLevy,
      outside: 0,
      note: 'Inside-IR35 only (if passed through).',
    },
    {
      label: 'Business expenses',
      inside: 0,
      outside: result.outside.breakdown.businessExpenses,
      note: 'Outside-IR35 only.',
    },
    {
      label: 'Corporation tax',
      inside: 0,
      outside: result.outside.breakdown.corporationTax,
      note: 'Outside-IR35 only.',
    },
    {
      label: 'Employer NI',
      inside: result.inside.breakdown.employerNI,
      outside: result.outside.breakdown.employerNI,
    },
    {
      label: 'Employee NI',
      inside: result.inside.breakdown.employeeNI,
      outside: result.outside.breakdown.employeeNI,
    },
    {
      label: 'Income tax (PAYE)',
      inside: result.inside.breakdown.incomeTax,
      outside: result.outside.breakdown.incomeTax,
    },
    {
      label: 'Dividend tax',
      inside: 0,
      outside: result.outside.breakdown.dividendTax,
      note: 'Outside-IR35 only.',
    },
    {
      label: 'Pension contribution',
      inside: result.inside.pensionContribution,
      outside: result.outside.pensionContribution,
    },
    {
      label: 'Net cash to you',
      inside: result.inside.netCash,
      outside: result.outside.netCash,
    },
    {
      label: 'Net wealth (cash + pension)',
      inside: result.inside.netWealth,
      outside: result.outside.netWealth,
    },
  ];
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6 overflow-x-auto">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
        Full breakdown
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-rule)]">
            <th className="text-left py-2 font-medium">Line item</th>
            <th className="text-right py-2 font-medium">Inside IR35</th>
            <th className="text-right py-2 font-medium">Outside IR35</th>
            <th className="text-right py-2 font-medium">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={r.label}
              className={`border-b border-[color:var(--color-rule)]/40 ${
                r.label.startsWith('Net') ? 'font-bold' : ''
              }`}
            >
              <td className="py-2">
                {r.label}
                {r.note && (
                  <span className="block text-xs text-[color:var(--color-ink-light)] font-normal">
                    {r.note}
                  </span>
                )}
              </td>
              <td className="py-2 text-right font-mono">{money(r.inside)}</td>
              <td className="py-2 text-right font-mono">{money(r.outside)}</td>
              <td className="py-2 text-right font-mono text-[color:var(--color-ink-light)]">
                {r.outside - r.inside === 0
                  ? '—'
                  : (r.outside - r.inside > 0 ? '+' : '') + money(r.outside - r.inside)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assumptions / caveats                                               */
/* ------------------------------------------------------------------ */

function Caveats() {
  return (
    <details className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <summary className="cursor-pointer font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)]">
        Assumptions &amp; limitations
      </summary>
      <ul className="mt-4 text-sm space-y-2 pl-5 list-disc text-[color:var(--color-ink-light)]">
        <li>
          <strong>This calculator does not make an IR35 status determination.</strong> Whether
          your engagement is inside or outside IR35 is a question of contract terms and working
          practices, decided under Chapter 10 ITEPA 2003. Use the HMRC CEST tool, an IR35
          specialist, or your accountant.
        </li>
        <li>
          Tax year is 2026/27 (rUK). Scottish rates are not modelled. Welsh rates currently
          mirror rUK.
        </li>
        <li>
          The outside-IR35 net cash is the output of the salary–dividend optimiser at 100% pension
          weight, which means the calculator chooses the mathematically optimal extraction. Real
          contractors with other constraints (mortgage affordability, partner income, retained
          profits) may choose differently.
        </li>
        <li>
          Inside-IR35 modelling assumes a clean PAYE umbrella with the employer NI passed through
          to the contractor's economic share (which is how all market-rate umbrella contracts work
          after the 2017/2021 reforms).
        </li>
        <li>
          The Apprenticeship Levy (0.5%) is only legally due once a paybill exceeds £3M, but many
          umbrellas pass it through anyway. The checkbox lets you model either treatment.
        </li>
        <li>
          Pension contributions inside-IR35 use salary sacrifice (the most efficient route);
          outside-IR35 they are modelled as employer contributions (CT-deductible, no NI on
          either side).
        </li>
        <li>
          Other income (rental, salary, etc.) is added to the personal tax stack for the
          purpose of computing marginal rates and the £100,000 personal-allowance taper, but is
          not double-counted in the net-cash figure.
        </li>
        <li>
          The £100k personal-allowance taper, the £125,140 additional-rate threshold, and the
          £50k–£250k corporation-tax marginal-relief band are all modelled. Boundary tests
          confirm correct behaviour.
        </li>
        <li>
          The Employment Allowance is not claimed (single-director Ltd Cos are NOT eligible).
        </li>
        <li>
          Student loan repayments, child benefit charge (HICBC), and Scottish income tax are
          not modelled here; we will add them as separate optional layers.
        </li>
      </ul>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Field({
  label,
  inline,
  children,
}: {
  label: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      {label && !inline && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-[color:var(--color-ink-light)] mt-1 leading-snug">
      {children}
    </p>
  );
}

function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className="w-full border border-[color:var(--color-rule)] rounded px-3 py-2 font-mono"
    />
  );
}

function CurrencyInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-light)] font-mono">
        £
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full border border-[color:var(--color-rule)] rounded pl-7 pr-3 py-2 font-mono"
      />
    </div>
  );
}
