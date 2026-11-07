"use client"

import { useState } from "react"
import { Menu, Phone, X } from "lucide-react"
import Link from "next/link"
import type { ContactData } from "@/types/contact"

const navItems = [
  { label: "HOME", href: "/" },
  { label: "SHOWROOM", href: "/used-cars" },
  { label: "SOLD CARS", href: "/sold-cars" },
  { label: "SERVICES", href: "/services" },
  { label: "WARRANTY", href: "/warranty" },
  { label: "REVIEWS", href: "/reviews" },
  { label: "CONTACT US", href: "/contact" },
]

type HomeHeaderProps = {
  contactData?: ContactData | null
  dealershipName?: string
  dealershipTagline?: string
  logoUrl?: string
}

const sanitizePhoneForTel = (value?: string | null) =>
  (value || '').replace(/\s+/g, '')

export default function HomeHeader({
  contactData,
  dealershipName,
  dealershipTagline,
  logoUrl,
}: HomeHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = dealershipName?.trim() || 'Dealership'
  const displayTagline = dealershipTagline?.trim() || 'Trusted used vehicles and service'

  const phoneNumbers = contactData?.phoneNumbers || []
  const primaryPhone = phoneNumbers.find((phone) => phone.isPrimary)?.number || phoneNumbers[0]?.number || ''
  const primaryEmail =
    contactData?.emailAddresses?.find((entry) => entry.isPrimary)?.email ||
    contactData?.emailAddresses?.[0]?.email ||
    ''

  const socialLinks = (contactData?.socialLinks || []).filter((link) => link.isActive !== false)
  const socialUrl = (platform: string) =>
    socialLinks.find((link) => link.platform.toLowerCase() === platform)?.url || '#'

  const whatsappNumber = contactData?.whatsappNumber
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\s+/g, '')}`
    : socialUrl('whatsapp')

  return (
    <>
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 flex h-20 items-center justify-between px-6 lg:px-12 border-b border-white/10 bg-black/30 backdrop-blur-sm text-white">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 hover:text-red-500 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6 text-red-500" />
            <span className="hidden sm:inline font-semibold tracking-wider">MENU</span>
          </button>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            {logoUrl ? (
              <img src={logoUrl} alt={displayName} className="h-10 w-auto max-w-[150px] object-contain" />
            ) : (
              <>
                <div className="w-8 h-6 xl:w-10 xl:h-8 bg-red-600 mr-2 -skew-x-[24deg]"></div>
                <span className="text-2xl xl:text-3xl font-black tracking-widest uppercase">{displayName}</span>
              </>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <a href={primaryPhone ? `tel:${sanitizePhoneForTel(primaryPhone)}` : '#'} className="hidden lg:flex items-center gap-2 hover:text-red-500 transition-colors">
            <Phone className="h-4 w-4 text-red-500" />
            <span className="font-semibold tracking-wider">{primaryPhone || 'Call us'}</span>
          </a>
          <div className="hidden sm:flex items-center">
            <div className="flex items-center gap-2 sm:gap-4 ml-6">
              <div className="h-10 w-[1px] bg-white/20"></div>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center justify-center p-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <div className="h-10 w-[1px] bg-white/20"></div>
              <a href={socialUrl('facebook')} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center justify-center p-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <div className="h-10 w-[1px] bg-white/20"></div>
              <a href={socialUrl('instagram')} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center justify-center p-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <div className="h-10 w-[1px] bg-white/20"></div>
              <a href={socialUrl('linkedin')} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center justify-center p-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.69 2.5a5.1 5.1 0 0 0 -5.02 5.25c0 .35 .04 .7 .1 1c-1.39 .36 -2.62 1.34 -2.62 2.76 0 .42 .19 .78 .52 1.05 .33 .26 .81 .45 1.38 .52 0 .91 -1.48 1.46 -2.31 1.76 -.19 .07 -.24 .3 -.1 .43 .08 .07 .18 .11 .29 .11 .9 0 2.27 -.36 3.63 0 1.02 .27 1.5 1.53 1.84 2a2.33 2.33 0 0 0 4.6 0c.34 -.47 .82 -1.73 1.84 -2 1.36 -.36 2.73 0 3.63 0 .1 0 .21 -.04 .29 -.11 .14 -.13 .09 -.36 -.1 -.43 -.83 -.3 -2.31 -.85 -2.31 -1.76 .57 -.07 1.05 -.26 1.38 -.52 .33 -.27 .52 -.63 .52 -1.05 0 -1.42 -1.23 -2.4 -2.62 -2.76 .06 -.3 .1 -.65 .1 -1a5.1 5.1 0 0 0 -5.02 -5.25z"></path>
                </svg>
              </a>
              <div className="h-10 w-[1px] bg-white/20"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in Navigation Sidebar */}
      <nav
        className={`fixed top-0 right-0 z-40 h-full w-full sm:w-[420px] bg-black flex flex-col transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-white/10">
          <span className="text-white text-xl font-black tracking-[0.3em] uppercase">NAVIGATE</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white hover:text-red-500 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Nav Links */}
        <ul className="flex flex-col px-10 py-8 gap-1 flex-1">
          {navItems.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 text-sm font-semibold tracking-[0.25em] uppercase transition-colors hover:text-red-500 ${
                  i === 0 ? "text-white border-b border-white/30 pb-3" : "text-white/80"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Bottom Contact Info */}
        <div className="border-t border-white/10 px-10 py-8 flex flex-col gap-4">
          <a
            href={primaryPhone ? `tel:${sanitizePhoneForTel(primaryPhone)}` : '#'}
            className="flex items-center gap-4 text-white hover:text-red-500 transition-colors group"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full border border-red-600 group-hover:bg-red-600 transition-colors shrink-0">
              <Phone className="h-4 w-4 text-red-500 group-hover:text-white transition-colors" />
            </span>
            <span className="font-semibold tracking-widest text-sm">{primaryPhone || 'Call us'}</span>
          </a>
          <a
            href={primaryEmail ? `mailto:${primaryEmail}` : '#'}
            className="flex items-center gap-4 text-white hover:text-red-500 transition-colors group"
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full border border-red-600 group-hover:bg-red-600 transition-colors shrink-0">
              <svg className="h-4 w-4 text-red-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="font-semibold tracking-widest text-sm uppercase">{primaryEmail || displayTagline}</span>
          </a>
        </div>
      </nav>
    </>
  )
}
