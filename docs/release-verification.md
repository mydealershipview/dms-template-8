# Template 8 release verification

Date: 2026-11-07. Target baseline `7b1c14a` on main; hardened shared reference Template 2 `3d07948`. Both supplied guides are retained in this repository. Shared behavior is ported; Template 8's original public layout, Montserrat typography, branding style and configured CMS content are preserved.

## Checks and environment

Node 24.22.1; exact Next 16.4.3 / React 19.3.1 / Payload 3.93.0 pins. Production application, stateful localhost HTTPS DMS fixture, disposable Mongo, temporary owned-media directory and Chrome/Chromium. The harness blanks deployment settings before providing fixture values. It never sends real leads, emails, provider adverts or payments and never migrates a real database.

| Check | Result and evidence |
| --- | --- |
| TypeScript | PASS — standalone type check and production build checking |
| ESLint | PASS with 269 warnings and zero errors; existing `any`, image, hook and migration diagnostics remain |
| Integration | PASS — 88 tests across 16 files; private outbox, shared rate counters and archive persistence use disposable Mongo |
| Production build | PASS — compilation, types, static generation and sitemap generation |
| Production HTTPS | PASS — 3 workflows covering complete keyed stock, real 404/308, no-store/security/noindex/robots, denied CMS/admin/payment/cron endpoints, scoped sign-in, price mutation, permanent sold images after original removal, archive controls and logout replay |
| Browser | PASS — 10 workflows: authenticated stock/Finder/add/feed editor, 320/390/768/1440 widths, public stock/detail/saved state and every actual target enquiry form's protected pending/retry identity |
| Full dependency audit | 0 critical, 0 high, 19 moderate, 3 low; [JSON](verification/npm-audit.json) |
| Production dependency audit | 0 critical, 0 high, 8 moderate, 3 low; [JSON](verification/npm-audit-production.json) |
| Diff review | PASS — whitespace, active inventory consumers/forms, secret/routing boundaries and variant identity reviewed |
| Real provider/deployment | NOT RUN — fixture results do not establish real Clerk/AutoTrader/DMS/email/Turnstile/storage acceptance |

Commands: `npm run type-check`, `npm run lint`, `npm run test:isolated`, `node scripts/run-isolated.mjs --services node scripts/verify-production.mjs --lighthouse`, `npm audit --json`, `npm audit --omit=dev --json`, `git diff --check`. The supported Node runtime is required. Optional fixture ports use FIXTURE_MOCK_PORT/FIXTURE_SITE_PORT/FIXTURE_APP_PORT; defaults are 9843/9844/54820.

## Current mobile Lighthouse measurements

Pinned Lighthouse 13.0.1, default simulated mobile, production build and local fixtures. Single runs vary with host/network/image cache. The site is deliberately noindexed: SEO's crawlability penalty is expected. These are current local measurements; no comparable pre-change production baseline or field Core Web Vitals was measured. Automated scores do not establish full accessibility compliance.

| Page/report | Performance | Accessibility | Best practices | SEO | LCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| [home](verification/lighthouse-home.json) | 68 | 100 | 100 | 63 | 11.0 s |
| [showroom](verification/lighthouse-showroom.json) | 80 | 100 | 100 | 63 | 5.2 s |
| [detail](verification/lighthouse-detail.json) | 81 | 100 | 100 | 66 | 4.5 s |

The original video-led public design is retained. Real provider images, permanent media/CDN setup and repeated staging performance measurements remain deployment acceptance work. Screenshots are retained under [verification/screenshots](verification/screenshots). Neither template had an authenticated workspace before the port, so there are no authenticated before screenshots to invent.

## Modernization acceptance matrix

PASS below means the specified local evidence, not real provider acceptance. Each real-service requirement has a separate NOT RUN row.

| Area | Local result and evidence | External acceptance |
| --- | --- | --- |
| Configuration/identity | PASS — normalized server-only config, rejected/missing key errors, separate lead UUID/public profile, canonical host and origin guards; security/auth suites; read-only settings lookup | NOT RUN — actual dealership key/advertiser/origin provisioning and revocation |
| Complete stock | PASS — 3 pages/>100 rows, duplicate IDs, sanitized recorded contract, empty authority, malformed rows/envelopes, failed later page and cap; inventory suite and 225-row HTTP fixture | NOT RUN — sanitized live feed comparison |
| Status/visibility | PASS — published website lifecycle rules, reserved display, sold/deleted/prep exclusion; shared API/page/sitemap service | NOT RUN — actual DMS lifecycle/webhook propagation |
| Cache | PASS — single-flight, fresh/stale/expiry/empty/failure/invalidation/late-response guards; inventory suite; no-store HTTP headers | Single-process cache documented; shared invalidation across replicas is not provided |
| Query/API | PASS — preserved shapes, validated finite paging/ranges/sorts, zero mileage/literal percent handling, missing 404/outage separation, no-store errors | NOT RUN — external CDN/proxy configuration |
| Price/overlay | PASS — total/base VAT, POA, fee and zero-fee override, missing price; shared display/filter/finance/schema helpers; CMS overlay removed | NOT RUN — dealer reconciliation of legacy CMS conflicts and purchase-VAT provider behavior |
| All client forms | PASS — local route wiring reviewed for email, callback, vehicle finance, vehicle part exchange, reservation, contact, service booking and CMS form blocks; labels and real portal form ownership; browser retry check | NOT RUN — every form's real DMS record and dealer inbox receipt |
| DMS acknowledgement | PASS — strict 200/201 persisted success+notification ID; invalid/HTML/error acknowledgements, routing overwrite, retained UUID and timeout recovery; lead/forms suites | NOT RUN — live receiver deduplication contract |
| Retry/delivery | PASS — independent email/webhook state, durable save, concurrent uniqueness/leases, backoff/retention; retries preserve original verified stock even after feed changes | NOT RUN — real timeout-after-save and email-provider ambiguity |
| Reservation/payments | PASS — current server stock snapshot, protected enquiry, no charge or automatic reservation; legacy payment endpoints return 410 | No payment integration is enabled |
| Attribution/analytics | PASS — opt-in first/last touch, direct revisit, reject/revoke/storage failure and URL minimization; conversion only after DMS success without PII | NOT RUN — real analytics/debug event and stored DMS attribution inspection |
| Abuse | PASS — bounded JSON, same-origin, honeypot, Turnstile host/action validation, shared hashed rate counters and fail-closed DB behavior; form/security suites | NOT RUN — real Turnstile host/action/replay and production proxy header replacement |
| Security/PII | PASS — DTO projection, private outbox, escaped minimal email, server routing, blocked bootstrap/GraphQL/seed/affiliate/debug endpoints; HTTP privacy assertions | NOT RUN — deployed bundle/log review and organizational access review |
| SEO/render | PASS — production real 404 and 308, known full hyphen IDs, safe JSON-LD, sitemap/noindex/robots, outage boundary | NOT RUN — live canonical/DNS/search-console acceptance |
| Performance/operations | PASS — production build, safe health/cron auth and bounded recovery integration checks; local responsive screenshots | NOT RUN — real alert receipt, scheduler, backup restore and comparable before/after Lighthouse baseline |

## Light DMS acceptance matrix

| Area | Local result and evidence | External acceptance |
| --- | --- | --- |
| Public baseline | PASS — shared public inventory, cards/detail/related/search/featured/makes/wishlist/sitemap paths reviewed; public showroom/detail browser workflow; existing brand preserved | NOT RUN — dealer content/sign-off across all public routes |
| Authentication | PASS — scoped secure httpOnly cookies, state validation, narrow handoff, remote logout and token replay denied; auth suite + actual HTTPS fixture flow | NOT RUN — Clerk expiry/revocation, dealer mismatch, real role/package/disabled access switch, key rotation |
| Direct authorization | PASS — anonymous admin denial, origin/custom-header checks, exact proxy methods/paths/fields and local archive DMS authorization; boundary suite | NOT RUN — real revoked-session behavior across DMS instances |
| Lite isolation | PASS — template contains no customer/invoice/broad stock proxy; explicit forbidden route assertions | NOT RUN — DMS-side Lite owner/full-DMS role regression; no DMS source modified |
| Finder | PASS — optional valuations/MOT/check presentation, missing/null/empty/defect/units/error handling and stale clearing; Finder/UI suites | NOT RUN — genuine provider valuations/checks and package-denial behavior |
| Add | PASS — three-step prepare/review, priced/prep/Due In rules, duplicate/open, frozen UUID/payload, uncertain status recovery, partial custom feeds; unit and browser fixture creation | NOT RUN — genuine approved AutoTrader creation → webhook → DMS → public site |
| Price/VAT | PASS — strict narrow updates and invalidation, shared VAT total; HTTPS mutation immediately visible publicly | NOT RUN — provider-specific VAT and purchase VAT override acceptance |
| Photos | PASS — one-field bounded upload, magic/type/size checks, reorder/remove boundaries and source allowlist; admin/sold-image tests | NOT RUN — genuine provider rejection/retry, video/spin persistence |
| Channels/feeds | PASS — AA Cars/CarGurus subscribed/unsubscribed fixtures, extensible custom feeds, add built-ins then custom follow-up, partial error/retry/readback UI; partner-feed suite and browser | NOT RUN — actual subscribed feed publication and downstream advert readback |
| Status | PASS — validated statuses/UK sold dates, disallowed transition checks, invalidation on success/failure; orchestration suite and public sold disappearance | NOT RUN — actual provider statuses and immediate authoritative feed |
| Sold archive | PASS — snapshot before sale, owned image copy, revision/history protection, pending recovery, hide/show/remove and original image loss; Mongo + HTTPS smoke | NOT RUN — deployed permanent bucket/storage durability and restore |
| Delete/re-add | PASS — stock-ID keyed records and narrow deletion, no registration-based overlay; archive/highlight authority reviewed | NOT RUN — genuine delete/sold-delete/re-add with new provider stock ID |
| Feed/cache | PASS — complete safe DTO and mutation invalidation tests; all local consumers share inventory | NOT RUN — real sanitized before/after contract; multiple replicas need shared invalidation |
| Cleanup | PASS — authenticated bounded cron, min seven days + prior 24-hour notice, authoritative states, missing/error/SOLD retain, atomic generation guard; orchestration suite | NOT RUN — real scheduled invocations and long-term retention observation |
| Forms | PASS — durable delivery, bot/origin/rate guards and retry tests as above | NOT RUN — real sender/receiver/Turnstile acceptance |
| CMS/security | PASS — first-user/GraphQL/seed/payment routes blocked, admin-only collections, provisioning idempotency and safe mail adapter; CMS provisioning not run against a real DB | NOT RUN — human initial account provisioning, deployed CSP reports and secret review |
| Responsive/accessibility | PASS — stock/Finder/editor no overflow at 320/390/768/1440, labeled fields, keyboard native controls, dialog semantics and error/pending feedback reviewed | NOT RUN — comprehensive assistive-technology and real mobile-device acceptance |
| Premium visual brief | PASS — AutoPrestige source references inspected; distinct staff shell, three-step Finder, ordered photos/review, per-feed states; browser screenshots under `test-results/` | No authenticated before screenshot exists because the original template had no staff workspace; dealer visual acceptance NOT RUN |
| SEO/performance/operations | PASS — local status/canonical/robots/sitemap/noindex/health/cron checks | NOT RUN — external alert delivery, deployed scheduler, storage restore and baseline performance comparison |

## Workflow changes

| Workflow | Before → after | Evidence |
| --- | --- | --- |
| Public stock/filter/sort/makes | Separate email/provider/CMS sources and caches → one complete keyed feed, validated query and shared publication policy | Inventory suites and production HTTP |
| Cards/detail/finance | Forecourt-first price/old CMS overlays → one retail total/base/VAT/admin-fee/POA policy; Reserved/highlight visible | Price/DTO tests and browser detail |
| Detail/canonical/related/sitemaps | Self HTTP, brittle parsing and false 200 missing/outage → known full stock IDs, real 404/308, shared current stock and JSON-LD | Production HTTP and source-image removal |
| Enquiry forms | Browser routing, 202 success and no stable identity → protected local API, durable private outbox, verified DMS acknowledgement, retained original UUID/input on pending | Every actual client flow browser-tested; server delivery tests |
| Reservation/payments | Fee/confirmation language without a complete payment flow → explicit no-payment availability enquiry, retired payment routes return 410 | Protected reservation browser + HTTP |
| Saved vehicles | Blank/stale local route → current stock verification and clear removed/outage states | Browser saved-vehicle workflow |
| Analytics/attribution | Unconditional/default consent → opt-in first/last touch and PII-free persisted-success conversion | Attribution suite |
| Staff Finder/editing/feeds | Absent → scoped handoff, narrow proxy, prepare/review/add/recover, VAT/photo/status/highlight and dynamic built-in/custom feed controls | Staff suites and browser fixture add/readback |
| Sold archive | Absent → pending/confirmed revision history with owned media and hide/show/remove/retry | Real disposable Mongo and temporary media; original deleted |
| CMS/operations | Public bootstrap/debug, weak role defaults and no durable retry → private admin operations, protected provisioning, redaction, health and bounded cron | Security/auth/orchestration suites and denied-route HTTP |

Template 8 keeps its video/section marketing homepage and legacy `/showroom` aliases. Contact and service-booking forms have separate protected adapters; the customer service vehicle stays separate from interested dealer stock. Free text/colour now filter the full inventory before pagination, literal percent names are not double decoded, stale filter requests are cancelled and WhatsApp uses configured public contact details.

## Staging release gates

Complete per-dealer canonical origin, raw website key, dealer lead UUID/secret, existing DMS role/package/website access and Clerk provisioning. Confirm actual add → provider webhook → DMS → public feed, VAT/purchase override, subscribed feeds, photo rejection/retry, lifecycle/delete/re-add, key/session revocation, receiver submission-ID deduplication, email delivery, Turnstile action/host/replay, analytics consent, deployed CSP, real alert receipt, authenticated scheduled recovery and Mongo/media backup restore. No DMS source, Swagger, webhook signatures or broad customer/invoice APIs were changed.

Media needs permanent S3 storage or a durable backed-up local volume. Cache invalidation is local to one process; shared coordination is required for immediate consistency across replicas. Keep legacy CMS stock as private backup and reconcile price conflicts before rollout. Rollback must retain outbox, confirmed sold history and owned images. See [operations](template-operations.md), [baseline](implementation-baseline.md) and [PR handoff](PR-description.md). Commits/pushes are separately authorized; no live provider/customer verification is implied by a Git push.
