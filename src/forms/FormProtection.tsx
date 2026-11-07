'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { getAttribution, attributionAllowed } from './attribution'
type Turnstile = {
  render: (node: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
  reset: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}
// Inlined at build time by next.config.js; the server re-checks and stays authoritative.
const demoBypass = process.env.NEXT_PUBLIC_TURNSTILE_DEMO_BYPASS === 'true'
export default function FormProtection() {
  const node = useRef<HTMLDivElement>(null)
  const widget = useRef<string | undefined>(undefined)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (demoBypass || !ready || !node.current || !window.turnstile || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
      return
    widget.current = window.turnstile.render(node.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      action: 'dealer-form',
      callback: (token: string) => {
        if (node.current) node.current.dataset.token = token
      },
      'expired-callback': () => {
        if (node.current) delete node.current.dataset.token
      },
      'error-callback': () => {
        if (node.current) delete node.current.dataset.token
      },
    })
    if (node.current) node.current.dataset.widget = widget.current
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current)
    }
  }, [ready])
  return (
    <div className="form-protection my-4 space-y-3">
      <label className="sr-only" aria-hidden="true">
        Leave empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={node} data-form-verification />
      {!demoBypass && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <p role="alert">Form verification is unavailable. Please contact the dealership.</p>
      )}
      <label className="flex items-start gap-2 text-sm text-inherit"><input type="checkbox" name="privacyAccepted" required className="mt-1"/>I agree to be contacted about this enquiry.</label>
      <p className="text-sm text-inherit">
        We use your details to respond to this enquiry. Read our{' '}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  )
}
const attempts = new WeakMap<
  HTMLFormElement,
  { submissionId: string; payload: Record<string, unknown> }
>()
export async function submitProtectedForm(url: string, init: RequestInit, form: HTMLFormElement) {
  const verification = form.querySelector('[data-form-verification]') as HTMLElement | null
  const token = verification?.dataset.token
  const honeypot =
    (form.querySelector('input[name="website"]') as HTMLInputElement | null)?.value || ''
  const privacyAccepted = (form.querySelector('input[name="privacyAccepted"]') as HTMLInputElement | null)?.checked === true
  if (!privacyAccepted) throw new Error('Please agree to be contacted about this enquiry.')
  if (!token && !demoBypass) throw new Error('Please complete the verification before sending your enquiry.')
  let attempt = attempts.get(form)
  if (!attempt) {
    const body = JSON.parse(String(init.body))
    delete body.advertiserId
    delete body.affiliateId
    delete body.amount
    attempt = { submissionId: crypto.randomUUID(), payload: { ...body, ...getAttribution() } }
    attempts.set(form, attempt)
  }
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      body: JSON.stringify({
        ...attempt.payload,
        privacyAccepted,
        submissionId: attempt.submissionId,
        website: honeypot,
        ...(token ? { turnstileToken: token } : {}),
      }),
    })
  } finally {
    if (verification) {
      if (verification.dataset.widget) window.turnstile?.reset(verification.dataset.widget)
      delete verification.dataset.token
    }
  }
  const result = await response
    .clone()
    .json()
    .catch(() => null)
  if (response.status === 202 || result?.pending)
    throw new Error(
      result?.message ||
        'Delivery pending. Retry to check the same enquiry; your original details are retained.',
    )
  if (!response.ok || result?.success !== true)
    throw new Error(result?.error || 'We could not confirm delivery. Retry with the same details.')
  attempts.delete(form)
  // No identity or financial fields in analytics. Emit only after persisted DMS acknowledgement.
  if (attributionAllowed())
    window.dispatchEvent(
      new CustomEvent('enquiry_submitted', { detail: { eventId: attempt.submissionId } }),
    )
  return response
}
