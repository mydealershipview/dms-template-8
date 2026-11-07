# Template 8 deployment and recovery

## Deployment contract

One dealer per deployment, with its own environment, Mongo database, media namespace/bucket and website key. The website uses only the DMS's narrow website-admin APIs; broad stock/customer/invoice APIs and AutoTrader credentials stay in DMS. No DMS source/query/API contract was changed by this port. DMS Swagger is unchanged; its existing external-notification acknowledgement documentation gap remains a DMS-maintainer task.

Use Node 24.22.1 or another runtime satisfying the pinned Payload engine requirement. Dependencies were upgraded as a compatible group. Review the [Payload 3.90 security migration notes](https://github.com/payloadcms/payload/releases/tag/v3.90.0), particularly regenerated auth/upload/Lexical types, SVG restrictions and pending scheduled publishing jobs. This deployment uses Mongo, not a relational adapter. Generated Payload types/import map are included. No migration was run against real data.

Human deployment order:

1. Back up existing website Mongo and media. Inventory any intentional CMS descriptions/prices and resolve price conflicts with the dealer: after conversion DMS is authoritative. The legacy Listings collection is private/hidden backup data, no longer a stock or price source. Do not erase it as part of rollout.
2. Confirm DMS deployments/migrations and the actual feed/admin/lead contract. Provision an existing dealership's key, `AUTOTRADER_CONNECT`, website access switch, team roles/package, and exact canonical origin including `www`/port. Do not change fleet-wide legacy-feed enforcement for a single site.
3. Populate `.env.example` privately. `DEALER_ID` is the lead routing UUID, not an advertiser number. Confirm lead secret enforcement on the receiver; this website always sends it. Rotate legacy exposed credentials through their owner.
4. Configure Turnstile for the real canonical hostname and `dealer-form` action; verify verified email sender/dealer recipient; configure owned media and image origins; configure `CRON_SECRET` and GlitchTip. Do not use fixture keys/URLs on a live site.
5. Provision the first CMS admin privately if required. DMS staff use their existing DMS account; do not make website passwords for them.
6. Deploy to a noindexed staging origin, register that exact origin in DMS, and complete the live acceptance checklist before promotion. Confirm CSP report-only sources against actual maps, finance and analytics behavior before enforcing CSP.
7. Schedule authenticated housekeeping and health checks. Confirm an actual sanitized alert is received and verify a backup restore. Enable required CI branch protection through an organization administrator.

No assistant should run real DMS migrations, submit live test enquiries, create provider adverts, process money, or alter dealer data for acceptance. Use an approved disposable staging car/account and the authorized human operator.

## Media and sold archives

Configure S3-compatible permanent media for deployed/serverless sites. If using local media on a long-running server, mount `public/media` on a durable backed-up volume and restore it with Mongo. Ephemeral container/serverless filesystem storage cannot establish permanence. Approved source image origins are HTTPS AutoTrader image CDN plus explicit `DMS_IMAGE_ORIGINS`; no arbitrary download endpoint or redirects are supported.

Sold snapshots are saved before the DMS sale. Failed copies or ambiguous sale outcomes stay pending; never force-confirm them. Retry from Sold cars only after DMS confirms SOLD. Each replacement has a revision and retains history; an older response cannot confirm a newer snapshot. Removing/hiding an archive affects only website visibility. Owned images associated with snapshots are protected from CMS deletion.

The source Template 8 had no Light DMS override/archive collections, so a fresh deployment needs no highlight/photo migration. Human-only dry-run/apply scripts are provided for future upgrades from a legacy Light DMS installation. Do not run them automatically or against an unreviewed connection. Source data remains as backup; existing DMS highlights win conflicts and lost provider photos cannot be recreated by migration.

## Delivery recovery and privacy

Forms validate and save privately before delivery. A verified DMS persisted acknowledgement yields 200/success; an outbox-only acceptance yields 202/pending. The browser retains inputs and the original UUID/payload on pending/error. A concurrent worker uses an expiring atomic lease; DMS and email outcomes persist separately, with body `submissionId` for receiver deduplication and email provider idempotency keys. A timeout never proves that the receiver did not save.

The CMS Operations outbox exposes failures only to CMS administrators. Financial/bank details stay in private DMS/outbox storage and are excluded from email and monitoring. Delivered outbox PII is eligible for bounded deletion 30 days after delivery; failed entries remain for intervention. Confirm this policy with the dealer's privacy policy. A retry uses the previously verified vehicle snapshot, so later price/status changes do not corrupt retry identity.

Honeypot and Turnstile apply to every form. The shared rate limit is 10 attempts per endpoint/IP per 15-minute window. IPs are HMAC hashed; buckets have unique indexes and expiry. Configure `FORMS_TRUST_PROXY=true` only when the hosting proxy replaces `X-Forwarded-For`. Vercel reads its dedicated forwarding header. Without a trusted proxy, requests share a restrictive host bucket. Monitor 429 rates; do not trust arbitrary client proxy headers to evade limits.

## Bounded housekeeping

Each authorized run considers at most 50 eligible pending archives and 25 due outbox entries, plus at most 50 fully delivered entries for retention. Pending snapshots must be at least seven days old, have been shown in the workspace at least 24 hours earlier, and have an authoritative key-only lifecycle response for that exact stock ID. Missing states, errors and SOLD retain the snapshot. Deletion additionally checks the unchanged pending generation so a concurrent confirmation/replacement wins. Confirmed history/media are never subject to this cleanup.

Scale recovery by scheduling more frequent bounded runs, not by removing caps. Failures remain visible and return 503; they are not success acknowledgements.

## Cache, backups and rollback

The process cache is 60 seconds fresh, bounded at 12 hours from the last complete successful read. Outages never renew that timestamp. Empty success replaces old stock. Public API responses are no-store, avoiding extra CDN stale age. Invalidation discards both current/stale snapshots and guards against late in-flight refreshes. It is not shared between replicas and does not survive a restart.

Back up Mongo, media objects/volume, configuration version and deployment revision together. Test restoration to an isolated site: restore Mongo/media, verify public confirmed archives and image references, ensure pending/outbox recovery is still protected, and keep outbound services disabled until reviewed. Backups contain private enquiries; restrict and expire them under the agreed retention policy.

Rollback the application independently of settings/data. Retain outbox, archives, owned media and compatible DMS APIs. A rollback does not undo a provider status/price/publication write, erase saved leads, or restore old price/highlight authority safely. Reconcile through DMS; do not re-enable dummy/CMS/provider fallbacks or resurrect retired payment routes. Key rotation may require fresh sign-in. Record template family/version for every deployment and roll out one dealer at a time.

## Demo configuration

The default configuration requires real Turnstile verification. An explicit `TURNSTILE_DEMO_BYPASS=true` is honored only together with `SEO_NOINDEX=true` or `SITE_NOINDEX=true`. It never bypasses origin, honeypot, privacy consent, rate limiting or durable delivery. It is prohibited on indexable client deployments and is not enabled by the test harness. Production startup also requires configured S3 media or an explicit durable `MEDIA_LOCAL_DIR`.
