'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi, pounds } from './types'
import { StockSkeleton } from './ui'
type Entry = {
  id: string
  title: string
  price?: number | null
  soldDate: string
  confirmed?: boolean
  visible?: boolean
  copyWarning?: string
  cleanupNotifiedAt?: string
}
export default function SoldCars() {
  const [rows, setRows] = useState<Entry[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    adminApi<{ docs: Entry[]; totalPages: number }>(`sold?page=${page}`, 'GET', undefined, {
      signal: controller.signal,
    })
      .then((result) => {
        setRows(result.docs)
        setTotalPages(result.totalPages)
        setError('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, revision])
  async function act(id: string, action: string) {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      const result = await adminApi('sold', 'POST', { id, action })
      setLoading(true)
      setNotice(result.warning || 'Sold page updated.')
      setRevision((value) => value + 1)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update this entry')
    } finally {
      setBusy(null)
    }
  }
  return (
    <section className="ld-main">
      <div className="ld-heading">
        <div>
          <p className="ld-eyebrow">WEBSITE ARCHIVE</p>
          <h1>Sold cars</h1>
          <p className="ld-muted">Manage the cars shown on your Sold Cars page.</p>
        </div>
        <Link className="ld-button" href="/sold-cars" target="_blank">
          View public page ↗
        </Link>
      </div>
      {error && (
        <p role="alert" className="ld-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="ld-notice">
          {notice}
        </p>
      )}
      {loading ? (
        <StockSkeleton />
      ) : rows.length ? (
        <ul className="ld-sold-list">
          {rows.map((row) => (
            <li key={row.id} className="ld-sold-row">
              <div>
                <h2 className="text-lg font-semibold">{row.title}</h2>
                <p className="ld-muted">
                  {pounds(row.price ?? null)} · {row.soldDate.slice(0, 10)} ·{' '}
                  {row.confirmed
                    ? row.visible !== false
                      ? 'Published'
                      : 'Hidden'
                    : 'Awaiting confirmation'}
                </p>
                {!row.confirmed && (
                  <p className="ld-pending-warning">
                    {row.copyWarning || 'Retry to confirm the DMS sale.'} Unconfirmed entries older
                    than 7 days may be removed if there is no matching DMS sale, at least 24 hours
                    after this notice.
                  </p>
                )}
              </div>
              <div className="ld-sold-actions">
                {!row.confirmed && (
                  <button
                    className="ld-button"
                    disabled={busy === row.id}
                    onClick={() => act(row.id, 'retry')}
                  >
                    Retry
                  </button>
                )}
                <button
                  className="ld-button"
                  disabled={busy === row.id}
                  onClick={() => act(row.id, row.visible === false ? 'show' : 'hide')}
                >
                  {row.visible === false ? 'Show' : 'Hide'}
                </button>
                <button
                  className="ld-button"
                  disabled={busy === row.id}
                  onClick={() => act(row.id, 'remove')}
                >
                  Remove from page
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ld-muted">
          No sold snapshots yet. Choose “Keep on Sold Cars page” when marking a car Sold.
        </p>
      )}
      <nav className="ld-sold-pagination" aria-label="Sold archive pages">
        <button
          disabled={page <= 1}
          onClick={() => {
            setLoading(true)
            setPage((value) => value - 1)
          }}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => {
            setLoading(true)
            setPage((value) => value + 1)
          }}
        >
          Next
        </button>
      </nav>
    </section>
  )
}
