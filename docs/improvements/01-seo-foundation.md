# 01 - SEO Foundation and Routing

Status: Review completed
Priority: P0
Owner track: SEO Agent

## Objective

Fix indexability and duplicate-content risk, then add strong metadata signals for multi-language SEO.

## Skills Reference

- Primary: `vercel-react-best-practices`
Why: Next.js routing, rendering, and metadata performance patterns.
Path: `/home/dev/.agents/skills/vercel-react-best-practices/SKILL.md`
- Primary: `web-design-guidelines`
Why: validates information architecture, accessibility, and crawl-friendly navigation quality.
Path: `/home/dev/.agents/skills/web-design-guidelines/SKILL.md`
- Optional: `agent-browser`
Why: verify canonical/hreflang/robots behavior in real browser sessions.
Path: `/home/dev/.agents/skills/agent-browser/SKILL.md`

## Current Findings

- `src/app/layout.tsx:16` returns children only.
- `src/app/page.tsx:28` renders `<html>` and `<body>`.
- `src/app/[lang]/layout.tsx:69` also renders `<html>` and `<body>`.
- `proxy.ts:44` excludes `/` from locale redirect handling.
- `src/app/[lang]/layout.tsx:34` hardcodes `metadataBase`.
- `src/app/sitemap.ts:49` adds query-parameter URLs as canonical entries.
- `src/app/sitemap.ts:41` and `src/app/sitemap.ts:50` use `new Date()` for all URLs on each generation.
- `src/app/robots.ts:9` hardcodes sitemap domain.

## Implementation Plan

1. Normalize layout ownership.
- Move the only `<html>/<body>` wrapper to `src/app/layout.tsx`.
- Refactor `src/app/page.tsx` and `src/app/[lang]/layout.tsx` to render fragments/content only.

2. Canonical locale handling.
- Make `/` redirect permanently to default locale page (for example `/en`).
- Keep one canonical URL pattern for each locale page.

3. Add metadata alternates.
- In `generateMetadata` for locale routes, add `alternates.canonical` and `alternates.languages`.
- Keep locale `og:locale` aligned with route language.

4. Remove hardcoded domain values.
- Use a single env source like `NEXT_PUBLIC_SITE_URL`.
- Apply it in metadata, `robots`, and `sitemap`.

5. Clean sitemap strategy.
- Keep canonical pages only.
- Exclude query variants like `?currency=...` unless you create dedicated route pages for those.
- Use stable `lastModified` values based on content update strategy.

6. Add structured data.
- Add JSON-LD for `WebSite` and `Organization` first.
- Add `FAQPage` when FAQ content exists.

## Acceptance Criteria

- `/` has one canonical destination.
- Each locale page has canonical and hreflang alternates.
- No query-parameter canonicals in sitemap unless explicitly indexed.
- Search Console reports no duplicate canonical conflicts.
