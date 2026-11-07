# Dealer email setup

Configure `RESEND_API_KEY`, a verified-domain `EMAIL_FROM`, and the dealer's comma-separated `EMAIL_TO` privately. Customer input never chooses notification recipients. No developer CC is configured.

Customer forms first save a private outbox entry. DMS persistence and notification email have separate delivery states and retries. Email delivery alone does not mean a lead was saved in DMS. A persisted DMS acknowledgement allows customer success; otherwise the customer sees pending and retains the original enquiry for retry. Financial/bank fields are excluded from notification emails.

CMS account messages also use the configured Resend sender. Missing configuration fails without printing reset links or credentials to the console. Provision the first CMS administrator using the private script described in [README](README.md).

Use a disposable staging recipient and approved DMS dealer to verify delivery. Confirm sender authentication, inbox receipt, independent failure recovery and the receiving DMS's submission-ID deduplication before live rollout. Do not send test customer enquiries to a live dealership.

See [deployment, retention and recovery](docs/template-operations.md) and [release evidence](docs/release-verification.md). Legacy direct browser webhooks and reservation payment emails are retired.
