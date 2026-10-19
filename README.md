# lax_trustscore

Deterministic Cerberus trust score for agent listings.

```ts
import { scoreAgent } from './src/index.js';

const result = scoreAgent(record, outsideScore);
// { score: 61, tier: 'silver', reasons: ['Listing has been open for 30 days, ...', ...] }
```

## Contract

```ts
scoreAgent(record?: AgentRecord | null, outside?: number | null): ScoreResult

interface ScoreResult {
  score: number;                       // integer 0..100
  tier: 'unproven' | 'bronze' | 'silver' | 'gold';
  reasons: string[];                   // one sentence per signal, stable order
}
```

Properties, all covered by tests:

- Pure. No network, no filesystem, no randomness, no clock. Input is never mutated.
- Deterministic. Same record and same outside score always give the same output.
- Never throws. `undefined`, `null`, empty objects, wrong field types and `NaN` all return a result.
- `tier` always equals `tierForScore(score)`.
- `reasons` is a fresh array on every call.

## Input record

| Field | Type | Meaning |
| --- | --- | --- |
| `listingCreatedAt` | ISO 8601 string | When the listing was opened. |
| `asOf` | ISO 8601 string | The "now" used for age. The caller supplies it, the module never reads a clock. |
| `acceptedDeliveries` | number | Accepted delivery count. |
| `rejectedDeliveries` | number | Rejected delivery count. |
| `admissionTest` | `'pass' \| 'fail' \| 'pending' \| 'none'` | Admission test result. |
| `aiaxReadiness` | number 0..1 | AIAX readiness fraction. |
| `acpScore` | number 0..100 | ACP competency score. |

Second argument, `outside`, is an optional 0..100 second opinion from an external scorer. `null` and `undefined` mean "no second opinion".

## Tiers and boundary values

Bands tile the whole 0..100 range with no gaps and no overlap.

| Tier | Score band |
| --- | --- |
| `unproven` | 0 to 39 |
| `bronze` | 40 to 59 |
| `silver` | 60 to 79 |
| `gold` | 80 to 100 |

The boundaries are exactly 40, 60 and 80. A score of 39 is `unproven`, 40 is `bronze`, 59 is `bronze`, 60 is `silver`, 79 is `silver`, 80 is `gold`.

## Weights

Internal maximum is 100 points.

| Signal | Max | Scoring |
| --- | --- | --- |
| Listing age | 15 | 0 days: 0, 1 to 6 days: 3, 7 to 29 days: 8, 30 to 89 days: 12, 90+ days: 15 |
| Accepted deliveries | 25 | 0: 0, 1: 6, 2 to 4: 12, 5 to 9: 18, 10 to 24: 22, 25+: 25 |
| Rejected deliveries | -25 | minus 5 per rejection, penalty capped at minus 25 |
| Admission test | 15 | pass: +15, fail: -10, pending or absent: 0 |
| AIAX readiness | 15 | round(15 x readiness), readiness clamped to 0..1 |
| ACP score | 30 | round(30 x acp / 100), acp clamped to 0..100 |

The raw sum is rounded and clamped to 0..100. Integer output only.

## The evidence gate

`unproven` means "nobody has judged this listing yet". A record counts as evidenced once it has at least one delivery decision (accepted or rejected) or a completed admission test (`pass` or `fail`).

Without evidence the score is capped at 39 and the tier is `unproven`, no matter how good the self reported readiness looks, and the cap is applied last so a perfect outside opinion cannot lift an unevidenced listing out of `unproven`. An empty record therefore returns `{ score: 0, tier: 'unproven' }` instead of being refused. A failed admission test counts as evidence (somebody judged it), so it scores and can still land in `unproven` on points alone.

## Outside score and the one step rule

The outside score is blended at 35 percent:

```
blended = round(internalScore x 0.65 + outsideScore x 0.35)
```

Because 35 percent of the range can be 35 points, a raw blend could cross two tier boundaries at once, for example 39 blended with 100 gives 60 and would jump `unproven` straight to `silver`. That is not allowed.

The rule: the tier may move at most one rung from the internal verdict, in either direction. When the blend would move further, the score is held at the edge of the adjacent band:

| Internal | Outside | Raw blend | Tier after rule | Score |
| --- | --- | --- | --- | --- |
| 39 (`unproven`) | 100 | 60 (`silver`) | `bronze` | 59 |
| 40 (`bronze`) | 100 | 61 (`silver`) | `silver` | 61 (one step, allowed) |
| 79 (`silver`) | 0 | 51 (`bronze`) | `bronze` | 51 (one step, allowed) |
| 80 (`gold`) | 0 | 52 (`bronze`) | `silver` | 60 |

A single step in either direction is always allowed. Two or more steps are never allowed, which is why an outside opinion can never overturn the internal verdict by more than one rung. The reason text names the cap whenever it engages.

Outside values outside 0..100 are clamped and reported; non finite values (`NaN`, `Infinity`) are ignored and reported.

## Reasons

Six internal signals always produce a sentence, followed by the outside blend note when a second opinion was supplied. Sentences are plain ASCII, end with a period, use Latin digits only and contain no long dashes. No `undefined`, `NaN` or `Infinity` ever reaches the prose.

Order: age, accepted, rejected, admission, AIAX, ACP, evidence gate, outside blend, one step cap.

## Files

| File | Concern |
| --- | --- |
| `src/types.ts` | Public types |
| `src/weights.ts` | Every weight, band and constant |
| `src/num.ts` | Numeric coercion helpers |
| `src/iso.ts` | Timestamp parsing and whole day maths |
| `src/tiers.ts` | Tier bands, ranks, the one step limiter |
| `src/outside.ts` | Second opinion normalisation |
| `src/signals/age.ts` | Listing age |
| `src/signals/deliveries.ts` | Accepted and rejected deliveries |
| `src/signals/admission.ts` | Admission test |
| `src/signals/aiax.ts` | AIAX readiness |
| `src/signals/acp.ts` | ACP score |
| `src/signals/evidence.ts` | Evidence gate predicate |
| `src/scoreAgent.ts` | Composition only |
| `src/index.ts` | Public exports |

## Tests

```bash
npx vitest run    # 177 tests, 7 files
npx tsc --noEmit  # type check
```

Coverage highlights: table driven rows for every tier boundary on both sides plus 0 and 100, a fixture per boundary scored end to end, property sweep of every fixture against twelve outside values asserting a rank delta of at most one, unproven never throwing, clock independence with `Date.now` stubbed to throw, and output formatting rules.

## Mutation proof

`test/outside.test.ts` guards the one step rule directly. Changing `Math.abs(distance) <= 1` to `Math.abs(distance) >= 0` in `src/tiers.ts` (which disables the cap) fails 8 tests, including:

```
FAIL  test/outside.test.ts > outside score moves the tier by at most one step > caps a two step climb at one step
AssertionError: expected 60 to be 59
FAIL  test/outside.test.ts > outside score moves the tier by at most one step > never moves more than one rank across every fixture and outside value
AssertionError: expected 2 to be less than or equal to 1
```

Restoring the comparison returns the suite to 177 passing tests, which is the count CI reports.
