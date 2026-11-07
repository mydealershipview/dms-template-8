# Dealer website modernization: template 1/2 audit and implementation playbook

Prepared 5 November 2026. Use this document as the initial handoff to modernize an older dealer website **without changing its chosen design**. This is the shared public-site foundation: DMS stock, correct lead delivery, attribution, caching, truthful fallbacks, security and operational checks. Light DMS staff management is an optional separate feature; its [complete guide](light-dms-template-implementation-guide.md) builds on this foundation.

The audit below is grounded in source, not an assumption that a newer site is perfect. Sections distinguish **observed**, **required target**, and **reference caveat**. Snippets are proposed implementations/adaptations, not claims that those exact snippets already run on MWA. This task produced documentation; it did not fix or deploy the templates.

## 1. Evidence, scope and rules

### Source snapshots

| Repository | Revision inspected | Update/action |
| --- | --- | --- |
| `../dms-template-1` | `5d328d2d091f38b107a5072e0e1d57395cdc2837` | Read-only source inspection; origin `hassan-31x/dms-1-template` |
| `../dms-template-2` | `14a33f19d9c14f19c11aee8ae3b5c1d5c0fc4cc3` | Read-only source inspection; origin `hassan-31x/dms-template-2` |
| `../dms-1-mwaautos` | `738487fefe0bc5cf4c84dca20f191930b1a0aaf9` | User-requested `git pull --ff-only` succeeded, from `e54ca4d`; untracked `design-assets/` preserved |
| `MYDV-DMS` | `e8902379` | Read current feed, lead receiver, save/deduplication service and Swagger |

Reference repository: `https://github.com/mydealershipview/dms-1-mwaautos`. Re-read its current source/revision before implementation. Its `docs/dealer-review-phase-1.md` is valuable history, but its version and auth descriptions are not always current: the checked package pins Next `16.4.3`, React/React DOM `19.3.1` and Payload `3.92.0`, while that review describes an earlier Next version. Lockfiles, runtime source and tests take precedence over old prose.

No deployed credentials/configuration, real feed records, actual lead delivery, production browser behavior or package vulnerability status were verified in this audit. Source-proven findings are high confidence; runtime/configuration-dependent items are explicitly marked for acceptance. Do not report the reference's historical test counts or audit results as tests performed for the new port.

### Checks performed while preparing this guide

- DMS `npm run type-check` passed. Markdown ESLint was invoked but the repository has no Markdown lint configuration, so the files were ignored; that is not a Markdown-lint pass.
- All six TypeScript blocks (five implementation snippets plus the cache-header helper) passed parsing and a separate strict type-check using template 1's actual `AutoTraderVehicle` interface and isolated server-module declarations.
- Mocked snippet probes passed for normalized config/HTTPS/dealer UUID, full pagination/deduplication/publication, authoritative empty vs malformed/failing pages, shared-cache concurrency/expiry/invalidation race, VAT/total fallback, and lead routing/acknowledgement/wrapper/stable identity. No real network, database or provider writes were involved.
- Five focused MWA suites were attempted after the pull using the existing local dependencies. Three suites passed (six tests); website-stock tests and lead-delivery suite were blocked by missing local `@sentry/nextjs`. This indicates the old `node_modules` does not match the pulled manifest; it does not establish a source regression or a fully passing reference. Before phase-two runtime verification, run the reference's reproducible npm install in the approved local test environment, then rerun. No dependency/lockfile edits were made for this audit.
- Local document links, code fences, reference paths and whitespace were checked. No public-site build, dev-server/browser smoke test, Lighthouse run, real lead submission or payment test was performed for this documentation-only task.

Read target AGENTS.md/CLAUDE.md and installed Next guides before editing. Use npm. Preserve unrelated work; create a branch or an authorized isolated variant rather than changing live client copies accidentally. Never copy `.env`, client data, uploaded media, `.git`, `node_modules` or build output into another dealer's variant. Do not mutate real databases, run DMS migrations, create test leads/payments/listings on production, commit/push/publish or send messages without task authorization. DMS rules prohibit assistant database writes in every environment. Human setup actions must remain explicit.

### Outcomes required from the implementing agent

1. A recorded target baseline and complete caller/route/form inventory.
2. One server-owned DMS inventory service used by all stock consumers, with complete paging and honest failure/cache behavior.
3. Every customer form uses its own website server; dealer routing and DMS authentication cannot come from the browser.
4. DMS lead persistence is the success criterion; notification email is a separate outcome, not a substitute.
5. Attribution, vehicle context, finance/part-exchange/test-drive data, correct VAT, Reserved visibility, canonical URLs and public design survive the upgrade.
6. Meaningful isolated tests, production HTTP smoke tests, dependency/security review, before/after evidence and documented deployment configuration.
7. A release report listing live acceptance not performed. No “everything works” based only on TypeScript or mocks.

## 2. Comparison findings and priorities

P0 = blocks safe release; P1 = core correctness; P2 = hardening/performance; P3 = cleanup. These are audit priorities, not a claim that production exploitation occurred.

| ID | Priority | Template 1 observed | Template 2 observed | MWA reference / target action |
| --- | --- | --- | --- | --- |
| ST-01 | P0 | DMS-first email fetch in `utilities/autotrader.ts`, then direct AutoTrader, Payload/dummy branches; separate route fallbacks | Direct AutoTrader auth/stock, then Payload and dummy fallback | Active `getWebsiteStock()` uses DMS only. Remove provider/fake-stock runtime paths in target |
| ST-02 | P1 | Several separate email-based DMS calls and route caches | Separate provider page loops and caches | One complete server service; website key preferred; no hardcoded email fallback for new deployments |
| ST-03 | P1 | Utility sets `totalResults` to filtered **current page** count; caller can stop after page 1 | Independent loops trust provider totals, no shared validated envelope | Follow DMS `data.pagination`, page size 100, bounded page count, ID dedupe; test >100 stock |
| ST-04 | P1 | Showroom FORECOURT-only, detail/featured/sitemap follow different fetch paths | Public paths separately fetch/merge/filter | One visibility predicate and public price/DTO helpers for every consumer |
| ST-05 | P1 | Cache/error fallback can return cached stock or empty array, without a shared stale age contract | Similar fallback to CMS/cached/empty | Bounded last-good stock only; authoritative empty vs outage distinct; no silent fake inventory |
| LD-01 | P0 | No required `x-webhook-secret` on form/reservation forwards; hardcoded dealer fallback UUID | Server routes lack shared auth/routing helper; several browser calls bypass them entirely | Server `getLeadConfig`, required secret + UUID, all browser forms post local APIs |
| LD-02 | P0 | Enquiry success when webhook **or** email succeeds; reservation returns success after webhook failure | Same outcome problem | Success only after DMS stored/acknowledged lead; email delivery reported/retried independently |
| LD-03 | P0 | Hardcoded default dealer routing in form/reservation | `NEXT_PUBLIC_FORM_SUBMIT_WEBHOOK_URL` used by contact/valuation/finance modal | Remove public upstream URL and browser dealer routing; allowlisted input with server overwrite |
| LD-04 | P1 | No shared newer attribution/honeypot integration in inspected callers | Missing shared attribution and direct webhook calls | Port first/last-touch + all client callers + spam guard; preserve exact DMS fields |
| LD-05 | P1 | Client validation mostly required presence, no durable retry identity | Same, plus differing form payloads | Server schemas/bounds, stable submissionId, DMS dedupe, no provider error bodies/PII returned |
| OP-01 | P1 | Repeated route caches, heavy loops, uncertain error cache headers | Same | MWA has shared cache and response headers; tune layered staleness intentionally |
| OP-02 | P1 | Minimal dependency/test/ops baseline | Similar old baseline | Add working npm checks, operational alerts and genuine local production smoke tests |
| SEC-01 | P0 | Legacy publicly callable payment creation/status/webhook surface exists | Same, reservation modal calls payment creation | MWA signature fixed, but payment surface still needs separate decision/review; do not copy blindly |
| SEC-02 | P1 | Listings/Payments/CMS seed access need review | Same | MWA restricts collections/seed; port authorization and test actual routes |
| SEO-01 | P1 | Vehicle/make sitemap reads duplicate DMS calls and own cache, can diverge | Only pages/posts sitemap routes found in inspected sitemap directory | Shared stock sitemaps and real detail 404/canonical behavior; add missing vehicle sitemap plumbing |
| UX-01 | P1 | Featured fetch catch sets `vehicles=[]`, can disguise outage | Several forms use alert-only results/direct URLs | Visible retry/error, preserve inputs and design; distinguish empty, pending, failure and success |
| OPT-01 | P2 | Layout self-fetches/duplicate inventory work; CMS merge reads | Similar layout self-fetch | Direct server functions and request deduplication, bounded CMS queries, lazy scripts/images |
| CFG-01 | P1 | Dealer email/ID/affiliate defaults and template branding | Northline/Premier/generic values in different components | Central configured identity; public copy vs private routing separated; no MWA values copied |

### Concrete paths to inspect first

Paths below are relative to each repository. Parentheses in filesystem paths are route groups, not URL segments.

| Responsibility | Template 1 | Template 2 | MWA |
| --- | --- | --- | --- |
| Main stock source | `src/utilities/autotrader.ts` | Same | `src/lib/services/websiteStock.ts`; legacy-named wrapper in `utilities/autotrader.ts` delegates |
| Showroom API | `src/app/(frontend)/api/listings/route.ts` | `src/app/api/listings/route.ts` | `src/app/(frontend)/api/listings/route.ts` |
| Detail API | `src/app/(frontend)/api/listing/[stockId]/route.ts` | `src/app/api/listing/[stockId]/route.ts` | Thin API + `src/lib/services/vehicleDetails.ts` |
| Featured API | `src/app/(frontend)/api/featured-vehicles/route.ts` | `src/app/api/featured-vehicles/route.ts` | Same route-group path as template 1 |
| Makes/models API | `src/app/(frontend)/api/available-makes-models/route.ts` | `src/app/api/available-makes-models/route.ts` | Same route-group path as template 1 |
| General form proxy | `src/app/(frontend)/api/submit-form/route.ts` | `src/app/api/submit-form/route.ts` | Same route-group path as template 1 |
| Reservation proxy | `src/app/api/submit-reservation/route.ts` | Same | Same + server routing/auth/guard |
| CMS overlays/fallbacks | `src/utilities/mergePayloadData.ts`, `payloadFallback.ts` | Same | Merge still active; inspect caveats below |
| Vehicle page | `src/app/(frontend)/used-cars/[slug]/page.tsx` | Discover actual target route | MWA page uses shared details + React request cache |
| Public shell | `src/components/Layout.tsx` | Same | Compare direct stock filter extraction, not only APIs |

### MWA is a reference with known limitations

Do not assume these are missing from the audit because the site is “updated”:

- `websiteStock.ts` still permits legacy dealer-email access and supplies an MWA email default. New configured sites should use keys; temporary compatibility must require an explicit target email, expiry/owner and clear warning.
- `isShownOnWebsite` treats absent website channel as shown, permits non-FORECOURT states, and makes reservation exceptions. Service allows DUE_IN, while actual `includeReserved=true` DMS public feed selects FORECOURT/SALE_IN_PROGRESS. Local fixture behavior is therefore broader than the real source contract. Do not promise Due In public availability or publish missing-status cars by copying MWA tests.
- `MAX_STALE_MS = Math.max(FRESH_MS, 15 minutes)`: the “never older than 15 minutes” comment only holds when configured fresh TTL ≤15 minutes. Validate configuration bounds. Also add CDN/browser cache time to source age; 5-minute process TTL + 5-minute CDN TTL + SWR is not a guaranteed 5-minute end-to-end freshness limit.
- Entire refresh fails on one malformed row. A future robust port can skip/report an isolated malformed record while failing invalid envelopes/pages; never replace the whole feed with an empty success.
- Active fetch uses no explicit cache mode because a prior no-store change broke statically prerendered routes. Preserve/retest render-mode compatibility before changing it. Request-scoped React `cache()` and process cache are different things.
- `mergePayloadData.ts` still overrides DMS totals/forecourt price and descriptions and defaults reserve price to 99. That can reintroduce competing prices and financial ambiguity. Review target overlays explicitly; preserve approved website copy only, not a silent price authority.
- `autotrader.ts` retains unused authentication/dummy functions and credential references even though the main exported stock wrapper now delegates to DMS. Trace the call graph; remove dead dangerous code after proving it is unused. Finding an old string is not proof that the active source still calls AutoTrader.
- Lead routes check HTTP `ok`, not the full DMS persisted-success JSON contract. Improve acknowledgement validation. MWA has no demonstrated durable form outbox in the inspected submission flow; a timeout after save can still lead to duplicate email/retry confusion.
- Spam guard trusts forwarded Host/IP headers. This is safe only with a correctly configured proxy that replaces them. Use explicit origin allowlist/trusted proxy controls; absence of Origin alone is not bot protection.
- Attribution blocks “rejected” but can write before an affirmative choice or on necessary-only. Port under the agreed consent policy, with marketing storage denied until affirmative consent; do not claim MWA already enforces that stricter policy.
- Payment creation still takes browser amount/details, contains sandbox/development constants, and status lookup returns broad payment data without a demonstrated per-customer access capability. A signed webhook alone does not make these routes safe.
- SEO slug parsing uses the last hyphen-delimited token as stockId; IDs with hyphens can break. Canonical constants and monitoring `[MWA]` labels are dealer-specific. Update config/slug resolver rather than transplant them.
- MWA's review document says mandatory auth since July; current DMS lead receiver defaults `LEAD_WEBHOOK_AUTH_MODE` to `log` and rejects missing auth only in `enforce`. Always send the secret anyway, and have the DMS owner confirm enforcement; do not change fleet-wide mode as a website-side shortcut.
- Swagger's external-notifications entry is minimal (`security: []`, 200-only), while source validates secret mode and returns 201/200 + stored notification ID. Record this documentation gap; route/service source is the contract for this audit. A DMS contract change must update Swagger.

## 3. Discovery procedure for any target template

Start with read-only discovery. Use `rg`, inspect all results rather than assuming template ancestry:

```sh
rg --files src | rg '(api/|utilities/|services/|sitemap|Layout|contact|finance|reservation|valuation|cookie|analytics)'
rg -n 'fetchAutoTrader|fetchAllAutoTrader|getAutoTraderAuthToken|AUTOTRADER_|dealerEmail|DMS_URL|payloadFallback|getDummy' src
rg -n 'allListingsCache|CACHE_DURATION|unstable_cache|revalidate|cache-control|Cache-Control|no-store' src
rg -n 'submit-form|submit-reservation|NEXT_PUBLIC_FORM|FORM_SUBMIT|mailto:|handleSubmit|onSubmit' src
rg -n 'affiliateId|advertiserId|DEALER_ID|sourceWebsite|attribution|firstTouch' src
rg -n 'FORECOURT|SALE_IN_PROGRESS|DUE_IN|SOLD|advertiserAdvert|reservationStatus|forecourtPrice|totalPrice' src
rg -n 'payments|create-first-user|first-register|overrideAccess|seed|graphQL' src
```

Record every stock consumer and form in a checklist with old function → new function → test. Include root/home/layout/navigation counts, featured rows, showroom/search/sort/filter, makes/models, vehicle metadata/details/gallery/related, wishlists, finance/reservation widgets, SEO/JSON-LD, sitemaps and seed/admin imports. A source helper change is incomplete if old routes still fetch separately.

For forms, include homepage contact modal (each mode), vehicle enquiry, appointment/test drive, valuation/part exchange, find-a-car, finance contact, full finance application, reviews contact, reservation and footer/sidebar contact. Telephone/mailto links are contact actions, not DMS lead submissions; do not falsely report them as saved leads. Check whether apparently unused modals are actually wired through imports before deleting them.

Template 2 requires a special search for `NEXT_PUBLIC_FORM_SUBMIT_WEBHOOK_URL`: observed in `components/home/contact-modal.tsx`, `valuation-modal.tsx`, `finance-application-modal.tsx`. Its `components/finance/finance-application.tsx` already uses the local API, so fixing that route alone misses the other forms. `components/home/vehicle-reservation-modal.tsx` calls `/api/payments/create-reservation`, a different flow from enquiry `/api/submit-reservation`.

Do not print `.env` values, credentials, complete feed URLs or PII. Inventory environment **names** and check presence privately. Capture HTTP/API response shapes and desktop/mobile baseline on isolated fixtures where possible. Preserve existing slugs, CMS blocks, branding, approved legal/finance copy and customer flow.

## 4. Identity and configuration: never confuse these values

| Setting/concept | Used for | Must not be confused with |
| --- | --- | --- |
| `DEALER_EMAIL` | Temporary legacy stock lookup; email matching existing DMS dealer | Authentication, website key, contact recipient |
| `DMS_WEBSITE_KEY` | Server Bearer credential for DMS public stock, bound to dealer | Advertiser number, Clerk secret, lead webhook secret |
| `DMS_ADVERTISER_ID` | Optional server-only stock advertiser selector belonging to keyed dealer | DMS dealer UUID, lead affiliate ID |
| `DEALER_ID` | DMS `dealers.id` UUID used as outbound lead `affiliateId` | AutoTrader advertiser ID or Payload/Mongo document ID |
| `EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET` | Server credential in outbound `x-webhook-secret` | Website-stock token; browser-visible config |
| `LEAD_SOURCE_WEBSITE` | Configured public hostname used to attribute origin site | Authorization or arbitrary client routing |
| `EMAIL_TO` | Dealer notification recipient | DMS dealer identity or proof a lead was saved |
| CMS dealership record ID | Local public content/branding configuration | DMS UUID unless explicitly mapped/validated |

Use separate origin/endpoint builders. MWA `DMS_URL` is a **full feed endpoint**; the Light DMS guide uses a **DMS origin**. Snippet A accepts either explicit known form and normalizes it. Do not concatenate an API path onto a full API path or assume one environment convention fits every template. No silent “info@example.com”/MWA fallback.

Minimum website env: DMS_URL, DMS_WEBSITE_KEY (or explicitly temporary legacy DEALER_EMAIL), optional DMS_ADVERTISER_ID; DEALER_ID, EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET, FORM_SUBMIT_WEBHOOK_URL, optional VEHICLE_RESERVATION_WEBHOOK_URL, LEAD_SOURCE_WEBSITE; canonical NEXT_PUBLIC_SERVER_URL/site URL; database/Payload secret where used; Resend sender/recipient/key; optional monitoring DSN. Secret names never begin `NEXT_PUBLIC_`. Public profile/copy, Maps/finance identifiers and consent settings remain separate.

Lead URL normally targets the deployed DMS `/api/webhooks/external-notifications`. Do not use a public browser webhook URL, the authenticated `/api/external-notifications` management API, or the platform's general `/api/contact` endpoint for dealer leads. Confirm any explicitly configured alternative has an adapter and contract tests. One service-wide webhook secret is not a per-dealer security boundary: server-owned routing and deployment isolation are still essential.

Remove AutoTrader API credentials from website runtime and environments after proving all calls moved; coordinate credential-owner rotation if they were exposed. Website key/lead secret issuance and DMS config are human operations, not values an agent invents. Keep legacy feed compatibility until the fleet migrates; DMS-wide `WEBSITE_FEED_REQUIRE_KEY` cannot be enabled by a single-template port.

## 5. Stock service: target behavior and implementation snippets

### DMS contract confirmed from source

Server request: `GET /api/website/stock?page=1&pageSize=100&includeReserved=true`, header `Authorization: Bearer <website key>`, optional server `advertiserId`. Key authenticates and chooses dealer; dealerEmail/dealerId query values are ignored when keyed. Unknown/revoked key →401, wrong advertiser/dealer unavailable →404. New sites must not call DMS from the browser.

Successful envelope: `{success:true,data:{vehicles:[],pagination:{page,pageSize,totalResults,totalPages,hasNextPage},filters,dealer}}`. Keyed responses: `Cache-Control: private, no-store`, `X-Website-Stock-Version: 1.2`. Old unauthenticated email/UUID access remains conditional on DMS rollout flag. Invalid HTTP/envelope is an error; `{vehicles:[]}` with valid pagination is valid empty stock.

`includeReserved=true` uses DMS public-feed predicates and FORECOURT/SALE_IN_PROGRESS states; in-prep/deleted/unpriced/ineligible rows are excluded there. Site publication policy still validates Dealer Website PUBLISHED. Public records include metadata/specification/adverts/media, allowed prices/VAT, timestamps and optional websiteHighlight/reserved. Exclude VIN/internal finances/customer/Finder data and server advertiser selection from website public DTOs.

### Snippet A — server-only normalized configuration

Place at `src/lib/services/dmsConfig.ts`. Proposed stricter adaptation, not verbatim MWA. The existing full URL and the newer origin form are both accepted; preserve neither old identity query parameters nor arbitrary URL paths.

```ts
import 'server-only'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}
function safeUrl(raw: string): URL {
  const url = new URL(raw)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) {
    throw new Error('Invalid DMS URL configuration')
  }
  return url
}
export function stockConfig() {
  const configured = safeUrl(required('DMS_URL'))
  const path = configured.pathname.replace(/\/+$/, '')
  if (path && path !== '/api/website/stock') throw new Error('Invalid DMS stock path')
  const url = new URL('/api/website/stock', configured.origin)
  const key = required('DMS_WEBSITE_KEY')
  const advertiser = process.env.DMS_ADVERTISER_ID?.trim()
  if (advertiser) url.searchParams.set('advertiserId', advertiser)
  return { url, key }
}
export function leadConfig(reservation = false) {
  const dealerId = required('DEALER_ID')
  if (!uuid.test(dealerId)) throw new Error('DEALER_ID must be the DMS dealer UUID')
  const secret = required('EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET')
  const raw = reservation && process.env.VEHICLE_RESERVATION_WEBHOOK_URL?.trim()
    ? process.env.VEHICLE_RESERVATION_WEBHOOK_URL.trim()
    : required('FORM_SUBMIT_WEBHOOK_URL')
  const url = safeUrl(raw)
  if (url.pathname !== '/api/webhooks/external-notifications' || url.search || url.hash) {
    throw new Error('Expected the DMS external-notifications webhook endpoint')
  }
  const source = required('LEAD_SOURCE_WEBSITE')
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(source)) throw new Error('Expected a source hostname')
  return { dealerId, secret, url, source }
}
```

If a currently live dealer still needs email temporarily, implement an explicit `ALLOW_LEGACY_STOCK_EMAIL=true` branch requiring configured DEALER_EMAIL and a once-per-process operational warning. Do not add an implicit fallback when a supplied key is rejected; that would bypass intentional revocation. A missing configured key can be transitional; an invalid configured key must fail. Keep that adapter separate and test both modes. Snippets below deliberately target keyed deployment.

### Snippet B — visibility and full paginated fetch

Place at `src/lib/services/loadWebsiteStock.ts`. Retain the target's vehicle type **as a compatibility type only**; it does not mean the source is AutoTrader. Adapt only if the installed feed fixture uses a different documented shape. `AutoTraderVehicle` imported as a type must not drag provider auth code into client/server runtime.

```ts
import 'server-only'
import type { AutoTraderVehicle } from '@/utilities/autotrader'
import { stockConfig } from './dmsConfig'

export function publicVehicle(row: AutoTraderVehicle): boolean {
  return ['FORECOURT', 'SALE_IN_PROGRESS'].includes(row.metadata?.lifecycleState) &&
    row.adverts?.retailAdverts?.advertiserAdvert?.status === 'PUBLISHED'
}
function validRow(value: unknown): value is AutoTraderVehicle {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const row = value as Partial<AutoTraderVehicle>
  return typeof row.metadata?.stockId === 'string' && !!row.metadata.stockId.trim() &&
    typeof row.metadata.lifecycleState === 'string' &&
    !!row.vehicle && typeof row.vehicle === 'object' && !Array.isArray(row.vehicle) &&
    !!row.adverts && typeof row.adverts === 'object' && !Array.isArray(row.adverts)
}
export async function loadWebsiteStock(): Promise<AutoTraderVehicle[]> {
  const { url: base, key } = stockConfig()
  const found = new Map<string, AutoTraderVehicle>()
  const MAX_PAGES = 100
  let totalPages = 1
  for (let page = 1; page <= totalPages; page++) {
    const url = new URL(base)
    url.searchParams.set('includeReserved', 'true')
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', '100')
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`DMS stock request failed (${response.status})`)
    const body = await response.json()
    const data = body?.data
    const pages = data?.pagination?.totalPages
    if (body?.success !== true || !Array.isArray(data?.vehicles) ||
        !Number.isInteger(pages) || pages < 0 || pages > MAX_PAGES ||
        (pages === 0 && data.vehicles.length !== 0) || (pages > 0 && pages < page)) {
      throw new Error('Invalid DMS stock envelope')
    }
    totalPages = pages
    let malformed = 0
    for (const raw of data.vehicles) {
      if (!validRow(raw)) { malformed++; continue }
      if (publicVehicle(raw)) found.set(raw.metadata.stockId, raw)
    }
    if (malformed) {
      console.warn('[dealer-site] malformed stock records skipped', { count: malformed })
      // All malformed is a contract failure, not a valid empty showroom.
      if (malformed === data.vehicles.length) throw new Error('Invalid DMS stock records')
    }
  }
  return [...found.values()]
}
```

Use current DMS serializer and sanitized recorded real-feed fixture to extend validation (page/pageSize, consistent page totals, allowed nested types). If a page fails, do not publish partial stock as complete or refresh `fetchedAt`; retain only the previous **complete** successful snapshot. Beyond MAX_PAGES fail/alert, do not silently truncate a fleet. Dedupe by stock ID, never registration.

The snippet intentionally omits explicit Next fetch cache options to match MWA's rendering compatibility. The service cache below owns freshness. If adding `cache:'no-store'`, revalidate/tags or `force-dynamic`, first read the installed Next guide and test production-build static pages, unknown URLs and every route that imports the shared layout. Framework fetch/page/CDN caches must not add an unbounded layer. Do not equate missing cache options with a proven universal Next caching default.

### Snippet C — shared bounded cache with single-flight and invalidation

Place at `src/lib/services/websiteStock.ts`. This uses MWA's five-minute fresh / fifteen-minute stale policy, validates it, and adds invalidation/generation handling useful for future Light DMS. Time is age **since the last complete success**, not since last failed attempt.

```ts
import 'server-only'
import type { AutoTraderVehicle } from '@/utilities/autotrader'
import { loadWebsiteStock } from './loadWebsiteStock'
import { reportOperationalError } from '@/utilities/reportOperationalError'

const seconds = Number(process.env.STOCK_CACHE_SECONDS || 300)
if (!Number.isInteger(seconds) || seconds < 1 || seconds > 900) {
  throw new Error('STOCK_CACHE_SECONDS must be an integer from 1 to 900')
}
const FRESH_MS = seconds * 1000
const MAX_STALE_MS = 15 * 60_000
let snapshot: { rows: AutoTraderVehicle[]; fetchedAt: number } | undefined
let pending: Promise<AutoTraderVehicle[]> | undefined
let generation = 0
let failedAt: number | null = null

function refresh(): Promise<AutoTraderVehicle[]> {
  if (pending) return pending
  const version = generation
  const task = (async () => {
    try {
      const rows = await loadWebsiteStock()
      if (version !== generation) return getWebsiteStock()
      snapshot = { rows, fetchedAt: Date.now() }
      failedAt = null
      return rows
    } catch (error) {
      if (version === generation) failedAt = Date.now()
      await reportOperationalError('dms_stock_unavailable')
      throw error
    }
  })()
  pending = task
  void task.finally(() => { if (pending === task) pending = undefined }).catch(() => {})
  return task
}
export function getWebsiteStock(): Promise<AutoTraderVehicle[]> {
  const age = snapshot ? Date.now() - snapshot.fetchedAt : Infinity
  if (snapshot && age < FRESH_MS) return Promise.resolve(snapshot.rows)
  if (snapshot && age < MAX_STALE_MS) {
    // refresh reports failure; this catch only consumes the background rejection.
    void refresh().catch(() => {})
    return Promise.resolve(snapshot.rows)
  }
  return refresh()
}
export function invalidateWebsiteStock(): void {
  generation++
  snapshot = undefined
  pending = undefined
}
export function stockHealth() {
  const age = snapshot ? Date.now() - snapshot.fetchedAt : Infinity
  return {
    lastSuccessAt: snapshot ? new Date(snapshot.fetchedAt).toISOString() : null,
    servingStale: !!snapshot && age >= FRESH_MS && age < MAX_STALE_MS,
    staleLimitExceeded: age >= MAX_STALE_MS,
    lastFailureAt: failedAt ? new Date(failedAt).toISOString() : null,
  }
}
```

Do not mutate returned shared objects with sort/splice/CMS merging. Copy before sorting and construct presentation DTOs. One process cache is not a shared durable store: replicas/serverless instances refresh independently and restart loses last-good stock. If a shared deployment serves multiple dealers, partition caches by authenticated dealer/config/advertiser; this snippet assumes **one dealer per deployment**. For strict consistency across replicas, implement shared cache/versioning rather than claiming local invalidation is global.

### Public API and HTTP cache integration

Remove each route's independent `fetchAllListings()` pagination/cache/fallback body and call this shared service. Preserve current browser response shapes:

| URL | Response expected by existing components |
| --- | --- |
| `/api/listings` | `{results,totalResults,pageSize,page,availableMakes,availableModels}` |
| `/api/listing/{stockId}` | `{vehicle,similarProducts,totalSimilar}`; 404 only after successful stock lookup confirms absence |
| `/api/featured-vehicles` | `{results,totalResults,page,pageSize}` |
| `/api/available-makes-models` | Existing `extractMakesAndModelsFromVehicles` result shape |

Filter/sort the full shared array **before** local pagination. Validate finite integer page/pageSize (1–100), allowed sort key/order, bounded text, finite range filters and contradictory min/max; `parseInt('abc')` NaN must not reach slice. URLSearchParams already decodes values; do not decode a second time and crash on literal `%`. Null price/mileage/year remains missing; mileage 0 can be valid and must not become 999999 through `||`. Missing numeric values must not pass a numeric filter by accident. Stable secondary stockId sorting avoids page jitter.

MWA's public HTTP header helper is:

```ts
export const stockCacheHeaders = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
}
export const noStoreHeaders = { 'Cache-Control': 'no-store' }
```

Use success headers only on sanitized public GETs. Errors, missing vehicles, admin/private data and lead POSTs are no-store. Do not forward upstream Bearer headers, cookies, X-Feed-Dealer or raw upstream metadata. MWA header values are a compatibility baseline, **not** a promise of fifteen-minute viewer age: source stale data could then sit at a CDN another five minutes. For a hard end-to-end bound either disable shared response caching while serving stale stock, or calculate remaining cache lifetime from source age and expose/test an internal age result. For future Light DMS, use shorter public TTLs/shared invalidation compatible with the [Light DMS guide](light-dms-template-implementation-guide.md), not two competing cache systems.

A route's 503 should show “Inventory temporarily unavailable” with retry. A valid empty array shows no matching stock. A 404 is a missing vehicle on a successful inventory read. Never recover a missing/sold vehicle from CMS fallback. Test actual HTTP statuses after a production build: an early global loading boundary can stream 200 before notFound; MWA removed that boundary and keeps Suspense only where URL-dependent components require it.

### One inventory for server pages and APIs

Server components/layout/metadata/sitemaps should import server functions directly; do not self-fetch `${NEXT_PUBLIC_SERVER_URL}/api/...` during build/render. `cache(getVehicleDetails)` deduplicates metadata/page reads within a render, while process cache prevents repeated feed paging across requests. Neither is a substitute for the other. Avoid importing the server stock module through a runtime client dependency; move DTOs and pure helpers into separate shared modules.

Update root navigation makes/models, home counts and featured lists, showroom, detail page and related cars, search, wishlists, sitemap endpoints, metadata and seed import read path. Preserve safe CMS import tooling without executing it during the audit. Remove direct provider auth, raw URL logs, fallback CMS stock/dummy code and old duplicate caches after confirming there are no remaining runtime callers.

## 6. Reserved, prices, CMS and public data safety

Prefer feed `reserved === true` as the public badge source. During an explicitly required legacy transition, MWA's exact `Reserved` match/lifecycle fallback avoids the `NotReserved` substring bug; never implement `.includes('reserved')`. Do not use badge state to bypass publication or lifecycle eligibility. New template policy in Snippet B is strict: missing Dealer Website status is not published; FORECOURT/SALE_IN_PROGRESS only. If a client intentionally wants Coming Soon/Due In, request a documented DMS feed option and agreed public behavior rather than bypassing keyed feed predicates or exposing admin stock.

Display the same price everywhere: cards, details, finance inputs, filters/sort, OG text, structured data and enquiry context. MWA often prefers forecourt price to total, which is not a universal VAT-aware rule. Use authoritative total where supplied; show base + VAT for Ex VAT, avoid adding VAT twice, preserve admin-fee/POA logic. Null/missing must not be a real £0 offer.

### Snippet D — pure presentation helpers

Place in a shared module importable by client and server. This accepts a small public price shape; extend it for the target's tested fee/POA contract rather than overriding prices in CMS.

```ts
export type PublicPriceInput = {
  adverts?: {
    forecourtPrice?: { amountGBP?: number | null }
    forecourtPriceVatStatus?: string | null
    retailAdverts?: {
      priceOnApplication?: boolean
      suppliedPrice?: { amountGBP?: number | null }
      price?: { amountGBP?: number | null }
      totalPrice?: { amountGBP?: number | null }
      vatStatus?: string | null
    }
  }
}
const positive = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
export function publicPrice(row: PublicPriceInput) {
  const retail = row.adverts?.retailAdverts
  const vat = (row.adverts?.forecourtPriceVatStatus ?? retail?.vatStatus ?? '').toLowerCase()
  const base = positive(retail?.suppliedPrice?.amountGBP) ??
    positive(row.adverts?.forecourtPrice?.amountGBP) ?? positive(retail?.price?.amountGBP)
  if (retail?.priceOnApplication) return { total: null, base, vat, onApplication: true }
  const total = positive(retail?.totalPrice?.amountGBP) ??
    (base === null ? null : vat === 'ex vat' ? Math.round(base * 120) / 100 : base)
  return { total, base, vat, onApplication: false }
}
export function photoLine(row: {
  websiteHighlight?: string | null
  adverts?: { retailAdverts?: { attentionGrabber?: string | null } }
}): string | null {
  return row.websiteHighlight?.trim() || row.adverts?.retailAdverts?.attentionGrabber?.trim() || null
}
```

If total is absent and admin fees are separately present, the fallback above must be extended to the DMS listingPrice/fee contract before use; do not assume base*1.2 includes every fee. POA has no numeric Offer price. Pass display total into price filters/finance only where the product contract expects that number; finance calculation is an estimate and not an authority over DMS price.

For Payload overlays, audit every selected field. Default modernization makes DMS price/VAT/status/publication/media/highlight authoritative. Keep specifically approved local description2/marketing content as a separate presentation field if needed. Existing intentional local pricing must be surfaced for owner resolution/migration, not silently discarded or perpetuated. Batch CMS reads once for requested stock IDs; merge main+similar from the same map rather than a second query; cache stable CMS content/revalidate via hooks. A failed optional overlay read should report degraded overlay status, not invent stock or silently mask a critical price dependency.

Project public data explicitly before sending JSON/RSC props: never raw provider records, VIN, purchase amounts/VAT, margin/profit/customer data, deployment secrets or advertiser IDs. Feed itself still has compatibility advertiser profile fields, so strip server-only identity even when upstream serialization is safe for other consumers. Keep only fields components actually need; do not manufacture empty `vin`/purchasePrice placeholders to satisfy an old broad type. Create a dedicated public DTO and update types.

## 7. Lead delivery: DMS contract and exact implementation steps

### Current receiver contract

DMS: `POST /api/webhooks/external-notifications`, JSON, server `x-webhook-secret: <EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET>` (Bearer is also understood, but use one standard). Receiver verifies configured log/enforce mode and saves via `src/lib/feeds/saveWebsiteLead.ts`; dealer lookup requires real DMS dealer UUID in `affiliateId`.

Current success: HTTP **201** for new lead or **200** for duplicate, JSON `{success:true,notificationId,message,duplicate}`. Errors: 400 invalid enquiry/dealer; 401 invalid authentication when enforce; 503 invalid auth-mode configuration; 500 save failure. The inspected `leadFeedRoute` adds feed-history reporting, not a rate limiter; website/edge throttling must be provided separately. Handle deployment-level 429/503 responses too. Do not acknowledge because the endpoint was reachable, an email succeeded, or status happened to be 2xx with HTML/`{}`.

General lead shape:

```json
{
  "submissionId": "<one stable UUID per customer submission>",
  "affiliateId": "<SERVER DMS DEALER UUID>",
  "advertiserId": "<SERVER DMS DEALER UUID, legacy alias where required>",
  "sourceWebsite": "dealer.example",
  "enquiryType": "find-your-next-car",
  "personal": {
    "firstName": "Alex", "lastName": "Example",
    "email": "alex@example.com", "phoneNumber": "07700900123"
  },
  "vehicle": { "stockId": "<public stock id>", "make": "<make>", "model": "<model>" },
  "userVehicle": null,
  "findYourNextCar": { "enquiryType": "stock-vehicle", "vehiclePreferences": null },
  "testDrive": null, "employment": null, "finance": null, "bank": null,
  "notes": "<validated customer message>",
  "attribution": { "utmSource": "google", "utmMedium": "cpc" },
  "firstTouchAttribution": { "utmSource": "google", "utmMedium": "cpc" }
}
```

`advertiserId` here is an unfortunate legacy **lead alias**, not permission to put AutoTrader advertiser ID into public forms. `affiliateId` is the canonical receiver dealer selector. Server overwrites both if retained for compatibility. Personal phone key is `phoneNumber` for general leads, `phone` for reservation customerDetails. Do not send only a freeform `name/message` object without mapping.

Required `enquiryType` mapping uses actual DMS-supported paths: `part-exchange`, `find-your-next-car`, `book-appointment`, `request-finance`; receiver documentation also describes `general-contact` and `vehicle-reservation`. Check `src/lib/external-notifications.ts` before extending enums. MWA WebhookData type is narrower than receiver prose. General vehicle enquiry can remain `find-your-next-car` with nested `stock-vehicle`; a contact form can use the existing agreed general-enquiry mapping. Do not arbitrarily rename analytics events or categories.

Preserve `vehicle` = car being considered and `userVehicle` = customer's part exchange. Preserve appointment date/time, finance quote, employment/bank fields only where actually collected and authorized. Full finance applications contain sensitive financial data: no analytics/logging copies, no unnecessary collection, explicit privacy/retention controls. Never fabricate missing customer data to pass validation.

Legacy reservation wrapper accepted by current DMS:

```json
{
  "type": "vehicle-reservation",
  "timestamp": "<server ISO time>",
  "data": {
    "submissionId": "<stable UUID>",
    "affiliateId": "<SERVER DMS DEALER UUID>",
    "sourceWebsite": "dealer.example",
    "customerDetails": {
      "title": "Mr", "firstName": "Alex", "lastName": "Example",
      "email": "alex@example.com", "phone": "07700900123", "address": "<address>"
    },
    "vehicleDetails": {
      "stockId": "<stock id>", "make": "<make>", "model": "<model>", "registration": "<registration>"
    },
    "amount": 10000,
    "attribution": {}, "firstTouchAttribution": {}
  }
}
```

DMS unwraps only that wrapper type then reads routing/attribution/submissionId from **inside data**. Reservation legacy amount is pence; distinguish it from real payment amounts and pounds in UI/provider storage. The receiver detects reservations by customerDetails+vehicleDetails+truthy amount. A no-deposit reservation **enquiry** should use an agreed general-lead mapping, not fake an amount just to trigger that branch. Determine the target's actual active flow before changing it.

### Snippet E — persisted acknowledgement, server routing and retry identity

Place in `src/utilities/dmsLead.ts`. Use validated/allowlisted DTO input from the website route, never raw request JSON. It supports flat enquiries and the existing reservation wrapper. Keep client routing/unknown nested objects out of `validated` at validation time. The stable UUID is generated once by the form/outbox, validated on the server and reused on retries; it is deduplication identity, not authentication.

```ts
import 'server-only'
import { leadConfig } from '@/lib/services/dmsConfig'

type LeadAck = { notificationId: string | number; duplicate: boolean }
export async function deliverDmsLead(
  validated: Record<string, unknown>,
  submissionId: string,
  reservation = false,
): Promise<LeadAck> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
    throw new Error('Invalid submission identity')
  }
  const config = leadConfig(reservation)
  const data = {
    ...validated,
    submissionId,
    affiliateId: config.dealerId,
    advertiserId: config.dealerId,
    sourceWebsite: config.source,
  }
  const body = reservation
    ? { type: 'vehicle-reservation', timestamp: new Date().toISOString(), data }
    : data
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': config.secret },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success !== true ||
      !['string', 'number'].includes(typeof result.notificationId)) {
    throw new Error(`DMS lead not acknowledged (${response.status})`)
  }
  return { notificationId: result.notificationId, duplicate: result.duplicate === true }
}
```

Current DMS dedupe uses body `submissionId`/`leadId`/`id` to build a dealer/source-scoped reference. Without explicit identity it hashes normalized content in a ten-minute bucket, which is weaker across retries/bucket boundaries. An `Idempotency-Key` header **alone** is not proof of dedupe on this receiver; the snippet uses body submissionId. An untrusted arbitrary `id` must not override the validated submissionId.

### Website route integration, in order

1. Browser sends **same-site** `/api/submit-form` or `/api/submit-reservation`, never upstream URL/secret/dealer routing. Preserve existing request field mappings; add stable submissionId, honeypot and consent-compatible attribution. Disable double clicks, keep UUID/payload after timeout; reset only on confirmed result or deliberate new submission.
2. Website route bounds body bytes before JSON parsing, rejects malformed JSON as 400, validates schema/field lengths/email/phone/enquiry mode and consent requirements. Allowlist nested structures; drop browser routing fields. Validate server configuration before sending either channel. Do not use TypeScript annotations as runtime validation.
3. Check configured origins, honeypot, shared atomic rate limits and bot verification where required. Do not trust arbitrary forwarded headers. Require a trusted proxy setting and strip/replace headers at the edge.
4. Resolve public stockId server-side for vehicle-specific forms and use current make/model/registration/price; reject or explicitly reconcile unavailable stock. Customer-entered part-exchange data is different and should not be replaced with showroom data. During feed outage do not silently trust a forged vehicle/amount.
5. Call `deliverDmsLead` and require persisted acknowledgement. Keep returned ID internal unless a safe opaque reference is intentionally provided. Never return X-Feed-Dealer or raw upstream errors/PII to browser.
6. Send dealer email independently using configured verified sender/recipient and escaped customer content. A notification email failure after DMS persistence should not cause duplicate lead creation; return success with safe warning/pending notification state and alert/retry. A DMS failure even with email success is not successful DMS delivery.
7. Return no-store JSON. On synchronous DMS failure use a truthful 502/503 and preserve form input; timeout is ambiguous, retry same submissionId. If using a durable outbox, return an explicit pending/202 state while waiting, not “saved to DMS” until acknowledged.
8. Emit `enquiry_submitted`/test-drive/finance/reservation conversion only after the relevant acknowledged outcome; event payload has no customer identity/finance/bank data. A local email or button click is not the same conversion as a saved lead.

MWA generic route already fails when DMS fails even if email succeeds; retain that correction. Improve its acknowledgement-body check, stable IDs and validation rather than reverting to the old OR condition.

### Durable outbox / delivery recovery

The MWA synchronous flow is a minimum reference, not durable queuing. For a full template modernization, port the hardened Light DMS website's `src/forms/{route,delivery,security,rateLimit}.ts`, FormOutbox/FormRateLimits collections, operations view and protected retry cron, adapted to the verified DMS lead contract above. It is reusable on a public-only site; it does not require enabling staff Light DMS.

Persist verified submissions privately before delivery. Track DMS acknowledgement/id, email state, attempt count/next attempt, stable submissionId and visible failure separately. Atomic uniqueness/claiming prevents duplicate workers; replay does not re-send successful channels. Test timeout-after-DMS-save and email failure independently. Honor bounded retention/access/privacy; remove delivered PII after agreed retention, retain failed entries for intervention. Do not copy the Light DMS generic webhook delivery implementation without adapting acknowledgement and body-ID behavior to this DMS receiver.

A durable accepted request and a confirmed DMS-saved request are different UI states. Decide/implement one truthful flow; document it so agent tests do not assert unconditional 200 success.

## 8. Every client form: exact replacement checklist

| Form/variant | Preserve/map | Required change |
| --- | --- | --- |
| Homepage/general contact | personal fields, notes, existing general enquiry category | Local API, no public webhook URL; validation/guard/routing/ack |
| Vehicle contact | Interested stockId and public current vehicle details | Pass real stockId from card/detail; server resolves it; do not leave null on product pages |
| Book appointment/test drive | isTestDrive/date/time/requirements | Validate real date and valid option values; server category book-appointment |
| Valuation/part exchange | Customer's car in userVehicle; interested car separately | No provider valuation secrets/browser endpoint; correct category and input limits |
| Find next car | Preferences and nested stock/help/general subtype | Preserve nested shape, do not invent a stock record |
| Finance contact/calculator | Quote amounts, deposit, term, APR where collected | Use current public vehicle total where relevant, clearly label estimates, no client dealer routing |
| Full finance application | employment/finance/bank only if required | Sensitive-field validation/minimization/privacy; no monitoring/email template injection |
| Reviews contact / footer / sidebar | Same existing contact semantics | Ensure each modal uses shared API/guard, not a forgotten copied route |
| Reservation enquiry | Customer and current stock context | Explicit enquiry state, no claim of payment/reservation confirmation merely from lead save |
| Deposit payment | Separate money operation | See payment review; do not swap silently with enquiry |

Port MWA `src/components/FormHoneypot/index.tsx` into all actual form components, and include `website` value in their local request. Do not rely on CSS-hidden dummy input without reading/submitting it. Honeypot must be outside keyboard tab order and assistive tech flow. Old templates often have multiple modal files whose names differ only in capitalization; check imports on case-sensitive hosts.

On form error keep inputs and show accessible inline messages/retry; do not close modal/reset on HTTP non-ok, `{success:false}`, pending state or JSON parse error. Add AbortController for obsolete **reads**, but don't treat aborting an already-submitted lead as proof no save occurred. Avoid logging raw form state. Replace alert-only flows while preserving approved styling.

## 9. Attribution, analytics and consent

MWA references: `src/utilities/adAttribution.ts`, `analytics.ts`, `src/components/Layout.tsx`, consent modal/provider and every form caller. DMS uses `saveLeadAttribution` in `saveWebsiteLead.ts`. Port both client capture and outbound fields; adding cookies but forgetting the form proxy loses attribution.

Required fields: `gclid`, `gbraid`, `wbraid`, `fbclid`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `referrer`, `landingPage`, `capturedAt`. First-touch is write-once within agreed retention; last-touch updates on a genuine new external campaign/referral. UTM-only visits and organic/referral visits count; direct/bookmark/internal navigation must not overwrite real attribution with “direct”. Do not use advertiser ID as traffic attribution.

Reference cookie names are `mydv_ad_attribution` and `mydv_ad_attribution_first`, 30-day window. Keep consent-compatible policy deliberately: default analytics/ads storage denied, no marketing attribution cookies before affirmative permission, reject/necessary-only clears or blocks them, consent revocation clears both. MWA's rejection-only write check needs strengthening for that target. Use Secure on HTTPS, SameSite=Lax, bounded validated JSON and no URL query strings containing personal information. Canonicalize/minimize landing/referrer data before storage; avoid copying callback tokens or arbitrary query data.

Use the target's actual consent keys consistently (`cookie-consent-v2` vs legacy `cookies-accepted`), fail safely if storage is blocked. Do not copy MWA's fixed GA/GTM/dealer IDs. Test first visit accepted/rejected/necessary, second ad visit, UTM-only, organic, direct return and every form path. Track named lead conversions only after acknowledged delivery, with opaque event ID if needed to dedupe, never names/emails/phones/bank data in dataLayer or monitoring.

## 10. Security and operations beyond the feed

### Abuse protection

MWA provides honeypot + Origin check + Mongo shared atomic ten-attempt/ten-minute rate buckets. Reuse the **atomic** property (`findOneAndUpdate` `$inc`, indexed key and TTL) rather than read-count-then-save. Test concurrent requests, database failure, bucket expiry and 429 Retry-After. Include endpoint/site in keys if separate limits are intended; MWA currently shares one bucket across routes. HMAC IP identifiers with a site secret if stronger privacy is required; never store raw IPs unnecessarily.

Production origin checks must derive allowed origins from configured canonical/approved preview origins. Do not authorize a caller merely because it supplied matching malicious Host and Origin headers. Trust forwarded host/IP only behind an edge that replaces them. Missing Origin requires independent validation/rate/bot defenses. Apply bounded request bytes and field lengths before costly provider work. Consider Turnstile (as in hardened reference) for all public collection forms; its hostname/action/token checks are server-side, not merely widget presence.

### Email safety

MWA `escapeEmailData` recursively escapes interpolated strings; template markup stays trusted. Port the helper or use a typed email component renderer with escaping. Treat subject/from/to/reply-to as separately validated fields; do not HTML-escape an address then use it as an actual recipient. Check Resend `result.error` (SDK can resolve with an error). Do not copy developer CCs, MWA recipient defaults or finance PII into logs. Return generic safe error to browser; preserve operational channel status in private outbox/alerts.

### CMS and exposed routes

Restrict Listings/Payments/admin-only globals and mutations to actual admins; public showroom `/api/listings` remains a deliberate sanitized route. CMS REST `/api/listings/{cmsId}` must not inherit public access just because the public route shares a prefix. Test actual requests to REST and GraphQL, not only an access helper.

Authenticate seed calls as the real requesting user, require admin, no “take first database admin” impersonation. Close first-user registration after private provisioning, disable unused GraphQL/playground and other exposed scaffolding. Review `overrideAccess` before each local privileged call. Database/model setup can write automatically: use disposable fixtures for testing and no real-data seeds/migrations during audit.

### Payments: explicit P0 decision

Old templates and MWA retain payment creation/status routes. Template 2 has an active reservation-modal caller. Determine the product's intended behavior **before** removal or reactivation:

- If no deposits: remove/disable creation/status/webhook routes, unused collections/credentials and misleading UI; replace caller with clearly worded reservation enquiry flow.
- If deposits are an authorized existing feature: retain functionality only after server-owned amount and current eligible stock, per-payment access cookie/token/authorization, provider sandbox/live configuration, idempotent monotonic webhook handling, notifications/reconciliation and privacy-safe status projection are implemented and verified.
- Missing signature config must fail closed; validate timing-safe raw-body signature **before** parsing or storage access, as MWA improved. Genuine captured provider request needed before shipping signature changes. Synthetic HMAC tests alone are insufficient.
- Do not copy MWA's sandbox institution/store/tunnel constants, browser-controlled amount or broad paymentRecord response. A webhook acknowledgement is not proof a payment was successful. A lead enquiry amount is not proof any deposit was collected.

This audit performs no money movement or payment probes.

### Monitoring/configuration/dependencies

Port operational fixed codes, instrumentation server/client and redaction from MWA, but configure dealer tag/environment rather than `[MWA]` hardcoding or always “production”. Strip cookies/auth/keys/query/body/customer finance data; sanitize exception/breadcrumb content too. Do not capture every console.log or sample a huge volume of stock debug events. Classify expected navigation cancellation/404 without suppressing real API failures. Confirm GlitchTip alert receipt with a non-PII test in staging.

Expose a safe health check for stock reachability/last success/stale/limit, DB connectivity and template revision. No private hosts/UUIDs or personal form counts/details; status 503 when unhealthy. Schedule authenticated retry/housekeeping if using outbox. Document single-instance/cache limitations, DB/media backups and restore procedure.

Inspect package/lockfile/runtime rather than copying historical version prose. Template 1 package declares Next `^15.4.8`, Payload `^3.68.2`, React `^19.2.1`; template 2 declares Next `^15.5.14`, Payload `^3.80.0`, React `^19.2.4`. These ranges are not proof of the installed lockfile runtime. MWA inspected pins Next `16.4.3`, Payload `3.92.0`, React `19.3.1`; treat as reference revision, not evergreen latest/safe advice.

Choose a compatible patched framework set after checking current official guidance/advisories at implementation time. Align all Payload packages, regenerate types/import map, test breaking Next/React conventions and exact locked versions. Remove unused adapters and provider code deliberately. Normalize npm scripts/CI/Docker: even MWA still contains pnpm in legacy test scripts. Add working `type-check`, ESLint, isolated integration tests, production build and smoke commands. Run audit and report actual unresolved vulnerabilities/mitigations; don't reuse an old “zero high” statement.

## 11. SEO, data fetching and performance integration

Preserve template design and canonical routes. Use configured dealer identity/canonical origin rather than MWA constants or mixed Northline/Premier placeholders. Vehicle metadata/JSON-LD/sitemap must use the same public inventory as the UI. Sold/removed car absent → real 404 or intentional permanent canonical redirect, outage → explicit unavailable, no resurrection from CMS.

Slug identity needs a deliberate robust rule: don't parse the last `-` token when real stock IDs can contain hyphens. Preserve published legacy URLs with a tested resolver that matches known stock IDs/canonical slugs; prefer explicit unambiguous ID segment for future route designs with redirects. Test make/model containing hyphens, stale renamed model slugs and provider UUID-like IDs. Do not globally change slug generation without a redirect map.

Vehicle sitemaps list only public stock; makes sitemaps only actual available makes. No admin/API/staging indexing; consistent robots/canonical/OG and structured data. Don't fabricate current lastmod on every request or fake aggregateRating. Omit missing timestamps/ratings unless genuinely evidenced. Structured data price and availability match displayed VAT-aware value/reservation state; don't mark every reserved car InStock unconditionally. Escape JSON-LD `<` as `\u003c` to avoid script breakouts.

Use direct server functions for data fetching; avoid build-time self HTTP calls/internal domains. Distinguish React request memoization, process data cache, CMS cache, route render cache and browser/CDN caching. Only one layer should own a given source freshness decision. Test cached public APIs with query strings, errors, multi-instance operation and upstream key failures.

Keep stable CMS/contact config cached with proper revalidation; optional contact errors must show a clear degraded state/log rather than incorrect dealer details. Don't block every static page on a huge full-stock read when a safe cached navigation summary suffices. Batch independent reads with Promise.all where correct; share main+similar CMS lookup. Avoid repeatedly paging the full feed from every API route.

Load decorative/hero images appropriately, generate image sizes, configure trusted CDN/DMS-upload image origins, avoid unbounded remote image allowlists. Lazy/interaction-load finance/maps widgets, reserve layout space, use consent-aware analytics and locally hosted fonts where appropriate. Measure comparable mobile home/showroom/detail Lighthouse performance/accessibility/SEO before/after; record numbers, no unmeasured score promises. Keep customer keyboard/form errors/focus/responsive 320/390/768/1440 behavior intact.

## 12. Step-by-step implementation order

1. Create baseline caller/form map and source revision report, inspect rules/dirty files, choose safe branch/variant. Record target environment **names**, preserve live client copy/design/content.
2. Confirm DMS endpoint/auth/enforcement/IDs with deployment owner; do not test by submitting production leads. Get missing secrets through approved secure setup, never chat/Git.
3. Introduce normalized server config and public DTO/types. Build isolated fixtures containing >100 cars, available, Reserved, hidden, prep, sold, deleted and malformed rows, Ex VAT/POA and empty feed.
4. Implement shared DMS loader/cache/public predicate. Replace routes, server pages/layout, filters/detail/featured/sitemaps/metadata/seed reads. Remove active provider/dummy/CMS-stock fallback and duplicate caches.
5. Resolve local price/description overlays deliberately, introduce unified presentation helpers, public DTO projection and VAT/Reserved UI. Preserve API response shape and slugs; add redirect/error handling.
6. Add server lead config/delivery/schema/abuse defenses. Convert every client caller, including template 2 direct webhook modals. Preserve all form semantics/context/attribution, stable retry IDs and proper acknowledgement.
7. Implement durable outbox/retry as required for the reusable target; add separate email status, safe UI pending/error, conversion gating and privacy/retention.
8. Audit/resolve CMS first-user/access/seed/GraphQL, legacy payments decision, security headers/secrets/proxy configuration. Upgrade compatible dependencies with separate regression evidence if substantial.
9. Wire dealer-neutral monitoring/health/CI/configuration/SEO/performance and deployment docs. No copy-pasted MWA identity or secret defaults.
10. Run automated and actual production HTTP checks on isolated fixtures, inspect full diff, fill acceptance matrix and before/after workflow list. List human live acceptance and blockers explicitly.
11. Human provisions missing settings/migrations, reviews and deploys to staging, then verifies real stock reads and approved test lead receipt (including attribution/vehicle linkage) without disturbing production customers. Roll out one site/family at a time; track version/adoption.

## 13. Coverage and verification checklist

### Port these reference tests as behavior references

MWA `tests/int/website-stock.int.spec.ts` covers paging, dedupe, cache and email/key compatibility; revise its loose missing-success/missing-publication fixtures for stricter target contract. `lead-delivery.int.spec.ts` proves server route overwrite and failure vs email; strengthen `{}` HTTP-200 mock to real persisted ack. `reserved-status.int.spec.ts` asserts MWA's permissive policy: do **not** blindly copy those expectations for new strict feed consumers.

Also inspect `dms-lead-config`, `lead-spam`, `email-safety`, `vehicle-detail`, `stock-cache-headers`, `payment-signature`, `seed-auth`, `monitoring`, `promotion-html` tests. New checks must cover the stronger snippets' contracts. Tests that assert source strings or mock every dependency cannot establish end-to-end behavior.

### Required scenarios

| Area | Evidence required |
| --- | --- |
| Config/identity | Missing/invalid key, optional explicit email transition, rejected key never falls back, invalid dealer UUID/secret, wrong advertiser, canonical/proxy configuration |
| Complete stock | >100 rows/3 pages, duplicate IDs, authoritative empty, malformed envelope/one malformed row/all malformed, page2 failure, cap breach, response serialization |
| Status/visibility | FORECOURT + published, Reserved + published, NotReserved text, missing/NOT_PUBLISHED, sold/deleted/prep/Due In; all consumers/sitemaps agree |
| Cache | Cold/concurrent requests single-flight, fresh hit, background refresh, failure below max stale, hard expiry, restart, empty replaces old stock, invalidation and late in-flight response, layered CDN age |
| API/query | Existing response shapes, finite pagination/ranges, unknown sort/NaN/% names/zero mileage, errors/missing no-store, valid empty vs 503 vs 404 |
| Price/overlay | All VAT modes, authoritative total/admin fee/POA, missing price, separate forecourt, CMS conflict resolution, display/filter/finance/schema consistency |
| Client forms | Every actual modal/page/variant uses local API and includes right stock context; no direct public webhook; missing/invalid fields, large/malformed JSON, inputs retained |
| DMS lead ack | 201 new/200 duplicate with ID; 200 `{}`/HTML/success false/missing ID fails; 400/401/429/500/timeout preserves input and same UUID; malicious routing overwritten |
| Retry/delivery | Timeout after persistence returns one DMS lead on retry, email independent failure, outbox dedupe/atomic worker/retention, no duplicate customer conversion |
| Reservation | Correct wrapper unwrapping and body submissionId/attribution; pence distinction; no-payment enquiry semantics; stock availability server check |
| Attribution | First/last touch, UTM-only, organic/referral, direct revisit, cookie rejection/necessary/default, consent change and storage blocked; stored DMS touches verified |
| Abuse | Honeypot every form, trusted Origin/proxy, forged forwarded headers, atomic concurrent limit/expiry/DB outage, bot-token host/action/failure where configured |
| Security/PII | No keys/dealer routing/advertiser IDs/VIN/finance internals in public output/logs; email escaping/recipients; private CMS/seed/first-user/GraphQL |
| Payments | Disabled path returns intentional unavailable OR approved provider sandbox creation/status authorization/signature/monotonic retry/amount rules; captured signature acceptance |
| SEO/render | Real production HTTP 404/canonical redirect, hyphen IDs/slugs, no fake ratings, sitemap agreement, outage not false missing, no admin/API/staging indexing |
| Performance/ops | Full build, home/showroom/detail comparable metrics, responsive/accessibility, sanitized alert/health failure, cron retry, multi-instance limits documented |

For every row record PASS / FAIL / NOT RUN, source revision/environment/fixture or real provider, command/output summary and remaining setup. Fill a second table per workflow: before behavior → after behavior → intended change/unchanged → evidence. Important workflows are stock/cards/detail/search/featured/makes/sitemap, every form category, attribution, finance widgets, reservation/payments, CMS/seed and monitoring.

### Commands and safe test setup

Target scripts differ; inspect them first. Use npm, not old pnpm/Yarn wrapper scripts. Typical modernized commands:

```sh
npm run type-check
npx eslint <changed-ts-and-tsx-files>
npm run test:int
npm run build
```

Only build/test with isolated DB/provider fixtures; some Next/Payload builds connect to databases or create indexes. Confirm fixtures before running, never use production env for tests. MWA smoke test explicitly rejects nonlocal REVIEW_BASE_URL and needs a running **production build** with a reserved-stock fixture:

```sh
REVIEW_BASE_URL=http://localhost:4320 node --test tests/smoke/production-smoke.test.mjs
```

Read its expectations and adapt dealer canonical values/path/strict visibility. Do not report tests skipped without REVIEW_BASE_URL as passed smoke coverage. Build alone doesn't run those HTTP assertions. Confirm the actual Node runtime and framework installed versions. Run dependency audit and record exact date/result without replacing lockfiles merely for audit.

No query changes in this documentation task. Any later DMS query change needs old/new authorized SELECT comparison per CLAUDE.md, temporary verification script removed afterwards. No real database writes by agent. Endpoint auth/request/response changes need Swagger update plus normal architecture/backend/frontend/README checks. The known lead Swagger gap needs a separately reviewed documentation correction if taken on, not an unannounced contract change.

### Final diff review / PR handoff

Review entire diff: no unscoped tenant selection, fake fallbacks, duplicate route URLs, wrong response envelope, unsupported price fields, stale resurrection, email-only success, missed client form, unsafe payment revival, secret/body logging, broad CMS access, unintended branding/slug break or deleted user files. Re-read earlier MWA review findings and tests; say which were corrected or deliberately deferred.

Prepare a PR description containing: scope/template/reference revisions; prioritized fixes; workflow before/after table; checks/results and not-run items; manual reproduction/acceptance steps; human config/deployment/rollback; artifact currency; risks (lead loss/duplication, money/VAT, payment webhooks, AutoTrader publication, CMS privileged writes/bulk imports). A public-site modernization should not change AutoTrader webhook signature logic or stock mutation behavior silently. Human review required; reviewer assignment follows current user preference, no automatic merge. Commit/push/PR only if requested.

Rollback application separately from settings: keep old key/lead configuration compatible where safe, retain outbox/backup data, do not reintroduce credentials/dummy stock or undo DMS-saved leads. An already saved lead is not removed because the website rollback occurred. Track template version and fleet adoption before retiring legacy email feed access.

## 14. Troubleshooting during the port

| Symptom | Likely integration mistake / next check |
| --- | --- |
| First 100 vehicles only | Current-page length used as total; duplicate page loops; pagination metadata ignored |
| Wrong dealer stock | Copied email/default advertiser, stale cache not isolated by deployment, wrong website key; never fix with browser-supplied dealerId |
| DMS 401 yet site still shows cars | Permissive fallback after invalid key, old CMS stock, unlimited stale/CDN layer; distinguish bounded stale mode from successful refresh |
| Reserved card opens 404 | Detail/page retained FORECOURT-only condition or uses a different service than showroom |
| Sold car comes back | CMS fallback, independent detail cache, fake fallback, stale snapshot refreshed on failure, wrong shared visibility |
| DMS delivery 401 | Website missing x-webhook-secret or wrong deployment secret; confirm DMS enforcement mode without weakening auth |
| Form says success but no DMS lead | Email-only OR success, direct browser webhook path, bad receiver URL, 2xx accepted without persisted ack |
| Reservation rejected as invalid enquiry | Missing affiliateId inside unwrapped data, wrong customerDetails/phone shape, unsupported zero-amount reservation branch |
| Duplicate lead/email after retry | New submissionId per attempt, ID placed outside reservation data, header-only idempotency, independent channels not tracked |
| Attribution missing | Capture not mounted, cookies blocked/consent, proxy drops firstTouch/lastTouch, wrapper fields at wrong level |
| Every real form 403 behind proxy | Canonical/approved origin mismatch or internal request URL used as only allowed origin; configure trust explicitly |
| Price differs between card/finance/schema | CMS override, base/total VAT mismatch, separate helper or cached API; inspect authoritative DMS price contract |
| Unknown URLs return 200 or 500 | Streaming loading boundary, swallowed Next notFound/redirect signal, render-mode change from shared layout fetch |
| Build fails after copying MWA | Unaligned dependencies/old node_modules, duplicate route-group URL, missing server-only boundary, CMS generated types or framework-version mismatch |

## 15. Initial prompt for the phase-two agent

```text
Modernize <TARGET_TEMPLATE_PATH> using MYDV-DMS/docs/dealer-template-modernization-audit.md.
The source comparison is templates 1 and 2 vs dms-1-mwaautos at recorded revisions.
Read current target rules, MWA source and current DMS receiver/feed before changes;
treat MWA as a reference with the documented caveats, not a folder to copy wholesale.

Preserve the target's public design, branding, URLs, content and valid customer flows.
Implement the full public-site foundation: one authenticated DMS stock source with
complete paging/public visibility/VAT-aware presentation/bounded honest cache;
replace every legacy provider/fake/CMS-stock fallback and independent consumer;
convert every form to local server routes with server-owned dealer UUID and secret,
validated DMS persistence acknowledgement, attribution, stable retry identity,
abuse prevention, safe email and durable delivery recovery. Resolve CMS price overlays,
reservation-vs-payment behavior and all documented security/configuration/SEO issues.
Do not enable Light DMS staff features unless separately requested.

Start with a caller/form map and baseline. Use the guide's code snippets and reference
paths, adapt types/routes/tests to this template, and complete its acceptance matrix.
Do not copy MWA identity/secrets/customer data, mutate a real database, run DMS migrations,
submit production leads/payments/listings or disturb live clients. Continue useful local
implementation with isolated fixtures when human credentials/setup are missing.

Run type-check, changed-file ESLint, isolated tests, production build and real local
production HTTP smoke checks, review the whole diff and report before/after workflows,
actual results/not-run live acceptance, risks and precise human setup steps. Prepare the
PR description. Do not commit/push/publish/send messages or merge without authorization.
```
