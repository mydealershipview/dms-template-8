'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Camera, Check, Search, Upload } from 'lucide-react'
import { adminApi, pounds, type Me, type Photo } from './types'
import VehicleInsights from './VehicleInsights'
import type { FinderResult } from './finderTypes'
const BUILT_IN = new Set(['aacars', 'cargurus', 'carslinkai', 'mydv_gva', 'gva'])
export default function AddVehicle({
  me,
  onClose,
  onAdded,
  onOpenExisting,
  registerNavigationGuard,
}: {
  me: Me | null
  onClose: () => void
  onAdded: (id: string, warning?: string) => void
  onOpenExisting?: (id: string) => void
  registerNavigationGuard?: (guard: () => boolean) => void
}) {
  const [registration, setRegistration] = useState(''),
    [mileage, setMileage] = useState('')
  const [lookup, setLookup] = useState<FinderResult | null>(null),
    [step, setStep] = useState<'find' | 'prepare' | 'review'>('find')
  const [price, setPrice] = useState(''),
    [vatStatus, setVat] = useState('No VAT'),
    [requiresPrep, setPrep] = useState(false)
  const [attentionGrabber, setAttention] = useState(''),
    [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([]),
    [channels, setChannels] = useState<Record<string, boolean>>({ advertiserAdvert: true })
  const [feeds, setFeeds] = useState<Record<string, boolean>>({}),
    [showOnWebsiteSoldPage, setSoldPage] = useState(false)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [pending, setPending] = useState<Record<string, unknown> | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null),
    [remainingFeeds, setRemainingFeeds] = useState<string[]>([])
  const attempt = useRef<{ id: string; payload: Record<string, unknown>; custom: string[] } | null>(
    null,
  )
  const controller = useRef<AbortController | null>(null)
  const dirty = !!(registration || mileage || lookup)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    const guard = () =>
      !busy &&
      (!dirty ||
        !!createdId ||
        window.confirm('Leave the vehicle finder and discard your entries?'))
    registerNavigationGuard?.(guard)
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (dirty || busy) window.addEventListener('beforeunload', warn)
    return () => {
      registerNavigationGuard?.(() => true)
      window.removeEventListener('beforeunload', warn)
    }
  }, [dirty, busy, createdId, registerNavigationGuard])
  function back() {
    if (
      !busy &&
      (!dirty || createdId || window.confirm('Leave the vehicle finder and discard your entries?'))
    )
      onClose()
  }
  function identityChanged() {
    controller.current?.abort()
    setLookup(null)
    setStep('find')
    setError('')
  }
  async function find(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    setBusy(true)
    setError('')
    setLookup(null)
    try {
      const result = await adminApi<FinderResult>(
        `dms/vehicle-lookup?${new URLSearchParams({ registration, mileage })}`,
        'GET',
        undefined,
        { signal: next.signal },
      )
      if (!next.signal.aborted) {
        setLookup(result)
        setStep('prepare')
      }
    } catch (error) {
      if (!next.signal.aborted) setError((error as Error).message)
    } finally {
      if (!next.signal.aborted) setBusy(false)
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      for (const file of Array.from(files)) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size > 10 * 1024 * 1024 ||
          !file.size
        )
          throw new Error('Choose nonempty JPEG, PNG or WebP photos under 10 MB.')
        if (photos.length + files.length > 100) throw new Error('Use at most 100 photos.')
        const data = new FormData()
        data.append('image', file)
        const photo = await adminApi<Photo>('dms/images', 'POST', data)
        setPhotos((old) => [...old, photo])
        if (photo.warning) setNotice(photo.warning)
      }
    } catch (error) {
      setError(`${(error as Error).message} Successfully uploaded photos are retained.`)
    } finally {
      setBusy(false)
    }
  }
  function move(index: number, delta: number) {
    setPhotos((old) => {
      const next = [...old]
      ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
      return next
    })
  }
  async function finishFeeds(stockId: string, ids: string[], warning = '') {
    setCreatedId(stockId)
    const failed: string[] = []
    const warnings: string[] = [warning].filter(Boolean)
    for (const feedId of ids) {
      try {
        const result = await adminApi(`dms/stock/${encodeURIComponent(stockId)}/feeds`, 'PATCH', {
          feedId,
          enabled: true,
        })
        if (result.warning) warnings.push(result.warning)
      } catch (error) {
        failed.push(feedId)
        warnings.push(
          `${me?.feeds.find((f) => f.id === feedId)?.name || feedId}: ${(error as Error).message}`,
        )
      }
    }
    setRemainingFeeds(failed)
    if (failed.length) {
      setError(
        `The car was created. ${warnings.join(' ')} Retry remaining feeds without adding the car again.`,
      )
      setNotice(`Stock ${stockId} is saved.`)
    } else if (warnings.length) onAdded(stockId, warnings.join(' '))
    else onAdded(stockId)
  }
  async function add(event: FormEvent) {
    event.preventDefault()
    if (busy || !lookup || !me || lookup.alreadyInStock) return
    setBusy(true)
    setError('')
    if (!attempt.current) {
      const offeredChannels = Object.fromEntries(
        me.channels.map((c) => [c.key, !requiresPrep && !!price && channels[c.key] === true]),
      )
      const builtIn = Object.fromEntries(
        me.feeds
          .filter((f) => BUILT_IN.has(f.id))
          .map((f) => [f.id, !requiresPrep && !!price && feeds[f.id] === true]),
      )
      const payload = {
        addRequestId: crypto.randomUUID(),
        registration,
        mileage: Number(mileage),
        vehicle: Object.fromEntries(
          ['make', 'model', 'derivative', 'derivativeId'].map((k) => [k, lookup.vehicle[k]]),
        ),
        ...(price ? { price: Number(price) } : {}),
        vatStatus,
        requiresPrep,
        attentionGrabber,
        description,
        imageIds: photos.map((p) => p.imageId),
        channels: offeredChannels,
        feeds: builtIn,
        ...(me.dealer.websiteSoldPage ? { showOnWebsiteSoldPage } : {}),
      }
      attempt.current = {
        id: payload.addRequestId,
        payload,
        custom:
          !requiresPrep && !!price
            ? me.feeds.filter((f) => !BUILT_IN.has(f.id) && feeds[f.id]).map((f) => f.id)
            : [],
      }
      setPending(payload)
    }
    try {
      if (createdId) {
        await finishFeeds(createdId, remainingFeeds)
        return
      }
      const result = await adminApi<{
        stockId: string
        prepWarning?: string
        websiteSoldWarning?: string
      }>('dms/stock', 'POST', attempt.current.payload)
      await finishFeeds(
        result.stockId,
        attempt.current.custom,
        [result.warning, result.prepWarning, result.websiteSoldWarning].filter(Boolean).join(' '),
      )
    } catch (error) {
      setError(
        `${(error as Error).message} The outcome may be uncertain. Check add status before retrying; the same request ID and original payload will be reused.`,
      )
    } finally {
      setBusy(false)
    }
  }
  async function check() {
    if (!attempt.current || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await adminApi<{ complete: boolean; stockId: string | null; state: string }>(
        `dms/stock/add-status?requestId=${attempt.current.id}`,
      )
      if (result.complete && result.stockId)
        await finishFeeds(result.stockId, attempt.current.custom)
      else
        setError(
          `Add request: ${result.state}. Retry retains the same request ID and original details.`,
        )
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="ld-add">
      <button className="ld-back" onClick={back} disabled={busy}>
        <ArrowLeft size={16} /> Back to stock
      </button>
      <div className="ld-add-intro">
        <div>
          <p className="ld-eyebrow">Vehicle finder</p>
          <h2>Add a car to your stock</h2>
          <p className="ld-muted">
            Find the vehicle, prepare its listing, then review before adding.
          </p>
        </div>
        <span className="ld-add-step-label">
          {step === 'find' ? 'Step 1 of 3' : step === 'prepare' ? 'Step 2 of 3' : 'Step 3 of 3'}
        </span>
      </div>
      <ol className="ld-add-progress" aria-label="Add vehicle progress">
        {(['find', 'prepare', 'review'] as const).map((item, index) => (
          <li key={item} aria-current={step === item ? 'step' : undefined}>
            <span>{index + 1}</span>
            {item === 'find'
              ? 'Find vehicle'
              : item === 'prepare'
                ? 'Prepare listing'
                : 'Review & add'}
          </li>
        ))}
      </ol>
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
      <form className="ld-finder-start" onSubmit={find}>
        <fieldset disabled={busy || !!pending}>
          <div className="ld-fields">
            <label>
              Registration <span aria-hidden="true">*</span>
              <input
                required
                pattern="[A-Za-z0-9]{2,8}"
                maxLength={8}
                autoComplete="off"
                className="ld-registration-input"
                value={registration}
                onChange={(e) => {
                  setRegistration(e.target.value.toUpperCase().replace(/\s/g, ''))
                  identityChanged()
                }}
              />
            </label>
            <label>
              Mileage <span aria-hidden="true">*</span>
              <input
                required
                type="number"
                min="1"
                max="2000000"
                step="1"
                value={mileage}
                onChange={(e) => {
                  setMileage(e.target.value)
                  identityChanged()
                }}
              />
            </label>
          </div>
          <button className="ld-button primary">
            <Search size={16} />
            {busy && !lookup ? 'Looking up…' : lookup ? 'Look up again' : 'Find vehicle'}
          </button>
        </fieldset>
      </form>
      {lookup && (
        <>
          <div className="ld-found-summary">
            <span className="ld-reg">{registration}</span>
            <div>
              <h3>
                {lookup.vehicle.make} {lookup.vehicle.model}
              </h3>
              <p>{lookup.vehicle.derivative}</p>
              <p className="ld-muted">
                {[
                  lookup.vehicle.yearOfManufacture,
                  lookup.vehicle.fuelType,
                  lookup.vehicle.transmissionType,
                  lookup.vehicle.bodyType,
                  lookup.vehicle.colour,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          {lookup.alreadyInStock ? (
            <div className="ld-notice">
              <p>This registration is already in stock.</p>
              <button
                className="ld-button"
                onClick={() => onOpenExisting?.(lookup.alreadyInStock!.stockId)}
              >
                Open existing vehicle
              </button>
            </div>
          ) : (
            <form onSubmit={add}>
              {step === 'prepare' && (
                <fieldset disabled={busy || !!pending} className="ld-add-sections">
                  <section className="ld-panel">
                    <div className="ld-panel-heading">
                      <h3>01 · Price & preparation</h3>
                    </div>
                    <div className="ld-panel-body">
                      <div className="ld-fields">
                        <label>
                          Advert price (£), optional
                          <input
                            type="number"
                            min="0.01"
                            max="9999999.99"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </label>
                        <label>
                          Listing VAT status
                          <select value={vatStatus} onChange={(e) => setVat(e.target.value)}>
                            {['No VAT', 'Inc VAT', 'Ex VAT'].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <p className="ld-muted">
                        No price creates a Due In car. Ex VAT prices display with 20% VAT added to
                        the buyer total.
                      </p>
                      <label className="ld-check">
                        <input
                          type="checkbox"
                          checked={requiresPrep}
                          onChange={(e) => setPrep(e.target.checked)}
                        />
                        Requires preparation (price required; publishing stays off)
                      </label>
                      {requiresPrep && !price && (
                        <p role="alert" className="ld-error">
                          Enter a price for a car that needs preparation.
                        </p>
                      )}
                    </div>
                  </section>
                  <section className="ld-panel">
                    <div className="ld-panel-heading">
                      <h3>02 · Description</h3>
                    </div>
                    <div className="ld-panel-body">
                      <label>
                        Attention grabber, optional
                        <input
                          maxLength={30}
                          value={attentionGrabber}
                          onChange={(e) => setAttention(e.target.value)}
                        />
                        <small>{attentionGrabber.length}/30</small>
                      </label>
                      <label>
                        Vehicle description, optional
                        <textarea
                          maxLength={4000}
                          rows={5}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                        <small>{description.length}/4000</small>
                      </label>
                    </div>
                  </section>
                  <section className="ld-panel">
                    <div className="ld-panel-heading">
                      <h3>03 · Photos</h3>
                      <Camera size={18} />
                    </div>
                    <div className="ld-panel-body">
                      <p className="ld-muted">
                        The first photo is your cover. JPEG, PNG or WebP, up to 10 MB each.
                      </p>
                      <label className="ld-upload">
                        <Upload size={18} />
                        Upload photos
                        <input
                          aria-label="Upload photos"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={(e) => {
                            void upload(e.target.files)
                            e.target.value = ''
                          }}
                        />
                      </label>
                      <div className="ld-add-photos">
                        {photos.map((photo, index) => (
                          <div key={photo.imageId}>
                            <img
                              src={photo.url.replace('{resize}', 'w400')}
                              alt={`Vehicle photo ${index + 1}`}
                              loading="lazy"
                            />
                            <div>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                                aria-label={`Move photo ${index + 1} earlier`}
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={index === photos.length - 1}
                                onClick={() => move(index, 1)}
                                aria-label={`Move photo ${index + 1} later`}
                              >
                                →
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPhotos((old) => old.filter((p) => p.imageId !== photo.imageId))
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!photos.length && (
                        <p className="ld-empty-inline">
                          No photos yet. You can add photos now or edit the gallery later.
                        </p>
                      )}
                    </div>
                  </section>
                  <section className="ld-panel">
                    <div className="ld-panel-heading">
                      <h3>04 · Publication & feeds</h3>
                    </div>
                    <div className="ld-panel-body">
                      <h4>AutoTrader channels</h4>
                      {me?.channels.map((channel) => (
                        <label className="ld-toggle-row" key={channel.key}>
                          <span>
                            <strong>{channel.label}</strong>
                            <small>
                              {requiresPrep || !price
                                ? 'Unavailable until priced and ready'
                                : 'Include at creation'}
                            </small>
                          </span>
                          <input
                            role="switch"
                            type="checkbox"
                            disabled={requiresPrep || !price}
                            checked={!requiresPrep && !!price && channels[channel.key] === true}
                            onChange={(e) =>
                              setChannels((old) => ({ ...old, [channel.key]: e.target.checked }))
                            }
                          />
                        </label>
                      ))}
                      <h4>Partner feeds</h4>
                      {me?.feeds.length ? (
                        me.feeds.map((feed) => (
                          <label className="ld-toggle-row" key={feed.id}>
                            <span>
                              <strong>{feed.name}</strong>
                              <small>
                                {feed.id.startsWith('feed_partner:')
                                  ? 'Applied after the stock record is created'
                                  : 'Included with the stock record'}
                              </small>
                            </span>
                            <input
                              role="switch"
                              type="checkbox"
                              disabled={requiresPrep || !price}
                              checked={!requiresPrep && !!price && feeds[feed.id] === true}
                              onChange={(e) =>
                                setFeeds((old) => ({ ...old, [feed.id]: e.target.checked }))
                              }
                            />
                          </label>
                        ))
                      ) : (
                        <p className="ld-empty-inline">
                          No partner subscriptions enabled. Ask your dealership administrator to
                          enable feeds.
                        </p>
                      )}
                      {me?.dealer.websiteSoldPage && (
                        <label className="ld-check">
                          <input
                            type="checkbox"
                            checked={showOnWebsiteSoldPage}
                            onChange={(e) => setSoldPage(e.target.checked)}
                          />
                          Eligible for the DMS Sold page when sold
                        </label>
                      )}
                      <p className="ld-muted">
                        A selected feed is not confirmation that an advert is live. The website Sold
                        Cars archive is chosen separately when marking a car sold.
                      </p>
                    </div>
                  </section>
                </fieldset>
              )}
              {step === 'review' && (
                <section className="ld-panel ld-review">
                  <div className="ld-panel-heading">
                    <h3>Review this listing</h3>
                    <Check size={18} />
                  </div>
                  <div className="ld-panel-body">
                    <dl className="ld-review-values">
                      <div>
                        <dt>Vehicle</dt>
                        <dd>
                          {registration} · {Number(mileage).toLocaleString('en-GB')} miles
                        </dd>
                      </div>
                      <div>
                        <dt>Advert price</dt>
                        <dd>
                          {price ? pounds(Number(price)) : 'Not set'} · {vatStatus}
                        </dd>
                      </div>
                      <div>
                        <dt>Initial status</dt>
                        <dd>
                          {!price
                            ? 'Due In'
                            : requiresPrep
                              ? 'Available, in preparation'
                              : 'Available'}
                        </dd>
                      </div>
                      <div>
                        <dt>Photos</dt>
                        <dd>{photos.length} ordered photos</dd>
                      </div>
                      <div>
                        <dt>Selected channels</dt>
                        <dd>
                          {!requiresPrep && price
                            ? me?.channels
                                .filter((c) => channels[c.key])
                                .map((c) => c.label)
                                .join(', ') || 'None'
                            : 'None while unpriced or in preparation'}
                        </dd>
                      </div>
                      <div>
                        <dt>Partner feeds</dt>
                        <dd>
                          {!requiresPrep && price
                            ? me?.feeds
                                .filter((f) => feeds[f.id])
                                .map((f) => f.name)
                                .join(', ') || 'None'
                            : 'None while unpriced or in preparation'}
                        </dd>
                      </div>
                    </dl>
                    {attentionGrabber && <p>{attentionGrabber}</p>}
                    <p className="ld-muted">
                      Review before creating. After a timeout, keep this page open and check add
                      status. Retrying uses the original details and request ID.
                    </p>
                  </div>
                </section>
              )}
              <div className="ld-add-actions">
                {step === 'prepare' ? (
                  <button
                    type="button"
                    className="ld-button primary"
                    disabled={busy || !me || (requiresPrep && !price)}
                    onClick={(event) => {
                      if (event.currentTarget.form?.reportValidity()) {
                        setStep('review')
                        setError('')
                      }
                    }}
                  >
                    Review listing <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ld-button"
                      disabled={busy || !!pending}
                      onClick={() => setStep('prepare')}
                    >
                      Edit details
                    </button>
                    <button className="ld-button primary" disabled={busy || !me}>
                      {busy
                        ? 'Saving…'
                        : createdId
                          ? 'Retry remaining feeds'
                          : pending
                            ? 'Retry original add'
                            : 'Add to stock'}
                    </button>
                    {pending && !createdId && (
                      <button
                        type="button"
                        className="ld-button"
                        disabled={busy}
                        onClick={() => void check()}
                      >
                        Check add status
                      </button>
                    )}
                    {createdId && (
                      <button
                        type="button"
                        className="ld-button"
                        disabled={busy}
                        onClick={() => onAdded(createdId, error)}
                      >
                        Open created vehicle
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
          )}
          <details className="ld-insights-disclosure">
            <summary>Vehicle information · valuations, MOT history & checks</summary>
            <VehicleInsights
              key={registration + mileage}
              insights={lookup.insights}
              registration={registration}
              mileage={Number(mileage)}
            />
          </details>
        </>
      )}
    </section>
  )
}
