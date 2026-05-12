/**
 * SippOptimiser — Monte Carlo retirement simulator.
 *
 * Design philosophy (per MASTER-PLAN §4 and Calculator #2 spec):
 *   • Show a *distribution*, not a point estimate — that's the whole moat.
 *   • Run on submit (10,000 paths takes ~1s in-browser; live-update isn't worth it).
 *   • Headline metrics first: probability of meeting target, probability of ruin.
 *   • Inline-SVG fan chart — no Recharts/Chart.js, keeps the bundle tiny.
 *   • All inputs in today's £ (real). All outputs in today's £.
 */

import { useMemo, useState, useTransition } from 'react';
import {
  simulateRetirement,
  type SimulateRetirementResult,
} from '../../lib/montecarlo/simulate';
import { historicalSummary } from '../../lib/montecarlo/returns';
import { PENSIONS, STATE_PENSION } from '../../lib/tax/constants';

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const gbpWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const pct = (x: number, dp = 1) =>
  `${(x * 100).toLocaleString('en-GB', {
    maximumFractionDigits: dp,
    minimumFractionDigits: dp,
  })}%`;

const money = (n: number) => gbpWhole.format(Math.round(n));

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

interface FormState {
  currentAge: number;
  retirementAge: number;
  currentPot: number;
  annualContribution: number;
  targetRetirementIncome: number;
  equityWeight: number;
  feeAnnual: number;
  includeStatePension: boolean;
}

const DEFAULT_FORM: FormState = {
  currentAge: 35,
  retirementAge: 65,
  currentPot: 50_000,
  annualContribution: 20_000,
  targetRetirementIncome: 25_000,
  equityWeight: 0.6,
  feeAnnual: 0.0025,
  includeStatePension: true,
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SippOptimiser() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<SimulateRetirementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Run an initial simulation on first mount so the page isn't blank.
  // We do this in a useMemo with a self-running effect-like pattern.
  useMemo(() => {
    if (result !== null) return;
    try {
      const r = simulateRetirement({
        currentAge: DEFAULT_FORM.currentAge,
        retirementAge: DEFAULT_FORM.retirementAge,
        currentPot: DEFAULT_FORM.currentPot,
        annualContribution: DEFAULT_FORM.annualContribution,
        targetRetirementIncome: DEFAULT_FORM.targetRetirementIncome,
        equityWeight: DEFAULT_FORM.equityWeight,
        feeAnnual: DEFAULT_FORM.feeAnnual,
        statePensionAnnual: DEFAULT_FORM.includeStatePension
          ? STATE_PENSION.annualFull
          : 0,
        numPaths: 10_000,
        seed: 1,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runSimulation() {
    setError(null);
    startTransition(() => {
      try {
        const r = simulateRetirement({
          currentAge: form.currentAge,
          retirementAge: form.retirementAge,
          currentPot: form.currentPot,
          annualContribution: form.annualContribution,
          targetRetirementIncome: form.targetRetirementIncome,
          equityWeight: form.equityWeight,
          feeAnnual: form.feeAnnual,
          statePensionAnnual: form.includeStatePension
            ? STATE_PENSION.annualFull
            : 0,
          numPaths: 10_000,
          seed: 1,
        });
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  const warnings = useMemo(() => buildWarnings(form), [form]);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-8">
      {/* ---------------- Form sidebar ---------------- */}
      <aside className="bg-white rounded-lg border border-[color:var(--color-rule)] p-6 self-start lg:sticky lg:top-6">
        <h2 className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
          Inputs
        </h2>

        <Field label="Current age" htmlFor="currentAge">
          <NumberInput
            id="currentAge"
            value={form.currentAge}
            min={18}
            max={80}
            step={1}
            onChange={v => setForm({ ...form, currentAge: v })}
          />
        </Field>

        <Field label="Target retirement age" htmlFor="retirementAge">
          <NumberInput
            id="retirementAge"
            value={form.retirementAge}
            min={Math.max(form.currentAge, PENSIONS.normalMinimumPensionAge)}
            max={85}
            step={1}
            onChange={v => setForm({ ...form, retirementAge: v })}
          />
          <Hint>
            Minimum pension access age is currently {PENSIONS.normalMinimumPensionAge}, rising
            to 57 from April 2028 (Finance Act 2022).
          </Hint>
        </Field>

        <Field label="Current SIPP / pension pot" htmlFor="currentPot">
          <CurrencyInput
            id="currentPot"
            value={form.currentPot}
            min={0}
            max={10_000_000}
            step={1_000}
            onChange={v => setForm({ ...form, currentPot: v })}
          />
          <Hint>
            Combined value of all defined-contribution pension pots today (SIPP, workplace
            DC, stakeholder). Excludes any defined-benefit / final-salary entitlements.
          </Hint>
        </Field>

        <Field label="Annual contribution (real £, today)" htmlFor="contribution">
          <CurrencyInput
            id="contribution"
            value={form.annualContribution}
            min={0}
            max={PENSIONS.annualAllowance}
            step={500}
            onChange={v => setForm({ ...form, annualContribution: v })}
          />
          <Hint>
            Total gross annual contribution including employer + personal. Capped at the {money(PENSIONS.annualAllowance)} Annual
            Allowance (HMRC PTM053100). Higher earners may face the tapered AA — see
            methodology below.
          </Hint>
        </Field>

        <Field label="Target retirement income (real £, today)" htmlFor="target">
          <CurrencyInput
            id="target"
            value={form.targetRetirementIncome}
            min={0}
            max={250_000}
            step={500}
            onChange={v => setForm({ ...form, targetRetirementIncome: v })}
          />
          <Hint>
            Gross income you want to draw each year from age {form.retirementAge}. The simulator
            assumes you draw this amount until age 95.
          </Hint>
        </Field>

        <Field label={`Equity weight: ${pct(form.equityWeight, 0)}`} htmlFor="equity">
          <input
            id="equity"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.equityWeight}
            onChange={e => setForm({ ...form, equityWeight: Number(e.target.value) })}
            className="w-full"
          />
          <Hint>
            0% = 100% gilts (low growth, low volatility). 100% = pure equities (high growth,
            high sequence risk in early retirement). 60/40 is a common balanced default.
          </Hint>
        </Field>

        <Field label={`Annual fund fee: ${pct(form.feeAnnual, 2)}`} htmlFor="fee">
          <input
            id="fee"
            type="range"
            min={0}
            max={0.02}
            step={0.0005}
            value={form.feeAnnual}
            onChange={e => setForm({ ...form, feeAnnual: Number(e.target.value) })}
            className="w-full"
          />
          <Hint>
            Total ongoing charges (OCF + platform fee). Global tracker ETFs are 0.07–0.25%.
            Actively managed funds are often 0.75–1.50%.
          </Hint>
        </Field>

        <Field label="" htmlFor="includeSP" inline>
          <label htmlFor="includeSP" className="flex items-start gap-2 cursor-pointer">
            <input
              id="includeSP"
              type="checkbox"
              checked={form.includeStatePension}
              onChange={e => setForm({ ...form, includeStatePension: e.target.checked })}
              className="mt-1"
            />
            <span>
              <span className="font-medium">
                Include State Pension ({money(STATE_PENSION.annualFull)}/yr from age{' '}
                {DEFAULT_FORM.currentAge < 67 ? 67 : 67})
              </span>
              <Hint>
                Assumes you'll have 35 qualifying NI years by State Pension Age. Check your
                forecast at gov.uk/check-state-pension.
              </Hint>
            </span>
          </label>
        </Field>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={runSimulation}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-[color:var(--color-accent)] text-white font-semibold rounded hover:opacity-90 transition disabled:opacity-60"
          >
            {isPending ? 'Running 10,000 paths…' : 'Re-run simulation'}
          </button>
          <button
            type="button"
            onClick={() => setForm(DEFAULT_FORM)}
            className="px-3 py-2 text-sm text-[color:var(--color-accent)] hover:underline"
          >
            Reset
          </button>
        </div>
      </aside>

      {/* ---------------- Results ---------------- */}
      <section className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-[color:var(--color-danger)] rounded-lg p-6">
            <p className="font-semibold text-[color:var(--color-danger)] mb-1">
              Can't compute that
            </p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!result && !error && (
          <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-8 text-center text-[color:var(--color-ink-light)]">
            <p>Running initial simulation…</p>
          </div>
        )}

        {result && (
          <>
            <HeadlineCard result={result} form={form} />

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

            <FanChart result={result} />
            <PercentileTable result={result} />
            <DatasetCard equityWeight={form.equityWeight} feeAnnual={form.feeAnnual} />
            <Caveats />
          </>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Headline panel                                                      */
/* ------------------------------------------------------------------ */

function HeadlineCard({
  result,
  form,
}: {
  result: SimulateRetirementResult;
  form: FormState;
}) {
  const success = result.probabilityOfMeetingTarget;
  const ruin = result.probabilityOfRuin;
  const verdict =
    success >= 0.95
      ? { color: 'success', text: 'Plan looks robust' }
      : success >= 0.80
        ? { color: 'accent', text: 'Plan is workable — monitor it' }
        : success >= 0.50
          ? { color: 'danger', text: 'Plan is fragile — reduce target or increase contributions' }
          : { color: 'danger', text: 'Plan is likely to fail — material change needed' };

  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-2">
        Probability of meeting your income target
      </p>
      <div className="flex items-baseline gap-3 mt-2">
        <span className="text-5xl font-bold font-mono text-[color:var(--color-ink)]">
          {pct(success, 0)}
        </span>
        <span
          className={`text-sm font-medium ${
            verdict.color === 'success'
              ? 'text-[color:var(--color-success)]'
              : verdict.color === 'danger'
                ? 'text-[color:var(--color-danger)]'
                : 'text-[color:var(--color-accent)]'
          }`}
        >
          {verdict.text}
        </span>
      </div>
      <p className="text-sm text-[color:var(--color-ink-light)] mt-2 leading-relaxed">
        Of 10,000 simulated lifetimes drawing {money(form.targetRetirementIncome)}/year (real)
        from age {form.retirementAge} to 95, the pot lasted to 95 in {pct(success, 1)} of them.
        Probability of running out: <strong>{pct(ruin, 1)}</strong>
        {result.medianExhaustionAge !== null && (
          <>
            {' '}
            (median age at exhaustion in the failed paths: <strong>{result.medianExhaustionAge.toFixed(0)}</strong>)
          </>
        )}
        .
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[color:var(--color-rule)]">
        <Stat
          label="Median pot at retirement"
          value={money(result.fan[form.retirementAge - form.currentAge]?.p50 ?? 0)}
        />
        <Stat label="Median terminal pot (age 95)" value={money(result.medianTerminalPot)} />
        <Stat
          label="Sustainable income at 95% success"
          value={`${money(result.sustainableIncomeAt95pct)}/yr`}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[color:var(--color-ink-light)] mb-1">
        {label}
      </p>
      <p className="text-xl font-mono font-bold text-[color:var(--color-ink)]">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fan chart                                                           */
/* ------------------------------------------------------------------ */

function FanChart({ result }: { result: SimulateRetirementResult }) {
  const fan = result.fan;
  if (fan.length < 2) return null;

  const W = 720;
  const H = 320;
  const padL = 64;
  const padR = 20;
  const padT = 16;
  const padB = 44;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const ageMin = fan[0]!.age;
  const ageMax = fan[fan.length - 1]!.age;

  // Y range: use min of p05 and max of p95 across the fan, with a small
  // headroom. Clamp the minimum to zero (no negative pot displayed).
  const yMaxRaw = Math.max(...fan.map(r => r.p95));
  const yMin = 0;
  const yMax = yMaxRaw * 1.05;
  const yRange = Math.max(1, yMax - yMin);

  const sx = (age: number) => padL + ((age - ageMin) / (ageMax - ageMin)) * innerW;
  const sy = (y: number) =>
    padT + innerH - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / yRange) * innerH;

  // Build polygons for 5-95 band and 25-75 band.
  const band95 = buildBand(fan, sx, sy, r => r.p05, r => r.p95);
  const band75 = buildBand(fan, sx, sy, r => r.p25, r => r.p75);

  const medianPath = fan
    .map((r, i) => `${i === 0 ? 'M' : 'L'}${sx(r.age).toFixed(1)},${sy(r.p50).toFixed(1)}`)
    .join(' ');

  // Find retirement age row.
  const retAge = result.resolved.retirementAge;
  const retX = sx(retAge);

  // Y ticks: 0, max/2, max.
  const yTicks = [0, yMax / 2, yMax];
  // X ticks: every ~10 years.
  const xTicks: number[] = [];
  for (let a = Math.ceil(ageMin / 10) * 10; a <= ageMax; a += 10) xTicks.push(a);

  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-2">
        Pot value through time (10,000 simulated paths)
      </p>
      <p className="text-sm text-[color:var(--color-ink-light)] mb-4">
        Shaded bands show the 5–95 and 25–75 percentile ranges across all simulated paths. The
        dark line is the median. All values are in <strong>today's £</strong> (real,
        inflation-adjusted).
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Fan chart of simulated pot value from age ${ageMin} to ${ageMax}`}
      >
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
          <g key={`y${i}`}>
            <line x1={padL - 4} y1={sy(y)} x2={padL} y2={sy(y)} stroke="var(--color-rule)" />
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
        {xTicks.map((a, i) => (
          <g key={`x${i}`}>
            <line
              x1={sx(a)}
              y1={padT + innerH}
              x2={sx(a)}
              y2={padT + innerH + 4}
              stroke="var(--color-rule)"
            />
            <text
              x={sx(a)}
              y={padT + innerH + 18}
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              fill="var(--color-ink-light)"
            >
              {a}
            </text>
          </g>
        ))}
        <text
          x={padL + innerW / 2}
          y={padT + innerH + 36}
          fontSize="11"
          textAnchor="middle"
          fill="var(--color-ink-light)"
        >
          age
        </text>

        {/* 5-95 band */}
        <path d={band95} fill="var(--color-accent)" fillOpacity="0.15" stroke="none" />
        {/* 25-75 band */}
        <path d={band75} fill="var(--color-accent)" fillOpacity="0.30" stroke="none" />

        {/* retirement marker */}
        <line
          x1={retX}
          y1={padT}
          x2={retX}
          y2={padT + innerH}
          stroke="var(--color-success)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text
          x={retX + 6}
          y={padT + 12}
          fontSize="11"
          fontFamily="var(--font-mono)"
          fill="var(--color-success)"
        >
          retirement @ {retAge}
        </text>

        {/* median line */}
        <path
          d={medianPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
        />
      </svg>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-[color:var(--color-ink-light)]">
        <Legend color="var(--color-accent)" opacity={0.15} label="5–95th percentile" />
        <Legend color="var(--color-accent)" opacity={0.30} label="25–75th percentile" />
        <Legend color="var(--color-accent)" opacity={1.0} label="median (50th)" line />
      </div>
    </div>
  );
}

function buildBand(
  fan: SimulateRetirementResult['fan'],
  sx: (a: number) => number,
  sy: (y: number) => number,
  low: (r: SimulateRetirementResult['fan'][number]) => number,
  high: (r: SimulateRetirementResult['fan'][number]) => number,
): string {
  const up = fan.map(r => `${sx(r.age).toFixed(1)},${sy(high(r)).toFixed(1)}`);
  const down = [...fan]
    .reverse()
    .map(r => `${sx(r.age).toFixed(1)},${sy(low(r)).toFixed(1)}`);
  return `M${up[0]}` + up.slice(1).map(p => `L${p}`).join('') + `L${down[0]}` + down.slice(1).map(p => `L${p}`).join('') + 'Z';
}

function Legend({
  color,
  opacity,
  label,
  line,
}: {
  color: string;
  opacity: number;
  label: string;
  line?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        style={{
          backgroundColor: line ? 'transparent' : color,
          opacity,
          border: line ? `2px solid ${color}` : 'none',
        }}
        className="inline-block w-4 h-3 rounded-sm"
      />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Percentile table                                                    */
/* ------------------------------------------------------------------ */

function PercentileTable({ result }: { result: SimulateRetirementResult }) {
  const showAges = [
    result.resolved.currentAge,
    result.resolved.retirementAge,
    result.resolved.retirementAge + 5,
    result.resolved.retirementAge + 10,
    result.resolved.retirementAge + 20,
    result.resolved.terminalAge,
  ].filter((a, i, arr) => arr.indexOf(a) === i);
  const rows = showAges
    .map(a => result.fan.find(r => r.age === a))
    .filter(<T,>(x: T | undefined): x is T => x !== undefined);
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6 overflow-x-auto">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
        Pot value percentiles at key ages
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-rule)]">
            <th className="text-left py-2 font-medium">Age</th>
            <th className="text-right py-2 font-medium">5th %ile</th>
            <th className="text-right py-2 font-medium">25th</th>
            <th className="text-right py-2 font-medium">Median</th>
            <th className="text-right py-2 font-medium">75th</th>
            <th className="text-right py-2 font-medium">95th %ile</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.age} className="border-b border-[color:var(--color-rule)]/40">
              <td className="py-2 font-mono">{r.age}</td>
              <td className="py-2 text-right font-mono">{money(r.p05)}</td>
              <td className="py-2 text-right font-mono">{money(r.p25)}</td>
              <td className="py-2 text-right font-mono font-bold">{money(r.p50)}</td>
              <td className="py-2 text-right font-mono">{money(r.p75)}</td>
              <td className="py-2 text-right font-mono">{money(r.p95)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dataset card — be transparent about the inputs                      */
/* ------------------------------------------------------------------ */

function DatasetCard({
  equityWeight,
  feeAnnual,
}: {
  equityWeight: number;
  feeAnnual: number;
}) {
  const summary = useMemo(
    () => historicalSummary(equityWeight, feeAnnual),
    [equityWeight, feeAnnual],
  );
  return (
    <div className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <p className="font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)] mb-4">
        Dataset properties (for the chosen {pct(equityWeight, 0)} equity weight, after {pct(feeAnnual, 2)} fee)
      </p>
      <div className="grid sm:grid-cols-4 gap-4 text-sm">
        <Stat label="Years covered" value={`${summary.yearsCovered}`} />
        <Stat label="Geometric mean (real)" value={pct(summary.geometricMean)} />
        <Stat label="Volatility (SD)" value={pct(summary.stdev)} />
        <Stat
          label="Worst year"
          value={pct(summary.minReturn)}
        />
      </div>
      <p className="text-xs text-[color:var(--color-ink-light)] mt-4 leading-relaxed">
        Source: Bank of England <em>Millennium of Macroeconomic Data</em>, Jordà-Schularick-Taylor
        Macrohistory Database, and Barclays Equity Gilt Study. Cross-checked against the
        Dimson-Marsh-Staunton (DMS) summary statistics published in the UBS Global Investment
        Returns Yearbook 2024. See <a className="underline" href="#methodology">methodology</a>.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Warnings & Caveats                                                  */
/* ------------------------------------------------------------------ */

function buildWarnings(form: FormState): string[] {
  const w: string[] = [];
  if (form.annualContribution > 60_000) {
    w.push(
      `Contribution of ${money(
        form.annualContribution,
      )} exceeds the standard Annual Allowance of £60,000 (HMRC PTM053100). Carry-forward of unused allowance from up to three prior tax years may permit this; tapered AA may apply if your adjusted income exceeds £260,000.`,
    );
  }
  if (form.retirementAge < 55) {
    w.push(
      `Retirement age below 55 — you cannot legally access a personal pension before the Normal Minimum Pension Age (55 currently, rising to 57 in April 2028, Finance Act 2022 s.10). Other resources (ISA, GIA) needed to bridge.`,
    );
  }
  if (form.retirementAge === 55 || form.retirementAge === 56) {
    w.push(
      `Note: the Normal Minimum Pension Age rises from 55 to 57 in April 2028. If you turn 57 after that date, you cannot access pension before then.`,
    );
  }
  if (form.equityWeight > 0.85) {
    w.push(
      `Very high equity weight (${pct(form.equityWeight, 0)}). Long-run expected returns are high, but the simulator will show wider sequence-of-returns risk — early-retirement crashes have an outsized effect.`,
    );
  }
  if (form.feeAnnual >= 0.01) {
    w.push(
      `Annual fee of ${pct(form.feeAnnual, 2)} is high by global tracker standards (0.07–0.25%). Over 30 years a 1% fee typically eats 20–25% of the final pot.`,
    );
  }
  if (
    form.targetRetirementIncome > 0 &&
    form.targetRetirementIncome / Math.max(1, form.currentPot + form.annualContribution * (form.retirementAge - form.currentAge)) > 0.05
  ) {
    // Naive proxy for "is the target obviously unaffordable" — surfaces a hint, not a hard fail.
    w.push(
      `Target income is high relative to projected pot at retirement. Watch the probability of ruin figure carefully and consider increasing contributions or lowering the target.`,
    );
  }
  return w;
}

function Caveats() {
  return (
    <details className="bg-white border border-[color:var(--color-rule)] rounded-lg p-6">
      <summary className="cursor-pointer font-mono text-sm uppercase tracking-widest text-[color:var(--color-ink-light)]">
        Assumptions &amp; limitations
      </summary>
      <ul className="mt-4 text-sm space-y-2 pl-5 list-disc text-[color:var(--color-ink-light)]">
        <li>
          All amounts in this calculator are <strong>real (today's £)</strong>. Contributions
          are assumed to keep pace with inflation in real terms.
        </li>
        <li>
          Returns are drawn from a <strong>block-bootstrap</strong> of UK historical real
          returns 1900–2024. The future may not resemble the past.
        </li>
        <li>
          Tax on pension drawdown is <em>not</em> modelled — the "target income" is gross.
          Most drawdown is taxed at marginal rates with a 25% tax-free lump sum (HMRC PTM063300).
        </li>
        <li>
          No fees beyond the OCF slider are modelled — platform fees, adviser fees,
          fund-of-fund overlays are typically extra.
        </li>
        <li>
          State Pension is modelled as a flat real annuity from age 67. Triple-lock dynamics
          are not modelled — the State Pension Age may also rise further.
        </li>
        <li>
          The Annual Allowance taper (£1 reduction per £2 of adjusted income above £260,000,
          floor £10,000) is not enforced in the input slider but is flagged in warnings.
        </li>
        <li>
          This is not personal financial advice. The FCA requires advised pension projections
          to use specific assumptions (COBS 13 Annex 2); ours are richer but for guidance only.
        </li>
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

function NumberInput({
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
    <input
      id={id}
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
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full border border-[color:var(--color-rule)] rounded pl-7 pr-3 py-2 font-mono"
      />
    </div>
  );
}
