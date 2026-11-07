# Template 8 · Dealer website and Light DMS

Template 8 keeps its public showroom design and adds a separate `/admin` dealer workspace. Payload content management remains at `/websiteadmin`. This is a website integration with the existing MYDEALERSHIPVIEW DMS, not a second stock, customer or invoicing database.

Use Node **24.22.1** (`nvm use`) and npm. Direct dependencies are pinned; commit the npm lockfile when updating them together.

## What is included

- One keyed DMS public feed, complete pagination, strict publication/lifecycle filtering, Reserved badges, VAT-aware prices and robust legacy vehicle URL resolution.
- A 60-second process cache with single-flight loading and a maximum 12-hour last-success age. Failed reads never invent vehicles or fall back to CMS stock. Mutations clear current and stale snapshots, including uncertain write outcomes.
- Protected local enquiry routes with Turnstile, same-origin checks, honeypots, atomic shared rate counters, server-owned dealer routing, stable submission IDs and a durable private outbox. DMS persistence acknowledgement is distinct from email delivery and pending acceptance.
- DMS sign-in handoff, scoped httpOnly cookies, remote logout/revocation, narrow staff proxy, stock browsing, Finder valuations/MOT/checks, add/retry, price/VAT, photos, lifecycle, website highlight and subscribed partner feeds.
- A three-step add flow with photo ordering and review. Built-in feeds such as AA Cars/CarGurus are sent at creation; custom feeds are applied afterward and retried without creating the car again.
- A permanent sold archive with owned photos, history, pending recovery, website hide/show/remove controls and a separate public `/sold-cars` page.
- Private CMS operations, disabled public bootstrap/seed/GraphQL/legacy affiliate endpoints, security headers, safe health checks, scheduled recovery and consent-gated analytics/attribution.

Reservations are **enquiries**: no online charge and no automatic stock reservation. Legacy payment endpoints deliberately return 410. No AutoTrader API credentials belong in this website.

## Local setup

1. Copy `.env.example` to a private local environment file and configure this deployment's settings. Use a dedicated local database, never a client database for testing.
2. `npm ci`
3. `npm run dev`

Public identity comes from existing dealership settings and the selected `DEALER_PROFILE` (`template` starter or `neutral`). `DEALER_NAME` and `DEALER_PUBLIC_EMAIL` override the starter profile. Public identity is separate from the private DMS `DEALER_ID` UUID. Reads never seed or update dealership settings.

For a fresh CMS, a human privately supplies temporary `PROVISION_ADMIN_EMAIL` and `PROVISION_ADMIN_PASSWORD` and runs `npm run provision:admin`. Remove those variables afterward. The script never resets an existing account and refuses adding a different initial admin after users exist. DMS staff accounts continue to use DMS/Clerk invitations and permissions.

## Verification

```sh
npm run type-check
npm run lint
npm run test:int
npm run test:production
npm audit --omit=dev
```

Integration tests provision disposable Mongo. `test:production` also starts a local HTTPS DMS protocol fixture, builds the production application, runs actual HTTP assertions, and checks the UI in Chrome/Chromium. It replaces deployment environment values, creates no real leads/listings/payments, and does not use live credentials. The first test run may download a Mongo binary; install Chromium with `npx playwright install chromium` on hosts without Chrome. For an additional pinned Lighthouse mobile run, use `node scripts/run-isolated.mjs --services node scripts/verify-production.mjs --lighthouse` (requires Chrome/Chromium and downloads the audit CLI). It saves reports to `docs/verification/`. Test screenshots/traces are under `test-results/`; the report is under `playwright-report/`.

`npm run build` is the real deployment build. Supply reviewed configuration. For isolated build-only verification: `node scripts/run-isolated.mjs npm run build`. Do not run tests/builds against a production database. See [verification evidence](docs/release-verification.md) for actual results and remaining live acceptance.

## Deploy and operate

Read [deployment and recovery](docs/template-operations.md) before deploying. DMS must already provide the contracts in the [Light DMS guide](docs/light-dms-template-implementation-guide.md) and [modernization audit](docs/dealer-template-modernization-audit.md). Exact canonical HTTPS origin registration, keys, role/package permissions, media storage, email, Turnstile and cron require human setup and staging acceptance.

`GET /api/health` returns safe stock/database state and template version. `GET /api/cron/housekeeping` requires a strong Bearer `CRON_SECRET`. Private delivery failures are visible in the CMS Operations collections. Vercel schedules are supplied; other hosts must configure their scheduler. A workflow file does not enable branch protection automatically.

Stock invalidation is local to one process. Use one long-running deployment or add shared cache/version coordination before promising immediate consistency across replicas. Back up the site's database and permanent media together. Never delete confirmed sold images/history during rollback or pending cleanup.

Commits and pushes are authorized for this implementation. Live DMS/provider acceptance still requires reviewed deployment configuration; tests never write to real services. The [baseline/workflow map](docs/implementation-baseline.md), [release report](docs/release-verification.md), and [PR handoff](docs/PR-description.md) record scope and acceptance boundaries.
