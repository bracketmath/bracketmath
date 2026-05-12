/**
 * SalaryDividendSplit — interactive React calculator.
 *
 * Wires the joint optimiser into a form + results UI.
 *
 * Design philosophy (per MASTER-PLAN §4):
 *   • Compute on every keystroke (debounced 250ms) — no submit button.
 *   • Show the headline answer first, then the breakdown, then the curve.
 *   • Be honest about uncertainty: explicit "vs rule-of-thumb" delta in £.
 *   • Inline the assumptions, never hide them behind a tooltip-only.
 *
 * No external chart library yet — we draw the salary-vs-wealth curve as an
 * inline SVG to keep the bundle tiny.
 */

import { useMemo, useState } from 'react';
import {
  optimiseSalaryDividend,
  type OptimiserInput,
  type OptimiserResult,
  type ExtractionPlan,
} from '../../lib/optim/salary-dividend';

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

const gbpWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const gbpExact = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});

const pct = (x: number) =>
  `${(x * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%`;

const money = (n: number) => gbpWhole.format(Math.round(n));
const moneyExact = (n: number) => gbpExact.format(n);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface FormState {
  profits: number;
  age: number;
  otherIncome: number;
  pensionWeight: number;
  claimEmploymentAllowance: boolean;
}

const DEFAULT_FORM: FormState = {
  profits: 140_000,
  age: 38,
  otherIncome: 0,
  pensionWeight: 1.0,
  claimEmploymentAllowance: false,
};

export default function SalaryDividendSplit() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  // Re-compute whenever inputs change. The optimiser runs in ~30–60ms for
  // realistic inputs; React batches state updates so we don't bother with
  // useDeferredValue or debouncing here.
  const result: OptimiserResult | { error: string } = useMemo(() => {
    try {
      const input: OptimiserInput = {
        profits: form.profits,
        age: form.age,
        otherIncome: form.otherIncome,
        pensionWeight: form.pensionWeight,
        claimEmploymentAllowance: form.claimEmploymentAllowance,
      };
      return optimiseSalaryDividend(input);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [form]);

  const isError = 'error' in result;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-8">
      {/* ---------------- Form sidebar ---------------- */}
      <aside className="bg-white rounded-lg border border-[color:var(--color-rule)] p-6 self-start lg:sticky lg:top-6">
        <h2 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
          Inputs
        </h2>

        <Field label="Company profit (before director pay)" htmlFor="profits">
          <CurrencyInput
            id="profits"
            value={form.profits}
            min={0}
            max={5_000_000}
            step={1_000}
            onChange={(v) => setForm({ ...form, profits: v })}
          />
          <Hint>
            Annual profit before subtracting director salary, employer NI, or pension
            contributions. This is roughly turnover minus business costs.
          </Hint>
        </Field>

        <Field label="Your age" htmlFor="age">
          <input
            id="age"
            type="number"
            min={16}
            max={120}
            value={form.age}
            onChange={(e) =>
              setForm({ ...form, age: Number(e.target.value) || 0 })
            }
            className="w-full border border-[color:var(--color-rule)] rounded px-3 py-2 font-mono"
          />
          <Hint>Affects when you can access pension contributions (currently 55, rising to 57).</Hint>
        </Field>

        <Field label="Other personal income (rental, side job…)" htmlFor="otherIncome">
          <CurrencyInput
            id="otherIncome"
            value={form.otherIncome}
            min={0}
            max={5_000_000}
            step={500}
            onChange={(v) => setForm({ ...form, otherIncome: v })}
          />
          <Hint>
            Excludes dividends from <em>this</em> company. Affects which tax band the salary lands in.
          </Hint>
        </Field>

        <Field label="Value of £1 in pension vs £1 cash today" htmlFor="pensionWeight">
          <div className="flex items-center gap-3">
            <input
              id="pensionWeight"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={form.pensionWeight}
              onChange={(e) =>
                setForm({ ...form, pensionWeight: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="font-mono text-sm w-12 text-right">
              {form.pensionWeight.toFixed(2)}
            </span>
          </div>
          <Hint>
            1.00 = you value pension £1 = cash £1 (max-wealth view). 0.00 = ignore pension entirely
            (cash optimum). Most directors should use 0.70–0.85 once they account for decumulation tax
            and illiquidity.
          </Hint>
        </Field>

        <Field label="" htmlFor="claimEA" inline>
          <label htmlFor="claimEA" className="flex items-start gap-2 cursor-pointer">
            <input
              id="claimEA"
              type="checkbox"
              checked={form.claimEmploymentAllowance}
              onChange={(e) =>
                setForm({ ...form, claimEmploymentAllowance: e.target.checked })
              }
              className="mt-1"
            />
            <span>
              <span className="font-medium">Claim Employment Allowance (£10,500)</span>
              <Hint>
                Only tick if you have at least <strong>two</strong> employees on PAYE, neither of
                whom is the sole director. Single-director Ltd Cos are <em>not</em> eligible.
              </Hint>
            </span>
          </label>
        </Field>

        <button
          type="button"
          onClick={() => setForm(DEFAULT_FORM)}
          className="text-sm text-[color:var(--color-accent)] hover:underline"
        >
          Reset to defaults
        </button>
      </aside>

      {/* ---------------- Results ---------------- */}
      <section className="space-y-6">
        {isError ? (
          <div className="bg-red-50 border border-[color:var(--color-danger)] rounded-lg p-6">
            <p className="font-semibold text-[color:var(--color-danger)] mb-1">
              Can't compute that
            </p>
            <p className="text-sm">{result.error}</p>
          </div>
        ) : (
          <Results res={result} pensionWeight={form.pensionWeight} />
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results panel                                                       */
/* ------------------------------------------------------------------ */

function Results({
  res,
  pensionWeight,
}: {
  res: OptimiserResult;
  pensionWeight: number;
}) {
  const { optimum, ruleOfThumb, savingsVsRuleOfThumb, salaryCurve, warnings } = res;
  return (
    <>
      <HeadlineCard
        optimum={optimum}
        ruleOfThumb={ruleOfThumb}
        savings={savingsVsRuleOfThumb}
        pensionWeight={pensionWeight}
      />

      {warnings.length > 0 && (
        <div className="bg-[color:var(--color-accent-soft)]/50 border border-[color:var(--color-rule)] rounded-lg p-4 text-sm">
          <p className="font-semibold mb-2">Things to be aware of</p>
          <ul className="space-y-1 pl-4 list-disc">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <BreakdownTable optimum={optimum} ruleOfThumb={ruleOfThumb} />

      <SalaryCurveChart curve={salaryCurve} optimumSalary={optimum.salary} />

      <Caveats />
    </>
  );
}

/* ---- Headline ----------------------------------------------------- */

function HeadlineCard({
  optimum,
  ruleOfThumb,
  savings,
  pensionWeight,
}: {
  optimum: ExtractionPlan;
  ruleOfThumb: ExtractionPlan;
  savings: number;
  pensionWeight: number;
}) {
  const beatsBaseline = savings > 0.5; // ignore sub-£1 noise
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-2">
        Optimum extraction plan
      </p>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <Stat label="Salary" value={money(optimum.salary)} mono />
        <Stat label="Dividend" value={money(optimum.dividend)} mono />
        <Stat label="Pension contribution" value={money(optimum.pension)} mono />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[color:var(--color-rule)]">
        <Stat
          label="Net cash to you"
          value={money(optimum.netCash)}
          mono
          highlight
        />
        <Stat
          label={pensionWeight < 1 ? `Net wealth (cash + ${pct(pensionWeight)} × pension)` : 'Net wealth (cash + pension)'}
          value={money(optimum.netWealth)}
          mono
          highlight
        />
        <Stat
          label="Effective total tax rate"
          value={pct(optimum.effectiveTotalTaxRate)}
          mono
        />
      </div>

      {beatsBaseline && (
        <p className="mt-6 text-sm bg-[color:var(--color-accent-soft)]/60 rounded p-3">
          <strong>{moneyExact(savings)}/year better</strong> than the rule-of-thumb baseline
          ({money(ruleOfThumb.salary)} salary, {money(ruleOfThumb.dividend)} dividend, no pension).
        </p>
      )}
      {!beatsBaseline && (
        <p className="mt-6 text-sm text-[color:var(--color-ink-light)]">
          The rule-of-thumb baseline ({money(ruleOfThumb.salary)} salary, no pension) is already
          close to optimal for your profit level — the additional gain from optimising is under £1.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[color:var(--color-ink-light)] mb-1">
        {label}
      </p>
      <p
        className={[
          mono ? 'font-mono' : '',
          highlight ? 'text-2xl font-bold' : 'text-xl',
          'text-[color:var(--color-ink)]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

/* ---- Breakdown table --------------------------------------------- */

function BreakdownTable({
  optimum,
  ruleOfThumb,
}: {
  optimum: ExtractionPlan;
  ruleOfThumb: ExtractionPlan;
}) {
  const rows: Array<{ label: string; opt: number; rot: number }> = [
    { label: 'Corporation tax', opt: optimum.taxes.corporationTax, rot: ruleOfThumb.taxes.corporationTax },
    { label: 'Employer NI', opt: optimum.taxes.employerNI, rot: ruleOfThumb.taxes.employerNI },
    { label: 'Employee NI', opt: optimum.taxes.employeeNI, rot: ruleOfThumb.taxes.employeeNI },
    { label: 'Income tax (salary)', opt: optimum.taxes.incomeTax, rot: ruleOfThumb.taxes.incomeTax },
    { label: 'Dividend tax', opt: optimum.taxes.dividendTax, rot: ruleOfThumb.taxes.dividendTax },
  ];
  const totalOpt = rows.reduce((s, r) => s + r.opt, 0);
  const totalRot = rows.reduce((s, r) => s + r.rot, 0);

  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6 overflow-x-auto">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
        Tax breakdown
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-rule)]">
            <th className="text-left py-2 font-medium">Tax</th>
            <th className="text-right py-2 font-medium">Optimum</th>
            <th className="text-right py-2 font-medium">Rule-of-thumb</th>
            <th className="text-right py-2 font-medium">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const delta = r.opt - r.rot;
            return (
              <tr key={r.label} className="border-b border-[color:var(--color-rule)]/40">
                <td className="py-2">{r.label}</td>
                <td className="py-2 text-right font-mono">{money(r.opt)}</td>
                <td className="py-2 text-right font-mono text-[color:var(--color-ink-light)]">
                  {money(r.rot)}
                </td>
                <td
                  className={[
                    'py-2 text-right font-mono',
                    delta < -0.5 ? 'text-[color:var(--color-success)]' : '',
                    delta > 0.5 ? 'text-[color:var(--color-danger)]' : '',
                  ].join(' ')}
                >
                  {delta >= 0 ? '+' : ''}
                  {money(delta)}
                </td>
              </tr>
            );
          })}
          <tr className="font-semibold">
            <td className="py-2">Total tax &amp; NI</td>
            <td className="py-2 text-right font-mono">{money(totalOpt)}</td>
            <td className="py-2 text-right font-mono text-[color:var(--color-ink-light)]">
              {money(totalRot)}
            </td>
            <td
              className={[
                'py-2 text-right font-mono',
                totalOpt - totalRot < -0.5 ? 'text-[color:var(--color-success)]' : '',
                totalOpt - totalRot > 0.5 ? 'text-[color:var(--color-danger)]' : '',
              ].join(' ')}
            >
              {totalOpt - totalRot >= 0 ? '+' : ''}
              {money(totalOpt - totalRot)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ---- Salary-vs-wealth curve (inline SVG) ------------------------- */

function SalaryCurveChart({
  curve,
  optimumSalary,
}: {
  curve: OptimiserResult['salaryCurve'];
  optimumSalary: number;
}) {
  if (curve.length < 2) return null;

  const W = 640;
  const H = 240;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xs = curve.map((p) => p.salary);
  const ys = curve.map((p) => p.netWealth);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = Math.max(1, yMax - yMin);

  const sx = (x: number) => padL + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const sy = (y: number) => padT + innerH - ((y - yMin) / yRange) * innerH;

  const path = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.salary).toFixed(1)},${sy(p.netWealth).toFixed(1)}`)
    .join(' ');

  const optX = sx(optimumSalary);
  const optY = sy(curve.find((p) => p.salary === optimumSalary)?.netWealth ?? yMax);

  // Y-axis ticks at min/mid/max
  const yTicks = [yMin, yMin + yRange / 2, yMax];
  // X-axis ticks at key salary points
  const xTickValues = [0, 12_570, 50_270, xMax].filter(
    (x) => x >= xMin && x <= xMax,
  );

  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-2">
        Net wealth as a function of salary
      </p>
      <p className="text-sm text-[color:var(--color-ink-light)] mb-4">
        For each salary level, the curve shows the best achievable net wealth (allowing the
        optimiser to pick the best pension contribution at that salary).
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Salary vs net wealth curve">
        {/* axes */}
        <line
          x1={padL}
          y1={padT + innerH}
          x2={padL + innerW}
          y2={padT + innerH}
          stroke="var(--color-rule)"
        />
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="var(--color-rule)" />

        {/* y ticks */}
        {yTicks.map((y, i) => (
          <g key={i}>
            <line
              x1={padL - 4}
              y1={sy(y)}
              x2={padL}
              y2={sy(y)}
              stroke="var(--color-rule)"
            />
            <text
              x={padL - 8}
              y={sy(y) + 4}
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="end"
              fill="var(--color-ink-light)"
            >
              {money(y)}
            </text>
          </g>
        ))}

        {/* x ticks */}
        {xTickValues.map((x, i) => (
          <g key={i}>
            <line
              x1={sx(x)}
              y1={padT + innerH}
              x2={sx(x)}
              y2={padT + innerH + 4}
              stroke="var(--color-rule)"
            />
            <text
              x={sx(x)}
              y={padT + innerH + 18}
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              fill="var(--color-ink-light)"
            >
              {money(x)}
            </text>
          </g>
        ))}

        {/* curve */}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" />

        {/* optimum marker */}
        <line
          x1={optX}
          y1={padT}
          x2={optX}
          y2={padT + innerH}
          stroke="var(--color-success)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle cx={optX} cy={optY} r="4" fill="var(--color-success)" />
        <text
          x={optX + 6}
          y={padT + 14}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="var(--color-success)"
        >
          optimum @ {money(optimumSalary)}
        </text>
      </svg>
    </div>
  );
}

/* ---- Caveats ----------------------------------------------------- */

function Caveats() {
  return (
    <details className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <summary className="cursor-pointer font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)]">
        Assumptions &amp; limitations
      </summary>
      <ul className="mt-4 text-sm space-y-2 pl-5 list-disc text-[color:var(--color-ink-light)]">
        <li>Uses HMRC published rates for the 2026/27 tax year (England, Wales &amp; NI; Scotland not yet supported).</li>
        <li>Single-director Ltd Co model: no Employment Allowance unless explicitly ticked.</li>
        <li>Pension is modelled as an <em>employer</em> contribution (CT-deductible, no NI either side). If you instead use salary sacrifice, results are roughly equivalent.</li>
        <li>The optimiser does not consider multi-year smoothing, retention of profit in the company, or carry-forward of unused pension allowance.</li>
        <li>Student loan repayments, High Income Child Benefit Charge, and Marriage Allowance are not modelled (yet).</li>
        <li>This is not personal advice. Cross-check with your accountant before acting.</li>
      </ul>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Small primitives                                                    */
/* ------------------------------------------------------------------ */

function Field({
  label,
  htmlFor,
  inline,
  children,
}: {
  label: string;
  htmlFor: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      {label && !inline && (
        <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
          {label}
        </label>
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

function CurrencyInput({
  id,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
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
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full border border-[color:var(--color-rule)] rounded pl-7 pr-3 py-2 font-mono"
      />
    </div>
  );
}
