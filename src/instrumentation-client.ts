import { init } from '@sentry/nextjs'
import { redactEvent } from './utilities/monitoring'
if (process.env.NEXT_PUBLIC_GLITCHTIP_DSN)
  init({
    dsn: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    beforeSend: redactEvent,
    beforeBreadcrumb: () => null,
  })
