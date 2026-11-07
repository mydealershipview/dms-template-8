import type { Metadata } from 'next'
import './admin.css'
import { Montserrat } from 'next/font/google'
const font = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})
export const metadata: Metadata = {
  title: 'Dealer workspace',
  icons: { icon: '/logo.png' },
  robots: { index: false, follow: false },
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className={`ld-root ${font.variable}`}>{children}</body>
    </html>
  )
}
