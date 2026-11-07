'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { captureAttribution, clearAttribution } from '@/forms/attribution'
import { ChevronDown, ShieldCheck } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function CookieConsentModal() {
  const [visible, setVisible] = useState(false)
  const [details, setDetails] = useState(false)

  useEffect(() => {
    captureAttribution()
    const reopen = () => setVisible(true)
    window.addEventListener('privacy-settings', reopen)
    let consent: string | null = null
    try { consent = localStorage.getItem('cookies-accepted') } catch { /* denied by browser */ }
    if (!consent) {
      const timer = window.setTimeout(() => setVisible(true), 900)
      return () => { window.clearTimeout(timer); window.removeEventListener('privacy-settings', reopen) }
    }
    return () => window.removeEventListener('privacy-settings', reopen)
  }, [])

  const choose = (value: string) => {
    try { localStorage.setItem('cookies-accepted', value) } catch { /* remain denied */ }
    if (value === 'true') captureAttribution(); else clearAttribution()
    window.dispatchEvent(new Event('consent-change'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-xl border border-[#d8d7d1] bg-[#f8f7f2] p-0 text-[#1b211e] shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <DialogHeader className="space-y-3 px-6 pb-2 pt-6 pr-16 text-left">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#fee2e2] text-[#991b1b]"><ShieldCheck className="h-5 w-5" /></div>
          <DialogTitle className="text-2xl font-semibold">Your privacy choices</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#68716c]">We use optional analytics and campaign attribution cookies to understand how visitors find and use the site. Necessary cookies keep essential features working.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <button onClick={() => setDetails(value => !value)} className="flex min-h-11 w-full items-center justify-between border-y border-[#d8d7d1] py-3 text-left text-sm font-semibold" aria-expanded={details}>
            Review cookie details <ChevronDown className={`h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${details ? 'rotate-180' : ''}`} />
          </button>
          {details && (
            <div className="space-y-4 border-b border-[#d8d7d1] py-4 text-sm leading-6 text-[#68716c]">
              <p><strong className="font-semibold text-[#1b211e]">Necessary:</strong> security, preferences, and core site functions. Always active.</p>
              <p><strong className="font-semibold text-[#1b211e]">Analytics:</strong> usage and campaign attribution information that helps improve the website.</p>
            </div>
          )}

          <button onClick={() => choose('true')} className="mt-5 h-12 w-full rounded-lg bg-[#991b1b] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7f1d1d] active:scale-[0.98]">Accept optional cookies</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => choose('necessary-only')} className="h-11 rounded-lg border border-[#c8c8c1] text-sm font-semibold hover:bg-white">Necessary only</button>
            <button onClick={() => choose('rejected')} className="h-11 rounded-lg text-sm font-medium text-[#68716c] hover:bg-[#eceae3]">Reject optional</button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#606d64]">Read our <Link href="/privacy" className="font-medium text-[#991b1b] underline underline-offset-2">privacy policy</Link> and <Link href="/cookies" className="font-medium text-[#991b1b] underline underline-offset-2">cookie policy</Link>.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
