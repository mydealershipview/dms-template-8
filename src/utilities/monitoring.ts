import type { ErrorEvent } from '@sentry/nextjs'
/** Only fixed operational codes and stack locations leave the server; never arbitrary error text. */
export function redactEvent(event: ErrorEvent): ErrorEvent {
  delete event.request
  delete event.user
  delete event.extra
  delete event.contexts
  delete event.breadcrumbs
  delete event.logentry
  event.message = 'dealer_site_operational_error'
  if (event.exception?.values)
    for (const exception of event.exception.values) {
      exception.value = 'Details redacted'
      if (exception.stacktrace?.frames)
        for (const frame of exception.stacktrace.frames) {
          delete frame.vars
          if (frame.filename) frame.filename = frame.filename.split('?')[0]
          delete frame.pre_context
          delete frame.post_context
          delete frame.context_line
        }
    }
  return event
}
