# 03 - Notifications and Reliability

Status: Review completed
Priority: P0
Owner track: Reliability Agent

## Objective

Make price notifications accurate, durable, and production-safe.

## Skills Reference

- Primary: `native-data-fetching`
Why: robust upstream fetch patterns, retry boundaries, and predictable refresh behavior.
Path: `/home/dev/.agents/skills/native-data-fetching/SKILL.md`
- Primary: `e2e-testing-patterns`
Why: notification flows, cron-trigger paths, and failure-path regression coverage.
Path: `/home/dev/.agents/skills/e2e-testing-patterns/SKILL.md`
- Optional: `agent-browser`
Why: manual validation of notification permission and service worker behavior in browser.
Path: `/home/dev/.agents/skills/agent-browser/SKILL.md`

## Current Findings

- `src/app/api/gold-prices-egp/route.ts:73` notification decision logic mutates `lastGoldPrice`.
- `src/app/api/gold-prices-egp/route.ts:212` determines direction after mutation, so direction can be wrong.
- `src/app/actions.ts:24` stores subscriptions in memory only.
- In-memory state is lost on restart or serverless cold start.
- `src/app/api/cron/update-prices/route.ts:13` allows all callers.

## Implementation Plan

1. Fix direction calculation bug.
- Compute delta and direction from previous price before mutating stored value.
- Return both `shouldNotify` and `direction` from helper.

2. Persist subscriptions.
- Add storage table for push subscriptions.
- Replace in-memory array in `src/app/actions.ts`.
- Keep invalid-subscription cleanup on 404/410.

3. Make cron deterministic.
- Run price check from controlled scheduler only.
- Prevent user traffic to main API route from triggering notifications.

4. Improve delivery observability.
- Add structured logs with subscriber count, success count, failure count, and reason codes.
- Add minimal retry strategy for transient failures.

5. Strengthen payload quality.
- Include old/new price and percent change in message.
- Add locale-aware formatting for currency in notification body.

## Acceptance Criteria

- Notification direction is always correct in tests.
- Subscription persistence survives restarts and redeploys.
- Unauthorized cron calls are rejected.
- Delivery metrics are queryable from logs.
