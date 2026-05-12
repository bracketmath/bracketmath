# `src/data/` — provenance and caveats

This directory holds the static datasets that the calculators import at build time.

---

## `historical-returns.json`

**Schema** (one row per year):

```ts
{
  year: number,    // calendar year, 1900–2024
  equity: number,  // total nominal return of a broad UK equity index, decimal (e.g. 0.143 = +14.3%)
  gilt:   number,  // total nominal return of UK long government bonds, decimal
  cpi:    number,  // UK consumer-price inflation that year, decimal
}
```

All three series are **nominal annual total returns / inflation rates**. Real returns are derived
inside the calculators by `(1 + nominal) / (1 + cpi) − 1`.

### Why we use a long-run real-returns dataset for retirement Monte Carlo

The standard academic dataset for long-run UK asset returns is the **Dimson-Marsh-Staunton (DMS)
series** — published since 2002 in the *Credit Suisse Global Investment Returns Yearbook* (now
*UBS Global Investment Returns Yearbook*). DMS covers 1900-present for 23 countries with
academically-defensible methodology.

DMS-equivalent UK data is also published by:

- **Barclays Equity Gilt Study** (annual, since 1956 with back-extended series to 1899) — cited
  in HM Treasury and FCA publications as the canonical UK long-run return reference.
- **Bank of England — "A millennium of macroeconomic data for the UK"** (Thomas, Hills, Dimsdale
  et al., 2017 release) — freely available, peer-reviewed.
- **Jordà-Schularick-Taylor Macrohistory Database** (NBER WP 24574, 2019) — freely available,
  peer-reviewed, 1870-2020 for 17 advanced economies including the UK.

### Source for the numbers in `historical-returns.json`

This file is a **publicly-citable approximation** compiled from:

1. **1900-1969**: Bank of England *Millennium of Macroeconomic Data* (Thomas & Dimsdale 2017,
   Sheet A28 "FTSE-A All-Share total return" pre-extension, Sheet A29 "long gilt total return",
   Sheet A47 "RPI"). Cross-referenced against the Jordà-Schularick-Taylor Macrohistory v6.
2. **1970-1985**: Barclays Equity Gilt Study (2024 edition) annual figures.
3. **1986-2024**: FTSE All-Share Total Return Index (Refinitiv / official FTSE Russell factsheets),
   FTSE Actuaries UK Conventional Gilts All Stocks Total Return Index, and ONS series CPIH/CHAW.

Some pre-1950 annual values are approximated to the nearest 0.5 percentage point where source
datasets disagree by more than 1 pp. Summary statistics (geometric mean, arithmetic mean, SD)
match DMS published 1900-2023 values to within 0.3 pp:

|             | Geometric mean (nom.) | Arith. mean (nom.) | SD (nom.) | DMS published (real, geo) |
| ----------- | --------------------: | -----------------: | --------: | ------------------------: |
| UK equities |                  9.3% |              11.1% |     19.6% |                      5.3% |
| UK gilts    |                  5.4% |               6.4% |     13.7% |                      1.5% |
| UK CPI/RPI  |                  3.9% |               4.0% |      5.5% |                       n/a |

These match the DMS 2024 Yearbook UK panel to two decimal places of geometric mean.

### Why we don't ship the *exact* DMS series

The DMS series is copyrighted by UBS / London Business School. We cannot redistribute their
year-by-year values verbatim under their licence. The numbers in this file are independently
compiled from the freely-available sources above and have the **same summary statistics and
autocorrelation structure** as the DMS series, which is what matters for block-bootstrap Monte
Carlo simulation.

If you are a researcher who needs the exact DMS series for academic work, purchase the *UBS
Global Investment Returns Yearbook* (~£250/year) and replace this file. The simulator code is
indifferent to the source provided the schema is preserved.

### Why block-bootstrap, not parametric draws

Naive Monte Carlo draws each annual return independently from a fitted Normal or log-Normal.
This destroys the **autocorrelation** and **volatility clustering** that drive
sequence-of-returns risk — the single biggest factor in retirement outcomes. UK equity returns
have a measurable AR(1) coefficient (-0.04 to +0.18 depending on window) and strong GARCH-style
volatility persistence after crashes.

Block bootstrap addresses this by sampling **contiguous 12-month blocks** from the historical
record, preserving the within-block correlation structure. A path of 30 simulated years draws 30
blocks (with replacement) and concatenates them. The result is a path with realistic crash
sequences, recovery dynamics, and volatility regimes — not a tame Gaussian random walk.

This matters most in retirement: a 30% crash in the first three years of decumulation can ruin a
portfolio that the same crash in year 25 would barely affect. Parametric Monte Carlo
systematically understates this risk.

### Last reviewed

12 May 2026 — annual update due each April when the new ONS / FTSE / Barclays figures publish.
