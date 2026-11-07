# Light DMS: complete dealer-template implementation guide

Prepared 5 November 2026. This is the reusable handoff for adding the complete Light DMS to **any dealer website template**, while keeping that template's public design and existing customer journeys. Give this file to the implementing agent together with the target repository and access to the reference implementation. This task is website-side integration; the DMS capability already exists.

## Contents

1. [Scope, authority and resolved decisions](#1-scope-authority-and-resolved-decisions)
2. [Discovery and template adaptation](#2-discovery-and-template-adaptation)
3. [Architecture and access](#3-architecture-and-access)
4. [Reference code and porting manifest](#4-reference-code-and-porting-manifest)
5. [Configuration and provisioning](#5-configuration-and-provisioning)
6. [Authentication and website route contracts](#6-authentication-and-website-route-contracts)
7. [DMS API reference](#7-dms-api-reference)
8. [Vehicle Finder and adding stock](#8-vehicle-finder-and-adding-stock)
9. [Editing stock and publication](#9-editing-stock-and-publication)
10. [Public inventory integration](#10-public-inventory-integration)
11. [Sold archive and permanent media](#11-sold-archive-and-permanent-media)
12. [Workspace UX and template preservation](#12-workspace-ux-and-template-preservation)
13. [Security, dependencies and forms](#13-security-dependencies-and-forms)
14. [Operations, SEO and performance](#14-operations-seo-and-performance)
15. [Implementation sequence and deployment](#15-implementation-sequence-and-deployment)
16. [Acceptance and release evidence](#16-acceptance-and-release-evidence)
17. [Troubleshooting](#17-troubleshooting)
18. [Copy-ready agent task](#18-copy-ready-agent-task)

## 1. Scope, authority and resolved decisions

### Source material and verification boundary

This guide consolidates the original [specification](../light-dms.md), [initial handoff](light-dms-handoff.md), [Vehicle Finder verification](light-dms-finder-verification.md), [template hardening/deployment guide](light-dms-template-hardening.md), and supplied **Light DMS Website: Developer Handoff** (Workstreams A–F). It was checked against these local source revisions:

- DMS: `MYDV-DMS`, commit `e8902379`.
- Working website: `../buy-brand-light-dms-demo`, commit `8993d30`, package `mydv-light-dms-template` version `2.0.0`.
- Reference repository: `https://github.com/mydealershipview/buy-brand-light-dms`.
- Sampled siblings: `dms-template-1`, `dms-template-3`, `dms-template-6`, `dms-template-10`, and original `template-11-buy-brand`.

Recheck deployed API availability and the reference HEAD before a port. Local source inspection does not establish that a particular deployment has migrations, keys, provider access or operational settings configured. Old handoffs contain historical branch names, test counts and “no remote” statements: these are historical evidence, not new setup instructions. Do not copy their real dealer emails, registrations, identifiers, credentials or staging account assumptions into another deployment.

For implementation, follow the target repository's AGENTS.md/CLAUDE.md and installed framework guides. If source and this document differ, investigate the contract and update the handoff; do not invent an endpoint. For DMS auth/request/response changes, update `src/lib/swagger.ts` in the same change. Never run DMS migrations or mutate a real database as an assistant; hand required setup/migrations to the human. Do not commit, push, publish or send external messages unless authorized for that task.

### Required feature set

Deliver a branded, authenticated `/admin` workspace with stock search/filter/pagination/counts; Vehicle Finder; four valuation types; MOT history; on-demand vehicle checks; add with stable retry identity; stock details; price and listing VAT; status/reservation/sold/delete; upload/reorder/remove photos; AutoTrader channel and subscribed-feed selection; website highlight editing; and self-service Sold cars management.

**Client direction added 5 November 2026:** the add-car page and listing management must look better, sharper and premium, taking inspiration from AutoPrestige's part-exchange and other customer forms. They must also accommodate partner feeds such as AA Cars and CarGurus. This is required acceptance scope for every Light DMS variant; a functional but basic port of the existing workspace is insufficient. See the concrete visual brief in section 12 and feed integration requirements in section 9.

Also integrate the public website: keyed stock source, Reserved badges, correct VAT display, consistent visibility everywhere, bounded stale cache, public Sold Cars page with permanent images, safe forms, secure CMS, health/monitoring, cron recovery, SEO and regression checks. A login page and proxy alone do not satisfy the task.

### Superseded instructions and current decisions

| Topic | Implement now | Historical instruction to avoid |
| --- | --- | --- |
| Highlight | DMS `stock_cache.website_highlight`, max 60 characters, feed + narrow authenticated PATCH; blank falls back to attention grabber | Mongo `vehicle-overrides` as the active store; “never sent to DMS” comments |
| Meaning of website-only highlight | Stored in DMS for shared editing, **never sent to AutoTrader** | Treating website-only as “must live in the website DB” |
| Reservation visibility | `includeReserved=true`; published FORECOURT and SALE_IN_PROGRESS remain visible; badge from `reserved === true` | Hiding every non-Available car or detecting reservation text |
| Status propagation | DMS cache updates synchronously; website invalidates inventory; no persistent showroom hides | Indefinite Sold/Deleted hides or 24-hour hide expiry rules |
| Online payments | Removed from the hardened Light DMS baseline; reservation **enquiries** remain | Shipping dormant Atoa creation/status/webhook endpoints or implying deposit confirmation |
| Sign-out | DMS token revocation first, then clear scoped cookies | Cookie-only sign-out |
| Callback | Exact registered HTTPS origin, including `www` and port | Treating bare and `www` as interchangeable |
| Optional Finder data | Authenticated valuations/MOT/check projections supported | Excluding all valuations because the original add-only spec did |
| Stale inventory | Default maximum age 12 hours; clear stale cache on status attempts, including ambiguous timeout | Unlimited stale stock, dummy cars or direct AutoTrader fallback |
| Sold photos | Copy up to 10 by default to owned media; failed copies remain pending | Permanent archive that depends on provider image URLs |
| Local databases | Separate per deployment; only archive/outbox/CMS data, no competing live-stock source | Copying a live customer's database into a demo |

These defaults are already implemented in the reference: 60-second process cache; 12-hour maximum stale age; 10 sold photos (configurable 1–30); 7-day pending retention with prior workspace notification and authoritative reconciliation; Turnstile; single shared code per template variant with isolated dealer deployments. A product request to change one must be explicit and documented. Existing template designs remain distinct: share the Light DMS logic and configuration conventions rather than replacing every website with BuyBrand's public UI.

## 2. Discovery and template adaptation

Before editing, inspect Git status, target rules, dependencies/lockfile, routes, CMS collections, environment **names** (never dump secret values), deployment settings and existing tests. Record the baseline and leave unrelated changes alone. Use a feature branch or an authorized isolated copy for a new Light DMS variant; do not modify the live client directory as a side effect. A source copy must exclude `.git`, `.env*` secrets, `node_modules`, `.next`, uploaded media and customer data; build the new environment deliberately.

### What the sampled templates show

This is a source-level survey, not a visual/browser audit or a claim that every template has been checked.

| Template family / inspected paths | Integration consequence |
| --- | --- |
| `dms-template-1`: `src/components/home/featured-vehicles.tsx`, `src/components/vehicle/*`, Payload Header and Pages | Wire existing card/gallery/reservation/featured components to the shared inventory and presentation helpers; preserve their layout and CMS blocks |
| `dms-template-3`: `src/components/sections/VehicleListings.tsx`, `VehicleFilters.tsx`, `HeroSection.tsx`, `src/components/Navigation/index.tsx` | Section-based public layout; some families omit Payload entirely. Use equivalent persistence/auth adapters rather than adding a whole CMS just for appearance |
| `dms-template-6`: stock APIs under `src/app/(frontend)/api/...`, plus split home/vehicle components | Route groups do not appear in URLs; avoid creating duplicate `/api/listings` or `/api/listing/[stockId]` routes |
| `dms-template-10`: `src/lib/services/vehicle-listing.service.ts` | Has a separate five-minute cache and direct AutoTrader fallback in the inspected service; replace/bypass that service consistently, not only `utilities/autotrader.ts` |
| `template-11-buy-brand` and hardened demo | Closest ancestry, but even the original has different dependency versions and legacy scripts; use the hardened demo's logic, not assumptions based on folder name |

Legacy package scripts in several templates still call pnpm or removed `next lint`; normalize the converted variant to npm and working ESLint commands. Do not run destructive reinstall scripts. Do not bulk-upgrade unrelated templates during a single-template port.

### Produce a target integration map

Find **all** inventory consumers using `rg`: home counts, featured slider, showroom, search/autocomplete, filters/make-model APIs, detail/metadata, related cars, wishlists, structured data, reservation forms, sitemap generators and background exports. Find direct AutoTrader calls, hardcoded dealer email/IDs, full URL logging, fake stock, price overrides, local hide collections, sold feeds, finance widgets and payment endpoints.

Map each target component to the new shared inventory/presentation layer. A stale wishlist may retain a bookmark, but its removed car must not appear available or open a live enquiry for stale stock. Existing CMS content may enrich non-stock presentation only; it must not override DMS lifecycle, publication, price, VAT or highlight after conversion.

Capture public desktop/mobile baselines and existing form outcomes before changing code. Preserve design, navigation, public content, legal/finance disclosures, route slugs, imagery, colours, typography and integrations. Add staff access unobtrusively (for example a footer “Dealer login”) and add Sold Cars navigation where appropriate. Do not put admin controls on public cards.

## 3. Architecture and access

### Ownership boundaries

The browser calls its own website `/api/admin/*`. The website server attaches the website key and user session and calls DMS `/api/website-admin/*`. DMS resolves the dealer and delegates permitted mutations through its existing stock/publishing handlers. DMS alone calls AutoTrader. Genuine provider webhooks reconcile DMS stock, which feeds the website.

Public stock is a separate server-to-server read: website → `/api/website/stock` with the website key only. Cron lifecycle reconciliation uses `/api/website/stock-states` with that key. The browser never receives the key, advertiser ID, DMS session, raw provider records, or DMS internal forwarding headers. AutoTrader image CDN URLs are legitimate media, not permission to call AutoTrader's API.

| System | Owns |
| --- | --- |
| DMS | Clerk/dealer/team authorization; website key hash; stock and lifecycle; prices/VAT; prep; channels/feeds; highlight; mutation/audit/revocation; AutoTrader credentials and calls |
| Website | Branded workspace; server proxy; scoped httpOnly cookies; public inventory cache; immutable sold snapshots/history/owned media; CMS public copy; form outbox/rate limits; health/cron |
| AutoTrader | Provider vehicle data, stock/publication operations, optional valuations/MOT/check access, webhook events |

Do not create a second website inventory database, independent price field, independent status system, website passwords for DMS users, or public valuation/check API.

### Dealer access policy

Prerequisites are `integrationMode = AUTOTRADER_CONNECT` and `enableWebsiteAccess = true`. The website key belongs to one existing dealer, not to a new dealership created for each user.

- `package = full`: owner, `store_owner_admin` (Dealer Admin), `sales` and `website_only` can manage the website. Employee, technician, agent and unknown roles are denied by default.
- `package = website_lite`: every dealer user, including the owner, is website-only and may manage the website when prerequisites hold.
- A `website_only` team member on a full package is also restricted to website management.
- Central DMS proxy and `getAuthContext`/`withAuth` deny other DMS APIs (`WEBSITE_ONLY`) and redirect other DMS pages. Hiding menu items is insufficient.
- Platform-admin exemption prevents an administrator being locked out when helping a Lite dealer; do not extend it to normal staff.

DMS source: `src/lib/websiteAccess.ts`, `src/lib/dealerHelper.ts`, `src/proxy.ts`. `/api/me/access` exposes the website permission for the DMS UI; websites use `/api/website-admin/me` instead. Additional people use the existing team invitation flow, not new dealer records or shared credentials. Clerk users are normally created on invitation acceptance; invitations alone do not prove a tested login.

## 4. Reference code and porting manifest

Paths below are relative to the hardened website repository unless prefixed **DMS**. If the local sibling is absent, obtain the reference repository/revision through the project's normal authorized checkout process. This guide does not require that a receiving agent has the original chat or its attachment.

| Files/modules | Port or adapt together |
| --- | --- |
| `src/lightdms/config.ts`, `dms.ts`, `session.ts`, `adminRequest.ts` | Server connection/config validation, fetch timeout/error handling, cookies, local authorization and same-origin writes |
| `src/lightdms/types.ts`, `finderTypes.ts` | Browser API helper/types and normalized Finder contracts; admin list and detail have different shapes |
| `src/lightdms/Workspace.tsx`, `AddVehicle.tsx`, `VehicleEditor.tsx`, `VehicleInsights.tsx`, `SoldCars.tsx`, `ui.tsx` | Stock navigation, stable add retry, editor sections, optional insights and archive management |
| `src/app/(light-dms)/layout.tsx`, `admin.css`, `admin/page.tsx`, `admin/login/page.tsx`, `admin/error.tsx` | Isolated staff layout/styles/authenticated page/error recovery; adapt routes if `/admin` is occupied |
| `src/app/api/admin/auth/{login,callback,logout}/route.ts` | Complete Clerk handoff and revocation lifecycle |
| `src/app/api/admin/dms/[...path]/route.ts` | Exact method/path allowlist; bounded, type-checked upload forwarding |
| `src/app/api/admin/vehicles/[stockId]/{status,highlight}/route.ts` | Status/archive orchestration and highlight write/cache invalidation; do not bypass with generic proxy |
| `src/app/api/admin/sold/route.ts` | Authorized archive list/hide/show/remove/retry |
| `src/lightdms/websiteData.ts`, `copySoldImages.ts`, `src/collections/LightDms/SoldArchive.ts`, `src/collections/Media.ts` | Archive state/history, permanent photos, unique keys, image sizes and access controls |
| `src/utilities/mydealershipview.ts`, `vehicleInventory.ts`, `vehiclePresentation.ts`, `vehicleSEO.ts` | Keyed feed adapter, one visibility rule/cache, VAT/price/highlight/SEO presentation |
| Public APIs `/api/listings`, `/api/listing/[stockId]`, `/api/featured-vehicles`, `/api/available-makes-models` and their consumers | Adapt every existing target stock entry point, not just these file names |
| `src/app/(frontend)/sold-cars/*`, robots and sitemap routes | Confirmed archive presentation and consistent SEO |
| `src/config/*`, `src/collections/SiteContent.ts`, `ContactInfo.ts`, `src/proxy.ts`, `scripts/prepare-site.mjs`, `generate-site-identity.mjs` | Public dealer identity/copy, canonical redirects, generated metadata; adapt to the target's existing configuration model |
| `src/forms/*`, `src/collections/{FormOutbox,FormRateLimits}.ts`, `/api/submit-form`, `/api/submit-reservation` | Validated, protected, durable customer enquiries with retry |
| `src/security/*`, `scripts/create-admin.ts`, `scripts/validate-env.*`, `src/collections/Users/*`, access helpers, `src/payload.config.ts` | Close CMS first-user/admin access gaps; register only required collections/plugins |
| `/api/health`, `/api/cron/housekeeping`, `src/instrumentation.ts`, `next.config.js`, `vercel.json` | Monitoring, recovery, headers/CSP/image hosts, scheduling |
| `scripts/migrate-website-highlights.ts`, `migrate-sold-photos.ts` | Human-run upgrade tools only for existing legacy data; new deployments need no legacy data migration |
| `tests/int/*`, `tests/fixtures/dms-stock-feed.json`, `tests/e2e/frontend.e2e.spec.ts`, `scripts/run-isolated.mjs`, test configs, CI | Port meaningful behavior/contract checks; adapt imports/markup/fixtures rather than copying false-passing tests |

DMS references: `src/app/api/website-admin/**`, `src/lib/websiteAdmin/**`, `src/app/api/website/stock/route.ts`, `src/app/api/website/stock-states/route.ts`, `src/lib/feeds/publicWebsiteVehicle.ts`, `src/lib/swagger.ts`, `src/lib/websiteAccess.ts`, `src/lib/websiteAdmin/websiteOrigin.ts`, `src/lib/listingPrice.ts`, `src/lib/publishChannels.ts`.

Do not replace `payload.config.ts`, `next.config.js`, root layouts, globals, aliases, package.json, proxy/middleware or image host lists wholesale. Merge the needed behavior with existing plugins, CMS schemas, Tailwind setup, redirects and metadata. Regenerate Payload types/import map where applicable. In a non-Payload template, implement equivalent archive/media/outbox storage with the same authorization, isolation, durability and unique constraints. A browser-only/localStorage archive is insufficient.

## 5. Configuration and provisioning

### Website environment checklist

Values are examples/placeholders only. Set secrets privately in deployment configuration; never use `NEXT_PUBLIC_` for DMS keys, advertiser IDs, delivery/storage credentials or session tokens.

| Variable | Meaning / requirement |
| --- | --- |
| `DMS_URL` | DMS **origin**, e.g. `https://app.mydealershipview.com`; no `/api/...`, credentials, query or fragment in new deployments |
| `DMS_WEBSITE_KEY` | Raw per-dealer website token issued by DMS platform admin; not the advertiser ID, Clerk secret, dealer ID or an invented password |
| `DMS_ADVERTISER_ID` | Optional server-only selection among that dealer's registered advertiser IDs; otherwise main advertiser |
| `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_SITE_URL` | Actual canonical website HTTPS origin, aligned with registered DMS contact website; local HTTP only in development |
| `SITE_CANONICAL_HOST`, `SITE_REDIRECT_HOSTS` | Canonical hostname and configured retired aliases; redirect before auth so callback origin is stable |
| `DATABASE_URI` | Dedicated site's MongoDB URI for Payload reference implementation |
| `PAYLOAD_SECRET` | Unique random secret, at least 32 characters; never reuse another dealer's |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT` | Owned permanent media configuration used by reference Payload S3 adapter; separate bucket or properly isolated prefix per dealer |
| `DMS_IMAGE_ORIGINS` | Comma-separated approved HTTPS origins for live DMS-uploaded images and sold-image downloads; also align Next remotePatterns and CSP |
| `STOCK_MAX_STALE_HOURS` | Positive number, default 12 |
| `SOLD_PHOTO_LIMIT` | Integer 1–30, default 10 |
| `SOLD_PENDING_RETENTION_DAYS` | Positive integer, default 7; see cleanup rules below |
| `NEXT_PUBLIC_SITE_PROFILE`, `NEXT_PUBLIC_SITE_COPY` | Reference public branding: use `neutral` + dealer copy for a new dealer; do not inherit compatibility default BuyBrand |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Real per-host form verification; secret remains server-side |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` | Verified sender and dealer destination; no developer CC |
| `FORM_SUBMIT_WEBHOOK_URL`, `VEHICLE_RESERVATION_WEBHOOK_URL` | Form delivery destinations; reservation webhook can fall back to general form webhook |
| `DEALER_ID` | Optional server-side form delivery routing; this does **not** authorize DMS calls |
| `CRON_SECRET` | Random secret, at least 32 characters; protect housekeeping with Bearer header |
| `GLITCHTIP_DSN` | Error monitoring; tag with site identity and strip request secrets/PII |
| `FORMS_TRUST_PROXY` | Default false; true only behind a proxy that strips/replaces forwarded IP headers |
| `SEO_NOINDEX` | True on staging/preview; production verified separately |
| `CSP_SCRIPT_SOURCES`, `CSP_CONNECT_SOURCES`, `CSP_FRAME_SOURCES` | Exact approved additional origins, space-separated in the reference |
| `PROVISION_ADMIN_EMAIL`, `PROVISION_ADMIN_PASSWORD` | Temporary private CMS provisioning inputs; remove after human provisioning |
| `ALLOW_FIRST_USER_SETUP` | False for normal deployments; exceptional controlled setup only |
| `READ_ONLY_VERIFICATION` | Verification-only, never production; does not make arbitrary application routes read-only |

Preserve target-specific public Maps/finance/preview settings as needed. Remove website `AUTOTRADER_API_KEY`, `AUTOTRADER_API_SECRET`, direct API configuration and obsolete Atoa payment secrets. If service-provider credentials were present on any website, coordinate rotation with the credential owner; deleting a file does not revoke a leaked credential.

Production startup must refuse missing required connection settings, weak Payload secrets, non-Mongo URI in the reference, invalid website key (URL-safe token, at least 40 characters), non-HTTPS or non-origin DMS/site URLs, and `READ_ONLY_VERIFICATION=true`. Validate optional numeric settings too. Code already supports an old full feed URL for development compatibility; do not perpetuate it as new configuration.

### Human/platform setup

1. Use the existing dealership, correct advertiser IDs and approved AutoTrader Connect configuration. Enable website access; choose `full` or `website_lite` deliberately. Do not change the package merely to demonstrate login to an existing full-DMS client.
2. Set `company_settings.contact_website` to the exact canonical website HTTPS origin through the supported DMS configuration. This controls sign-in return validation. A production DMS does not accept arbitrary localhost callbacks.
3. Issue the website key in DMS platform dealer administration (`/api/admin/dealer-website-token` is platform-admin tooling, **not** a dealer-site endpoint). Store raw key only on the website server; DMS stores SHA-256 hash. Rotation/revocation invalidates sessions bound to the old key. The key also affects public-feed reads, so coordinate rollout.
4. Confirm required DMS migrations are already applied by a human, including base access/audit schema and `drizzle/0042_website-highlight.sql`. Do not rerun old migrations blindly. `npm run db:migrate` in the DMS always targets production; it is **not** a staging command.
5. Provision separate website database/media, CMS administrator, DNS/TLS, Turnstile, email/webhooks, monitoring and cron. CMS users and DMS/Clerk users are separate identities with separate purposes.
6. Invite staff via the DMS team flow. Verify a real permitted user and a denied role. Never store staff passwords in the template or share another dealer's session.

DMS-only deployment settings, when relevant to DMS maintainers: `WEBSITE_ADMIN_SIGNING_SECRET` (otherwise derived from Clerk secret), `DMS_INTERNAL_URL` (internal forwarding target), `WEBSITE_FEED_REQUIRE_KEY` (fleet-wide retirement switch). These do not belong on dealer websites. Enable mandatory feed keys only after every legacy client has migrated.

## 6. Authentication and website route contracts

### Sign-in lifecycle

1. `/admin/login` links to website `GET /api/admin/auth/login`.
2. Website generates 24 random bytes encoded base64url, sets httpOnly `lightdms_state` for 10 minutes at `/api/admin/auth`, and redirects to `${DMS_URL}/website-admin/connect?redirect_uri=<encoded callback>&state=<random>`.
3. DMS signs in through its own Clerk pages, verifies dealership/user access and the exact registered website origin, and returns to website `/api/admin/auth/callback?code=...&state=...`.
4. Callback requires code, state and expected state cookie, compares state safely and clears it on completion/error. Exchange code **server-side** through `POST /api/website-admin/session` with website key and `{ "code": "..." }`.
5. DMS code lasts two minutes and is single use, claimed atomically across processes. The returned `sessionToken` expires after 12 hours. Do not put it in JSON sent to a browser, localStorage or query strings.
6. Set two host-only, Secure in production, httpOnly, SameSite=Lax cookies with DMS expiry: `lightdms_page_session` at `/admin` and `lightdms_api_session` at `/api/admin`. One cookie cannot have two paths. Clear legacy root `lightdms_session` too when upgrading. Redirect to `/admin` and validate via DMS `/me` before showing stock.
7. Every authenticated DMS call attaches `Authorization: Bearer <DMS_WEBSITE_KEY>` and `X-Website-Session: <token>`. DMS checks dealer equality, key binding, persisted revocation, current Clerk session and website permissions. Clerk active-session checks have a 30-second positive cache; allow for that when testing upstream Clerk revocation.
8. Website `POST /api/admin/auth/logout` calls DMS `/logout` first, then clears both scoped cookies. A revocation failure must be visible, not presented as confirmed remote sign-out. Other Clerk sessions are not globally signed out.

Use configured canonical origin in production, not an untrusted Host header. Local host/port preservation exists only for development. Never add a permissive redirect or CORS exception to work around a wrong registered origin.

### Website endpoints to provide

All protected website routes use the same session guard; **website-local archive operations must validate `/me` before touching storage**, rather than trusting cookie presence. Every mutation requires `X-LightDMS: 1` and same-site Origin validation; refuse a different Origin. Reference permits an absent Origin only with the custom header. No permissive cross-origin API policy. Responses are `Cache-Control: private, no-store` and admin routes are noindex.

| Website method/path | Function |
| --- | --- |
| `GET /api/admin/auth/login` | Start state-protected handoff |
| `GET /api/admin/auth/callback` | Validate state, exchange code, set scoped cookies |
| `POST /api/admin/auth/logout` | Revoke DMS session then clear cookies |
| `GET /api/admin/dms/me` | Proxy DMS access/capabilities/counts |
| `/api/admin/dms/...` | Only the exact allowlisted methods/paths below |
| `POST /api/admin/vehicles/{stockId}/status` | Local sold snapshot orchestration + DMS PATCH status + inventory invalidation |
| `GET /api/admin/vehicles/{stockId}/highlight` | Read current DMS highlight |
| `PUT /api/admin/vehicles/{stockId}/highlight` | Validate max 60, DMS narrow PATCH, invalidate inventory |
| `GET /api/admin/sold?page=1` | Authorized archive list, pending warnings, pagination |
| `POST /api/admin/sold` | `{ "id": "<archive id>", "action": "hide|show|remove|retry" }` |

Generic proxy allowlist: GET `me`, `stock`, `stock/add-status`, `stock/{id}`, `vehicle-lookup`, `vehicle-check`; POST `stock`, `images`; PATCH `stock/{id}/price`, `/channels`, `/feeds`; PUT `stock/{id}/images`. Everything else 404. Status and highlight use dedicated local routes. Encode IDs, validate segments, never accept an arbitrary upstream URL, method or user-supplied forwarding/auth headers. GET query strings contain only expected API parameters. Forward status codes and safe error messages; clear website cookies on 401 and redirect the UI to login.

Important integration requirement: generic proxy success does not invalidate inventory in the inspected reference. Explicitly ensure add, price, images, channels and feeds mutations invalidate the target's public inventory too, in addition to the dedicated status/highlight routes. Reuse a shared mutation helper and test it. Do not claim immediate public freshness while an independent cache still serves old records.

## 7. DMS API reference

Prefix every website-admin path below with `/api/website-admin`. Unless noted, every request needs **both** server-side headers described above. JSON bodies use `Content-Type: application/json`; multipart upload sets its own boundary. Do not call broad `/api/stock/*`, `/api/vehicles`, `/api/listings/*` routes directly from the website. DMS handles their internal auth/forward signature itself.

### Routes and payloads

| Method + relative path | Input | Successful response essentials |
| --- | --- | --- |
| `POST /session` | Website key only; `{code}` | `success`, `sessionToken`, `expiresAt`, safe `user`, `dealer` |
| `POST /logout` | Key + token; no body needed | `success: true`; persists token revocation, including when user permission/upstream session has ended |
| `GET /me` | None | `user: {name,email,role}`, `dealer: {name,package,websiteSoldPage}`, `counts`, `statuses`, `vatStatuses`, `channels: [{key,label}]`, `feeds: [{id,name}]` |
| `GET /stock` | `status=ALL|AVAILABLE|DUE_IN|SALE_IN_PROGRESS|SOLD`, `search`, `page`, `pageSize` (1–100, default 24) | `success`, `vehicles`, `pagination: {page,pageSize,totalResults,totalPages}` |
| `GET /stock/{stockId}` | Dealer-owned stock ID | `success`, `vehicle` detail projection |
| `POST /stock` | Add payload below | HTTP 201, `success`, `stockId`, `lifecycleState`, `adopted`, `inPrep`, optional `prepWarning`, `websiteSoldWarning`, `warning` |
| `GET /stock/add-status` | `requestId=<same addRequestId UUID>` | `success`, `state`, `complete`, nullable `stockId` |
| `GET /vehicle-lookup` | `registration`, `mileage` | `success`, `vehicle`, `insights`, `alreadyInStock: null | {stockId,status}` |
| `GET /vehicle-check` | `registration` | `success`, `source`, `fetchedAt`, `available`, `checks`, optional `warning` |
| `PATCH /stock/{stockId}` | **Only** `{websiteHighlight: string}` | `success`, `websiteHighlight`, optional `warning`; no generic edit capability |
| `PATCH /stock/{stockId}/price` | `{price?: number|string, vatStatus?: "Inc VAT"|"Ex VAT"|"No VAT"}`; at least one | `success`, `stockId`, `price` (advert input), `vatStatus`, optional `warning` |
| `PATCH /stock/{stockId}/status` | `{status, soldDate?, channels?}` | `success`, `stockId`, `status`, optional `unchanged`, `warning` |
| `POST /images` | Multipart field **`image`**, one JPEG/PNG/WebP, nonempty, max 10 MiB | HTTP 201, `success`, `imageId`, `url` |
| `PUT /stock/{stockId}/images` | `{imageIds: string[]}` complete ordered list, 0–100 distinct IDs | `success`, `stockId`, `images: [{imageId,url}]`, optional `warning` |
| `PATCH /stock/{stockId}/channels` | `{channels: {<offered key>: boolean}}`, partial map | `success`, `stockId`, merged `channels`, optional `warning` |
| `PATCH /stock/{stockId}/feeds` | `{feedId: string, enabled: boolean}`, one offered feed | `success`, `stockId`, `feedId`, `enabled`, optional `warning` |

List excludes deleted/wastebin stock. `status=DELETED` is rejected; a legacy unknown lifecycle may appear as `OTHER` and must not be rewritten automatically. Counts use `all`, `available`, `dueIn`, `saleInProgress`, `sold`.

List item fields: `stockId`, `registration`, `make`, `model`, `derivative`, `year`, `mileage`, `colour`, `fuelType`, `status`, `lifecycleState`, `inPrep`, `price`, `advertPrice`, `vatStatus`, `thumbnail`, `imageCount`, `channels`, `updatedAt`. Detail adds `bodyType`, `transmissionType`, `websiteHighlight`, `attentionGrabber`, `description`, `images`, and `feeds: [{id,name,enabled}]`. Nullable prices/dates/specifications remain unavailable, never invented zero values. A list item is not a detail object; fetch detail before editing or archiving.

Current narrow APIs do **not** offer arbitrary post-add editing of registration/specification, attention grabber or full description. They return those fields, and add accepts the fields listed below. Do not render a save button that silently sends unsupported fields. A future broader editor needs an agreed narrow DMS contract + Swagger change.

### Add request example

```json
{
  "addRequestId": "31cb2679-784f-4a21-adc2-d169e61ada2d",
  "registration": "<LOOKED_UP_REGISTRATION>",
  "mileage": 70000,
  "vehicle": {
    "make": "<lookup make>",
    "model": "<lookup model>",
    "derivative": "<lookup derivative>",
    "derivativeId": "<lookup derivativeId>"
  },
  "price": 12500,
  "vatStatus": "No VAT",
  "attentionGrabber": "<up to 30 characters>",
  "description": "<up to 4000 characters>",
  "requiresPrep": false,
  "imageIds": [],
  "channels": { "advertiserAdvert": true, "autotraderAdvert": false },
  "feeds": {},
  "showOnWebsiteSoldPage": false
}
```

Generate the UUID for the actual new operation; the example UUID is not a reusable request identity. Registration is normalized uppercase without spaces, 2–8 alphanumeric characters. Mileage must be integer 1–2,000,000. Price may be omitted/null/blank to create Due In; positive priced creation uses FORECOURT. Price must be finite, positive and below £10m; price edit has a separate minimum £75. Prep requires a price and prevents publishing through existing DMS rules. Use actual lookup data: DMS uses its cached vehicle-finder flow, not the website's arbitrary vehicle schema. The DMS add allowlist takes only make/model/derivative/derivativeId from the supplied `vehicle` object.

Offer `showOnWebsiteSoldPage` only when `/me.dealer.websiteSoldPage` is enabled. This is the existing **DMS** sold-page eligibility option, not `keepOnSoldPage` for the independent website snapshot at sale time. Keep them distinct.

### Error and warning handling

Most admin errors are `{success:false,error,code?}`. Public feed errors may use a different wrapper; validate status + success + expected shape rather than assuming every error has one shape.

| Outcome | UI/action |
| --- | --- |
| 400 | Validation or expired/replayed sign-in code; preserve useful inputs and explain |
| 401 `WEBSITE_KEY_INVALID` / `SESSION_INVALID` | Clear cookies for session failure, request sign-in; key failure needs operator setup |
| 403 `NO_WEBSITE_ACCESS` / optional check package denial | Explain permission/package issue; do not treat it as empty stock or a passed check |
| 404 | Missing/not-owned car or advertiser unavailable; do not leak another dealer's data |
| 409 | Duplicate/prep/lifecycle conflict; refresh authoritative record and explain |
| 413 / 415 from website upload proxy | Too large / unsupported or mismatched image content |
| 5xx, timeout, malformed body | Explicit failure/uncertain outcome; reconcile before retrying writes |
| HTTP success + `warning`, `prepWarning`, `websiteSoldWarning` | Surface it visibly. A successful provider write with a failed audit/local step is not a complete failure |

Never indiscriminately retry mutations. A provider can succeed before a DMS/cache/audit response fails. A later 502 does not prove the provider write failed. Fetch fresh detail/status before deciding. Keep request payload and UUID frozen for add retries.

## 8. Vehicle Finder and adding stock

Build the full Finder flow, not merely a registration text field:

1. Registration and mileage inputs with normalization, bounds, loading and useful errors. Cancel obsolete requests or discard late responses when registration/mileage changes. Clearing/changing identity clears previous insights/checks/duplicate result.
2. Show allowlisted make/model/derivative/year/specification and “already in stock” action. Open the existing record instead of submitting another active car with the same registration. Deleted/wastebin and sold entries are handled by DMS duplicate logic, not registration-keyed local overrides.
3. Show four provider estimates: Retail (`retail`), Private sale (`private`), Part exchange (`partExchange`), Trade (`trade`). Each has `amountGBP: number|null`, returned `vatBasis`, source and optional fetched time. Label them AutoTrader market estimates; never present them as purchase cost, margin, profit or a guaranteed sale value. Missing/nonpositive estimates say unavailable.
4. `insights.motTests` is null when unavailable, `[]` when no tests were returned. Show newest-first date/result/expiry/readings/units and defects (text/type/dangerous). Do not call either state “MOT passed”. Warn when entered mileage conflicts with a comparable previous MOT reading; account for returned units.
5. Provide optional “Load vehicle check” on demand. DMS gates package access. Eleven normalized checks cover stolen, scrapped, imported, exported, high risk, private finance, trade finance, mileage discrepancy, registration changed, colour changed, insurance write-off. Render `flagged|clear|unknown`; missing is unknown. For write-off display the returned category detail.
6. DMS lookup may retry a specification-only read when optional enrichment is refused with 400/403/422; the warning is intentional. It does not retry 401/404. Check errors or missing insights must not block adding the vehicle. Clear previously shown clear results before a failing reload, rather than retaining misleading old checks.
7. Let staff enter advert price/VAT, prep option, attention grabber/description, ordered photos and supported channel/feed choices. Preserve unsaved entry when moving through steps; warn before discarding it. Fetch capabilities from `/me`.
8. Generate one UUID and freeze the exact submitted add payload. Disable double submit. After lost response, query `/stock/add-status?requestId=...`; when complete, open that stock ID. If not complete, retry the **same UUID and payload**. A different car or deliberately new operation gets a new UUID. Do not generate another UUID just because a request timed out.
9. Show success/adopted/prep/pending warnings, invalidate inventory, reload detail/counts. Verify genuine provider/webhook/public visibility separately on the approved staging advertiser.

Existing stock detail offers the same Vehicle information section on demand, using its registration/mileage. Keep read-only insights cached within that editor when navigating between sections, clear them when the car changes, and cancel stale updates. Finder valuations, MOT history and checks must never enter add payloads, public feeds, public API JSON, website globals, overrides, snapshots, logs or analytics.

## 9. Editing stock and publication

### Price and VAT

Use the normalized `advertPrice` as the editable base input and `price` as buyer-facing total where applicable. PATCH accepts price, VAT or both. Advert price updates use the existing DMS rule: a separate forecourt price stays separate; it follows the advert only when previously equal. Never maintain a competing website price override.

VAT options are exactly `Inc VAT`, `Ex VAT`, `No VAT`. Ex VAT total includes 20% VAT; prefer authoritative `retailAdverts.totalPrice.amountGBP`, otherwise use a tested VAT-aware helper. Display total inc VAT and base “+ VAT” together when appropriate. Do not add VAT twice or parse currency strings as authoritative prices. Apply the same numbers to cards, details, filters, sorting, finance inputs, structured data and snapshots; preserve admin-fee/POA behavior. Missing price is “Price not set”/unavailable, not a real £0 offer.

Advert VAT changes affect purchase VAT and DMS margin **unless a purchase VAT override exists** (`follows_unless_overridden`), and DMS audits this. Website users cannot read or send purchase values. Call out this expected financial side effect in release evidence, including future upgrades from Lite to full DMS.

### Status

| Website choice/API value | DMS behavior and public result |
| --- | --- |
| Available / `AVAILABLE` | Existing adverts publication handler; DMS lifecycle FORECOURT; prep block retained; visibility also needs Dealer Website channel published |
| Due In / `DUE_IN` | Existing lifecycle update + unpublish adverts; absent from public stock |
| Sale in progress / `SALE_IN_PROGRESS` | Existing reserve handler; immediate cache consistency; published car stays public with Reserved badge |
| Sold / `SOLD` | Existing lifecycle handler + unpublish adverts, valid UK sold date; archive orchestration below; absent from live showroom |
| Delete / `DELETED` | Existing soft delete; confirmation required; can delete sold stock; re-add creates a new stock ID |

Use a real `YYYY-MM-DD` calendar date, not a timestamp. Default to today in **Europe/London**, refuse future sale dates. DMS itself validates. A sold car cannot move to another status except Deleted via this API; re-add as new stock for a returned car. Repeated same status may return `unchanged: true`. Show custom lifecycle values as Other without forcing a mutation.

The website dedicated status route accepts `{status,soldDate?,keepOnSoldPage?,channels?}` and forwards only permitted DMS fields. Always invalidate current **and stale** inventory in a `finally` after a status attempt: timeout may follow provider success. Never resurrect sold stock from a pre-change cache. No persistent showroom-hide collection or dependency on `lastUpdated` to clear a hide.

### Photos

Upload one file at a time through website proxy → DMS `/images` → AutoTrader, then save the returned image IDs using the **entire ordered list**. Upload alone does not attach a photo. Reorder/removal/replacement share this PUT; `[]` intentionally removes the last/all photos. Preserve video and 360-spin by using this endpoint rather than reconstructing all media.

Validate declared type, file signature and size before forwarding; JPEG/PNG/WebP only, nonempty, up to 10 MiB each, multipart body bounded with modest overhead. Reference checks 10 MiB + 64 KiB envelope, then one file and signature, then streams bounded content upstream. Do not trust filename or MIME alone, buffer unlimited bodies, or claim memory-free streaming when pre-validation already buffers. IDs are 6–80 letters/digits/dashes, max 100, distinct on final save. Provider confirmation is required before showing save success. Provide keyboard-accessible reorder controls as well as drag where used.

### Channels and feeds

Render `/me.channels` dynamically. Current offered AutoTrader keys: `autotraderAdvert` (AT Search & Find), `advertiserAdvert` (Dealer Website), `profileAdvert` (AT Store), `exportAdvert` (AT Linked Advertisers). Manufacturer/Locator is intentionally excluded; do not add `locatorAdvert` merely because an old comment mentions it.

PATCH channel booleans by offered key; partial changes preserve unedited channels. Publishing requires Available/Sale in progress and prep rules still apply (409). A vehicle can exist in admin stock without being publicly advertised. Partner feeds come from `/me.feeds` and detail `feeds`, only active subscribed entries. Use actual IDs, not display labels, guessed keys or all possible subscriptions. Feed mutation is one `{feedId,enabled}` per call. Report partial failure when saving several feeds; do not announce all saved if one failed.

#### Required AA Cars, CarGurus and extensible feed experience

The client's “accommodate feeds” request means working per-car feed controls in **both add-car and listing management**, not partner logos or a static list. Render the dealer's actual subscribed/active feeds from `/me.feeds`; read saved selections from detail `vehicle.feeds`. Keep AutoTrader channels and partner feeds in clearly labeled groups. Unavailable subscriptions must not be switchable; if none are offered, explain that feeds need to be enabled for the dealership. The workspace does not sell subscriptions or configure provider credentials.

Current built-in feed IDs include `aacars` (AA Cars), `cargurus` (CarGurus), `carslinkai`, `mydv_gva` and `gva`, plus active custom `feed_partner:<id>` entries. These examples explain the contract; render the returned names/IDs rather than hardcoding the UI to AA and CarGurus. Do not invent `aa`, `car_gurus` or subscription-config keys as mutation IDs. Motors is currently excluded by `src/lib/websiteAdmin/feedChannels.ts` because the existing update handler has no Motors implementation; a requested unsupported feed needs a separate reviewed DMS capability, not a nonfunctional toggle.

For add, submit offered built-in selections in the `feeds` map, for example `{"feeds":{"aacars":true,"cargurus":false}}`. The current add endpoint maps built-in IDs through `feedChannelKey`; **custom `feed_partner:<id>` selections are not applied by that creation mapping**. If the add form offers custom feed selection, save the car first and then apply those selections through its narrow feeds endpoint using the returned stockId. Preserve the car's successful creation when a later feed request fails; show the remaining feed actions and retry them without creating another car. Apply the same existing prep/publication restrictions; a prep car must not be published through a follow-up feed call.

For listing management, use `PATCH /api/website-admin/stock/{stockId}/feeds` with `{"feedId":"aacars","enabled":true}` or `{"feedId":"cargurus","enabled":true}` via the protected website proxy. Read back detail after saving. Show each feed's selected state, pending action, confirmation or specific failure. A selected/enabled flag is not proof the advert is already live on the partner's site; do not invent delivery timestamps, analytics or publication confirmations the API does not return. Preserve unsaved selections on error, prevent duplicate saves, and make partial completion visible.

Acceptance must include an isolated dealer fixture with AA Cars + CarGurus enabled, another without those subscriptions, and a custom feed. Verify add selections, existing-car enable/disable persistence, dynamic labels, prep rejection, provider failure/partial retry and public stock cache refresh. Confirm real partner delivery separately on an approved staging setup; mocked state alone is not evidence of a live partner advert.

### Highlight

Website PUT calls DMS `PATCH /stock/{id}` with only `{websiteHighlight}`. Trim text, max 60 characters, clear with empty string. DMS stores it and exposes it on detail and public feed when set. Public image line uses highlight, then attention grabber, then no line. Do not send it to AutoTrader or keep a Mongo override as an active fallback. Record the client's written acceptance that website copy can differ from AutoTrader. New stock IDs do not inherit old car overrides by registration.

## 10. Public inventory integration

Use website-server `GET /api/website/stock?page=1&pageSize=100&includeReserved=true` with `Authorization: Bearer <website key>`; append optional `advertiserId` only on that server. No user session is required for public-feed reads. No dealer email/UUID authentication on new sites.

Successful feed shape is `success: true`, `data.vehicles`, `data.pagination` (page/pageSize/totalResults/totalPages/hasNextPage), filters and safe dealer name. It is **not** the admin `{vehicles,pagination}` shape. Current keyed contract header is `X-Website-Stock-Version: 1.2` (verify at deployment) and keyed responses are private/no-store. A website cache may apply its own short TTL; do not let a CDN cache credentials or staff data.

Use DMS `publicWebsiteVehicle` and a sanitized recorded fixture as contract authority. Public fields include stock ID, sanitized vehicle/specification, first registration date, lifecycle/metadata timestamps, advert publication states, price/total/VAT, media/features and optional `websiteHighlight`; opt-in reserved feed includes boolean `reserved`. VIN/internal financial/customer data and Finder insights stay excluded. Do not spread raw admin/provider responses into public JSON. Strip advertiser ID from nested website DTOs, HTML/RSC props, metadata, structured data, cache/status endpoints and sold-listing routes even if upstream compatibility types include it.

Fetch pages of 100, respecting pagination with a safety cap of 50 pages as in the reference; deduplicate/validate IDs and log if the cap truncates a larger fleet. Validate the response envelope centrally. Skip/log malformed individual records without crashing all valid records; reject an invalid entire envelope. Missing stockId, vehicle/metadata objects, or publication status must not create a believable available car. Missing website publication status is not published. Never fabricate “now” timestamps as real feed updates.

A successful empty feed is authoritative empty stock. A rejected/failed/malformed feed is an explicit error or bounded stale mode, never silently `[]`.

### One visibility and presentation policy

Public live inventory requires lifecycle FORECOURT or SALE_IN_PROGRESS and `adverts.retailAdverts.advertiserAdvert.status === 'PUBLISHED'`. DMS public-feed predicates also exclude prep/deleted/ineligible stock. Use `reserved === true` for the Reserved badge, never attention-grabber text. Reuse the same filtered inventory for every public consumer identified in discovery, including dynamic metadata and sitemaps.

Do not route sold archive entries through live-vehicle pages and expose an active purchase/enquiry action. A sold/deleted/hidden vehicle detail returns 404 or an intentional showroom redirect. An inventory outage returns a clear unavailable state, not a misleading 404 proving the car disappeared.

### Cache behavior

- Process cache: 60 seconds, single-flight concurrent reads; record `lastGood.fetchedAt`, successful feed time, failure/stale state.
- On outage serve last good inventory only within configured maximum age (12h default), log periodically rather than per request and expose health degradation. After expiry/no cache, show inventory error UI.
- Invalidate both current and stale data after website mutations; status invalidation also runs after timeout/error. Use a generation/version guard so an older in-flight request cannot repopulate invalidated stock.
- Reference process cache is not durable across restarts and invalidation is not shared across instances. Prefer one long-running instance. Multiple instances/serverless rely on short TTL or need a shared cache for stronger consistency; do not promise global instant invalidation.
- Do not restore local hides as a workaround for a broken DMS cache. Report/reconcile the backend failure.

The DMS also has `status=sold` feed capabilities for its own sold-page eligibility model, and optional reserved/sold ads APIs. The independent website archive is still required for permanent history; it must not disappear when a DMS row is deleted or sold feed eligibility expires. Avoid mixing these models accidentally.

## 11. Sold archive and permanent media

### Sale orchestration

1. Ask “Keep on Sold Cars page?” and sold date; distinguish from the DMS add-time sold-page option.
2. If selected, fetch authenticated DMS detail and current user server-side. Build an explicit public snapshot: stockId/title/registration/make/model/derivative/year/mileage/fuel/transmission/body/colour, display price/VAT, highlight, public description, image sources, sold date. Internal `archivedBy` is admin-only audit metadata, never public output.
3. Copy photos to owned Media/S3 and persist the pending snapshot **before** sending Sold to DMS. Persist a copy warning/pending record if copies fail. If storage cannot save the snapshot at all, fail before changing status; do not claim an archive exists.
4. Send DMS PATCH status Sold. On success confirm the snapshot only when permanent images are ready. Clear inventory in all outcome paths. If no archive was selected, still mark Sold and invalidate.
5. A timeout or downstream failure can leave a valid pending snapshot and an uncertain/successful remote sale. Keep it; show reconciliation guidance. Never delete it as automatic rollback or keep displaying pre-sale cached stock.
6. Public `/sold-cars` uses confirmed + visible + not removed entries only. It has no live availability/purchase promise. A failure reading archive storage is an error state, not “no cars sold”.

The unique current snapshot key is `stockId`; keep replaced versions in history when another snapshot is saved. Normally returned/sold stock must be re-added under a **new** stock ID, so do not bypass DMS sold lifecycle restrictions just to exercise history. Hide/show/remove controls affect website archive only, never DMS inventory. Removal is a soft visibility change; confirmed records/images/history remain permanent. Session authorization must precede any privileged local storage access.

Workspace Sold cars section lists pending/confirmed/visible states, price/date, warning, pagination and hide/show/remove/retry. Retry verifies DMS detail says SOLD (409 otherwise), retries owned image copies and confirms only when safe. Show warnings after partial success rather than a misleading all-green completion.

### Media protection

Copy up to configured photo limit (10 default, 1–30 allowed), generate display sizes, store owned URLs and media IDs. Allow HTTPS AutoTrader production/QA image CDN and explicitly approved `DMS_IMAGE_ORIGINS` only; reject userinfo, untrusted hosts, redirects, unsupported signatures, oversize downloads and timeouts. Do not create a generic URL downloader or accept arbitrary image origins from the client.

Reference uses bounded 10 MiB reads, 15-second download timeout and SHA-256 of stockId + source URL (`soldImageKey`) for reuse on retry. Use unique/indexed keys and handle concurrent attempts safely. Empty source images remain empty without fake stock photography. A failed copy remains pending with source references private for retry; do not claim permanence for a provider photo that was already removed. Never delete owned images still referenced by confirmed snapshots/history.

### Persistence and cleanup

Register admin-only `sold-archive` with unique/indexed stockId, timestamps, public snapshot fields, owned image references, sourceImages (private), confirmed, visible, removed, pendingSince, copyWarning, cleanupNotifiedAt, archivedBy and history. Public reads go through a projected server query, not public CMS collection access.

Housekeeping uses protected `GET /api/cron/housekeeping`. Default eligible pending age is seven days from pendingSince (legacy records may use createdAt); workspace must have shown notification at least 24 hours earlier. Before deleting an unconfirmed entry, request key-only `GET /api/website/stock-states?stockIds=<comma-separated IDs>` (1–50). Response is `{success:true,states:{"<id>":"SOLD"|"..."|null}}` for this dealer only. Retain on errors, omitted IDs or confirmed SOLD state. An explicit null can mean no matching row and is distinct from a failed read. Never substitute the public stock feed for authoritative lifecycle checks: sold/deleted cars are intentionally absent there.

Reference bounds each housekeeping run to 50 pending snapshots and 25 due outbox deliveries, with separate bounded purge of successfully delivered enquiries. Permanent confirmed archives/history are not subject to pending cleanup. Storage-wide deletion/retention changes need explicit product/legal ownership.

## 12. Workspace UX and template preservation

Use the existing proven admin interaction model and adapt branding through design tokens. Public presentation retains the chosen template; admin styles live in their own route layout to avoid changing public buttons, typography or container rules. Reuse existing accessible primitives where possible.

### Client visual brief: sharper, premium add-car and listing management

The client specifically referenced AutoPrestige's part-exchange and other forms. Inspect these source references in `../autoprestige-cars-ltd-8-site` before designing the staff screens:

- `src/app/(frontend)/usedcars/[slug]/_components/modals/PartExchangeModal.tsx`: restrained dark panel, fine border, deliberate spacing, clear section heading, aligned fields and primary action.
- `src/app/(frontend)/valuation/_components/ValuationForm.tsx`: grouped personal/vehicle fields, consistent field styling, responsive columns, section dividers and explicit submission feedback.
- `src/app/(frontend)/finance/_components/FinanceApplicationForm.tsx`: related form composition and longer-input flow; retain only presentation ideas relevant to stock management.

These paths were inspected as source references, not a live visual sign-off. During implementation, review the actual rendered forms and capture reference screenshots in an authorized local/preview environment. Adapt their premium visual language to the chosen dealer template; do not copy AutoPrestige's identity, customer enquiry logic, field requirements or exact brand colours into every client workspace. Keep the existing DMS authentication/API/data rules.

**Add-car / Vehicle Finder:** make registration and mileage the clear starting action. After lookup, present an intentional vehicle summary with its identity, image when available, duplicate warning and concise next step. Group price/VAT, photos, preparation and publication/feed choices into a clear progression with visible section headings and a review summary. Keep valuations/MOT/checks readable and optional detail expandable so they do not overwhelm the add action. Align field heights, labels, helper text, validation and button placement; use the template's typography/colour tokens, controlled contrast and restrained borders/shadows. Display required versus optional inputs clearly. Provide a prominent final add action and distinct busy/saved/retry states without losing entered data or the stable request ID.

**Listing management:** give stock rows/cards a sharp, consistent hierarchy: vehicle thumbnail/identity, price and VAT, lifecycle/prep/Reserved status, then relevant actions. Search, filters and counts must feel like one toolbar. In the editor, retain vehicle context while moving between pricing, photos, website and publication. Present AutoTrader channels and partner feeds as clean labeled rows with readable names, state and save feedback; avoid an undifferentiated block of checkboxes. Make AA Cars, CarGurus and future returned feed entries fit without breaking alignment or requiring new page layouts. Keep delete visually distinct from ordinary edits and confirm destructive actions.

**Interaction quality:** readable text, deliberate spacing, crisp focus/hover/disabled states, accessible contrast and keyboard operation are part of “premium”. Avoid decoration that obscures errors or availability. On mobile, stack fields and actions in a coherent order; keep the current step/vehicle and save outcome understandable without horizontal scrolling. Any sticky action area must not cover form errors, keyboard-focused fields or content.

**Visual acceptance:** capture the authenticated add-car flow (empty, lookup result, validation error, review/submission), stock list and listing editor/feed section at mobile and desktop widths. Compare them with the recorded pre-change workspace and the AutoPrestige references. Review hierarchy, alignment, field consistency, whitespace, action clarity and feedback, alongside the existing 320/390/768/1440 overflow/accessibility checks. Include realistic long vehicle names, no-photo stock, zero/one/many feeds and a partially failed feed save. Attach this evidence to the implementation PR; passing functionality tests alone does not satisfy the client's visual requirement.

Required screens/states:

- Login with “Sign in with MYDEALERSHIPVIEW”, permission/configuration/expired-session recovery.
- Workspace shell showing dealer/user, My stock, Vehicle finder, Sold cars, and sign out.
- Stock list with counts, search, status tabs/filter, pagination, compact vehicle summary/thumbnail, price/VAT, prep and Reserved state. Keep controls usable on mobile.
- Detail editor with clear sections for overview/price, status, photos, listings/feeds, website highlight and on-demand Vehicle information. Show selected vehicle context and a clear back action.
- Finder with retained inputs, review/add state, duplicate-open action, valuations/MOT, optional check and reliable retry.
- Sold archive list and warning/recovery states described above.
- Loading, empty, permission denied, missing vehicle, partial provider data, timeout, offline, unsaved changes and mutation-in-progress states. Failure cannot appear as a legitimate empty list or saved result.

Use labels/help text, keyboard focus, focus-visible treatment, accessible modal/dialog announcements, proper buttons and contrast. Confirm destructive delete/remove separately from ordinary save. Disable duplicate writes; cancel reads safely; avoid losing unsaved changes when switching cards/sections. Long registrations/models/descriptions/check lists must wrap. Verify at 320, 390, 768 and 1440 CSS pixels with no page overflow and no inaccessible controls.

Public cards/detail use the same highlight, price/VAT and Reserved helpers even if each template renders them differently. Reserved is separate from website highlight. Do not remove a site's finance widget, customer contact options or legal copy accidentally; move costly scripts below the fold/behind interaction when needed, keeping consent and functionality.

## 13. Security, dependencies and forms

The attached developer handoff's A–F requirements are release requirements, including those in the underlying template rather than only in Light DMS code.

### Framework/CMS and dependency baseline

Inspect actual target Next/React/Payload compatibility and installed migration guides before coding. The reference inspected here pins Next `16.4.2`, React/React DOM `19.3.1`, and all Payload packages `3.91.0`; these identify the reviewed source, **not** a permanent statement of latest/safe versions. Re-audit at implementation time. Keep Payload packages aligned on one compatible exact version; Next/React aligned too, npm lockfile reproducible, no floating direct dependency ranges in the hardened variant. Remove unused adapters/dependencies only after verifying imports/plugins.

Run `npm audit --omit=dev` and report each unresolved critical/high advisory with applicability, mitigation/owner or release blocker. An old report claiming an audit count is not current evidence. Generate CMS types/import map and test public/CMS/admin after upgrades. Avoid combining incompatible Next-16-only proxy changes with an older template; use the installed version's supported convention.

### CMS access and first-user registration

`/admin` is Light DMS; reference CMS is `/websiteadmin`. If the target uses `/admin` for its CMS, move the CMS deliberately and update all links/configuration or choose a coordinated distinct staff path and adapt cookie paths/callbacks/tests. Do not create overlapping catch-all routes.

Private CMS collections (Users, Listings, archives, form outbox/rate counters and any legacy Payments/overrides) require explicit admin access. Do not grant every Payload-authenticated user admin rights. Privileged `overrideAccess` calls are server-only and guarded first. Public CMS create-first-user/first-register must be blocked in production. Human runs `npm run provision:admin` privately for a fresh reference site, using temporary provisioning env; script is idempotent and must not reset existing credentials or add a surprise different initial admin. Remove secrets afterwards. Any exceptional first-user switch must refuse startup once users exist, then be removed.

Disable unused GraphQL/playground, public seed endpoints, legacy public affiliate-ID/admin endpoints and unused payment surface. Preserve a required integration only with explicit authorization and tested auth. `READ_ONLY_VERIFICATION` is forbidden in production because it skips index/collection setup; never describe it as a safe way to invoke real write routes.

### Headers and secret handling

Set HSTS for HTTPS deployments (`max-age=31536000; includeSubDomains` when appropriate to the domain), nosniff, SAMEORIGIN/frame-ancestors, strict-origin-when-cross-origin Referrer-Policy and camera/microphone/geolocation restrictions. Add CSP report-only first for actual scripts/connect/frame/image sources (finance, analytics, maps, Turnstile, DMS/media), then enforce after review. Merge with target existing headers; verify public/admin/API responses. Admin/API responses are private/no-store and noindex.

Do not log full DMS URLs, credentials, callback codes, cookies, bodies, raw provider data or personal enquiries. Sanitize monitoring context. Keep tokens out of client bundles/RSC props/source maps/fixtures. No stock modification with website key alone; no user-controlled dealerId or advertiser selection crossing another dealer's boundary.

### Customer forms

Inventory administration must not break enquiry, reservation, part-exchange, finance or contact forms. Apply shared server validation, field length limits, escaped outgoing email and appropriate privacy notice links. Validate real Turnstile tokens for action `dealer-form` and configured hostname, plus honeypot; missing token/config fails closed. No test keys on live sites.

Persist each verified submission to a private outbox **before delivery**, with separate email/webhook state, stable submissionId/Idempotency-Key and bounded retry/backoff. Preserve a delivery when the other channel fails; receivers deduplicate. Private operations UI shows unresolved deliveries. Reference purges successfully delivered enquiries after 30 days; failures remain for intervention. Confirm retention with the dealer's privacy policy.

Rate limit per endpoint/IP: reference default 10 attempts/15 minutes, atomic shared Mongo counters with TTL and HMAC-hashed IP identity. In-memory counters alone do not work across instances; avoid read-then-write races. Trust forwarded IPs only behind the configured trusted proxy (or the known hosting platform). Do not copy the developer's email as a notification recipient.

Reservation forms in this baseline send enquiries, take **no payment**, and do not imply that submission has reserved the car or set DMS status. Resolve current stock server-side before presenting vehicle information as authoritative. If deposits are separately requested, scope them as a new payment feature: server-owned amount/current eligible stock, environment-specific provider settings, idempotent monotonic webhook state, dealer/customer notifications, agreed DMS reserve behavior, rate limits and genuine captured signature tests. Never revive the old dormant endpoints just to preserve a URL.

## 14. Operations, SEO and performance

Use dealer configuration/CMS for names, addresses, email, phones, locations, logos, colours, opening hours, socials, public copy/imagery, legal entity/FCA/finance details. Avoid hardcoded hostname redirects. Public profile dictionaries contain no secret identity. Search source for the original dealer's name/town/domain/phone; legitimate occurrences belong only to explicit seed/config/docs. Prepare a second neutral dealer profile to prove configuration-only reuse. Do not transplant BuyBrand's consent/legal/finance statements to another business unchecked.

For shared maintenance, publish/version one Light DMS implementation per design-template family and deploy per dealer with isolated env/database/media. Record template version + source revision. Prefer configuration over dealer-specific forks; if forks are required, document how updates/security fixes are propagated and track their versions. Set up grouped dependency updates (Payload together; Next/React together) and CI type-check/lint/tests/build. Branch protection requires owner/admin setup; a workflow file alone does not prove merge blocking is enabled.

`GET /api/health` should expose safe reachability, last successful feed time, stale/limit state, database reachability and template version; no credentials, dealer email, internal URLs or customer data. Alert on stale-limit exceeded, database failure and pending snapshots. Configure GlitchTip site tags; validate alert delivery. Protect housekeeping using Bearer CRON_SECRET. Reference schedules health hourly and housekeeping daily in Vercel; other hosts must schedule these explicitly. Increase bounded-run frequency for large queues rather than removing safety bounds. Back up website DB and owned media together and test restoration.

Render stock on the server where supported. Use shared inventory for canonical vehicle URLs/JSON-LD/sitemaps, list publicly visible live cars only, no admin/API/staging indexing. Canonical host, robots, metadata, sitemap and redirects must agree; generated SEO must not duplicate route files. Preserve true feed timestamps. Confirmed sold archives have distinct presentation and appropriate SEO, not live Offer availability. A live vehicle removed from inventory returns 404 or deliberate redirect; backend outage has explicit error semantics.

Consent defaults denied; no analytics cookies before consent. Keep third-party finance/maps/analytics lazy or interaction/viewport gated where practical. Optimize images with correct remotePatterns, sizes and loading, reserve layout space, avoid full-resolution decorative images and layout shift. Capture comparable mobile Lighthouse performance/accessibility/SEO on home, showroom and vehicle page before/after, under the same conditions. Record measured scores and resolve regressions; a previously green build does not establish performance.

## 15. Implementation sequence and deployment

1. Read target rules, snapshot baseline/workflows, inspect existing changes, identify source/reference versions, target family and missing capabilities. Make a new variant safely; do not touch other clients.
2. Fix foundational exposure first: compatible dependencies, CMS access/first-user, payment surface removal, secret/env validation and headers. Add CI early.
3. Port shared Light DMS server/auth/types and protected routes. Merge configuration/CMS/media models and preserve existing plugins. Verify denied access before implementing writes.
4. Replace **every** stock service/fallback/cache consumer with keyed DMS adapter + shared public visibility/pricing/highlight layer. Adapt existing public UI rather than replacing it.
5. Port workspace, Finder and editor. Wire supported narrow APIs, stable add retry, optional check handling, photos and channels/feeds; make mutation invalidation explicit.
6. Add sold archive/history/permanent-media/recovery, public Sold Cars and protected housekeeping. Remove active local overrides/showroom hides only after any legacy data has been migrated safely by a human.
7. Integrate durable/spam-protected forms, health, monitoring, branding/profile configuration, SEO/consent and performance. Add/port meaningful isolated tests as implementation proceeds.
8. Run checks, full diff review and approved acceptance matrix; document evidence and unresolved human setup. Never label fixture tests as a genuine AutoTrader round trip.
9. Human deploys DMS migrations/API first if missing, then migration of existing website data, then website variant/environment. Do not change global legacy feed enforcement while other clients still use it.
10. Configure DNS/canonical origin and test real sign-in/delivery/provider flows on staging before publication. Human review/merge/deployment approvals follow current task authorization. Never merge your own PR.

### Existing-site migration and rollback

New empty deployments do not need highlight/sold-photo migration. Existing websites may need both human-run tools:

```sh
npm run payload -- run scripts/migrate-website-highlights.ts
npm run payload -- run scripts/migrate-website-highlights.ts --apply
npm run payload -- run scripts/migrate-sold-photos.ts
npm run payload -- run scripts/migrate-sold-photos.ts --apply
```

These commands are **human-only migration instructions**, not authorization for an agent to mutate a live database. Highlight migration needs a freshly issued DMS session supplied privately as `MIGRATION_WEBSITE_SESSION`. Dry-run first, back up, resolve conflicts; nonblank DMS values win, matching values skip. Retain old collections as backup until verified; stop reading them in the new app. Legacy photo migration cannot recover a provider image that no longer exists; inspect all warnings before removing source adverts. Do not expose migration sessions in CLI history/logs.

Rollback application versions without dropping additive DMS columns or deleting archive/media/history. Preserve compatible DMS endpoints while sites depend on them; roll the website back first if withdrawing paired APIs. Old website versions may read obsolete local highlights, so do not silently roll back past a data-source migration without a reconciliation plan. A rollback does not reverse an AutoTrader stock write: reconcile genuine lifecycle/publication through the normal DMS flow. Key rotation/session format changes may require fresh login.

## 16. Acceptance and release evidence

### Automated and local verification

For the converted website run `npm run type-check`, ESLint (changed files and full project where supported), isolated integration/contract tests, meaningful UI/e2e tests, production build and dependency audit. Reference commands:

```sh
npm run type-check
npm run lint
npm run test:int
node scripts/run-isolated.mjs npm run build
npm run test:e2e
npm audit --omit=dev
```

Inspect scripts first: never run a baseline suite against live write targets. Reference isolated helper uses disposable local Mongo fixtures and deliberately does not use `.env` DATABASE_URI; first run may need network for a test Mongo binary. `npm run build` is the real deployment build and needs deployment configuration. Do not treat old `READ_ONLY_VERIFICATION=true` build instructions as current production instructions. Record tool versions and any tests requiring additional server setup; do not claim an unrun test passed.

Port source tests for auth/state/callback/revocation, proxy allowlist, forbidden fields, Finder data/missing distinctions/stale responses, duplicate/add retry identity, VAT/price, reserved/public visibility, sold recovery/media/cleanup, forms/rate counter races/delivery retry, SEO and cache invalidation. Use sanitized real-feed fixtures, never live sessions/keys/PII. Test multi-request and out-of-order responses where they affect correctness.

If DMS code changes, also run its required type-check, changed-file ESLint, relevant isolated regressions and production build; smoke changed routes on the dev server. Query-logic changes require the repository's temporary old/new SELECT comparison against real authorized data, then remove the script. Do not run mutation handlers against production for verification.

### Required acceptance matrix

Record PASS / FAIL / NOT RUN, environment, source revision and evidence for **each** row. A NOT RUN provider/setup item stays a release limitation, not a passed feature.

| Area | Cases to verify |
| --- | --- |
| Public baseline | Home/showroom/detail/search/featured/related/wishlist/filter/sitemap/contact/finance/reservation remain functional and retain chosen template design |
| Authentication | Permitted user login, state mismatch/missing/expired/replayed code, different dealer, denied role, disabled switch, Lite owner restrictions, session expiry, logout replay, Clerk revocation, key rotation/revoke, exact origin |
| Direct authorization | Anonymous every admin route; cross-site mutations; generic proxy forbidden route/method; local archive storage cannot bypass DMS revocation; no client-supplied dealer override |
| Lite isolation | Direct requests to customer/invoice/sales/broad stock/public-listings bypass routes denied for website-only/Lite users; existing full-DMS behavior preserved |
| Finder | Valid lookup, no vehicle, duplicate-open, all four valuations/VAT basis, missing values, MOT null vs empty/history/units/defects/mileage warning; optional check clear/flagged/unknown/package denial/failure, reload stale clearing |
| Add | Priced/Due In/prep, duplicate/double click, frozen UUID/payload after timeout, status recovery, adopted/partial result and warning; genuine approved AutoTrader creation → webhook → DMS → public site |
| Price/VAT | Every VAT mode, expected total/base/fee/POA, separate forecourt price, purchase VAT override on/off; no financial fields exposed |
| Photos | Upload/type/signature/size/boundary; reorder/replace/remove including last photo; video/spin preserved; provider rejection and retry; old cached photos invalidated |
| Channels/feeds | AA Cars + CarGurus subscribed/unsubscribed fixtures; dynamic custom feeds; add-time built-in map and post-create custom-feed save; existing-car toggles/readback; Dealer Website toggle; prep publication 409; per-feed/partial failure and safe retry; public cache refresh |
| Status | Available/Due In/Reserved/Sold/Delete, same status, invalid/future UK date, unsupported Other, sold transition restriction; immediate next feed and cached website visibility |
| Sold archive | Opt in/out, snapshot before sale, DB failure, provider failure/timeout, copy failure, pending retry, hide/show/remove, new/replaced history, original image removed, confirmed permanence |
| Delete/re-add | Soft delete, sold delete, same registration new stock ID, old highlight/archive does not overwrite new car, no indefinite showroom hides |
| Feed/cache | Real sanitized contract before/after, malformed individual record/envelope, authoritative empty, reserved flag, secret/advertiser stripping, outage within/after 12h, no-cache restart, mutation/in-flight race, multiple-instance limits |
| Cleanup | Key-only states constrained to own dealer/max50; missing/error retains pending; sold retained; notification+retention guard; protected cron; bounded retries and confirmed history preserved |
| Forms | Every collection form, spam/Turnstile host/action/replay failure, per-IP/race limits, durable save, each delivery outage, retry/deduplication, privacy/recipient/retention; no payment implied |
| CMS/security | First-user routes blocked, authorized provisioning, admin vs nonadmin, GraphQL/seed/legacy endpoints, env failures, headers/CSP, no secrets in HTML/JSON/logs/bundles |
| Responsive/accessibility | 320/390/768/1440 widths, keyboard/focus/dialogs/labels, errors/warnings, long values, photo ordering, no overflow |
| Premium visual brief | AutoPrestige form reference comparison; before/after authenticated add-car, stock list and listing/feed editor screenshots on mobile/desktop; consistent fields/actions and clear empty/error/pending/partial-save states |
| SEO/performance/ops | Canonicals/robots/noindex/sitemap/removed cars, denied consent, comparable home/showroom/detail Lighthouse, health 503, alert delivery, scheduled cron, DB/media backup |

All provider writes require the approved disposable staging dealer/advertiser and authorization consistent with repository rules. No production test listings, money, live customer messages or invented testing claims. Real webhook signature changes require a genuine captured request; this template conversion ordinarily does not change DMS webhook signature logic.

### Review and PR/report template

Review the whole diff for accidental public redesign, tenant leaks, broad proxies, silent empty/zero fallbacks, stale resurrection, mismatched API shapes, duplicate routes, unsupported saves, hidden warnings, dependency drift, build side effects, CMS exposure and leftover dealer values. Recheck prior reference UI/Finder/security review findings; inspect `docs/light-dms-ui-review.md`, `light-dms-finder-review.md`, `security-audit.md` and `release-verification.md` in the website reference. Fix relevant findings before handoff.

Prepare a PR description even if the current task only authorizes local changes:

- What changed and source/reference/template revisions.
- Workflows affected, each with before → after and intended/unchanged behavior.
- Commands/checks and exact results, live/fixture boundaries, not-run items and blockers.
- Manual steps to reproduce sign-in, each mutation, public visibility and archive recovery.
- DMS contract/Swagger, architecture/backend/frontend, audit scope and README currency checks (updated or not applicable).
- Risks: price/VAT financial effect, delete/re-add, provider publication/sync, status cache partial failure, migrations, permanent media, bulk/cron actions and form PII. Explicitly state whether webhooks/payments/bulk writes changed.
- Human migration/configuration/branch-protection/acceptance requirements, deployment and rollback order.

Human review is required before merge. Follow the user's current reviewer preference; do not request a GitHub reviewer automatically if instructed to leave the PR unassigned. Do not create a PR, commit or push unless authorized in that task.

## 17. Troubleshooting

| Symptom | Check |
| --- | --- |
| “Website not linked” | DMS contact website vs canonical HTTPS origin, exact `www`/port, redirect-host configuration; don't weaken validation |
| Login loop / state expired | Cookie path, secure scheme, mixed localhost/127.0.0.1 or ports, canonical redirect, two-minute code and ten-minute state expiry |
| Key 401 / session 401 | Correct issued raw website key, server-only env, key rotation; new login after session format changes; DMS current Clerk session |
| Access 403 | Existing dealer association/team role, package, website switch, AutoTrader Connect mode; optional check package separately |
| Admin stock exists but public empty | Lifecycle, prep, Dealer Website PUBLISHED, advertiser selection, public predicates; empty can be valid |
| Reserved disappears | `includeReserved=true`, shared public filter accepts SALE_IN_PROGRESS, no old local hide, badge from boolean |
| Sold reappears / Available stays hidden | Independent old caches/fallbacks, stale cache not cleared, in-flight repopulation, legacy local hides, missing DMS synchronous cache update |
| Price incorrect | Base vs authoritative total, Ex VAT added twice, separate forecourt price, fee/POA, old CMS price override |
| Highlight missing | Narrow DMS PATCH + deployed migration + optional feed field + cache invalidation; don't read old Mongo fallback |
| Add timeout | Query same requestId, reconcile stockId, reuse frozen payload/UUID; never submit a new operation blindly |
| Photos uploaded but absent | Upload creates ID; final full ordered-list PUT attaches it; Next image hosts/CSP/cache/provider confirmation |
| Sold image copy pending | Approved origin, no redirects, storage credentials/permissions, real source still exists, image size/type/timeout; retry, never force-confirm |
| Stock failure shown as no cars | Error swallowed in a legacy service/API, dummy fallback or invalid envelope mapped to empty; fail loudly |
| Forms fail after port | Real Turnstile host/action/key, durable DB, email sender verification, destinations/outbox/cron, trusted proxy settings |
| Build fails / pages conflict | Installed Next guide, generated SEO files, duplicate route-group URL, merged Payload config/types/import map, missing env, incorrect test DB setup |

## 18. Copy-ready agent task

Copy the block below and fill the target path/variant name. This guide carries the full contract and acceptance criteria; no prompt per feature is needed.

```text
Add the complete Light DMS to <TARGET_DEALER_TEMPLATE_PATH> as the
<NEW_VARIANT_NAME> variant. Use docs/light-dms-template-implementation-guide.md
from MYDV-DMS as the implementation handoff. Read target AGENTS.md/CLAUDE.md
and installed framework guides first. Inspect the current hardened reference
website (../buy-brand-light-dms-demo or the buy-brand-light-dms repository)
and the actual DMS routes/Swagger before coding.

Preserve this template's public design, content, URLs and customer journeys.
Implement the entire guide: secure Clerk handoff/session proxy; stock workspace;
Finder valuations/MOT/on-demand checks; stable add/retry; price/VAT, photos,
status/sold/delete, dynamic channels/feeds and DMS-backed website highlight;
consistent keyed public inventory/Reserved/VAT/cache; permanent self-service
sold archive; safe CMS/forms, configuration, monitoring, cron, SEO, performance
and tests. Port shared behavior, adapt all target inventory consumers, and
avoid unsupported save controls or competing local stock data. Use the
hardened decisions, not superseded original-handoff behaviors.

The client additionally requires a sharper premium add-car and listing-management
experience inspired by AutoPrestige's part-exchange/valuation forms (section 12).
Adapt that visual quality to this template's brand and provide before/after visual
evidence. Implement real subscribed AA Cars/CarGurus and dynamic partner-feed
controls in add and listing management, including the documented post-create
handling for custom feeds, per-feed feedback and safe partial-failure retries.

Do not disturb live clients or unrelated files. Never copy production secrets,
AutoTrader credentials, sessions, customer databases or BuyBrand identity into
the new variant. Do not mutate any real database or run DMS migrations; give
human setup instructions and use isolated fixtures. No production test listings.
Identify missing credentials/setup without inventing them. Continue all useful
implementation/testing that does not depend on those missing inputs.

Complete type-check, ESLint, isolated tests, production build, source/diff
review and the guide's acceptance matrix. Report before/after workflows,
measured checks, not-run live acceptance, risks and exact human setup steps.
Prepare the PR description. Do not commit, push, publish, send invitations or
merge unless separately authorized. A task is not release-ready merely because
mocked tests pass; retain explicit live provider/configuration blockers.
```
