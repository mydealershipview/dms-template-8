import { getDealershipInfo } from '@/lib/services/dealership.service'
import Link from 'next/link'
import { isLightDmsConfigured } from '@/lightdms/config'
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const dealership = await getDealershipInfo()
  const { error } = await searchParams
  return (
    <main className="ld-login">
      <Link className="ld-brand" href="/">
        {dealership.name}
        <span>Dealer workspace</span>
      </Link>
      <div className="ld-eyebrow">DEALER WORKSPACE</div>
      <h1>
        Your stock.
        <br />
        Ready for the road.
      </h1>
      <p>Add cars, update prices and manage your listings from one place.</p>
      {error && (
        <p role="alert" className="ld-error">
          {error === 'access'
            ? 'Your account does not have website access. Contact your dealership owner.'
            : error === 'expired'
              ? 'Your session has ended. Please sign in again.'
              : 'Sign-in could not be completed. Please try again.'}
        </p>
      )}
      {isLightDmsConfigured() ? (
        <Link className="ld-button primary" href="/api/admin/auth/login" prefetch={false}>
          Sign in with MYDEALERSHIPVIEW →
        </Link>
      ) : (
        <p className="ld-notice">
          Website management is awaiting connection. Contact MYDEALERSHIPVIEW support to enable
          sign-in.
        </p>
      )}
      <p className="ld-muted">Use your existing dealership account.</p>
      <Link href="/">← Back to the website</Link>
    </main>
  )
}
