'use client'
import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { attributionAllowed, clearAttribution } from '@/forms/attribution'
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
export default function ConsentAnalytics({ gaId }: { gaId: string }) {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    const target = window as AnalyticsWindow
    target.dataLayer = target.dataLayer || []
    const gtag = (...args: unknown[]) => target.dataLayer!.push(args)
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    const update = () => {
      const accepted = attributionAllowed()
      setAllowed(accepted)
      gtag('consent', 'update', {
        analytics_storage: accepted ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
      if (!accepted) {
        clearAttribution()
        for (const item of document.cookie.split('; ')) {
          const name = item.split('=')[0]
          if (/^_ga(?:_|$)/.test(name)) {
            document.cookie = `${name}=; Path=/; Max-Age=0`
            const segments = location.hostname.split('.')
            for (let i = 0; i < segments.length - 1; i++)
              document.cookie = `${name}=; Path=/; Domain=.${segments.slice(i).join('.')}; Max-Age=0`
          }
        }
      }
    }
    const conversion = (event: Event) => {
      if (attributionAllowed())
        target.gtag?.('event', 'enquiry_submitted', {
          event_id: (event as CustomEvent<{ eventId: string }>).detail.eventId,
        })
    }
    update()
    window.addEventListener('consent-change', update)
    window.addEventListener('enquiry_submitted', conversion)
    return () => {
      window.removeEventListener('consent-change', update)
      window.removeEventListener('enquiry_submitted', conversion)
    }
  }, [])
  return allowed && gaId ? <GoogleAnalytics gaId={gaId} /> : null
}
