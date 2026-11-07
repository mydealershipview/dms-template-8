# Modernize Template 8 and add Light DMS

Replaces mixed stock sources and browser-owned enquiry routing with a complete sanitized keyed DMS inventory and protected durable local outbox. Customer success requires a persisted DMS acknowledgement; pending retries retain the original inputs and identity. Reservations take no payment.

Adds scoped DMS sign-in, Finder/add/review/recovery, stock browsing, price/VAT/photo/status/highlight and built-in/custom partner feeds, plus owned-image sold archives and pending recovery. Retains the video/section homepage, Montserrat/red design, two-image detail layout, CMS content routes and legacy showroom redirects. Five vehicle modals plus contact and service booking are adapted individually; service customer vehicles stay separate from dealer stock.

Search and colour now filter the full inventory before pagination. Fixes percent-name decoding, stale filter requests, hardcoded WhatsApp routing, dummy featured stock and blank saved vehicles. Upgrades framework/CMS/dependencies and adds protected provisioning, consent/attribution, redacted monitoring, health, bounded cron, CI and isolated verification.

See [release evidence](release-verification.md) for commands/results, screenshots, warnings and NOT RUN integrations. Follow [operations/rollback](template-operations.md) for keys/origin/roles, permanent media, sender/Turnstile, cron/monitoring, backups and staging acceptance. No DMS source/Swagger, provider signature changes or real provider/customer test writes are included. Cache invalidation is process-local.
