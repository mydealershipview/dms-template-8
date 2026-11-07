'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Temporarily unavailable</h1>
      <p className="my-6">We could not load this page. Please retry or contact the dealership.</p>
      <button onClick={reset} className="rounded-lg bg-[#244d35] px-6 py-3 text-white">
        Try again
      </button>
    </main>
  )
}
