'use client'
import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Check,
  ChevronRight,
  Globe,
  ImageIcon,
  Info,
  Megaphone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import PartnerFeeds from './PartnerFeeds'
import { adminApi, labels, pounds, type Me, type Photo, type Vehicle } from './types'
import VehicleInsights from './VehicleInsights'
import type { FinderResult } from './finderTypes'
import { PhotoCount, StatusBadge, VehiclePhoto, VehicleSpecs } from './ui'
const SECTIONS = [
  { id: 'overview', name: 'Overview', description: 'Summary, pricing & status', icon: Info },
  {
    id: 'insights',
    name: 'Vehicle information',
    description: 'Valuations, MOT & checks',
    icon: ShieldCheck,
  },
  { id: 'photos', name: 'Photos', description: 'Gallery & cover photo', icon: ImageIcon },
  { id: 'listings', name: 'Listings', description: 'Channels & partner feeds', icon: Megaphone },
  { id: 'website', name: 'Website', description: 'Highlight & presentation', icon: Globe },
] as const
type Section = (typeof SECTIONS)[number]['id']
export default function VehicleEditor({
  stockId,
  me,
  onClose,
  onSaved,
  registerNavigationGuard,
}: {
  stockId: string
  me: Me | null
  onClose: () => void
  registerNavigationGuard?: (guard: () => boolean) => void
  onSaved: (message?: string, counts?: boolean) => void
}) {
  const [feedsDirty, setFeedsDirty] = useState(false)
  const [car, setCar] = useState<Vehicle | null>(null)
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('')
  const [research, setResearch] = useState<FinderResult | null>(null)
  const [researchError, setResearchError] = useState('')
  const [researchRetry, setResearchRetry] = useState(0)
  const [section, setSection] = useState<Section>('overview')
  const [price, setPrice] = useState(''),
    [vat, setVat] = useState('No VAT')
  const [highlight, setHighlight] = useState(''),
    [savedHighlight, setSavedHighlight] = useState(''),
    [highlightLoaded, setHighlightLoaded] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([]),
    [channels, setChannels] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState('AVAILABLE'),
    [keep, setKeep] = useState(true),
    [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [soldDate, setSoldDate] = useState(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date()),
  )
  const [highlightRetry, setHighlightRetry] = useState(0)
  const [retry, setRetry] = useState(0),
    [discard, setDiscard] = useState(false)
  const base = `dms/stock/${encodeURIComponent(stockId)}`,
    local = `vehicles/${encodeURIComponent(stockId)}`
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    // Website overrides authorize and read stock again on the server. Defer that request until
    // the Website section is opened, rather than doubling the initial detail lookup.
    adminApi<{ vehicle: Vehicle }>(base, 'GET', undefined, { signal: controller.signal })
      .then(({ vehicle: v }) => {
        if (controller.signal.aborted) return
        setCar(v)
        setPrice(String(v.advertPrice ?? ''))
        setVat(v.vatStatus || 'No VAT')
        setPhotos(v.images)
        setChannels(v.channels)
        setStatus(v.status)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [base, retry])
  useEffect(() => {
    if (section !== 'website' || highlightLoaded) return
    const controller = new AbortController()
    adminApi<{ websiteHighlight: string }>(`${local}/highlight`, 'GET', undefined, {
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) {
          setHighlight(result.websiteHighlight)
          setSavedHighlight(result.websiteHighlight)
          setHighlightLoaded(true)
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [section, local, highlightLoaded, highlightRetry])
  useEffect(() => {
    if (section !== 'insights' || research || !car?.registration || !car.mileage) return
    const controller = new AbortController()
    setResearchError('')
    adminApi<FinderResult>(
      `dms/vehicle-lookup?${new URLSearchParams({ registration: car.registration, mileage: String(car.mileage) })}`,
      'GET',
      undefined,
      { signal: controller.signal },
    )
      .then((result) => {
        if (!controller.signal.aborted) setResearch(result)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setResearchError(e.message)
      })
    return () => controller.abort()
  }, [section, research, car?.registration, car?.mileage, researchRetry])
  const priceDirty =
    !!car && (price !== String(car.advertPrice ?? '') || vat !== (car.vatStatus || 'No VAT'))
  const photosDirty =
    !!car &&
    JSON.stringify(photos.map((p) => p.imageId)) !==
      JSON.stringify(car.images.map((p) => p.imageId))
  const channelsDirty = !!car && JSON.stringify(channels) !== JSON.stringify(car.channels)
  const dirty =
    priceDirty ||
    photosDirty ||
    channelsDirty ||
    feedsDirty ||
    highlight !== savedHighlight ||
    (!!car && status !== car.status)
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    if (dirty || busy) window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, busy])
  useEffect(() => {
    registerNavigationGuard?.(
      () => !busy && (!dirty || window.confirm('Discard unsaved vehicle changes?')),
    )
    return () => registerNavigationGuard?.(() => true)
  }, [dirty, busy, registerNavigationGuard])
  async function save(
    action: () => Promise<{ warning?: string }>,
    success: string,
    counts = false,
  ) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await action()
      const text = result.warning ? `${success} ${result.warning}` : success
      setMessage(text)
      onSaved(text, counts)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return
    await save(async () => {
      const warnings: string[] = []
      for (const file of Array.from(files)) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size > 10 * 1024 * 1024 ||
          !file.size
        )
          throw new Error('Choose JPEG, PNG or WebP photos under 10 MB.')
        const form = new FormData()
        form.append('image', file)
        const photo = await adminApi<Photo>('dms/images', 'POST', form)
        setPhotos((old) => [...old, photo])
        if (photo.warning) warnings.push(photo.warning)
      }
      return { warning: warnings.join(' ') || undefined }
    }, 'Photos uploaded. Save the photo order to apply them to this car.')
  }
  function move(index: number, delta: number) {
    setPhotos((old) => {
      const next = [...old]
      ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
      return next
    })
  }
  function changeStatus(e: FormEvent) {
    e.preventDefault()
    if (status === 'DELETED' && deleteConfirmation !== car?.registration) {
      setError('Type the registration to confirm deletion.')
      return
    }
    void save(
      async () => {
        const result = await adminApi(`${local}/status`, 'POST', {
          status,
          soldDate,
          keepOnSoldPage: keep,
        })
        if (status === 'DELETED') onClose()
        else if (!result.warning) setCar((old) => (old ? { ...old, status } : old))
        return result
      },
      status === 'DELETED'
        ? 'Car deleted. Re-add it as a new stock record if needed.'
        : 'Status updated.',
      true,
    )
  }
  function back() {
    if (dirty) {
      setDiscard(true)
      return
    }
    onClose()
  }
  const heading = SECTIONS.find((s) => s.id === section)!
  return (
    <section className="ld-editor">
      <div className="ld-breadcrumb">
        <button onClick={back} disabled={busy}>
          <ArrowLeft size={16} />
          My stock
        </button>
        <ChevronRight size={14} />
        <span>{car?.registration || 'Vehicle'}</span>
      </div>
      {discard && (
        <div role="alert" className="ld-error ld-discard">
          <span>You have unsaved changes. Save them before leaving, or discard them.</span>
          <button className="ld-button" onClick={() => setDiscard(false)}>
            Keep editing
          </button>
          <button className="ld-button danger" onClick={onClose}>
            Discard changes
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="ld-error">
          {error}{' '}
          {(!car || (section === 'website' && !highlightLoaded)) && (
            <button
              onClick={() => {
                setError('')
                if (car) setHighlightRetry((n) => n + 1)
                else setRetry((n) => n + 1)
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
      {message && (
        <p role="status" className="ld-notice">
          <Check size={17} />
          {message}
          <button onClick={() => setMessage('')} aria-label="Dismiss vehicle message">
            ×
          </button>
        </p>
      )}
      {!car ? (
        <div className="ld-detail-skeleton" role="status" aria-label="Loading vehicle">
          <div />
          <div />
          <div />
        </div>
      ) : (
        <>
          <div className="ld-detail-title">
            <div>
              <span className="ld-reg">{car.registration || 'No registration'}</span>
              <h1>
                {car.make} {car.model}
              </h1>
              <p>{car.derivative}</p>
            </div>
            <StatusBadge status={car.status} inPrep={car.inPrep} />
          </div>
          <div className="ld-detail-layout">
            <aside className="ld-detail-sidebar">
              <div className="ld-sidebar-label">Vehicle workspace</div>
              <nav aria-label="Vehicle sections">
                {SECTIONS.map(({ id, name, description, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setSection(id)
                      setError('')
                    }}
                    aria-current={section === id ? 'page' : undefined}
                    disabled={busy}
                  >
                    <Icon size={18} />
                    <span>
                      <strong>{name}</strong>
                      <small>{description}</small>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </nav>
              <div className="ld-sidebar-note">
                <Globe size={17} />
                <p>
                  Changes are saved to your DMS. Website highlights are stored in DMS and only shown
                  on your website.
                </p>
              </div>
            </aside>
            <div className="ld-detail-content">
              <div className="ld-section-heading">
                <div>
                  <h2>{heading.name}</h2>
                  <p>{heading.description}</p>
                </div>
                {busy && (
                  <span className="ld-muted" role="status">
                    Saving changes…
                  </span>
                )}
              </div>
              {section === 'overview' && (
                <>
                  <div className="ld-overview-hero">
                    <button
                      className="ld-hero-photo"
                      onClick={() => setSection('photos')}
                      aria-label="Open vehicle photos"
                    >
                      <VehiclePhoto
                        url={car.images[0]?.url}
                        title={`${car.make} ${car.model}`}
                        eager
                        size="detail"
                      />
                      <PhotoCount count={car.images.length} />
                    </button>
                    <div className="ld-hero-info">
                      <span className="ld-eyebrow">VEHICLE DETAILS</span>
                      <h2>
                        {car.make} {car.model}
                      </h2>
                      <p>{car.derivative}</p>
                      <VehicleSpecs car={car} />
                      <dl className="ld-details-list">
                        {[
                          ['Body type', car.bodyType],
                          ['Colour', car.colour],
                          ['Transmission', car.transmissionType],
                        ]
                          .filter(([, v]) => v)
                          .map(([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                      </dl>
                      <button className="ld-button" onClick={() => setSection('photos')}>
                        <Camera size={16} />
                        Manage photos
                      </button>
                    </div>
                  </div>
                  {car.inPrep && (
                    <div className="ld-prep-notice">
                      <Info size={18} />
                      <span>
                        This vehicle is in prep. Publishing is blocked until preparation is
                        completed in the DMS.
                      </span>
                    </div>
                  )}
                  <fieldset disabled={busy} className="ld-overview-panels">
                    <form
                      className="ld-panel"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void save(async () => {
                          const result = await adminApi(`${base}/price`, 'PATCH', {
                            price: Number(price),
                            vatStatus: vat,
                          })
                          setCar((old) =>
                            old ? { ...old, advertPrice: Number(price), vatStatus: vat } : old,
                          )
                          return result
                        }, 'Price and VAT status saved.')
                      }}
                    >
                      <div className="ld-panel-heading">
                        <h3>Advertised price</h3>
                        <span className="ld-muted">Price & VAT</span>
                      </div>
                      <div className="ld-panel-body">
                        <label>
                          Advertised price (£)
                          <input
                            type="number"
                            min="75"
                            max="9999999"
                            step="0.01"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </label>
                        <label>
                          Listing VAT status
                          <select value={vat} onChange={(e) => setVat(e.target.value)}>
                            {['No VAT', 'Inc VAT', 'Ex VAT'].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        {vat === 'Ex VAT' && (
                          <div className="ld-price-total">
                            <span>Including 20% VAT</span>
                            <strong>{pounds(Number(price) * 1.2)}</strong>
                          </div>
                        )}
                        <p className="ld-muted">
                          VAT status affects margin calculations unless purchase VAT has been
                          overridden.
                        </p>
                      </div>
                      <div className="ld-panel-footer">
                        <button className="ld-button primary" disabled={!priceDirty}>
                          <Save size={16} />
                          Save price
                        </button>
                      </div>
                    </form>
                    <form className="ld-panel" onSubmit={changeStatus}>
                      <div className="ld-panel-heading">
                        <h3>Vehicle status</h3>
                        <StatusBadge status={car.status} />
                      </div>
                      <div className="ld-panel-body">
                        <label>
                          Status
                          <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            {!labels[car.status] && (
                              <option value={car.status} disabled>
                                {car.status.replaceAll('_', ' ')}
                              </option>
                            )}
                            {Object.entries(labels)
                              .filter(([key]) => key !== 'ALL')
                              .map(([key, name]) => (
                                <option
                                  value={key}
                                  key={key}
                                  disabled={
                                    car.status === 'SOLD' && key !== 'DELETED' && key !== 'SOLD'
                                  }
                                >
                                  {name}
                                </option>
                              ))}
                          </select>
                        </label>
                        {status === 'SOLD' && (
                          <>
                            <label>
                              Sold date
                              <input
                                type="date"
                                required
                                value={soldDate}
                                max={new Intl.DateTimeFormat('en-CA', {
                                  timeZone: 'Europe/London',
                                }).format(new Date())}
                                onChange={(e) => setSoldDate(e.target.value)}
                              />
                            </label>
                            <label className="ld-check">
                              <input
                                type="checkbox"
                                checked={keep}
                                onChange={(e) => setKeep(e.target.checked)}
                              />
                              Keep on the Sold Cars page
                            </label>
                            <p className="ld-muted">
                              Keep a snapshot on your website after the vehicle is sold.
                            </p>
                          </>
                        )}
                        {status === 'DELETED' && (
                          <div className="ld-error">
                            <p>
                              This removes the vehicle and its listings. Re-adding creates a new
                              stock record.
                            </p>
                            <label>
                              Type {car.registration} to confirm
                              <input
                                value={deleteConfirmation}
                                onChange={(e) =>
                                  setDeleteConfirmation(e.target.value.toUpperCase())
                                }
                                required
                              />
                            </label>
                          </div>
                        )}
                        <p className="ld-muted">
                          Status changes follow the same rules as your DMS and update your listings.
                        </p>
                      </div>
                      <div className="ld-panel-footer">
                        <button
                          className={`ld-button ${status === 'DELETED' ? 'danger' : 'primary'}`}
                          disabled={
                            status === car.status || (car.status === 'SOLD' && status !== 'DELETED')
                          }
                        >
                          <Save size={16} />
                          Update status
                        </button>
                      </div>
                    </form>
                  </fieldset>
                  {car.description && (
                    <div className="ld-panel">
                      <div className="ld-panel-heading">
                        <h3>Vehicle description</h3>
                      </div>
                      <p className="ld-panel-body ld-description">{car.description}</p>
                    </div>
                  )}
                </>
              )}
              {section === 'insights' &&
                (!car.registration || !car.mileage ? (
                  <p className="ld-error">
                    A registration and mileage above zero are required to retrieve vehicle
                    information. Use Vehicle finder with the correct details.
                  </p>
                ) : researchError ? (
                  <p role="alert" className="ld-error">
                    {researchError}{' '}
                    <button onClick={() => setResearchRetry((n) => n + 1)}>
                      Retry vehicle information
                    </button>
                  </p>
                ) : research ? (
                  <VehicleInsights
                    insights={research.insights}
                    registration={car.registration}
                    mileage={car.mileage}
                  />
                ) : (
                  <p role="status">Retrieving AutoTrader vehicle information…</p>
                ))}
              {section === 'photos' && (
                <fieldset disabled={busy} className="ld-photo-panel ld-panel">
                  <div className="ld-panel-heading">
                    <div>
                      <h3>
                        Vehicle gallery <span className="ld-count">{photos.length}</span>
                      </h3>
                      <p>
                        First photo is the cover. Reorder or remove photos, then save your changes.
                      </p>
                    </div>
                    <label className="ld-button ld-upload-button">
                      <Upload size={16} />
                      Upload photos
                      <input
                        className="ld-sr"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        aria-label="Upload photos"
                        onChange={(e) => {
                          void upload(e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  <div className="ld-panel-body">
                    <div className="ld-photos">
                      {photos.map((photo, i) => (
                        <div className="ld-photo-tile" key={photo.imageId}>
                          <div className="ld-photo-image">
                            <VehiclePhoto
                              url={photo.url}
                              title={`Vehicle photo ${i + 1}`}
                              eager={i < 4}
                            />
                            {i === 0 && <span className="ld-cover-label">Cover photo</span>}
                          </div>
                          <div className="ld-photo-actions">
                            <span>{String(i + 1).padStart(2, '0')}</span>
                            <button
                              type="button"
                              aria-label={`Move photo ${i + 1} earlier`}
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move photo ${i + 1} later`}
                              disabled={i === photos.length - 1}
                              onClick={() => move(i, 1)}
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove photo ${i + 1}`}
                              onClick={() => setPhotos((old) => old.filter((_, j) => j !== i))}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!photos.length && (
                      <div className="ld-empty">
                        <ImageIcon size={32} />
                        <h3>No photos selected</h3>
                        <p>Upload your first photo, or save to remove the existing gallery.</p>
                      </div>
                    )}
                  </div>
                  <div className="ld-panel-footer">
                    <span className="ld-muted">
                      {photosDirty ? 'You have unsaved gallery changes.' : 'Gallery is up to date.'}
                    </span>
                    <button
                      className="ld-button primary"
                      disabled={!photosDirty}
                      onClick={() =>
                        void save(async () => {
                          const result = await adminApi(`${base}/images`, 'PUT', {
                            imageIds: photos.map((p) => p.imageId),
                          })
                          setCar((old) =>
                            old
                              ? {
                                  ...old,
                                  images: photos,
                                  imageCount: photos.length,
                                  thumbnail: photos[0]?.url ?? null,
                                }
                              : old,
                          )
                          return result
                        }, 'Photos saved.')
                      }
                    >
                      <Save size={16} />
                      Save photo order
                    </button>
                  </div>
                </fieldset>
              )}
              {section === 'listings' && (
                <fieldset disabled={busy} className="ld-overview-panels">
                  <form
                    className="ld-panel"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void save(async () => {
                        const result = await adminApi(`${base}/channels`, 'PATCH', { channels })
                        const detail = await adminApi<{ vehicle: Vehicle }>(base)
                        setCar(detail.vehicle)
                        setChannels(detail.vehicle.channels)
                        return result
                      }, 'Listing channels saved.')
                    }}
                  >
                    <div className="ld-panel-heading">
                      <h3>AutoTrader channels</h3>
                    </div>
                    <div className="ld-panel-body">
                      <p className="ld-muted">Choose where this vehicle is advertised.</p>
                      {me?.channels.map((channel) => (
                        <label className="ld-toggle-row" key={channel.key}>
                          <span>
                            <strong>{channel.label}</strong>
                            <small>{channels[channel.key] ? 'Published' : 'Not published'}</small>
                          </span>
                          <input
                            type="checkbox"
                            role="switch"
                            checked={channels[channel.key] === true}
                            onChange={(e) =>
                              setChannels((old) => ({ ...old, [channel.key]: e.target.checked }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <div className="ld-panel-footer">
                      <button className="ld-button primary" disabled={!channelsDirty}>
                        <Save size={16} />
                        Save channels
                      </button>
                    </div>
                  </form>
                  <PartnerFeeds
                    stockId={stockId}
                    feeds={car.feeds}
                    onDirtyChange={setFeedsDirty}
                    onSaved={(feeds, text) => {
                      setCar((old) => (old ? { ...old, feeds } : old))
                      onSaved(text)
                    }}
                  />
                </fieldset>
              )}
              {section === 'website' && (
                <div className="ld-website-grid">
                  <form
                    className="ld-panel"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void save(async () => {
                        const result = await adminApi(`${local}/highlight`, 'PUT', {
                          websiteHighlight: highlight,
                        })
                        setSavedHighlight(highlight)
                        return result
                      }, 'Website highlight saved.')
                    }}
                  >
                    <div className="ld-panel-heading">
                      <h3>Website highlight</h3>
                      <span className="ld-website-badge">
                        <Globe size={13} />
                        Website only
                      </span>
                    </div>
                    <fieldset disabled={busy || !highlightLoaded} className="ld-panel-body">
                      <label>
                        Line on the vehicle photo
                        <input
                          value={highlight}
                          maxLength={60}
                          onChange={(e) => setHighlight(e.target.value)}
                          placeholder={
                            car.attentionGrabber || 'Leave blank to use the attention grabber'
                          }
                        />
                      </label>
                      <div className="ld-character-count">{highlight.length}/60</div>
                      <p className="ld-muted">
                        Shown on your website only. Leave blank to use the AutoTrader attention
                        grabber.
                      </p>
                      <p className="ld-muted">This does not change your AutoTrader advert.</p>
                    </fieldset>
                    <div className="ld-panel-footer">
                      <button
                        className="ld-button primary"
                        disabled={busy || !highlightLoaded || highlight === savedHighlight}
                      >
                        <Save size={16} />
                        Save highlight
                      </button>
                    </div>
                  </form>
                  <div>
                    <div className="ld-preview-label">WEBSITE PREVIEW</div>
                    <div className="ld-highlight-preview">
                      <VehiclePhoto
                        url={car.images[0]?.url}
                        title={`${car.make} ${car.model}`}
                        eager
                      />
                      {(highlight || car.attentionGrabber) && (
                        <span>{highlight || car.attentionGrabber}</span>
                      )}
                    </div>
                    <p className="ld-muted">
                      {car.make} {car.model} · {car.registration}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {busy && (
        <p role="status" className="ld-saving">
          <Save size={17} />
          Saving changes. Please keep this page open.
        </p>
      )}
    </section>
  )
}
