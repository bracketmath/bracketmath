/**
 * Sole Trader Tax calculator — React island.
 *
 * UX grammar mirrors the other three calculators on the site: a single
 * input panel on the left, a results panel on the right, all calculation
 * client-side (no telemetry, no network calls).
 *
 * The two questions this calculator answers:
 *   1. What does a sole trader actually take home at 2026/27 rates after
 *      income tax, Class 4 NI (+ optional Class 2 voluntary), with the
 *      trading allowance vs actual expenses decision automated?
 *   2. Should this person incorporate? At the entered turnover, what would
 *      a Ltd Co director net — and what's the break-even profit level at
 *      which the routes swap?
 *
 * Everything that follows reads from `computeSoleTrader()` and
 * `compareIncorporation()` in `src/lib/optim/sole-trader.ts`.
 */

import { useMemo, useState } from 'react';
import { computeSoleTrader, compareIncorporation } from '../../lib/optim/sole-trader';

const money = (n: number) => '£' + Math.round(n).toLocaleString('en-GB');
const pct = (n: number) =>
  (n * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 }) + '%';

export default function SoleTraderTax() {
  const [turnover, setTurnover] = useState(45_000);
  const [actualExpenses, setActualExpenses] = useState(2_500);
  const [otherIncome, setOtherIncome] = useState(0);
  const [voluntaryClass2, setVoluntaryClass2] = useState(true);
  const [age, setAge] = useState(38);
  const [showIncorporation, setShowIncorporation] = useState(true);

  const result = useMemo(
    () =>
      computeSoleTrader({
        turnover,
        actualExpenses,
        otherIncome,
        voluntaryClass2,
        age,
      }),
    [turnover, actualExpenses, otherIncome, voluntaryClass2, age],
  );

  const incorporation = useMemo(
    () =>
      showIncorporation
        ? compareIncorporation({
            turnover,
            actualExpenses,
            age,
            otherIncome,
            pensionPercent: 0,
          })
        : null,
    [turnover, actualExpenses, age, otherIncome, showIncorporation],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── INPUT PANEL ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-6">
        <h2 className="text-xl font-bold mb-4 text-[color:var(--color-ink)]">Inputs</h2>

        <NumberField
          label="Annual turnover (£)"
          help="Total gross income from the self-employment activity for the 2026/27 tax year."
          value={turnover}
          onChange={setTurnover}
          step={1_000}
        />

        <NumberField
          label="Actual business expenses (£/yr)"
          help="Wholly-and-exclusively business costs. The engine compares this against the £1,000 trading allowance and picks the better of the two."
          value={actualExpenses}
          onChange={setActualExpenses}
          step={100}
        />

        <NumberField
          label="Other personal income (£/yr)"
          help="PAYE salary, rental, pensions etc. Stacks below the self-employment profits in the band schedule."
          value={otherIncome}
          onChange={setOtherIncome}
          step={1_000}
        />

        <NumberField
          label="Age"
          help="Used in the Ltd-Co comparison branch for Annual Allowance / taper considerations."
          value={age}
          onChange={setAge}
          step={1}
          min={16}
          max={80}
        />

        <label className="flex items-start gap-3 mt-4 text-sm">
          <input
            type="checkbox"
            checked={voluntaryClass2}
            onChange={(e) => setVoluntaryClass2(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong className="text-[color:var(--color-ink)]">Pay voluntary Class 2 NI (£179.40/yr)</strong>
            <span className="block text-[color:var(--color-ink-light)] mt-1">
              Buys a State Pension qualifying year. Strongly recommended if
              profits are below the Small Profits Threshold (£6,725 for
              2026/27) and the NI record has gaps.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 mt-3 text-sm">
          <input
            type="checkbox"
            checked={showIncorporation}
            onChange={(e) => setShowIncorporation(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong className="text-[color:var(--color-ink)]">Show Ltd-Co incorporation comparison</strong>
            <span className="block text-[color:var(--color-ink-light)] mt-1">
              Drives the optimiser at the same turnover and expense pot (no
              pension), then bisects for the break-even profit level.
            </span>
          </span>
        </label>
      </div>

      {/* ── RESULTS PANEL ─────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-6">
          <h2 className="text-xl font-bold mb-4 text-[color:var(--color-ink)]">
            Net take-home — sole trader route
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Metric label="Net cash" value={money(result.netCash)} large />
            <Metric label="Effective rate" value={pct(result.effectiveRate)} large />
          </div>
          <table className="w-full text-sm">
            <tbody>
              <Row label="Taxable profits (after expenses / allowance)" value={money(result.taxableProfits)} />
              <Row
                label="Trading allowance applied?"
                value={result.tradingAllowanceUsed ? `Yes — saved ${money(result.tradingAllowanceSaving)}` : 'No (actual expenses larger)'}
              />
              <Row label="Income tax (sole-trader share)" value={money(result.incomeTax.tax)} />
              <Row label="Class 4 NI" value={money(result.ni.class4)} />
              <Row label="Class 2 NI (voluntary)" value={money(result.ni.class2)} />
              <Row label="Marginal rate on next £1 of profit" value={pct(result.marginalRate)} />
            </tbody>
          </table>
          {result.notes.length > 0 && (
            <ul className="mt-4 text-sm text-[color:var(--color-ink-light)] list-disc list-inside space-y-1">
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>

        {incorporation && (
          <div className="rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-6">
            <h2 className="text-xl font-bold mb-4 text-[color:var(--color-ink)]">
              Should I incorporate?
            </h2>
            <p className="text-sm text-[color:var(--color-ink-light)] mb-4">
              Same turnover and expense pot, run through the Ltd Co joint
              optimiser (no pension contribution, cash optimum). Apples-to-apples
              with the sole-trader figure above.
            </p>
            <table className="w-full text-sm mb-4">
              <tbody>
                <Row label="Sole trader net cash" value={money(incorporation.soleTraderNetCash)} />
                <Row label="Ltd Co net cash (cash optimum)" value={money(incorporation.ltdCoNetCash)} />
                <Row
                  label="Gap"
                  value={
                    incorporation.differenceVsSoleTrader > 0
                      ? `+${money(incorporation.differenceVsSoleTrader)} for Ltd Co`
                      : `${money(-incorporation.differenceVsSoleTrader)} for staying sole trader`
                  }
                />
                <Row
                  label="Break-even turnover (by bisection)"
                  value={
                    incorporation.breakevenProfits
                      ? `${money(incorporation.breakevenProfits)}/yr`
                      : 'No sign-change in [£15k, £400k] range'
                  }
                />
              </tbody>
            </table>
            <p className="text-xs text-[color:var(--color-ink-light)]">
              Caveat: this is a pure-tax comparison. A Ltd Co adds ~£800–£1,500/yr
              of accountancy / filing overhead, plus the loss of the £1,000
              trading allowance and public Companies House filings. Net the gap
              against those non-tax frictions before incorporating.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Small presentation primitives — kept inline so the calculator stays a       */
/* single file matching the other three in the calculators/ folder.            */
/* ────────────────────────────────────────────────────────────────────────── */

function NumberField({
  label,
  help,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  help: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-semibold text-[color:var(--color-ink)]">{label}</span>
      <input
        type="number"
        className="mt-1 block w-full rounded border border-[color:var(--color-rule)] bg-white px-3 py-2 font-mono text-base text-[color:var(--color-ink)]"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
      <span className="block mt-1 text-xs text-[color:var(--color-ink-light)]">{help}</span>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[color:var(--color-rule)] last:border-b-0">
      <td className="py-2 pr-4 text-[color:var(--color-ink-light)]">{label}</td>
      <td className="py-2 text-right font-mono text-[color:var(--color-ink)]">{value}</td>
    </tr>
  );
}

function Metric({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--color-ink-light)] mb-1">
        {label}
      </p>
      <p
        className={
          large
            ? 'text-2xl font-bold text-[color:var(--color-ink)]'
            : 'text-lg font-semibold text-[color:var(--color-ink)]'
        }
      >
        {value}
      </p>
    </div>
  );
}
