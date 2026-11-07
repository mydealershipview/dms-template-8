'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  SearchCheck,
  Store,
} from 'lucide-react'
import { adminApi, labels, pounds, type Me, type Vehicle } from './types'
import { PhotoCount, StatusBadge, StockSkeleton, VehiclePhoto, VehicleSpecs } from './ui'
const SoldCars = dynamic(() => import('./SoldCars'), { loading: () => <StockSkeleton /> })
const VehicleEditor = dynamic(() => import('./VehicleEditor'), { loading: () => <StockSkeleton /> })
const AddVehicle = dynamic(() => import('./AddVehicle'), { loading: () => <StockSkeleton /> })
const COUNT_KEYS: Record<string, keyof Me['counts']> = {
  ALL: 'all',
  AVAILABLE: 'available',
  DUE_IN: 'dueIn',
  SALE_IN_PROGRESS: 'saleInProgress',
  SOLD: 'sold',
}
type StockPage = { vehicles: Vehicle[]; pagination: { totalPages: number; totalResults: number } }
const PAGE_SIZE = 24
export default function Workspace() {
  const [me, setMe] = useState<Me | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [soldView, setSoldView] = useState(false)
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)
  const [profileRevision, setProfileRevision] = useState(0)
  // Per mounted workspace only: never share authenticated inventory between users or persist it.
  const pages = useRef(new Map<string, { data: StockPage; expires: number }>())
  const generation = useRef(0)
  const listScroll = useRef(0)
  const navigationGuard = useRef<() => boolean>(() => true)
  const activeVehicle = useRef<string | null>(null)
  activeVehicle.current = selected
  const registerNavigationGuard = useCallback((guard: () => boolean) => {
    navigationGuard.current = guard
  }, [])
  const refresh = useCallback((message = 'Changes saved.', counts = false) => {
    setNotice(message)
    pages.current.clear()
    generation.current++
    setRevision((n) => n + 1)
    if (counts) setProfileRevision((n) => n + 1)
  }, [])
  useEffect(() => {
    const readUrl = () => {
      if (!navigationGuard.current()) {
        window.history.pushState(
          {},
          '',
          activeVehicle.current
            ? `/admin?vehicle=${encodeURIComponent(activeVehicle.current)}`
            : '/admin',
        )
        return
      }
      setSelected(new URLSearchParams(window.location.search).get('vehicle'))
      setAdding(false)
    }
    readUrl()
    window.addEventListener('popstate', readUrl)
    return () => window.removeEventListener('popstate', readUrl)
  }, [])
  function openVehicle(id: string, event?: MouseEvent<HTMLAnchorElement>) {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return
    event?.preventDefault()
    listScroll.current = window.scrollY
    window.history.pushState({}, '', `/admin?vehicle=${encodeURIComponent(id)}`)
    setSelected(id)
    setAdding(false)
    window.scrollTo({ top: 0 })
  }
  function closeVehicle() {
    window.history.pushState({}, '', '/admin')
    setSelected(null)
    setAdding(false)
    requestAnimationFrame(() => window.scrollTo({ top: listScroll.current }))
  }
  useEffect(() => {
    const controller = new AbortController()
    setProfileError('')
    adminApi<Me>('dms/me', 'GET', undefined, { signal: controller.signal })
      .then(setMe)
      .catch((e) => {
        if (!controller.signal.aborted) setProfileError(e.message)
      })
    return () => controller.abort()
  }, [profileRevision])
  useEffect(() => {
    if (selected || adding) return
    const controller = new AbortController()
    const qs = new URLSearchParams({
      status,
      search: query,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    })
    const key = qs.toString(),
      cached = pages.current.get(key),
      version = generation.current
    const apply = (stock: StockPage) => {
      setVehicles(stock.vehicles)
      setTotalPages(stock.pagination.totalPages)
      setTotal(stock.pagination.totalResults)
      setLoading(false)
    }
    setError('')
    if (cached && cached.expires > Date.now()) {
      apply(cached.data)
      return
    }
    setLoading(true)
    adminApi<StockPage>(`dms/stock?${qs}`, 'GET', undefined, { signal: controller.signal })
      .then((stock) => {
        if (controller.signal.aborted || generation.current !== version) return
        if (pages.current.size >= 12) pages.current.delete(pages.current.keys().next().value!)
        pages.current.set(key, { data: stock, expires: Date.now() + 30000 })
        apply(stock)
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [status, query, page, revision, selected, adding])
  async function signOut() {
    if (!navigationGuard.current()) return
    try {
      await adminApi('auth/logout', 'POST')
      window.location.assign('/admin/login')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <div className="ld-shell">
      <a className="ld-skip" href="#workspace">
        Skip to stock management
      </a>
      <header className="ld-topbar">
        <Link
          href="/admin"
          className="ld-brand"
          onClick={(e) => {
            e.preventDefault()
            if (navigationGuard.current()) {
              setSoldView(false)
              closeVehicle()
            }
          }}
        >
          {me?.dealer.name || 'Dealer workspace'}
          <span>Stock management</span>
        </Link>
        <span className="ld-workspace-label">Dealer workspace</span>
        <div className="ld-toplinks">
          <a href="/" target="_blank" rel="noreferrer">
            View website <ArrowUpRight size={15} />
          </a>
          <button onClick={signOut} aria-label="Sign out">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <nav className="ld-app-nav" aria-label="Workspace">
        <button
          aria-current={!adding && !soldView ? 'page' : undefined}
          onClick={() => {
            if (navigationGuard.current()) {
              setSoldView(false)
              closeVehicle()
            }
          }}
        >
          <CarFront size={17} />
          My stock
        </button>
        <button
          aria-current={adding ? 'page' : undefined}
          onClick={() => {
            if (adding) return
            if (navigationGuard.current()) {
              window.history.pushState({}, '', '/admin')
              setSelected(null)
              setSoldView(false)
              setAdding(true)
              window.scrollTo({ top: 0 })
            }
          }}
        >
          <SearchCheck size={17} />
          Vehicle finder
        </button>
        <button
          aria-label="Manage Sold Cars page"
          aria-current={soldView ? 'page' : undefined}
          onClick={() => {
            if (navigationGuard.current()) {
              setSoldView(true)
              setAdding(false)
              setSelected(null)
            }
          }}
        >
          <Store size={17} />
          Sold cars
        </button>
        <span>{me?.dealer.name || 'Your dealership'}</span>
      </nav>
      {soldView ? (
        <SoldCars />
      ) : (
        <main className="ld-main" id="workspace">
          {!selected && !adding && (
            <div className="ld-heading">
              <div>
                <div className="ld-eyebrow">YOUR INVENTORY</div>
                <h1>My stock</h1>
                <p className="ld-muted">Your vehicles, ready to manage.</p>
              </div>
              <button
                className="ld-button primary"
                onClick={() => {
                  setSoldView(false)
                  setAdding(true)
                  setSelected(null)
                }}
              >
                <Plus size={17} />
                Add a car
              </button>
            </div>
          )}
          {notice && (
            <p role="status" className="ld-notice">
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss message">
                ×
              </button>
            </p>
          )}
          {profileError && !error && (
            <div role="alert" className="ld-error">
              {profileError}{' '}
              <button onClick={() => setProfileRevision((n) => n + 1)}>
                Retry account details
              </button>
            </div>
          )}
          {adding ? (
            <AddVehicle
              me={me}
              onClose={closeVehicle}
              registerNavigationGuard={registerNavigationGuard}
              onOpenExisting={openVehicle}
              onAdded={(id, warning) => {
                refresh(
                  warning
                    ? `Car added. ${warning}`
                    : 'Car added. You can now manage its photos and listings.',
                  true,
                )
                openVehicle(id)
              }}
            />
          ) : selected ? (
            <VehicleEditor
              key={selected}
              stockId={selected}
              me={me}
              onClose={closeVehicle}
              onSaved={refresh}
              registerNavigationGuard={registerNavigationGuard}
            />
          ) : (
            <>
              <nav className="ld-tabs" aria-label="Stock status">
                {Object.keys(COUNT_KEYS).map((key) => (
                  <button
                    key={key}
                    aria-current={status === key ? 'page' : undefined}
                    onClick={() => {
                      setStatus(key)
                      setPage(1)
                    }}
                  >
                    {labels[key]}
                    <span className="ld-count">{me?.counts[COUNT_KEYS[key]] ?? '—'}</span>
                  </button>
                ))}
              </nav>
              <form
                className="ld-toolbar"
                onSubmit={(e) => {
                  e.preventDefault()
                  setQuery(search.trim())
                  setPage(1)
                }}
              >
                <label className="ld-search">
                  <span className="ld-sr">Search stock</span>
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search registration, make or model"
                  />
                </label>
                <button className="ld-button" type="submit">
                  Search
                </button>
                <span className="ld-result-count">
                  {loading ? 'Loading vehicles…' : `${total.toLocaleString('en-GB')} vehicles`}
                </span>
                <button
                  type="button"
                  className="ld-button ld-icon-button"
                  onClick={() => refresh('Stock refreshed.', true)}
                  aria-label="Refresh stock"
                >
                  <RefreshCw size={17} />
                </button>
                <div className="ld-view-switch" aria-label="Stock display">
                  <button
                    type="button"
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    onClick={() => setView('grid')}
                  >
                    <LayoutGrid size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label="List view"
                    aria-pressed={view === 'list'}
                    onClick={() => setView('list')}
                  >
                    <List size={17} />
                  </button>
                </div>
              </form>
              {error ? (
                <div role="alert" className="ld-error">
                  {error} <button onClick={() => refresh('', true)}>Try again</button>
                </div>
              ) : loading ? (
                <StockSkeleton />
              ) : !vehicles.length ? (
                <div className="ld-empty">
                  <CarFront size={36} />
                  <h2>No cars found</h2>
                  <p>Try a different search or add a car to your stock.</p>
                  <button className="ld-button primary" onClick={() => setAdding(true)}>
                    <Plus size={16} />
                    Add a car
                  </button>
                </div>
              ) : view === 'grid' ? (
                <div className="ld-stock-grid">
                  {vehicles.map((car, index) => (
                    <article className="ld-card" key={car.stockId}>
                      <a
                        className="ld-card-photo"
                        href={`/admin?vehicle=${encodeURIComponent(car.stockId)}`}
                        onClick={(e) => openVehicle(car.stockId, e)}
                        aria-label={`Manage ${car.registration}`}
                      >
                        <VehiclePhoto
                          url={car.thumbnail}
                          title={`${car.make} ${car.model}`}
                          eager={index < 4}
                        />
                        <StatusBadge status={car.status} inPrep={car.inPrep} />
                        <PhotoCount count={car.imageCount} />
                      </a>
                      <div className="ld-card-body">
                        <span className="ld-reg">{car.registration || 'No registration'}</span>
                        <a
                          className="ld-card-title"
                          href={`/admin?vehicle=${encodeURIComponent(car.stockId)}`}
                          onClick={(e) => openVehicle(car.stockId, e)}
                        >
                          <h2>
                            {car.make} {car.model}
                          </h2>
                        </a>
                        <p className="ld-derivative">{car.derivative || 'Vehicle details'}</p>
                        <VehicleSpecs car={car} />
                        <div className="ld-card-price">
                          <strong>{pounds(car.advertPrice)}</strong>
                          <span>{car.vatStatus || 'VAT status not set'}</span>
                        </div>
                        <div className="ld-card-channels">
                          <span>
                            <i className={car.channels?.advertiserAdvert ? 'on' : ''} />
                            Website
                          </span>
                          <span>
                            <i className={car.channels?.autotraderAdvert ? 'on' : ''} />
                            AutoTrader
                          </span>
                        </div>
                      </div>
                      <a
                        className="ld-card-action"
                        href={`/admin?vehicle=${encodeURIComponent(car.stockId)}`}
                        onClick={(e) => openVehicle(car.stockId, e)}
                      >
                        Manage vehicle <ArrowRight size={16} />
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ld-table-wrap">
                  <table className="ld-table">
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Advertised price</th>
                        <th>Photos</th>
                        <th>
                          <span className="ld-sr">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((car) => (
                        <tr key={car.stockId}>
                          <td>
                            <a
                              className="ld-vehicle-link"
                              href={`/admin?vehicle=${encodeURIComponent(car.stockId)}`}
                              onClick={(e) => openVehicle(car.stockId, e)}
                            >
                              <span className="ld-table-photo">
                                <VehiclePhoto
                                  url={car.thumbnail}
                                  title={`${car.make} ${car.model}`}
                                  size="thumb"
                                />
                              </span>
                              <span>
                                <strong>
                                  {car.make} {car.model}
                                </strong>
                                <small>{car.derivative}</small>
                                <span className="ld-reg">{car.registration}</span>
                                <VehicleSpecs car={car} />
                              </span>
                            </a>
                          </td>
                          <td>
                            <StatusBadge status={car.status} inPrep={car.inPrep} />
                          </td>
                          <td>
                            <strong>{pounds(car.advertPrice)}</strong>
                            <small>{car.vatStatus}</small>
                          </td>
                          <td>{car.imageCount}</td>
                          <td>
                            <a
                              className="ld-button"
                              href={`/admin?vehicle=${encodeURIComponent(car.stockId)}`}
                              onClick={(e) => openVehicle(car.stockId, e)}
                            >
                              Manage <ArrowRight size={15} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="ld-pagination">
                <span>
                  {!loading && !error && total
                    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} vehicles`
                    : 'Stock inventory'}
                </span>
                <div>
                  <button
                    className="ld-button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((n) => n - 1)}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span>
                    Page {page} of {Math.max(totalPages, 1)}
                  </span>
                  <button
                    className="ld-button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((n) => n + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
          <footer className="ld-footer">
            <span>{me?.user.name || me?.user.email || 'Dealer workspace'}</span>
            <span>Powered by MYDEALERSHIPVIEW</span>
          </footer>
        </main>
      )}
    </div>
  )
}
