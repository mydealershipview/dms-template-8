'use client'
import { vehiclePrice as currentPrice,priceLabel,vatLabel,photoLine,highlightLine } from '@/utilities/vehiclePresentation'
import { StockLabels,VatNote } from '@/components/vehicle/StockLabels'

import { useDealer } from '@/config/DealerProvider'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AutoTraderVehicle } from '@/utilities/autotrader'
import { Make, Model } from '@/utilities/types'
import { formatPrice, generateVehicleSlug } from '@/utilities/formatVehicleData'
import { useWishlist } from '@/contexts/WishlistContext'
import { ChevronDown, Search, CreditCard, Camera, Video, SlidersHorizontal, X } from 'lucide-react'

interface UsedCarsComponentProps {
  listingsData?: unknown
}

interface ListingsFilters {
  search: string
  make: string
  model: string
  minPrice: string
  maxPrice: string
  fuelType: string
  bodyType: string
  transmissionType: string
  minYear: string
  maxYear: string
  colour: string
  minMileage: string
  maxMileage: string
}

type ExtendedModel = Model & {
  makeName: string
}

export default function UsedCarsComponent({ listingsData: _listingsData }: UsedCarsComponentProps) {
  const dealer = useDealer()
  const activeRequest = useRef<AbortController | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [listings, setListings] = useState<AutoTraderVehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [pageSize] = useState(20)
  const { toggleWishlist, isInWishlist } = useWishlist()

  // Sorting state
  const [sortBy, setSortBy] = useState('price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  // Make and Model state
  const [makes, setMakes] = useState<Make[]>([])
  const [models, setModels] = useState<ExtendedModel[]>([])
  const [allModels, setAllModels] = useState<ExtendedModel[]>([])
  const [makesModelsLoaded, setMakesModelsLoaded] = useState(false)

  // Get current page from URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Get sorting from URL params
  useEffect(() => {
    const urlSortBy = searchParams.get('sortBy') || 'price'
    const urlSortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    setSortBy(urlSortBy)
    setSortOrder(urlSortOrder)
  }, [searchParams])

  // Get filters from URL params
  const getFiltersFromParams = useCallback((): ListingsFilters => {
    return {
      search: searchParams.get('search') || '',
      make: searchParams.get('make') || '',
      model: searchParams.get('model') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      fuelType: searchParams.get('fuelType') || '',
      bodyType: searchParams.get('bodyType') || '',
      transmissionType: searchParams.get('transmissionType') || '',
      minYear: searchParams.get('minYear') || '',
      maxYear: searchParams.get('maxYear') || '',
      colour: searchParams.get('colour') || '',
      minMileage: searchParams.get('minMileage') || '',
      maxMileage: searchParams.get('maxMileage') || '',
    }
  }, [searchParams])

  const filters = getFiltersFromParams()

  const totalPages = Math.ceil(totalResults / pageSize)

  const fetchListings = async (
    page: number,
    currentFilters: ListingsFilters,
    currentSortBy?: string,
    currentSortOrder?: 'asc' | 'desc',
  ) => {
    activeRequest.current?.abort()
    const controller = new AbortController();activeRequest.current = controller
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: currentSortBy || sortBy,
        sortOrder: currentSortOrder || sortOrder,
      })

      // Add filters to query params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`/api/listings?${queryParams}`,{signal:controller.signal})

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setListings(data.results)
      setTotalResults(data.totalResults)

      // Update makes and models from the response
      if (data.availableMakes) {
        setMakes(data.availableMakes)
      }
      if (data.availableModels) {
        setAllModels(data.availableModels)
        if (!makesModelsLoaded) {
          setMakesModelsLoaded(true)
        }
      }

      // Filter models for the selected make
      if (data.availableModels) {
        const filteredModels = currentFilters.make
          ? data.availableModels.filter((model: any) => {
              const selectedMakeObj = data.availableMakes?.find(
                (make: any) => make.name === currentFilters.make,
              )
              return selectedMakeObj && model.makeId === selectedMakeObj.makeId
            })
          : []
        setModels(filteredModels)
      }
    } catch (err) {
      if(controller.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Failed to fetch listings')
    } finally {
      if(!controller.signal.aborted) setLoading(false)
    }
  }

  // Load listings on component mount and when parameters change
  useEffect(() => {
    fetchListings(currentPage, filters, sortBy, sortOrder)
    return()=>activeRequest.current?.abort()
  }, [
    currentPage,
    sortBy,
    sortOrder,
    filters.search,
    filters.make,
    filters.model,
    filters.minPrice,
    filters.maxPrice,
    filters.fuelType,
    filters.bodyType,
    filters.transmissionType,
    filters.minYear,
    filters.maxYear,
    filters.colour,
    filters.minMileage,
    filters.maxMileage,
  ])

  const updateURL = useCallback(
    (
      newFilters: ListingsFilters,
      page: number = 1,
      newSortBy?: string,
      newSortOrder?: 'asc' | 'desc',
    ) => {
      const params = new URLSearchParams()

      if (page > 1) {
        params.set('page', page.toString())
      }

      const currentSortBy = newSortBy || sortBy
      const currentSortOrder = newSortOrder || sortOrder
      if (currentSortBy !== 'price' || currentSortOrder !== 'desc') {
        params.set('sortBy', currentSortBy)
        params.set('sortOrder', currentSortOrder)
      }

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        }
      })

      const newURL = params.toString() ? `?${params.toString()}` : '/used-cars'
      router.push(newURL, { scroll: false })
    },
    [router, sortBy, sortOrder],
  )

  const handleFilterChange = (key: keyof ListingsFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    updateURL(newFilters, 1, sortBy, sortOrder)
  }

  // Handle make change
  const handleMakeChange = (makeName: string) => {
    const newFilters = { ...filters, make: makeName, model: '' }
    setModels(allModels.filter(model=>model.makeId===makes.find(make=>make.name===makeName)?.makeId))
    updateURL(newFilters, 1, sortBy, sortOrder)
  }

  // Handle model change
  const handleModelChange = (modelName: string) => {
    const newFilters = { ...filters, model: modelName }
    updateURL(newFilters, 1, sortBy, sortOrder)
  }

  // Handle sorting change from dropdown
  const handleSortDropdownChange = (value: string) => {
    const lastDash = value.lastIndexOf('-')
    const newSortBy = value.substring(0, lastDash)
    const newSortOrder = value.substring(lastDash + 1) as 'asc' | 'desc'
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    updateURL(filters, 1, newSortBy, newSortOrder)
    fetchListings(1, filters, newSortBy, newSortOrder)
  }

  const handleClearFilters = () => {
    const clearedFilters: ListingsFilters = {
      search: '',
      make: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      fuelType: '',
      bodyType: '',
      transmissionType: '',
      minYear: '',
      maxYear: '',
      colour: '',
      minMileage: '',
      maxMileage: '',
    }
    updateURL(clearedFilters, 1, sortBy, sortOrder)
    setModels([])
  }

  const handlePageChange = (page: number) => {
    updateURL(filters, page, sortBy, sortOrder)
  }

  const formatMileage = (mileage: number | null) => {
    if (mileage == null) return null
    return `${new Intl.NumberFormat('en-GB').format(mileage)}mi`
  }

  const calculateMonthlyPayment = (price: number | null): string => {
    if (!price || price <= 0) return 'N/A'
    const deposit = price * 0.1
    const principal = price - deposit
    // 8.9% APR, 48 months
    const monthlyRate = Math.pow(1.089, 1 / 12) - 1
    const n = 48
    const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(monthly)
  }

  const isULEZCompliant = (vehicle: AutoTraderVehicle): boolean => {
    const emissionClass = (vehicle.vehicle.emissionClass || '').toLowerCase()
    const fuelType = (vehicle.vehicle.fuelType || vehicle.vehicle.standard?.fuelType || '').toLowerCase()
    if (fuelType === 'electric') return true
    if (fuelType === 'petrol' || fuelType === 'hybrid') {
      return emissionClass.includes('euro 4') || emissionClass.includes('euro 5') || emissionClass.includes('euro 6')
    }
    if (fuelType === 'diesel') return emissionClass.includes('euro 6')
    return false
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    manufacturer: true,
    model: false,
    price: false,
    bodyType: false,
    fuelType: false,
    transmission: false,
    year: false,
    mileage: false,
  })

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Search and colour filters are applied to the complete inventory before pagination.
  const filteredListings = listings
  useEffect(()=>{setSearchQuery(filters.search)},[filters.search])

  // Accordion section component
  const FilterSection = ({
    sectionKey,
    label,
    isActive,
    children,
  }: {
    sectionKey: string
    label: string
    isActive?: boolean
    children: React.ReactNode
  }) => (
    <div className="border-b border-white/10">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/5 transition-colors"
      >
        <span
          className={`text-sm font-semibold tracking-wide uppercase ${
            isActive ? 'text-red-500' : 'text-white'
          }`}
        >
          {label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            openSections[sectionKey] ? 'rotate-180' : ''
          }`}
        />
      </button>
      {openSections[sectionKey] && (
        <div className="px-5 pb-4 pt-1 space-y-2">{children}</div>
      )}
    </div>
  )

  const inputCls =
    'w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 appearance-none'
  const selectCls =
    'w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30'
  const filterSelectCls =
    'w-full bg-[#1f232a] border border-[#4a4f58] rounded-none px-4 py-3 text-sm text-white focus:outline-none focus:border-[#646b76] appearance-none'

  const [financeMode, setFinanceMode] = useState<'price' | 'monthly'>('price')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const priceOptions = [
    { label: 'Any', value: '' },
    { label: '£1,000', value: '1000' },
    { label: '£2,000', value: '2000' },
    { label: '£3,000', value: '3000' },
    { label: '£5,000', value: '5000' },
    { label: '£7,500', value: '7500' },
    { label: '£10,000', value: '10000' },
    { label: '£12,500', value: '12500' },
    { label: '£15,000', value: '15000' },
    { label: '£20,000', value: '20000' },
    { label: '£25,000', value: '25000' },
    { label: '£30,000', value: '30000' },
    { label: '£40,000', value: '40000' },
    { label: '£50,000', value: '50000' },
  ]

  const monthlyOptions = [
    { label: 'Any', value: '' },
    { label: '£100', value: '100' },
    { label: '£150', value: '150' },
    { label: '£200', value: '200' },
    { label: '£250', value: '250' },
    { label: '£300', value: '300' },
    { label: '£350', value: '350' },
    { label: '£400', value: '400' },
    { label: '£500', value: '500' },
    { label: '£600', value: '600' },
    { label: '£700', value: '700' },
  ]

  const estimateMonthlyFromPrice = (price: number): number => {
    if (price <= 0) return 0
    const deposit = price * 0.1
    const principal = price - deposit
    const monthlyRate = Math.pow(1.089, 1 / 12) - 1
    const n = 48
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
  }

  const estimatePriceFromMonthly = (monthly: number): number => {
    if (monthly <= 0) return 0
    let low = 0
    let high = 100000
    for (let i = 0; i < 25; i++) {
      const mid = (low + high) / 2
      const estimate = estimateMonthlyFromPrice(mid)
      if (estimate < monthly) {
        low = mid
      } else {
        high = mid
      }
    }
    return Math.round((low + high) / 2)
  }

  const monthlyFromValue = useMemo(() => {
    if (!filters.minPrice) return ''
    const value = Math.round(estimateMonthlyFromPrice(Number(filters.minPrice)))
    const match = monthlyOptions.find((option) => option.value && Number(option.value) === value)
    return match?.value || ''
  }, [filters.minPrice])

  const monthlyToValue = useMemo(() => {
    if (!filters.maxPrice) return ''
    const value = Math.round(estimateMonthlyFromPrice(Number(filters.maxPrice)))
    const match = monthlyOptions.find((option) => option.value && Number(option.value) === value)
    return match?.value || ''
  }, [filters.maxPrice])

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 1949 }, (_, i) => (currentYear - i).toString())
  }, [])

  const mileageOptions = [
    { label: 'Any', value: '' },
    { label: '1,000', value: '1000' },
    { label: '5,000', value: '5000' },
    { label: '10,000', value: '10000' },
    { label: '20,000', value: '20000' },
    { label: '30,000', value: '30000' },
    { label: '40,000', value: '40000' },
    { label: '50,000', value: '50000' },
    { label: '60,000', value: '60000' },
    { label: '70,000', value: '70000' },
    { label: '80,000', value: '80000' },
    { label: '90,000', value: '90000' },
    { label: '100,000', value: '100000' },
    { label: '125,000', value: '125000' },
    { label: '150,000', value: '150000' },
    { label: '175,000', value: '175000' },
    { label: '200,000', value: '200000' },
  ]

  return (
    <main className="min-h-screen bg-[#111111] text-white">
      {/* Navbar spacer — nav is rendered globally via Layout */}
      <div className="h-20" />

      {/* Page header */}
      <div className="text-center py-9 border-b border-white/10">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[0.2em] uppercase">Our Showroom</h1>
        <p className="text-sm tracking-[0.15em] text-gray-400 mt-2 uppercase font-medium">
          {loading ? '...' : `${totalResults} Vehicles for Sale`}
        </p>
      </div>

      {/* Mobile filter backdrop */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100vh-120px)]">
        {/* ── Sidebar ── */}
        <aside className={`${mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky inset-y-0 left-0 z-50 lg:z-auto w-72 lg:w-52 shrink-0 border-r border-white/10 bg-[#0d0d0d] flex flex-col top-0 h-screen overflow-y-auto scrollbar-thin transition-transform duration-300`}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-start justify-between">
            <div>
              <p className="text-sm font-extrabold tracking-widest uppercase">Filters</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-semibold uppercase tracking-wider">
                {loading ? '...' : `${totalResults} Available`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[10px] text-red-400 hover:text-red-300 transition-colors mt-0.5 uppercase tracking-wide"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Manufacturer */}
          <FilterSection sectionKey="manufacturer" label="Manufacturer" isActive={!!filters.make}>
            <select aria-label="Make"
              value={filters.make}
              onChange={(e) => handleMakeChange(e.target.value)}
              className={selectCls}
            >
              <option value="">All Makes</option>
              {makes.map((make) => (
                <option key={make.makeId} value={make.name}>
                  {make.name}
                </option>
              ))}
            </select>
          </FilterSection>

          {/* Model */}
          <FilterSection sectionKey="model" label="Model" isActive={!!filters.model}>
            <select aria-label="Model"
              value={filters.model}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={!filters.make}
              className={`${selectCls} disabled:opacity-40`}
            >
              <option value="">All Models</option>
              {models.map((model) => (
                <option key={model.modelId} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </FilterSection>

          {/* Price / Monthly Finance */}
          <FilterSection sectionKey="price" label="Price/Monthly Finance" isActive={!!(filters.minPrice || filters.maxPrice)}>
            <div className="space-y-4">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setFinanceMode('price')}
                  className={`h-11 text-sm font-extrabold uppercase tracking-[0.08em] transition-colors ${
                    financeMode === 'price' ? 'bg-[#ff1010] text-white' : 'bg-[#3a0505] text-white/90 hover:bg-[#4a0808]'
                  }`}
                >
                  Price
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceMode('monthly')}
                  className={`h-11 text-sm font-extrabold uppercase tracking-[0.08em] transition-colors ${
                    financeMode === 'monthly' ? 'bg-[#ff1010] text-white' : 'bg-[#3a0505] text-white/90 hover:bg-[#4a0808]'
                  }`}
                >
                  Monthly Finance
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold tracking-wide text-white/85">From</p>
                  <select
                    value={financeMode === 'price' ? filters.minPrice : monthlyFromValue}
                    onChange={(e) => {
                      const value = e.target.value
                      if (financeMode === 'price') {
                        handleFilterChange('minPrice', value)
                        return
                      }
                      handleFilterChange('minPrice', value ? estimatePriceFromMonthly(Number(value)).toString() : '')
                    }}
                    className={filterSelectCls}
                  >
                    {(financeMode === 'price' ? priceOptions : monthlyOptions).map((option) => (
                      <option key={`from-${financeMode}-${option.value || 'any'}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-lg font-semibold tracking-wide text-white/85">To</p>
                  <select
                    value={financeMode === 'price' ? filters.maxPrice : monthlyToValue}
                    onChange={(e) => {
                      const value = e.target.value
                      if (financeMode === 'price') {
                        handleFilterChange('maxPrice', value)
                        return
                      }
                      handleFilterChange('maxPrice', value ? estimatePriceFromMonthly(Number(value)).toString() : '')
                    }}
                    className={filterSelectCls}
                  >
                    {(financeMode === 'price' ? priceOptions : monthlyOptions).map((option) => (
                      <option key={`to-${financeMode}-${option.value || 'any'}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Body Type */}
          <FilterSection sectionKey="bodyType" label="Body Type" isActive={!!filters.bodyType}>
            <select aria-label="Body type"
              value={filters.bodyType}
              onChange={(e) => handleFilterChange('bodyType', e.target.value)}
              className={selectCls}
            >
              <option value="">Any</option>
              <option value="Saloon">Saloon</option>
              <option value="Hatchback">Hatchback</option>
              <option value="SUV">SUV</option>
              <option value="Coupe">Coupe</option>
              <option value="Convertible">Convertible</option>
              <option value="Estate">Estate</option>
              <option value="MPV">MPV</option>
            </select>
          </FilterSection>

          {/* Fuel Type */}
          <FilterSection sectionKey="fuelType" label="Fuel Type" isActive={!!filters.fuelType}>
            <select aria-label="Fuel type"
              value={filters.fuelType}
              onChange={(e) => handleFilterChange('fuelType', e.target.value)}
              className={selectCls}
            >
              <option value="">Any</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </FilterSection>

          {/* Transmission */}
          <FilterSection sectionKey="transmission" label="Transmission" isActive={!!filters.transmissionType}>
            <select aria-label="Transmission"
              value={filters.transmissionType}
              onChange={(e) => handleFilterChange('transmissionType', e.target.value)}
              className={selectCls}
            >
              <option value="">Any</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </FilterSection>

          {/* Year */}
          <FilterSection sectionKey="year" label="Year" isActive={!!(filters.minYear || filters.maxYear)}>
            <div className="grid grid-cols-2 gap-1.5">
              <select aria-label="Minimum year"
                value={filters.minYear}
                onChange={(e) => handleFilterChange('minYear', e.target.value)}
                className={selectCls}
              >
                <option value="">From</option>
                {yearOptions.map((year) => (
                  <option key={`year-from-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select aria-label="Maximum year"
                value={filters.maxYear}
                onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                className={selectCls}
              >
                <option value="">To</option>
                {yearOptions.map((year) => (
                  <option key={`year-to-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </FilterSection>

          {/* Mileage */}
          <FilterSection sectionKey="mileage" label="Mileage" isActive={!!(filters.minMileage || filters.maxMileage)}>
            <div className="grid grid-cols-2 gap-1.5">
              <select aria-label="Minimum mileage"
                value={filters.minMileage}
                onChange={(e) => handleFilterChange('minMileage', e.target.value)}
                className={selectCls}
              >
                <option value="">From</option>
                {mileageOptions.map((option) => (
                  <option key={`mileage-from-${option.value || 'any'}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select aria-label="Maximum mileage"
                value={filters.maxMileage}
                onChange={(e) => handleFilterChange('maxMileage', e.target.value)}
                className={selectCls}
              >
                <option value="">To</option>
                {mileageOptions.map((option) => (
                  <option key={`mileage-to-${option.value || 'any'}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </FilterSection>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Search + Sort bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#111111]">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 bg-[#1a1a1a] border border-white/10 px-3 py-2.5 text-white shrink-0 hover:border-white/30 transition-colors"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wide uppercase">Filters</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
            </button>
            <form role="search" aria-label="Search inventory" onSubmit={event=>{event.preventDefault();handleFilterChange('search',searchQuery)}} className="relative flex-1 min-w-0">
              <button type="submit" aria-label="Search all stock" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="w-4 h-4" /></button>
              <input
                type="text"
                aria-label="Search make, model or colour" placeholder="Search make, model or colour"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
              />
            </form>
            <select aria-label="Sort stock"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSortDropdownChange(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 shrink-0 w-30 sm:w-auto sm:min-w-45"
            >
              <option value="price-desc">Price Highest to Lowest</option>
              <option value="price-asc">Price Lowest to Highest</option>
              <option value="dateAdded-desc">Newest First</option>
              <option value="dateAdded-asc">Oldest First</option>
              <option value="mileage-asc">Mileage: Low to High</option>
              <option value="year-desc">Year: Newest First</option>
            </select>
          </div>

          {/* Finance disclaimer */}
          <div className="text-center px-6 py-3 border-b border-white/5 bg-[#111111]">
            <p className="text-[11px] font-bold text-gray-300 mb-0.5">
              We are a credit broker, not a lender. Representative Example:
            </p>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-5xl mx-auto">
              Finance Product Type: Hire Purchase. The fixed interest rate of 8.9% is applied to a total credit
              amount of £18,895.50 for a duration of 48 months. The cash price of the vehicle is £20,995.00, and
              a deposit of £2,099.50 is required. The total amount to be paid over the term of the agreement is
              £24,479.02, with monthly repayments of £466.24. The Representative APR of 8.9% represents the
              overall cost of borrowing, including any additional charges.
            </p>
          </div>

          {/* Content area */}
          <div className="flex-1 p-4">
            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded overflow-hidden animate-pulse">
                    <div className="h-44 bg-white/10" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-3/4" />
                      <div className="h-4 bg-white/10 rounded w-1/2" />
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                      <div className="h-8 bg-white/10 rounded mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-red-400 font-medium mb-2">Failed to load listings</p>
                <p className="text-gray-400 text-sm mb-5">{error}</p>
                <button
                  onClick={() => fetchListings(currentPage, filters, sortBy, sortOrder)}
                  className="px-6 py-2.5 bg-white text-black rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No results */}
            {!loading && !error && filteredListings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-white font-medium mb-2">No vehicles found</p>
                <p className="text-gray-400 text-sm mb-5">Try adjusting your filters</p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-white text-black rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Vehicle grid */}
            {!loading && !error && filteredListings.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredListings.map((vehicle) => {
                    const stockId = vehicle.metadata?.stockId || ''
                    const slug = generateVehicleSlug(vehicle)
                    const inWishlist = isInWishlist(stockId)

                    const imageUrl =
                      vehicle.media?.images?.[0]?.href?.replace('{resize}','w800') ||
                      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
                    const imageCount = vehicle.media?.images?.length || 0
                    const hasVideo = !!(vehicle.media?.video?.href)

                    const vehicleMake = vehicle.vehicle?.make || vehicle.vehicle?.standard?.make || ''
                    const vehicleModel = vehicle.vehicle?.model || vehicle.vehicle?.standard?.model || ''
                    const vehicleDerivative =
                      vehicle.vehicle?.derivative || vehicle.vehicle?.standard?.derivative || ''
                    const vehicleYear = vehicle.vehicle?.yearOfManufacture
                    const vehicleMileage = vehicle.vehicle?.odometerReadingMiles
                    const vehicleFuelType =
                      vehicle.vehicle?.fuelType || vehicle.vehicle?.standard?.fuelType || ''
                    const vehicleTransmission =
                      vehicle.vehicle?.transmissionType ||
                      vehicle.vehicle?.standard?.transmissionType ||
                      ''
                    const vehicleHighlights = photoLine(vehicle) || highlightLine(vehicle)
                    const vehiclePrice = currentPrice(vehicle)
                    const ulez = isULEZCompliant(vehicle)
                    const monthlyPrice = calculateMonthlyPayment(vehiclePrice)
                    const mileageStr = formatMileage(vehicleMileage)

                    const whatsappMsg = encodeURIComponent(
                      `Hi, I'm interested in the ${vehicleYear || ''} ${vehicleMake} ${vehicleModel}. Stock ID: ${stockId}`,
                    )
                    const whatsappNumber = (dealer.whatsapp || dealer.phone).replace(/\D/g,'').replace(/^0/,'44')
                    const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : '/contact'

                    return (
                      <div
                        key={stockId || slug}
                        className="bg-[#1a1a1a] flex flex-col overflow-hidden group"
                      >
                        {/* Image */}
                        <div className="relative h-44 overflow-hidden bg-black">
                          <StockLabels vehicle={vehicle}/>
                          <img loading="lazy" decoding="async"
                            src={imageUrl}
                            alt={`${vehicleMake} ${vehicleModel}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Photo / video count */}
                          {imageCount > 0 && (
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <span className="flex items-center gap-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                                <Camera className="w-3 h-3" />
                                {imageCount}
                              </span>
                              {hasVideo && (
                                <span className="flex items-center gap-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                                  <Video className="w-3 h-3" />1
                                </span>
                              )}
                            </div>
                          )}
                          {/* Wishlist */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              // toggleWishlist(stockId)
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded bg-black/60 hover:bg-black/80 transition-colors"
                            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={inWishlist ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={1.5}
                              className={`h-3.5 w-3.5 ${inWishlist ? 'text-red-500' : 'text-white'}`}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Card body */}
                        <div className="flex flex-col flex-1 px-3 pt-2.5 pb-0">
                          {/* Highlights */}
                          {vehicleHighlights && (
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate mb-1">
                              {vehicleHighlights}
                            </p>
                          )}

                          {/* Make + Model */}
                          <p className="text-base font-extrabold uppercase tracking-wide leading-tight truncate">
                            {vehicleMake} {vehicleModel}
                          </p>

                          {/* Derivative */}
                          {vehicleDerivative && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{vehicleDerivative}</p>
                          )}

                          {/* Price columns */}
                          <div className="flex gap-4 mt-2.5">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                                Our Price
                              </p>
                              <p className="text-sm font-bold text-white leading-tight">
                                {priceLabel(vehicle)}{vatLabel(vehicle)}<VatNote vehicle={vehicle}/>
                              </p>
                            </div>
                            {vehiclePrice && monthlyPrice !== 'N/A' && (
                              <div>
                                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                                  Monthly Price
                                </p>
                                <p className="text-sm font-bold text-red-500 leading-tight">{monthlyPrice}</p>
                              </div>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {vehicleYear && (
                              <span className="text-[10px] border border-white/20 text-gray-300 px-2 py-0.5 rounded-sm">
                                {vehicleYear}
                              </span>
                            )}
                            {vehicleTransmission && (
                              <span className="text-[10px] border border-white/20 text-gray-300 px-2 py-0.5 rounded-sm">
                                {vehicleTransmission}
                              </span>
                            )}
                            {mileageStr && (
                              <span className="text-[10px] border border-white/20 text-gray-300 px-2 py-0.5 rounded-sm">
                                {mileageStr}
                              </span>
                            )}
                            {vehicleFuelType && (
                              <span className="text-[10px] border border-white/20 text-gray-300 px-2 py-0.5 rounded-sm">
                                {vehicleFuelType}
                              </span>
                            )}
                            {ulez && (
                              <span className="text-[10px] bg-teal-600/20 border border-teal-500/40 text-teal-400 px-2 py-0.5 rounded-sm font-semibold">
                                ULEZ
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="mt-3 grid grid-cols-3 border-t border-l border-white/10">
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-center gap-1 py-2 border-r border-b border-white/10 text-[10px] font-bold tracking-wide text-white hover:bg-white/5 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#25D366]">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              Chat
                            </a>
                            <Link
                              href={`/reservation?stockId=${stockId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-center py-2 border-r border-b border-white/10 text-[10px] font-bold tracking-wide text-white hover:bg-white/5 transition-colors"
                            >
                              Reserve
                            </Link>
                            <Link
                              href={`/finance?stockId=${stockId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-center gap-1 py-2 border-b border-white/10 text-[10px] font-bold tracking-wide text-white hover:bg-white/5 transition-colors"
                            >
                              <CreditCard className="w-3 h-3 text-red-400" />
                              Finance
                            </Link>
                          </div>
                        </div>

                        {/* MORE button */}
                        <Link
                          href={`/used-cars/${slug}`}
                          className="block text-center bg-red-600 hover:bg-red-500 transition-colors py-2.5 text-[11px] font-extrabold tracking-[0.15em] uppercase text-white mt-auto"
                        >
                          More &rsaquo;
                        </Link>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10 mb-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded border border-white/10 text-sm text-gray-400 hover:border-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number
                      if (totalPages <= 7) {
                        page = i + 1
                      } else if (currentPage <= 4) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i
                      } else {
                        page = currentPage - 3 + i
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-9 h-9 rounded border text-sm transition-colors ${
                            currentPage === page
                              ? 'border-white bg-white text-black font-semibold'
                              : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded border border-white/10 text-sm text-gray-400 hover:border-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

