# 04 - Security and Ops

Status: Implemented (2026-02-13)
Priority: P1
Owner track: Security Agent

## Objective

Reduce abuse risk and improve production operability.

## Skills Reference

- Primary: `e2e-testing-patterns`
Why: test authorization gates, rate-limit behavior, and error-path correctness end-to-end.
Path: `/home/dev/.agents/skills/e2e-testing-patterns/SKILL.md`
- Optional: `native-data-fetching`
Why: define safe retry, timeout, and fallback behavior for upstream dependencies.
Path: `/home/dev/.agents/skills/native-data-fetching/SKILL.md`
- Note
There is no dedicated security-only skill in the current installed list, so this track uses testing + network reliability skills.

## Current Findings

- `src/app/api/cron/update-prices/route.ts:13` uses `const isAuthorized = true`.
- `src/app/actions.ts:8` and `src/app/actions.ts:9` use non-null assertions for envs.
- `src/app/api/gold-prices-egp/route.ts:134` throws when `EXCHANGE_RATE_API_KEY` is missing.
- `proxy.ts:70` and `proxy.ts:81` set COEP/COOP globally, which can break third-party embeds and should be intentional.

## Implementation Plan

1. Protect cron endpoint.
- Require secret header such as `Authorization: Bearer <CRON_SECRET>`.
- Return `401` for missing/invalid secret.

2. Add rate limiting.
- Rate limit public API endpoints.
- Separate tighter limits for cron and internal trigger endpoints.

3. Harden env validation.
- Add startup env schema validation.
- Fail fast with clear error messages in one place.

4. Audit response headers.
- Keep strict headers where required.
- Scope COEP/COOP to routes that need cross-origin isolation.

5. Add operational runbook notes.
- Document scheduler setup and secret management.
- Document expected error patterns and recovery steps.

## Acceptance Criteria

- Cron endpoint cannot be called anonymously.
- API abuse from repeated anonymous calls is throttled.
- Missing envs fail with explicit startup diagnostics.
- Header policy is intentional and documented.
