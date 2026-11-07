export async function register() {
  const { validateProductionEnv } = await import('../scripts/validate-env.mjs')
  validateProductionEnv()
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.GLITCHTIP_DSN) {
    const Sentry = await import('@sentry/nextjs')
    const { redactEvent } = await import('./utilities/monitoring')
    Sentry.init({
      dsn: process.env.GLITCHTIP_DSN,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      tracesSampleRate: 0,
      beforeSend: redactEvent,
      beforeBreadcrumb: () => null,
      initialScope: {
        tags: {
          dealerSite: process.env.SITE_CANONICAL_HOST || 'unconfigured',
          templateVersion: 'template-8/2.0.0',
        },
      },
    })
  }
}
export { captureRequestError as onRequestError } from '@sentry/nextjs'
