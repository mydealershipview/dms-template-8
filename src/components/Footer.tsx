"use client"

import { Phone, MapPin, Clock, MessageCircle, Facebook, Instagram } from "lucide-react"
import { ContactData } from "@/types/contact"
import { Make, Model } from "@/utilities/types"
import Link from "next/link"
import type { OpeningHours } from "@/types/dealership"

interface FooterProps {
  contactData?: ContactData | null
  dealershipName?: string
  openingHours?: OpeningHours
  makes: Make[]
  models: Model[]
}

export default function Footer({ contactData, dealershipName, openingHours }: FooterProps) {
  const primaryPhone = contactData?.phoneNumbers?.find(p => p.isPrimary) ?? contactData?.phoneNumbers?.[0]
  const primaryEmail = contactData?.emailAddresses?.find(e => e.isPrimary) ?? contactData?.emailAddresses?.[0]
  const address = contactData?.businessAddress
  const displayName = dealershipName || address?.name || 'Dealership'

  const phone = primaryPhone?.number ?? 'Phone available on request'
  const email = primaryEmail?.email ?? 'Email available on request'
  const phoneHref = primaryPhone?.number ? `tel:${primaryPhone.number.replace(/\s/g, '')}` : '#'
  const emailHref = primaryEmail?.email ? `mailto:${primaryEmail.email}` : '#'
  const addressLine = address
    ? [address.name, address.street, address.city && address.postcode ? `${address.city}, ${address.postcode}` : address.city ?? address.postcode].filter(Boolean).join(', ')
    : 'Address details available on request'

  const socialLinks = (contactData?.socialLinks ?? []).filter(s => s.isActive !== false)

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5 text-white" />
      case 'instagram': return <Instagram className="h-5 w-5 text-white" />
      case 'whatsapp': return <MessageCircle className="h-5 w-5 text-white" />
      default: return <MessageCircle className="h-5 w-5 text-white" />
    }
  }

  return (
    <footer className="w-full bg-black text-gray-400 py-16 px-6 lg:px-12 border-t border-red-600/50 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col items-center">

        {/* Main Info Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full mb-16 px-4 lg:px-0">
          {/* Contact Details */}
          <div className="flex flex-col gap-6 items-center md:items-start md:border-r border-white/10 md:pr-12">
            <a href={phoneHref} className="flex items-center gap-4 w-full justify-center md:justify-start group">
              <div className="flex items-center justify-center w-10 h-10 border border-white/20 group-hover:border-red-600 transition-colors shrink-0">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="text-white font-semibold tracking-wider text-xl">{phone}</div>
            </a>
            <a href={emailHref} className="flex items-center gap-4 w-full justify-center md:justify-start group">
              <div className="flex items-center justify-center w-10 h-10 border border-white/20 group-hover:border-red-600 transition-colors shrink-0">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-white font-medium tracking-wide">{email}</div>
            </a>
          </div>

          {/* Address & Hours */}
          <div className="flex flex-col gap-6 items-center md:items-start md:border-r border-white/10 md:pr-12">
            <div className="flex items-start gap-4 w-full justify-center md:justify-start">
              <div className="flex items-center justify-center w-10 h-10 border border-white/20 hover:border-red-600 transition-colors mt-1 shrink-0">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <address className="not-italic text-white/80 text-sm leading-relaxed tracking-wide">
                {addressLine}
              </address>
            </div>
            <div className="flex items-start gap-4 w-full justify-center md:justify-start">
              <div className="flex items-center justify-center w-10 h-10 border border-white/20 hover:border-red-600 transition-colors mt-1 shrink-0">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div className="text-white/80 text-xs leading-relaxed tracking-wider space-y-1">
                <div>{openingHours?.weekdays || 'Monday - Friday: 9:00 am - 6:00 pm'}</div>
                <div>{openingHours?.saturday || 'Saturday: 9:00 am - 5:00 pm'}</div>
                <div>{openingHours?.sunday || 'Sunday: By Appointment'}</div>
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
            {socialLinks.length > 0 ? (
              socialLinks.map(s => (
                <a
                  key={s.id ?? s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="flex items-center justify-center w-12 h-12 border border-white/20 hover:border-red-600 hover:text-red-500 transition-colors"
                >
                  {getSocialIcon(s.platform)}
                </a>
              ))
            ) : (
              <>
                <a href="#" className="flex items-center justify-center w-12 h-12 border border-white/20 hover:border-red-600 hover:text-red-500 transition-colors">
                  <MessageCircle className="h-5 w-5 text-white" />
                </a>
                <a href="#" className="flex items-center justify-center w-12 h-12 border border-white/20 hover:border-red-600 hover:text-red-500 transition-colors">
                  <Facebook className="h-5 w-5 text-white" />
                </a>
                <a href="#" className="flex items-center justify-center w-12 h-12 border border-white/20 hover:border-red-600 hover:text-red-500 transition-colors">
                  <Instagram className="h-5 w-5 text-white" />
                </a>
              </>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-white/10 mb-12" />

        {/* FCA Disclaimer */}
        <div className="text-[10px] md:text-xs text-center text-gray-400 max-w-6xl mx-auto leading-relaxed mb-12 uppercase tracking-wide">
          <p className="mb-4">
            This dealership is authorised and regulated by the Financial Conduct Authority for Consumer Credit. We are a credit broker, not a lender, and can introduce you to a limited number of lenders.
          </p>
          <p>
            All finance applications are subject to status, terms and conditions apply, UK residents only, 18&apos;s or over. Guarantees may be required. The commission we receive does not influence the interest rate you will pay. Our aim is to secure finance for you at the lowest interest rate you are eligible for from our panel of lenders.
          </p>
        </div>

        {/* Bottom Legal Links */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-400 tracking-wider">
          <span>© {new Date().getFullYear()} {displayName}</span>
          <span className="hidden md:inline">|</span>
          <Link href="/terms" className="hover:text-red-500 transition-colors uppercase border-b border-red-800 pb-0.5">Terms &amp; Conditions</Link>
          <span className="hidden md:inline">|</span>
          <Link href="/privacy" className="hover:text-red-500 transition-colors uppercase border-b border-red-800 pb-0.5">Privacy Policy</Link>
          <span className="hidden md:inline">|</span>
          <Link href="/cookies" className="hover:text-red-500 transition-colors uppercase border-b border-red-800 pb-0.5">Cookie Preferences</Link>
          <span className="hidden md:inline">|</span>
          <Link href="/contact" className="hover:text-red-500 transition-colors uppercase border-b border-red-800 pb-0.5">Contact Us</Link>
          <span className="hidden md:inline">|</span>
          <Link href="/admin/login" rel="nofollow" className="hover:text-red-500 transition-colors uppercase border-b border-red-800 pb-0.5">Dealer login</Link>
        </div>

        {/* Powered By */}
        <div className="mt-8 text-center text-[10px] md:text-xs text-gray-400 tracking-wider">
          Website powered by <a href="https://mydealershipview.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors border-b border-red-800 pb-0.5">MYDEALERSHIPVIEW</a>
        </div>
      </div>
    </footer>
  )
}
