'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="ld-main">
      <h1>Stock management is unavailable</h1>
      <p>Please try again. Your existing stock is unchanged.</p>
      <button className="ld-button" onClick={reset}>
        Try again
      </button>
    </main>
  )
}
