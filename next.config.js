import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const imageOrigins = [
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  process.env.S3_ENDPOINT,
  ...(process.env.DMS_IMAGE_ORIGINS || '').split(','),
].filter(Boolean)
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://challenges.cloudflare.com " +
        (process.env.CSP_SCRIPT_SOURCES || ''),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://m.atcdn.co.uk https://m-qa.atcdn.co.uk https://images.unsplash.com https://maps.gstatic.com https://maps.googleapis.com " +
        imageOrigins.join(' '),
      "connect-src 'self' https://www.google-analytics.com https://maps.googleapis.com https://challenges.cloudflare.com " +
        (process.env.CSP_CONNECT_SOURCES || ''),
      "frame-src 'self' https://www.google.com https://maps.google.com https://challenges.cloudflare.com " +
        (process.env.CSP_FRAME_SOURCES || ''),
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_TURNSTILE_DEMO_BYPASS:
      process.env.TURNSTILE_DEMO_BYPASS === 'true' &&
      (process.env.SEO_NOINDEX === 'true' || process.env.SITE_NOINDEX === 'true')
        ? 'true'
        : '',
  },
  turbopack: {},
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      {
        hostname: 'logo.clearbit.com',
        protocol: 'https',
      },
      {
        hostname: 'm.atcdn.co.uk',
        protocol: 'https',
      },
      {
        hostname: 'm-qa.atcdn.co.uk',
        protocol: 'https',
      },
      {
        hostname: 'images.unsplash.com',
        protocol: 'https',
      },
      ...imageOrigins.map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
