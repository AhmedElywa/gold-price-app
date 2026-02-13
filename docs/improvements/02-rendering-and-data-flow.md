# 02 - Rendering and Data Flow

Status: Implemented (2026-02-13)
Priority: P0
Owner track: Data Agent

## Objective

Improve page speed, crawlable content, and API efficiency by moving core data to server-first rendering and shared client state.

## Skills Reference

- Primary: `native-data-fetching`
Why: request lifecycle, caching, polling strategy, error handling, and stale-state management.
Path: `/home/dev/.agents/skills/native-data-fetching/SKILL.md`
- Primary: `vercel-react-best-practices`
Why: remove client waterfalls, optimize SSR/streaming, and reduce client bundle pressure.
Path: `/home/dev/.agents/skills/vercel-react-best-practices/SKILL.md`
- Optional: `tanstack-query-best-practices`
Why: if we migrate shared client state to TanStack Query for dedup/polling/cache control.
Path: `/home/dev/.agents/skills/tanstack-query-best-practices/SKILL.md`

## Current Findings

- `src/hooks/useGoldData.ts:15` fetches data client-side only.
- `src/hooks/useGoldData.ts:46` polls every 60 seconds per hook usage.
- `src/components/gold-prices.tsx:15` calls `useGoldData()`.
- `src/components/silver-prices.tsx:12` calls `useGoldData()`.
- `src/components/exchange-rates.tsx:39` calls `useGoldData()`.
- Result: three independent pollers and three API calls per minute on one page view.
- `src/app/[lang]/page.tsx:18` to `src/app/[lang]/page.tsx:25` render loading fallbacks first, so initial HTML does not include real prices.

## Implementation Plan

1. Introduce server-first payload.
- Fetch price payload in route/page server component.
- Pass `initialData` into a client data provider.

2. Create one shared data source on client.
- Add a single provider context or query client state for price data.
- Components read from shared state instead of creating new fetch loops.

3. Consolidate polling.
- Keep exactly one interval for refresh.
- Apply visibility-aware refresh pause when tab is hidden.

4. Improve freshness UX.
- Display server timestamp from API payload, not local "just now" only.
- Show stale state when data age exceeds threshold.

5. Remove duplicate legacy component paths.
- Evaluate `src/components/enhanced-gold-price-page.tsx` usage and remove if dead.

## Acceptance Criteria

- Initial page HTML contains current core price values.
- One API polling loop per page, not three.
- Time-to-first-meaningful-content improves.
- API request volume per active user session drops significantly.
