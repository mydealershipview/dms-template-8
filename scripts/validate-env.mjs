export function validateProductionEnv(env = process.env) {
  if (env.NODE_ENV !== 'production') return
  if (env.READ_ONLY_VERIFICATION === 'true')
    throw new Error('READ_ONLY_VERIFICATION is forbidden in production')
  const required = [
    'DATABASE_URI',
    'PAYLOAD_SECRET',
    'DMS_URL',
    'DMS_WEBSITE_KEY',
    'DEALER_ID',
    'FORM_SUBMIT_WEBHOOK_URL',
    'EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET',
    'LEAD_SOURCE_WEBSITE',
    'NEXT_PUBLIC_SERVER_URL',
    'CRON_SECRET',
  ]
  // Permanent media: S3 in deployment, or an explicit durable local volume.
  if (!env.MEDIA_LOCAL_DIR?.trim()) required.push('S3_BUCKET')
  // Demo deployments may opt out of Turnstile, but only when also marked non-indexable.
  const noindex = env.SEO_NOINDEX === 'true' || env.SITE_NOINDEX === 'true'
  if (env.TURNSTILE_DEMO_BYPASS === 'true' && !noindex)
    throw new Error('TURNSTILE_DEMO_BYPASS requires SEO_NOINDEX=true (demo deployments only)')
  if (env.TURNSTILE_DEMO_BYPASS !== 'true') required.push('TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY')
  for (const name of required) {
    if (!env[name]?.trim()) throw new Error(`Missing deployment setting: ${name}`)
  }
  if (env.CRON_SECRET.length < 32) throw new Error('CRON_SECRET must have at least 32 characters')
  if (env.PAYLOAD_SECRET.length < 32)
    throw new Error('PAYLOAD_SECRET must have at least 32 characters')
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(env.DEALER_ID))
    throw new Error('DEALER_ID must be a UUID')
  const origin = new URL(env.NEXT_PUBLIC_SERVER_URL)
  if (origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Canonical website URL must be an origin')
  if (env.NEXT_PUBLIC_SITE_URL && new URL(env.NEXT_PUBLIC_SITE_URL).origin !== origin.origin) throw new Error('Public site origins must match')
  if (env.SITE_CANONICAL_HOST && env.SITE_CANONICAL_HOST !== origin.host) throw new Error('Canonical hostname must match public origin')
  if (!['localhost','127.0.0.1'].includes(origin.hostname) && !origin.hostname.endsWith('.test') && /^([123])x000/.test(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '')) throw new Error('Turnstile test keys are forbidden on live sites')
  for (const name of ['DMS_URL', 'NEXT_PUBLIC_SERVER_URL', 'FORM_SUBMIT_WEBHOOK_URL']) {
    const url = new URL(env[name])
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error(`${name} requires HTTPS without credentials`)
  }
}
