import { siteNoindex } from '@/lib/noindex'
import { jsonLd } from '@/utilities/vehicleSEO'
import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { Montserrat } from 'next/font/google'
import React from 'react'

import CookieConsentModal from '@/components/ui/cookie-consent-modal'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { generateStructuredData } from '@/utilities/structuredData'
import { getDealershipInfo } from '@/lib/services/dealership.service'

import '@/styles/globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import Layout from '@/components/Layout'

// Configure Montserrat font
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dealership = await getDealershipInfo()
  const structuredData = generateStructuredData(dealership)

  return (
    <html className={cn(montserrat.variable, GeistMono.variable)} lang="en-GB" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon-32x32.png" rel="icon" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(structuredData)
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Providers>
          <Layout>
            {children}
          </Layout>
          <CookieConsentModal />
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipInfo()
  const serverUrl = getServerSideURL()
  const title = `${dealership.name} | Quality Used Cars`
  const description =
    dealership.seoText ||
    `${dealership.name} - ${dealership.tagline || 'Trusted used cars, finance options, and friendly support.'}`

  return {
    metadataBase: new URL(serverUrl),
    title: {
      default: title,
      template: `%s | ${dealership.name}`,
    },
    description,
    keywords: [
      'used cars',
      'car finance',
      'part exchange',
      dealership.name,
      dealership.address.city,
      dealership.address.postcode,
    ]
      .filter(Boolean)
      .join(', '),
    authors: [{ name: dealership.name }],
    creator: dealership.name,
    publisher: dealership.name,
    formatDetection: {
      telephone: true,
      email: true,
      address: true,
    },
    openGraph: mergeOpenGraph({
      title,
      description,
      url: serverUrl,
      siteName: dealership.name,
      locale: 'en_GB',
      type: 'website',
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: !siteNoindex(),
      follow: true,
      googleBot: {
        index: !siteNoindex(),
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}
