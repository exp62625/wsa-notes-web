# Identifying the Trend 1.0 (Phase One)

## Overview
- The lesson refreshes how Cue reads trend direction before layering any other tool. Trend ID comes from clean structure first, then is validated with his EMA pair (8 EMA vs. 18 SMA).
- Work top–down: zoom out to clear the noise, decide whether price is printing higher highs/lows or lower lows/highs, and only then drill into lower timeframes for execution.
- Trend context keeps later tactics (trendlines, fibs, entries) aligned with the market’s actual direction so you are not counter-trading momentum by accident.

## Setup
1. **Workspace / tools** – TradingView (or broker chart) with price-only view + Cue’s moving-average overlay: EMA 8 (blue) and SMA 18 (red). Keep structure notes (HH, HL, LH, LL) visible.
2. **Context scan (top–down sweep)**
   - Start on weekly/monthly to see if price is inside a broad range or trending leg.
   - Drop to daily to confirm whether the 8 EMA is above/below the 18 SMA and whether swings are making HH/HL or LL/LH.
   - Use H4 to refine the active swing you will actually trade from; only go to H1/M30 once the higher-frame bias is locked.
3. **Annotation standards** – Mark swing highs/lows, label “HH/HL” or “LL/LH,” and tag any perceived break of structure. Color-code EMA alignment notes (blue>red = bullish, red>blue = bearish).

## Execution Rules
1. **Bias checklist (must all align)**
   - Structure: HH/HL = bullish, LL/LH = bearish; anything else = consolidation → stay patient.
   - EMA confirmation: 8 EMA above 18 SMA keeps a buy bias; 8 below 18 keeps sell bias. Mixed/flat lines = no trade.
   - Timeframe agreement: Daily and H4 must agree; if they conflict, zoom out and wait until daily catches up.
2. **Trend validation**
   - Treat “faux” breaks on lower TFs as noise if the higher TF still holds a higher low or lower high.
   - A valid shift requires both a structural break (new HH/LL) *and* EMA flip.
3. **Invalidations / do-not-trade cues**
   - EMA stack braids or price chopping between both lines → stay flat until a clear slope returns.
   - Swing structure that alternates HH, LL, HH in tight range = consolidation box; wait for a daily close outside.

## Checklist
- [ ] Logged macro direction (weekly/monthly) and noted if we’re inside a range or leg.
- [ ] Daily swing structure and EMA stack match (bullish or bearish) with written bias.
- [ ] H4 presents clean HH/HL or LL/LH without contradictory spikes.
- [ ] Any lower-timeframe setup is in the same direction as daily/H4 bias.

## Common Mistakes
- Mistaking lower-timeframe pullbacks for full trend changes while the higher timeframe still prints a higher low.
- Ignoring the EMA stack and taking trades while blue/red are tangled (no slope = no edge).
- Failing to document the timeframe that produced the bias, then forgetting and switching contexts mid-trade.
- Forcing trades inside broad consolidation ranges where neither structure leg extends nor EMAs slope.

## Drills / Reps
1. **Daily bias journal** – Each NY session, log the weekly, daily, and H4 bias for three majors (e.g., UJ, GU, US30). Note HH/HL vs. LL/LH plus EMA alignment. Goal: 5 consecutive days with zero conflicting notes.
2. **Noise filter replay** – Use TradingView replay on a choppy section; pause after any apparent break on M30, then check H4 to decide if the move was real or noise. Track accuracy (%) of those calls weekly.
3. **EMA flip alerts** – Backtest last month’s price action and mark every time the 8>18 flipped. Note which flips coincided with structure breaks versus fake-outs. Target: correctly classify ≥80% of flips before price moves 1R.

## Questions to Revisit
- What specific structural evidence (swing labels) would make me abandon the current bias?
- Does the EMA alignment confirm or contradict what structure already told me?
- Which timeframe produced today’s bias, and am I still trading from that chart or did I drift into noise?

> Reference transcript: `tmp/wsa-transcripts/identifying-the-trend-1-0.txt`
