# Public Research Experience Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the research-only placeholder into a polished, useful Korean public-facing research hub before the original trade dataset exists.

**Architecture:** Preserve the dependency-free static runtime and Vercel deployment shape. Semantic HTML carries all primary content; local CSS and progressive-enhancement JavaScript add responsive navigation, filtering and sharing. No analytics, accounts, live trading, data ingestion or fabricated performance.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node built-in tests, Playwright and axe for local browser verification.

## Baseline and scope
- Repository: Jeonyomi/Wonyotti, main at 026f953. Local clone clean; check/build pass.
- Work branch: feat/public-research-experience.
- Dataset NOT_ACQUIRED; schema UNVERIFIED; verification/backtest NOT_RUN; live trading disabled.
- Current web deployment listed by GitHub: https://wonyotti.vercel.app. User explicitly approved feature-branch push, PR, CI review, main merge and the connected production deployment during this implementation session. Keep noindex policy; data collection, trading and indexing are outside authorization.
- Original announcement URL and publication date unknown. README numbers are attributed unverified claims, not results.

## 1. Frontend experience (isolated implementer)
**Files:** index.html, assets/styles.css, assets/app.js, tests/ui.test.mjs.
- RED: Node tests using installed jsdom verify overview, nonaffiliation, explicit unavailability, semantic sections and local assets; then interaction tests for source filtering, accessible tabs if used, copy fallback.
- Implement refined editorial/financial-research layout: warm light canvas, forest-green typography, restrained amber waiting indicators; coherent desktop header/sidebar and mobile navigation.
- Sections: overview/status; research questions and methodology; data requirements and status; attributed claims; curated source directory; FAQ/publication boundaries.
- Preserve useful existing methodology, G0–G6 conceptual gates and four proposed modules; no simulated dashboards or made-up progress.
- Functional enhancements: searchable/filterable source directory with live count/empty state/reset; copy concise share brief with failure fallback; print button. Main content available without JS.
- Status date is manual research snapshot, not last network fetch. Exact original URL remains unknown. Explicit unofficial independent project, not affiliated/endorsed; educational research, not investment advice.
- Responsive 320/390/768/1440, accessible focus/skip link, prefers-reduced-motion and print CSS.
- GREEN: node --test tests/ui.test.mjs. No commits, remote actions or editing other task files.

## 2. Documentation and information audit (isolated implementer)
**Files:** README.md introduction only; docs/PUBLISHING.md; docs/INFORMATION-POLICY.md.
- Preserve the original research guide and headings; replace obsolete dummy overview with accurate implementation/limitations summary and development commands agreed with parent.
- Audit factual public claims without amplifying unsupported numbers. New operational news is outside scope; flag existing current-affairs assertions for independent revalidation.
- Publishing checklist: source/permissions, manual date, noindex until review, explicit nonaffiliation, no raw trade data, no live credentials; source references do not prove original file acquisition.
- No promises of deployed functionality or actual collection/analysis.

## 3. Build and repeatable verification (parent)
**Files:** package.json/package-lock.json, scripts/check.mjs, scripts/build.mjs, tests/build.test.mjs, tests/browser.spec.mjs, playwright.config.mjs, .gitignore, .github/workflows/check.yml, local icons/share asset, vercel.json if needed.
- RED: assert build includes every referenced local asset, honest status and share metadata; syntax and config checks run against real files.
- Keep zero production dependencies. Add development-only jsdom/Playwright/axe for real DOM interactions and accessibility.
- Build copies index/assets/robots and a human-readable research brief (if implemented) into dist. Gate node unit tests before build.
- CSP restricts to local styles/scripts/images, no remote connections/forms/frames; keep existing noindex.
- Verify npm test, npm run check, npm run build, and browser acceptance against dist.
- Desktop/mobile screenshots, overflow, no JS errors, link targets, keyboard interaction, source search/filter, share fallback, print, no-JS content and axe critical/serious checks.

## 4. Review and delivery
- Spec-compliance review first, quality/security review after spec passes. Fix important findings and rerun exact-tree checks with no active writers.
- Commit only after checks; no push/PR/merge/public deployment without exact authorization.
- Deliver verified local artifact/screenshots and concise change/test/remaining-data-gates report. Include any external blockers honestly.
