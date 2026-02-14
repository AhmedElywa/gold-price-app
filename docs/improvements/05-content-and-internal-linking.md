# 05 - Content and Internal Linking

Status: Implemented (2026-02-13)
Priority: P1
Owner track: Content Agent

## Objective

Turn placeholder UI into indexable, trustworthy content flows that improve user retention and SEO.

## Skills Reference

- Primary: `web-design-guidelines`
Why: ensure link semantics, accessibility, and content hierarchy quality.
Path: `/home/dev/.agents/skills/web-design-guidelines/SKILL.md`
- Primary: `agent-browser`
Why: run real link audits, navigation checks, and quick visual verification.
Path: `/home/dev/.agents/skills/agent-browser/SKILL.md`
- Optional: `vercel-react-best-practices`
Why: keep added content routes lightweight and performant.
Path: `/home/dev/.agents/skills/vercel-react-best-practices/SKILL.md`

## Current Findings

- `src/components/header.tsx:30` links to `#about`, but no `id="about"` section exists.
- `src/components/footer.tsx:20` and `src/components/footer.tsx:23` use `href="#"` placeholders.
- `src/components/footer.tsx:48` uses `href="#"` for historical data.
- Locale dictionaries already include labels for legal and historical links.

## Implementation Plan

1. Replace placeholders with real routes.
- Add `/[lang]/about`.
- Add `/[lang]/privacy`.
- Add `/[lang]/terms`.
- Add `/[lang]/historical`.

2. Add real page content.
- Explain methodology, data sources, update frequency, and limitations.
- Add legal pages with localized base templates.

3. Improve internal linking.
- Keep header and footer links pointing to real pages.
- Add contextual links from homepage sections to related pages.

4. Add content blocks for SEO.
- Add FAQs on major intent queries.
- Add "how to calculate jewelry price" and "gold karat guide" pages.

5. Add trust indicators.
- Display source attribution and update timestamp policy clearly.
- Add contact/support path that is not placeholder text.

## Acceptance Criteria

- No `href="#"` placeholders remain in production UI.
- Main navigation links resolve to indexable pages.
- At least one strong informational page per major intent cluster exists.
- About and legal pages are available in default locale at minimum.
