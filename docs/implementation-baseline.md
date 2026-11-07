# Template 8 implementation baseline

Repository: mydealershipview/dms-template-8 (original remote: hassan-31x/temp-8). Initial revision `7b1c14a`, clean main working tree. Hardened shared reference: Template 2 `3d07948`; Template 7's verified adapters and fixture cleanup were reused where original files matched. Both supplied guides and the installed Next 16 migration/caching documentation were consulted.

The public template uses Montserrat, dark surfaces, red accents, a video/section marketing homepage and a two-image vehicle detail layout. These, its configured CMS content and /showroom redirects are preserved. No authenticated stock workspace or permanent sold archive existed.

Before conversion stock APIs/sitemaps mixed an unkeyed email feed, direct provider and CMS fallbacks with independent caches. Detail pages self-fetched and returned false 200 missing/outage pages. Prices preferred forecourt values. Five vehicle enquiry modals shared browser-controlled routing and accepted 202 as success. Reservations claimed a £99 fee. Contact/service page forms used a hardcoded dealer fallback; the customer's car was mixed with interested stock. Showroom text search filtered one already-paginated page, percent names were decoded twice, requests could race, WhatsApp used a static number, and saved vehicles had a blank route.

The target keeps public composition while replacing those paths with complete safe keyed stock, consistent VAT/POA/highlight/Reserved presentation, server filtering and protected durable enquiries. Service customer cars stay separate from stock. The new /admin is Light DMS; /websiteadmin remains CMS. Settings reads never seed/update dealer records. No private routing/runtime credentials were copied.

No authenticated before screenshot exists because there was no workspace. A comparable pre-change production Lighthouse baseline was not measured. Current fixture measurements and NOT RUN real acceptance are recorded separately.
