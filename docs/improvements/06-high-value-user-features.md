# 06 - High-Value User Features

Status: Implemented (2026-02-13)
Priority: P1
Owner track: Product Agent

## Objective

Add sticky features that create repeat usage and clear user value beyond basic spot price display.

## Skills Reference

- Primary: `web-design-guidelines`
Why: feature UX quality, accessibility, and conversion-focused interface decisions.
Path: `/home/dev/.agents/skills/web-design-guidelines/SKILL.md`
- Primary: `native-data-fetching`
Why: efficient multi-feature data loading, cache policy, and offline-aware behavior.
Path: `/home/dev/.agents/skills/native-data-fetching/SKILL.md`
- Primary: `e2e-testing-patterns`
Why: cover key user flows for alerts, calculators, and portfolio/watchlist interactions.
Path: `/home/dev/.agents/skills/e2e-testing-patterns/SKILL.md`
- Optional: `vercel-react-best-practices`
Why: keep feature growth aligned with performance and rendering best practices.
Path: `/home/dev/.agents/skills/vercel-react-best-practices/SKILL.md`

## Prioritized Feature Backlog

1. Historical charting and trend analysis.
- Scope: 1D, 1W, 1M, 6M, 1Y views, highs/lows, and percent change.
- Value: retention and better investment context.

2. Smart alert builder.
- Scope: above/below threshold, percent move, daily summary digest.
- Value: strong return usage and push opt-in growth.

3. Jewelry price calculator.
- Scope: weight, karat, making charge, tax, currency conversion.
- Value: direct consumer decision support.

4. Portfolio watchlist.
- Scope: save entries by metal/karat/currency and show unrealized P/L.
- Value: long-term engagement.

5. Dealer premium comparison panel.
- Scope: show spot vs retail premium bands and explain premium sources.
- Value: trust and practical buying guidance.

## Implementation Notes

- Start with features that reuse existing API payload first.
- Keep a single shared data layer from Track 02 to avoid extra polling.
- Design each feature as route-level module to keep homepage fast.

## KPI Targets

- Push opt-in rate increase.
- Repeat session rate increase.
- Time on site increase.
- Reduced bounce rate on landing page.

## Acceptance Criteria

- At least two feature modules shipped with production telemetry.
- Each module has explicit user-facing value and clear source attribution.
- Performance budget remains stable after rollout.
