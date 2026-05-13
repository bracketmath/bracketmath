# The Universal Arbitrage Engine — Blueprint

## Vision

A fully automated, AI-powered deal-finding system that scans every major second-hand, surplus, auction, and liquidation source in the UK, identifies mispriced assets, calculates exact profit margins, and delivers only the highest-confidence opportunities directly to the operator via Discord.

The operator makes one decision: buy or don't buy. Everything else is automated.

This is not a reselling side hustle. It is a compounding capital machine. Starting capital of £2,000 gets deployed into early opportunities, profits reinvested, capital grows, deal sizes scale. The system is the same whether you're flipping £50 items or £50,000 sports cars. Only the numbers change.

---

## Core Philosophy

**Profit is profit. The system does not care what the asset is.**

Every asset has a cost and a sell price. The gap between them is the opportunity. The system's job is to find every gap, everywhere, and rank them by risk-adjusted return. The operator's job is to deploy capital at the top of that ranked list.

**The five filters before a human sees anything:**
1. Does it exist cheaper somewhere than it sells for elsewhere?
2. Does the AI confidently know what it actually is?
3. Does the market data confirm it sells reliably?
4. Does the risk score pass the threshold?
5. Is the profit margin above the minimum floor?

Fail any gate. Die. Never reach the operator.

---

## Capital Growth Trajectory

| Phase | Capital | Focus | Target Monthly Profit |
|---|---|---|---|
| Month 1–2 | £2,000 | Small items, system learning | £500–£1,000 |
| Month 3–4 | £4,000–£6,000 | Expanding categories | £1,500–£2,500 |
| Month 5–6 | £8,000–£15,000 | Higher value items | £3,000–£5,000 |
| Year 1–2 | £30,000–£80,000 | Watches, classic cars, equipment | £8,000–£20,000 |
| Year 3+ | £100,000+ | High value asset arbitrage | Uncapped |

Profits are never spent until £2,500/month passive income is secured. Everything else reinvests.

---

## Data Sources

### Free / Zero Cost Items
- **Freecycle** — items given away for free. Every penny of sell price is pure margin
- **Freegle** — same model, different network
- **Facebook Marketplace free section**

### Auction and Surplus
- **LPGS** (local government surplus)
- **i-bidder** (UK auction aggregator)
- **BidSpotter UK**
- **Tips and Rails** (industrial and lab)
- **Wilsons Auctions**
- **Lot Stream**
- **University disposal pages** (goldmine — almost nobody monitors these systematically)

### Liquidation
- **B-Stock UK**
- **Bulq UK**
- **Liquidation.com UK**
- **Amazon Warehouse / Amazon Renewed** (discounted returns priced below market)

### eBay Itself
- **Misspelled listings** — items with typos get zero search traffic, sell for fractions of value
- **Job lots** — buy 20 items cheap, split and sell individually at full retail each
- **Ending soon with zero bids** — real-time snipe opportunities
- **Buy It Now underpriced** — instant purchase, known margin

### Gumtree and Facebook Marketplace
- Standard listings priced by people who don't know what they have
- Particularly productive for electronics, tools, scientific equipment

---

## System Architecture — The Five Layer Pipeline

Every listing passes through five gates in sequence. Each gate is cheaper to run than the next. The goal is to kill bad opportunities as early and cheaply as possible so AI processing is reserved only for genuine candidates.

---

### Layer 1 — Broad Ingest and Instant Valuation Kill
**Cost: Near zero. Speed: Milliseconds.**

- Scraper pulls every new listing continuously from all sources
- Each listing title and description is passed to the eBay API immediately
- eBay API returns median sold price for that keyword across last 90 days
- If median sold price is not at least 3x the listing cost: **KILLED INSTANTLY**
- No AI. No human. Pure maths filter.
- Expected kill rate: 85–90% of all listings eliminated here

**For Buy It Now listings:** exact cost is known. Instant kill or pass.
**For auctions:** a maximum bid ceiling is calculated (median sold price minus target margin minus fees). Ceiling stored for later use.

---

### Layer 2 — AI Identification and Condition Assessment
**Cost: Fraction of a penny per item. Only survivors from Layer 1.**

Listing title, description, and available images are sent to Claude API with a tightly engineered prompt. Returns structured JSON:

```
{
  "identified": true/false,
  "confidence": 0–100,
  "item_name": "Tektronix TDS2024C Oscilloscope",
  "manufacturer": "Tektronix",
  "model_number": "TDS2024C",
  "condition_assessment": "Good — described as working, no visible damage mentioned",
  "red_flags": ["no power supply mentioned", "untested"],
  "category": "test_equipment",
  "estimated_completeness": 80
}
```

**Kill conditions:**
- Confidence below 70%: **KILLED**
- Red flags score too high: **KILLED**
- Cannot identify a model number: **KILLED** (cannot do precise valuation)

Expected kill rate of remaining items: 40–60%

---

### Layer 3 — Precise Market Valuation
**Cost: eBay API call. Only survivors from Layer 2.**

Now the system has an exact model number. eBay API queried with precision:

- Median sold price (last 90 days)
- Sell-through rate — percentage of listings that actually sell (critical — a 20% sell-through rate means 80% of listings don't sell)
- Average days to sell
- Current live competition (how many are listed right now)
- Price variance (consistent market vs volatile)
- Seasonal adjustment flag

**Profit calculation:**
```
Gross Profit = Median Sold Price - Listing Cost
eBay Fees = Gross Sold Price × 12.8%
Postage Estimate = based on item size/weight category
Risk Buffer = 10% of gross profit
Net Profit = Gross Profit - eBay Fees - Postage - Risk Buffer
ROI = Net Profit / Capital Deployed × 100
```

**Kill conditions:**
- Sell-through rate below 60%: **KILLED**
- Net profit below £30: **KILLED**
- ROI below 40%: **KILLED** (unless absolute profit is very high)
- High price variance with thin market depth: **FLAGGED as speculative, lower priority**

---

### Layer 4 — Composite Risk Scoring
**Cost: Negligible computation. Only the best survivors.**

Final automated quality check before alerting the operator. Scores each item across five dimensions:

| Dimension | Weighting | What it checks |
|---|---|---|
| Market liquidity | 25% | Sell-through rate, days to sell, competition depth |
| Source reliability | 20% | How long listing has been live, seller credibility |
| Identification confidence | 20% | AI confidence score from Layer 2 |
| Price stability | 20% | Variance in sold prices, seasonal risk |
| Capital efficiency | 15% | ROI, capital required, estimated days to return |

**Composite score 0–100 generated.**
- Below 60: Killed or held in low-priority queue
- 60–79: Surfaced as standard opportunity
- 80–89: Surfaced as high confidence opportunity
- 90+: Immediate Discord alert regardless of time

---

### Layer 5 — Discord Alert Delivery
**Only genuine winners. Operator sees nothing else.**

Discord message format:

```
🟢 HIGH CONFIDENCE — ACT NOW

Item:        Tektronix TDS2024C Oscilloscope
Source:      University of Manchester Disposal
Your Cost:   £45 (auction — max bid ceiling: £80)
eBay Median: £310
Net Profit:  £218
ROI:         484%
Sell-Through: 91%
Avg Sale:    3.2 days
Risk Score:  87/100

⚠️  No power supply mentioned — factor into bid

→  View Listing
→  eBay Sold Listings
→  Current eBay Competition
→  Courier Quote (estimated £12)
```

Operator sees this. Operator decides. That is the entire human role.

---

## The Misspelling Module

A dedicated module that runs parallel to the main pipeline, targeting eBay itself.

- Maintains a database of high-value brands: Dyson, Nikon, Canon, Apple, DeWalt, Bosch, Festool, Leica, Rolex, Omega, etc.
- Generates systematic misspelling variants for each: Dyosn, Dysoon, Nikkon, Canan, Aplle, etc.
- Queries eBay search continuously for these misspellings
- Items with typos attract zero search traffic — they sell for fractions of true value
- System identifies the item, validates value, flags for immediate Buy It Now purchase
- Relist correctly spelled. Profit immediately.

This module alone can generate consistent daily income because the supply of misspelled listings is continuous and the competition is almost zero.

---

## The Job Lot Splitting Module

Identifies eBay job lots and mixed lots where:
- The lot price is below the sum of individual item values
- Individual items are identifiable and have strong standalone sell-through rates

System calculates split value vs lot cost and flags profitable splitting opportunities. This is a consistent arbitrage available at volume on eBay daily.

---

## Technical Stack

| Component | Technology | Purpose |
|---|---|---|
| Scrapers | Python + Playwright/BeautifulSoup | Pull listings from all sources |
| eBay valuation | eBay Finding API + Browse API | Sold prices, live competition |
| AI identification | Claude API (claude-sonnet) | Item identification and condition |
| Database | PostgreSQL | Listings, valuations, sold price history |
| Orchestration | Python scheduler (APScheduler) | Run pipelines continuously |
| Alerts | Discord Webhooks | Opportunity delivery |
| Dashboard | Simple local web UI | Review queue, portfolio tracking |
| Hosting | VPS (£5–10/month) | 24/7 operation |

**API running costs:** Processing 10,000 listings per day through the AI layer costs approximately £2–5/month in API credits. The bulk are killed in Layer 1 before reaching the AI.

---

## Proprietary Price Database

Every sold price the system observes gets stored. Over time this becomes a proprietary dataset that is more valuable than any public source because:
- It is categorised properly by the AI identification layer (not just raw eBay titles)
- It tracks seasonal patterns by category
- It builds confidence intervals around valuations
- It identifies categories with improving or deteriorating margins

At 12 months of operation, this database is a genuine moat. The system's valuations become more accurate than anything commercially available.

---

## Scaling the Asset Classes

The system architecture does not change as capital scales. The categories broaden:

**£0–£5,000 capital:** Electronics, tools, scientific equipment, textbooks, small collectibles

**£5,000–£20,000 capital:** Higher-end test equipment, vintage audio, specialist tools, quality watches (entry level)

**£20,000–£100,000 capital:** Luxury watches, classic motorcycles, specialist vehicles, fine instruments

**£100,000+ capital:** Classic and sports cars, rare collectibles, fine art (where data sources exist), commercial equipment

At every level the process is identical. The system identifies a mispriced asset. The operator validates and acquires. The operator liquidates at fair market value. Capital compounds.

---

## What the Operator Does

1. Check Discord alerts when they arrive
2. Look at the linked listing and sold comparables
3. Decide yes or no
4. If yes: bid, buy, arrange collection or courier
5. List on eBay (10–15 minutes per item)
6. Post when sold

**Estimated daily time commitment at steady state: 1–2 hours.**

Everything else is the machine.

---

## Build Order

**Week 1–2:** eBay misspelling module. Fastest to build, immediate income, no capital required beyond the items purchased.

**Week 3–4:** Freecycle and Gumtree scrapers with basic eBay API valuation. Layer 1 kill filter only. Start surfacing opportunities manually while AI layer is built.

**Week 5–6:** Claude API integration for AI identification. Layer 2 and 3 live.

**Week 7–8:** Risk scoring engine. Layer 4 live. Discord alerts configured.

**Week 9–10:** Misspelling module, job lot module, dashboard.

**Ongoing:** Add new data sources, expand category coverage, build out proprietary price database.

---

## Summary

This system has never been built comprehensively for the UK market. Manual resellers operate by intuition and browsing. Nobody has combined:

- Continuous multi-source automated scraping
- AI-powered item identification from vague descriptions and images
- Precise model-level eBay valuation via API
- Risk-adjusted profit scoring
- Instant alert delivery

The edge is not working harder than other resellers. The edge is that the machine never sleeps, never misses a listing, never misidentifies equipment, and never lets emotion influence a bid ceiling.

Capital starts at £2,000. The machine finds the deals. Profits compound. The asset classes scale. The system is the asset.
