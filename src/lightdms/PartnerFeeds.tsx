'use client'
import { useEffect, useState } from 'react'
import { adminApi, type Vehicle } from './types'
export default function PartnerFeeds({
  stockId,
  feeds,
  onSaved,
  onDirtyChange,
}: {
  stockId: string
  feeds: Vehicle['feeds']
  onSaved: (feeds: Vehicle['feeds'], message: string) => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(feeds.map((f) => [f.id, f.enabled])),
  )
  const [results, setResults] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const dirty = feeds.some((f) => selected[f.id] !== f.enabled)
  useEffect(() => {
    onDirtyChange?.(dirty)
    return () => onDirtyChange?.(false)
  }, [dirty, onDirtyChange])
  async function save(id: string) {
    const enabled = selected[id]
    setBusy(id)
    setResults((old) => ({ ...old, [id]: 'Saving selection…' }))
    try {
      const result = await adminApi(`dms/stock/${encodeURIComponent(stockId)}/feeds`, 'PATCH', {
        feedId: id,
        enabled,
      })
      const detail = await adminApi<{ vehicle: Vehicle }>(
        `dms/stock/${encodeURIComponent(stockId)}`,
      )
      if (detail.vehicle.feeds.find((f) => f.id === id)?.enabled !== enabled)
        throw new Error('The saved selection has not been confirmed. Refresh and retry.')
      const message = result.warning || 'Selection saved. Partner publication is managed by DMS.'
      setResults((old) => ({ ...old, [id]: message }))
      onSaved(detail.vehicle.feeds, message)
    } catch (error) {
      setResults((old) => ({
        ...old,
        [id]: error instanceof Error ? error.message : 'Selection could not be saved. Retry.',
      }))
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="ld-panel">
      <div className="ld-panel-heading">
        <h3>Partner feeds</h3>
      </div>
      <div className="ld-panel-body">
        <p className="ld-muted">
          Choose from your active subscriptions. A saved selection does not confirm a live partner
          advert.
        </p>
        {feeds.length ? (
          feeds.map((feed) => (
            <div key={feed.id} className="ld-feed-setting">
              <label className="ld-toggle-row">
                <span>
                  <strong>{feed.name}</strong>
                  <small>{feed.enabled ? 'Included in feed' : 'Not included'}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={feed.name}
                  checked={selected[feed.id] === true}
                  disabled={busy !== null}
                  onChange={(e) => setSelected((old) => ({ ...old, [feed.id]: e.target.checked }))}
                />
              </label>
              <div className="ld-feed-result">
                <p role="status" aria-live="polite">
                  {results[feed.id] ||
                    (selected[feed.id] !== feed.enabled ? 'Unsaved selection' : '')}
                </p>
                {selected[feed.id] !== feed.enabled && (
                  <button
                    type="button"
                    className="ld-button"
                    disabled={busy !== null}
                    onClick={() => void save(feed.id)}
                  >
                    {busy === feed.id ? 'Saving…' : `Save ${feed.name}`}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="ld-empty-inline">
            No partner feeds are enabled. Ask your dealership administrator to enable a
            subscription.
          </p>
        )}
      </div>
    </div>
  )
}
