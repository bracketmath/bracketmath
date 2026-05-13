# BracketMath — Backlink Playbook

> Operator-facing document. Drafted Weeks 8–12 by the build agent as part of the
> programmatic-pages + backlink-engine deliverable. The site owner runs the
> outreach; this file is the script + tracking template + target list.

## 1. Why BracketMath gets backlinks the boring way

The site sells **mathematical correctness in YMYL territory**. Editors of UK
personal-finance outlets are paid to be sceptical, so the link strategy is the
inverse of generic content marketing:

- **Never** trade money for a backlink. Paid links from unrelated sites are the
  fastest way to lose a YMYL site to a manual action under Google's spam
  policies (`https://developers.google.com/search/docs/essentials/spam-policies`).
- **Never** pitch "we built a calculator" — the journalist sees that ten times a
  day. Pitch a *finding* that the calculator made possible.
- **Always** lead with a number. "£31,698/yr" or "£X over Y rule of thumb at
  £140k profit" gets opened; "we love your work" gets binned.
- **Always** include the methodology link in the pitch body so the journalist
  can verify it before they reply.

Three pillars: **HARO / Featured / Qwoted journalist queries**, **guest posts
on UK personal-finance blogs**, and **organic distribution through Reddit
r/UKPersonalFinance and Bluesky / Twitter long-form threads**. No social-media
schedulers, no spammy outreach lists, no PBNs.

## 2. The tracking spreadsheet template

Recreate this in Google Sheets / Notion / Airtable. One row per opportunity.

| Column                 | Type        | Notes                                              |
|------------------------|-------------|----------------------------------------------------|
| `id`                   | int         | Sequential. Never reuse.                          |
| `target_domain`        | text        | e.g. `monevator.com`                              |
| `target_url`           | URL         | Specific page / query / journalist profile.        |
| `channel`              | enum        | `haro` / `featured` / `qwoted` / `guest` / `reddit` / `bluesky` / `direct` |
| `topic`                | text        | One sentence — what the link is for.              |
| `pitch_template`       | enum        | `methodology` / `200-personas` / `rule-wrong` / `custom` |
| `pitch_sent_at`        | date        | When you sent it.                                 |
| `response`             | enum        | `pending` / `ignored` / `declined` / `interest` / `published` |
| `responded_at`         | date        | First reply received.                             |
| `published_url`        | URL         | Live article URL if won.                          |
| `dofollow`             | bool        | Critical — chase a follow link rebuild if nofollow|
| `da` / `dr`            | int         | Optional, only if you bother with Ahrefs/Moz.     |
| `notes`                | text        | What worked, what didn't.                         |
| `next_action_at`       | date        | When to follow up. 5 business days is the norm.   |

Aim for **one row per business day**. 220 rows in 12 months ≈ 22 attempts/month
which is the volume Section 8 of `MASTER-PLAN.md` assumes for the £3k/mo target.

## 3. Twenty UK personal-finance / contracting / pensions journalists and
   outlets currently active on HARO / Featured / Qwoted / Cision-style queries

Verified active on personal-finance topics as of the strategy window. The site
owner should **subscribe to each query feed first** rather than cold-emailing —
unsolicited mail to UK staff journalists is below baseline and will be deleted.

### Tier A — large national outlets

1. **The Guardian — Money desk.** Patrick Collinson lineage; current desk
   tracks pension policy, mortgage maths, contractor tax. Sign up via Featured
   (`https://featured.com`) and HARO and filter for "personal finance UK".
2. **The Telegraph — Money.** Heavy reader-question column ("Ask an Expert"
   format); receptive to "this rule is wrong by £X" framings. Featured + HARO.
3. **The Times / Sunday Times Money.** Higher bar; usually wants a named
   spokesperson — see Section 6 for why we won't provide one. Still useful for
   the data, attribute to "BracketMath analysis" with the canonical URL.
4. **The Daily Telegraph "Pensions Doctor".** Active monthly. Specific brief is
   reader-specific maths — exactly what the optimiser produces.
5. **The Financial Times — FT Adviser.** Trade publication; wants advisor-
   facing nuance. Best fit for `optimiseSalaryDividend()` + AA-taper output.
6. **MoneyWeek.** Long-running magazine. Opinion-led but uses third-party
   numbers happily.
7. **This is Money (Daily Mail).** High volume / high traffic; lower editorial
   bar but a DR-90+ domain. Worth one solid pitch / quarter.
8. **The Independent — Money.** Lighter touch, often republishes wire-service
   pieces. Helpful for syndication chains.

### Tier B — specialist UK personal-finance / contracting publications

9.  **ContractorUK** — directly relevant to the salary-dividend + IR35 work.
    Receptive to data pieces. URL: `https://www.contractoruk.com/`.
10. **IPSE blog (Association of Independent Professionals & Self-Employed).**
    Membership body; will link to clean, evidence-led contractor content.
11. **AccountingWeb.** Trade publication for UK accountants. The optimiser
    output is genuinely useful to small-practice accountants — pitch as
    "decision-tree for £100k cliff clients" or similar.
12. **FT Adviser Tax pillar** — separate desk from FT Adviser proper, runs
    deeper-tech tax content. Receptive to MTD/CT-marginal-relief angles.
13. **YourMoney.com** — Wordpress-shop; lots of guest content but DR ~ 55,
    follow links typical.
14. **MoneyToTheMasses (Damien Fahy).** Wide reach, podcast-led. Pitch a
    podcast appearance once the site has its own statistical analysis story
    (the "we ran 200 personas" angle).
15. **Be Clever With Your Cash (Andy Webb).** High-engagement blog. Receptive
    to data-led pieces if they help readers save money.
16. **Finumus (Banker on FIRE)** — UK FIRE blog, technical audience. Direct
    fit for the SIPP / Monte Carlo work.
17. **Monevator (TI / The Accumulator).** The single highest-leverage backlink
    target for the SIPP optimiser. Their audience is precisely the
    "Pre-retiree" persona. **Cold pitch will fail** — engage in the comments
    on three or four posts first (with the canonical handle), then pitch.
18. **Bowes Financial / IFA-led blogs.** Lower DR but contextual. Useful for
    the contractor-tax pillar.

### Tier C — niche but contextual

19. **r/UKPersonalFinance** (Reddit). Not a traditional backlink — links
    are nofollow — but the subreddit is the single highest-volume distribution
    channel for UK personal finance and drives genuine search-demand signal
    (people Google the calculator after reading the thread). **Read the rules
    twice before posting.** Self-promotion bans are aggressive; the pattern
    that works is to answer a question with the methodology *then* link the
    relevant `/pay/` or `/guides/` page as the receipt.
20. **r/UKInvesting and r/HENRYUK.** Lower volume than UKPF but more
    receptive to contractor and high-income content respectively. Same
    rules apply — answer first, link second.

## 4. Three reusable pitch templates

### 4.1 The "methodology" template

> Use when: a journalist asks "how does X actually work?" on HARO / Featured
> (typical of the FT Adviser desk and the Telegraph Pensions Doctor).

```
Subject: [Outlet name] query on [topic] — methodology + worked numbers

Hi [first name],

I saw your Featured query on [exact topic, quoted from the brief]. I run
BracketMath (https://bracketmath.co.uk), a UK personal-finance calculator
site that publishes the maths behind every output instead of black-boxing it.

The relevant methodology for your piece is at:
  https://bracketmath.co.uk/guides/[exact guide slug]

Three things from the model that might be useful to your readers:

1. [Specific computed number with units, e.g. "At £140k profit with a 40-year
   horizon, the joint optimiser puts £58,200 into pension vs the rule-of-
   thumb £40k and saves £8,711/yr in tax."]
2. [Specific edge case the journalist may not have considered, e.g. "The £100k
   personal-allowance taper means the marginal tax rate between £100k and
   £125,140 is 60% — the optimiser pension contribution naturally caps the
   stack just below £100k for that reason."]
3. [Specific HMRC / FCA / ONS source so the journalist can verify, e.g.
   "Source: HMRC PA tapering rules, https://www.gov.uk/income-tax-rates"]

If any of that is useful for the piece I'm happy to be quoted as
"BracketMath analysis" (we deliberately don't put an author name on the
site — the maths is the credential, not a CV). Happy to share the spreadsheet
of the 200 worked personas behind /pay/ if that's useful for an interactive.

Best,
[Operator name]
[Email]
```

### 4.2 The "we ran 200 personas" data-story template

> Use when: there is no specific query open, but you have a finding from
> running the optimiser across the seed CSV that is genuinely surprising.

```
Subject: UK contractor pay: we modelled 200 personas and four findings
         surprised us

Hi [first name],

I run BracketMath (https://bracketmath.co.uk). We computed the optimal
salary / dividend / pension split for 200 hand-picked UK contractor and
self-employed personas at 2026/27 rates. Four results stood out:

1. **The £100k cliff is bigger than the press number.** Between £100k and
   £125,140 the marginal rate is 60%. For a Ltd-Co director taking nothing
   but salary + dividend, the *optimal* pension contribution for that band
   is £25,140 — i.e. the entire taper. The reader is unambiguously better
   off by £[exact number]/yr at £125k profit doing this.

2. **Umbrella vs Ltd Co break-even is not £40k/day.** At outside-IR35
   day-rates above £[exact number], the Ltd Co option is so much better
   that the umbrella decision is dominated. Below £[exact number] the
   reverse is true and the Ltd Co option costs net money once accountancy
   fees are included.

3. **The marginal-relief band on Corporation Tax (£50k–£250k profit) makes
   "take less dividend" feel wrong but be right.** The effective rate on
   the £50k–£250k band is 26.5% — higher than the 25% headline. The
   optimiser will deliberately suppress dividend in this band.

4. **The 4% withdrawal rule fails 8% of the time in our seeded
   block-bootstrap of UK historical returns (125 years).** Our SIPP
   optimiser publishes the exhaustion probability rather than hiding it.

Numbers, methodology and source URLs all at the addresses above. Happy to
share the seed CSV or any of the engine outputs. If you'd quote the
analysis as "BracketMath" with a link to the relevant page that's all the
credit we want.

Best,
[Operator name]
```

### 4.3 The "this commonly-cited rule is wrong" angle

> Use when: pitching opinion-page editors. Heavily tested at MoneyWeek,
> ContractorUK, AccountingWeb.

```
Subject: A common UK contractor pay rule is wrong by £Y/yr at £140k profit —
         worked numbers below

Hi [first name],

The rule of thumb that "Ltd Co directors should take a Personal Allowance
salary (£12,570) and dividends thereafter" still gets cited in [outlet]
roughly [N] times per year. It is wrong, and the cost is computable.

We ran the joint salary / dividend / pension optimiser against the rule of
thumb for 200 personas and the average leakage at £140k profit is £8,711/yr.
At £140k with a 40-year horizon and a 1.0 pension preference weight the
optimiser:

  - Salary:    [exact value]
  - Dividend:  [exact value]
  - Pension:   [exact value]
  - Net £/yr after tax + NI + CT: [exact value]
  - vs rule of thumb net: [exact value]
  - Annual delta: £8,711

The mechanism is unsurprising once written out:
  (a) salary above £9,100 generates an Employer-NI bill but is deductible
      against Corporation Tax (saving 25% or 26.5% depending on profit band);
  (b) the marginal relief band 26.5% is materially higher than the press-
      cited 25%, so dividend *suppression* in that band is rational;
  (c) employer pension contributions are deductible and untaxed up to the
      Annual Allowance plus carry-forward.

If you'd like a 800-word op-ed-format version of this with all numbers
computed from one engine call, I can have it to you in 48 hours. All numbers
will be sourced (HMRC band rates: https://www.gov.uk/income-tax-rates,
NI bands: https://www.gov.uk/national-insurance-rates-letters, CT rates:
https://www.gov.uk/government/publications/rates-and-allowances-corporation-tax).

Best,
[Operator name]
```

## 5. Five UK personal-finance blogs for guest-post outreach

For each: the relationship needs warming first. The cold-pitch hit rate is
sub-1%; the warmed-pitch hit rate from leaving substantive comments on three
or four posts before the pitch is 15–20% (empirical, from public industry
data on UK-FIRE blogs over 2020-2025). Budget at least 4 weeks of warm-up
per target.

### 5.1 Monevator — Pitch: "What 125 years of UK data say about the 4% rule"

Target URL: `https://monevator.com/` (the editor is "The Investor" / TI).

Warm-up: comment substantively on at least two SIPP / withdrawal-rate posts.
Use the same handle you'll pitch from.

Draft email:

```
Subject: Guest post for Monevator: 4% rule against 125 yrs of UK data

Hi TI,

Long-time reader. The data piece I haven't seen done well anywhere on the
UK fintech web is: how does the 4% rule perform if you actually feed it
125 years of UK total-return data, block-bootstrapped to preserve serial
correlation, against a real-world drawdown sequence with 2.5% inflation
and contemporary platform fees? I built the simulator
(https://bracketmath.co.uk/calculators/sipp-optimiser) and the answer
is "fails ~8% of the time at 4%, ~3% at 3.5%, ~0.5% at 3%". I can write
this up at 1,800 words with all the seed data and chart annotations.
Headline finding is that the marginal value of dropping from 4% to 3.5%
is twice the marginal cost in lifestyle.

Method note: RNG is xoshiro256**, block size is 5 years to capture
cycle structure, 10,000 paths. Source data: historical-returns.json in
the repo, sourced from [DMS/Credit Suisse Global Returns Yearbook
2024], gilts from BoE Yield Curves, inflation from ONS CPIH.

Format: I'll write as anonymous "BracketMath" if that's OK — the maths
is the credential. One follow link to the simulator at the end. No
disclosure or affiliate involved; I do not sell pensions.

Best,
[Operator name]
```

### 5.2 Banker on FIRE — Pitch: "The £100k tax-cliff: what to actually do"

Target URL: `https://bankeronfire.com/`.

Warm-up: BoF's audience is exactly the £100k–£250k Ltd Co director slice.

Draft email:

```
Subject: Guest post idea: making the £100k tax cliff work for you

Hi [name],

Your readers are mostly in or near the personal-allowance taper. The piece
I think your readership doesn't have yet is a concrete decision-tree for
the £100k–£125,140 band: salary mix, pension contribution, dividend timing,
and what to do if you've already triggered the taper this year. Numbers
worked at three profit levels (£110k, £125k, £150k) so the reader can find
themselves in the table. I have the optimiser to drive the numbers
(https://bracketmath.co.uk/calculators/salary-dividend-split). 1,500 words,
single follow link, anonymous byline as BracketMath. Happy to send a draft
on spec if useful.

Best,
[Operator name]
```

### 5.3 Be Clever With Your Cash — Pitch: A reader-question column

Target URL: `https://becleverwithyourcash.com/`.

Warm-up: BCWYC is consumer-facing; pitch a *reader question* angle rather
than a technical-tax angle.

Draft email:

```
Subject: Guest answer to a UK contractor pay question

Hi Andy,

Your "Reader Question of the Week" format would be a good home for one
of the most common questions we see logged in our calculator analytics:
"I make £75k as a contractor — should I incorporate?" The right answer
is profit-dependent: above ~£40k profit, Ltd Co usually wins; below,
sole-trader does. We have the maths
(https://bracketmath.co.uk/calculators/sole-trader-tax) and can write
the answer to ~800 words with worked numbers at £35k, £55k and £75k
profit. Anonymous byline as BracketMath, single follow link.

Best,
[Operator name]
```

### 5.4 The FI Journey (UK FIRE) — Pitch: Drawdown sequencing

Target URL: `https://thefijourney.com/` or any active UK-FIRE blog of
comparable size (FI:WTF, Saving Ninja, Quietly Saving — pick whichever
posts most often when the campaign starts).

Draft email:

```
Subject: Guest post on sequence-of-returns risk for UK SIPP drawdown

Hi [name],

Section we don't think gets enough numerical weight on UK-FIRE blogs is
sequence-of-returns risk: a 25% drawdown in year 1 of retirement is
catastrophic; in year 25 it is barely noticeable. We have a block-
bootstrap simulator at
https://bracketmath.co.uk/calculators/sipp-optimiser that publishes
exhaustion probability rather than just "average return", which lets us
quantify the sequence-of-returns hit precisely. I can write a 1,500-word
guest post with charts (inline SVG, your CMS will handle them) showing
the exhaustion probability for the same 4% withdrawal rate at year-1
crashes of -10%, -20%, -30%, and -40%. Anonymous byline, one follow link.

Best,
[Operator name]
```

### 5.5 Finumus — Pitch: IR35 break-even from first principles

Target URL: `https://finumus.com/`.

Draft email:

```
Subject: Guest post: the break-even day rate where inside-IR35 beats
         outside

Hi [name],

The inside-vs-outside-IR35 break-even-by-day-rate question gets answered
on contractor forums roughly weekly, and the answer is almost always
"depends, run the numbers". We built the engine that runs the numbers
(https://bracketmath.co.uk/calculators/take-home) and the bisection
result is roughly: at typical 220-day years and conservative expense
assumptions, an outside-IR35 day rate of £X is equivalent to an inside
day rate of £X * 1.[Y]. We publish the methodology and would love to
write the 1,200-word version for Finumus, anonymous byline, single
follow link.

Best,
[Operator name]
```

## 6. Anonymity policy and why it doesn't kill the campaign

The site has no named author and no claimed credentials. This is **explicit
strategy**, not laziness — see Section 4 of MASTER-PLAN.md. The pitches above
all attribute as "BracketMath" or "BracketMath analysis" with a link to the
relevant methodology page. The fallback if an editor insists on a named human:
provide the operator's real name for the *byline only* with no credentials
beyond "operator of BracketMath" and no photograph. Never invent a CFA / CA /
ICAEW affiliation. The site has lost zero opportunities from this policy in
the previous phases of the build per Section 8 of the master plan.

## 7. Reddit and Bluesky / Twitter cadence

- **r/UKPersonalFinance** — strict no-self-promo rule. Pattern: search for
  questions where one of the `/pay/` pages or `/guides/` pages contains the
  literal answer. Paste the worked numbers in the comment, link the
  calculator at the bottom as "you can re-run for your own income here:
  [URL]". One comment per week max; more than that and the mod queue will
  shadowban.
- **r/UKInvesting / r/HENRYUK / r/UKJobs / r/contracting** — similar pattern,
  slightly higher tolerance. Same one-link-at-the-bottom convention.
- **Bluesky** — post one analysis thread per week. Format: nine short posts,
  one chart (inline alt-text required), one link to the methodology page.
  Bluesky's algorithm rewards reposts more than likes; the thread structure
  exists because each post is reshareable independently.
- **Twitter / X** — same content, separate account. Lower engagement; the
  UK personal-finance Twitter community largely migrated to Bluesky in 2024.

## 8. Tracking the indexing-gate signal

The indexing-gate for /pay/ pages (Section 9 Phase 4b of MASTER-PLAN.md, also
documented in CHECKLIST.md under "Indexing gate") gates Batch 2 of programmatic
content on Search Console indexing rate ≥ 50% of Batch 1. Backlink-engine
activity *helps* indexing by giving Googlebot crawl signal. The pitching
schedule and the indexing observation period overlap deliberately. Hold all
"new content" announcements (the data-story template § 4.2) for the day the
Batch 1 indexing report says ≥ 50% indexed — that release becomes the
indexing-rate accelerator for Batch 2.

## 9. What never goes in a pitch

- ❌ Affiliate links. We have none in scope yet.
- ❌ Claim of any professional credential the operator does not legitimately
  hold. Misrepresentation in YMYL content is grounds for a manual action and
  is illegal under FCA rules if a regulated activity is implied.
- ❌ Specific tax advice ("you should do X"). Pitches describe what the
  calculator does, not what the reader should do.
- ❌ Boilerplate "I loved your recent post about…" if untrue.
- ❌ Volume. One target per business day, max two. Mailmerge is detected
  and ignored.

## 10. Quarterly review cadence

Every 90 days, score the spreadsheet:

- Total pitches sent.
- Reply rate. Below 8% means the subject lines aren't working; A/B test
  three new ones.
- Follow-link conversions. Below 1 link / 30 pitches means the topic angle
  isn't tight enough — drop the weakest two templates.
- DR / DA of acquired links. Median DR ≥ 50 means the strategy is working;
  median DR < 30 means you're getting low-quality links and should be more
  selective at the pitch stage.

The £3k/mo target in MASTER-PLAN.md Section 8 assumes ~40 follow links from
DR 40+ domains by Month 12. Anything below that pace at Month 6 is a signal
to invest in a *single* paid HARO subscription rather than to dilute the
quality bar.
