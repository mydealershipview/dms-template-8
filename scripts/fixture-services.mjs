// Isolated protocol fixtures. Never contacts DMS, AutoTrader, email or Cloudflare.
import https from 'node:https'
import http from 'node:http'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const DMS_PORT = process.env.FIXTURE_MOCK_PORT || '9843'
const SITE_PORT = process.env.FIXTURE_SITE_PORT || '9844'
const APP_PORT = process.env.FIXTURE_APP_PORT || '54820'
export async function fixtureServices() {
  const dir = await mkdtemp(join(tmpdir(), 'template8-fixture-')),
    key = join(dir, 'key.pem'),
    cert = join(dir, 'cert.pem')
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
      '-addext',
      'subjectAltName=DNS:localhost,IP:127.0.0.1',
    ],
    { stdio: 'ignore' },
  )
  const tls = { key: await readFile(key), cert: await readFile(cert) }
  let sourceAvailable = true
  const records = new Map(),
    sessions = new Set(),
    leads = new Map()
  let next = 1
  const codes = new Set(),
    adds = new Map()
  const image = await readFile(new URL('../public/website-template-OG.webp', import.meta.url))
  for (let i = 1; i <= 225; i++) {
    const stockId = `fixture-stock-${String(i).padStart(6, '0')}`,
      make = i % 2 ? 'Mercedes-Benz' : 'Ford',
      model = i % 2 ? 'E-Class' : 'Focus'
    records.set(stockId, {
      stockId,
      registration: `AB${String(i % 100).padStart(2, '0')}CDE`,
      make,
      model,
      derivative: 'Premium specification with a long vehicle name',
      year: 2023,
      mileage: i * 100,
      status: i === 2 ? 'SALE_IN_PROGRESS' : 'AVAILABLE',
      lifecycleState: i === 2 ? 'SALE_IN_PROGRESS' : 'FORECOURT',
      inPrep: false,
      price: 12000 + i,
      advertPrice: 10000 + i,
      vatStatus: 'Ex VAT',
      fuelType: 'Petrol',
      bodyType: 'Saloon',
      transmissionType: 'Automatic',
      colour: 'Green',
      updatedAt: '2026-10-01T12:00:00Z',
      thumbnail: '/website-template-OG.webp',
      imageCount: 1,
      channels: { advertiserAdvert: true, autotraderAdvert: false },
      attentionGrabber: 'Well maintained',
      websiteHighlight: '',
      description: 'Disposable fixture vehicle.',
      images: [
        {
          imageId: `image-${String(i).padStart(6, '0')}`,
          url: `https://localhost:${DMS_PORT}/fixture-image.webp`,
        },
      ],
      feeds: [
        { id: 'aacars', name: 'AA Cars', enabled: false },
        { id: 'cargurus', name: 'CarGurus', enabled: true },
        { id: 'feed_partner:fixture', name: 'Local partner', enabled: false },
      ],
    })
  }
  const me = {
    user: { name: 'Fixture Dealer', email: 'fixture@example.test', role: 'website_only' },
    dealer: { name: 'Template 8 Fixture Motors', package: 'website_lite', websiteSoldPage: true },
    statuses: ['AVAILABLE', 'DUE_IN', 'SALE_IN_PROGRESS', 'SOLD', 'DELETED'],
    vatStatuses: ['Inc VAT', 'Ex VAT', 'No VAT'],
    channels: [
      { key: 'advertiserAdvert', label: 'Dealer Website' },
      { key: 'autotraderAdvert', label: 'AutoTrader Search & Find' },
    ],
    feeds: [
      { id: 'aacars', name: 'AA Cars' },
      { id: 'cargurus', name: 'CarGurus' },
      { id: 'feed_partner:fixture', name: 'Local partner' },
    ],
  }
  const publicRow = (v) => ({
    stockId: v.stockId,
    reserved: v.status === 'SALE_IN_PROGRESS',
    websiteHighlight: v.websiteHighlight,
    metadata: {
      stockId: v.stockId,
      lifecycleState: v.lifecycleState,
      lastUpdated: v.updatedAt,
      dateOnForecourt: '2026-10-01T12:00:00Z',
    },
    vehicle: {
      registration: v.registration,
      make: v.make,
      model: v.model,
      derivative: v.derivative,
      yearOfManufacture: v.year,
      odometerReadingMiles: v.mileage,
      fuelType: v.fuelType,
      transmissionType: v.transmissionType,
      bodyType: v.bodyType,
      colour: v.colour,
      standard: { make: v.make, model: v.model },
    },
    adverts: {
      retailAdverts: {
        priceOnApplication: false,
        suppliedPrice: { amountGBP: v.advertPrice },
        totalPrice: { amountGBP: v.price },
        vatStatus: v.vatStatus,
        advertiserAdvert: { status: v.channels.advertiserAdvert ? 'PUBLISHED' : 'NOT_PUBLISHED' },
        attentionGrabber: v.attentionGrabber,
        description: v.description,
      },
    },
    media: {
      images: v.images.map((i) => ({ href: '/website-template-OG.webp' })),
      video: { href: null },
      spin: { href: null },
    },
    features: [],
    highlights: [],
  })
  const dms = https.createServer(tls, async (req, res) => {
    const url = new URL(req.url, `https://localhost:${DMS_PORT}`),
      path = url.pathname
    const json = (data, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify({ success: status < 400, ...data }))
    }
    if (path === '/__fixture/remove-source' && req.headers.authorization === 'Bearer fixture-key') {
      sourceAvailable = false
      json({})
      return
    }
    if (path === '/fixture-image.webp') {
      if (!sourceAvailable) {
        json({ error: 'Original removed' }, 404)
        return
      }
      res.writeHead(200, { 'Content-Type': 'image/webp' })
      res.end(image)
      return
    }
    if (path === '/website-admin/connect') {
      const callback = new URL(url.searchParams.get('redirect_uri'))
      const code = `fixture-code-${next++}`
      codes.add(code)
      callback.searchParams.set('code', code)
      callback.searchParams.set('state', url.searchParams.get('state'))
      res.writeHead(302, { Location: callback.href })
      res.end()
      return
    }
    if (path === '/turnstile') {
      json({ hostname: 'localhost', action: 'dealer-form' })
      return
    }
    if (
      req.headers.authorization !== 'Bearer fixture-key' &&
      path !== '/api/webhooks/external-notifications'
    ) {
      json({ error: 'Invalid website key', code: 'WEBSITE_KEY_INVALID' }, 401)
      return
    }
    let body = {}
    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      try {
        body = JSON.parse(Buffer.concat(chunks).toString())
      } catch {
        body = {}
      }
    }
    if (path === '/api/webhooks/external-notifications') {
      if (req.headers['x-webhook-secret'] !== 'fixture-lead-secret') {
        json({ error: 'Invalid lead secret' }, 401)
        return
      }
      const duplicate = leads.has(body.submissionId)
      if (!duplicate) leads.set(body.submissionId, body)
      json({ notificationId: body.submissionId, duplicate }, duplicate ? 200 : 201)
      return
    }
    if (path === '/api/website/stock') {
      const rows = [...records.values()]
          .filter(
            (v) =>
              ['AVAILABLE', 'SALE_IN_PROGRESS'].includes(v.status) &&
              v.channels.advertiserAdvert &&
              !v.inPrep,
          )
          .map(publicRow),
        page = Number(url.searchParams.get('page') || 1),
        pageSize = Number(url.searchParams.get('pageSize') || 100),
        totalPages = Math.ceil(rows.length / pageSize)
      json({
        data: {
          vehicles: rows.slice((page - 1) * pageSize, page * pageSize),
          pagination: {
            page,
            pageSize,
            totalResults: rows.length,
            totalPages,
            hasNextPage: page < totalPages,
          },
        },
      })
      return
    }
    if (path === '/api/website/stock-states') {
      json({
        states: Object.fromEntries(
          (url.searchParams.get('stockIds') || '')
            .split(',')
            .map((id) => [id, records.get(id)?.lifecycleState || null]),
        ),
      })
      return
    }
    if (path === '/api/website-admin/session') {
      if (!codes.delete(body.code)) {
        json({ error: 'Code expired or replayed' }, 400)
        return
      }
      const token = `fixture-session-${next++}`
      sessions.add(token)
      json({
        sessionToken: token,
        expiresAt: new Date(Date.now() + 548200000).toISOString(),
        user: me.user,
        dealer: me.dealer,
      })
      return
    }
    if (!sessions.has(req.headers['x-website-session'])) {
      json({ error: 'Session invalid', code: 'SESSION_INVALID' }, 401)
      return
    }
    if (path === '/api/website-admin/logout') {
      sessions.delete(req.headers['x-website-session'])
      json({})
      return
    }
    if (path === '/api/website-admin/me') {
      const values = [...records.values()]
      json({
        ...me,
        counts: {
          all: values.length,
          available: values.filter((v) => v.status === 'AVAILABLE').length,
          dueIn: values.filter((v) => v.status === 'DUE_IN').length,
          saleInProgress: values.filter((v) => v.status === 'SALE_IN_PROGRESS').length,
          sold: values.filter((v) => v.status === 'SOLD').length,
        },
      })
      return
    }
    if (path === '/api/website-admin/vehicle-lookup') {
      json({
        vehicle: {
          make: 'Ford',
          model: 'Focus',
          derivative: 'Titanium',
          yearOfManufacture: 2023,
          fuelType: 'Petrol',
          transmissionType: 'Automatic',
        },
        alreadyInStock: null,
        insights: {
          source: 'AutoTrader',
          fetchedAt: '2026-10-01T12:00:00Z',
          warnings: [],
          valuations: ['retail', 'private', 'partExchange', 'trade'].map((type, i) => ({
            type,
            label: ['Retail', 'Private sale', 'Part exchange', 'Trade'][i],
            amountGBP: 15000 - i * 1000,
            vatBasis: 'No VAT',
          })),
          motTests: [
            {
              completedDate: '2026-01-01',
              testResult: 'PASSED',
              expiryDate: '2027-01-01',
              odometerValue: '40000',
              odometerUnit: 'mi',
              defects: [],
            },
          ],
        },
      })
      return
    }
    if (path === '/api/website-admin/vehicle-check') {
      json({
        source: 'AutoTrader',
        available: true,
        fetchedAt: '2026-10-01',
        checks: [
          'stolen',
          'scrapped',
          'imported',
          'exported',
          'highRisk',
          'privateFinance',
          'tradeFinance',
          'mileageDiscrepancy',
          'registrationChanged',
          'colourChanged',
          'insuranceWriteOff',
        ].map((key) => ({ key, label: key, status: 'unknown', detail: null })),
      })
      return
    }
    if (path === '/api/website-admin/images') {
      json(
        {
          imageId: `fixture-image-${next++}`,
          url: `https://localhost:${DMS_PORT}/fixture-image.webp`,
        },
        201,
      )
      return
    }
    if (path === '/api/website-admin/stock/add-status') {
      const stockId = adds.get(url.searchParams.get('requestId')) || null
      json({ complete: !!stockId, stockId, state: stockId ? 'COMPLETE' : 'NOT_FOUND' })
      return
    }
    if (path === '/api/website-admin/stock') {
      if (req.method === 'POST') {
        if (adds.has(body.addRequestId)) {
          json({ stockId: adds.get(body.addRequestId), adopted: true }, 201)
          return
        }
        const id = `fixture-added-${next++}`,
          v = {
            ...records.values().next().value,
            ...body,
            ...body.vehicle,
            stockId: id,
            advertPrice: body.price || null,
            price: body.price || null,
            year: 2023,
            status: body.price ? 'AVAILABLE' : 'DUE_IN',
            lifecycleState: body.price ? 'FORECOURT' : 'DUE_IN',
          }
        v.feeds = me.feeds.map((f) => ({ ...f, enabled: body.feeds?.[f.id] === true }))
        v.price = body.price
          ? Math.round(Number(body.price) * (body.vatStatus === 'Ex VAT' ? 1.2 : 1) * 100) / 100
          : null
        v.images = (body.imageIds || []).map((imageId) => ({
          imageId,
          url: `https://localhost:${DMS_PORT}/fixture-image.webp`,
        }))
        v.imageCount = v.images.length
        v.thumbnail = v.images.length ? '/website-template-OG.webp' : null
        records.set(id, v)
        adds.set(body.addRequestId, id)
        json({ stockId: id, inPrep: body.requiresPrep === true }, 201)
        return
      }
      let rows = [...records.values()].filter((v) => v.status !== 'DELETED')
      const status = url.searchParams.get('status')
      if (status && status !== 'ALL') rows = rows.filter((v) => v.status === status)
      const search = url.searchParams.get('search')
      if (search)
        rows = rows.filter((v) =>
          [v.make, v.model, v.registration].join(' ').toLowerCase().includes(search.toLowerCase()),
        )
      const page = Number(url.searchParams.get('page') || 1),
        pageSize = Number(url.searchParams.get('pageSize') || 24)
      json({
        vehicles: rows.slice((page - 1) * pageSize, page * pageSize),
        pagination: {
          page,
          pageSize,
          totalResults: rows.length,
          totalPages: Math.ceil(rows.length / pageSize),
        },
      })
      return
    }
    const match = path.match(
      /^\/api\/website-admin\/stock\/([^/]+)(?:\/(price|channels|feeds|status|images))?$/,
    )
    if (match) {
      const v = records.get(decodeURIComponent(match[1]))
      if (!v) {
        json({ error: 'Not found' }, 404)
        return
      }
      const action = match[2]
      if (req.method === 'GET') {
        json({ vehicle: v })
        return
      }
      if (action === 'price') {
        if (body.price !== undefined) v.advertPrice = Number(body.price)
        if (body.vatStatus) v.vatStatus = body.vatStatus
        v.price = Math.round(v.advertPrice * (v.vatStatus === 'Ex VAT' ? 1.2 : 1) * 100) / 100
      }
      if (action === 'channels') v.channels = { ...v.channels, ...body.channels }
      if (action === 'feeds') {
        const f = v.feeds.find((f) => f.id === body.feedId)
        if (f) f.enabled = body.enabled
      }
      if (action === 'status') {
        v.status = body.status
        v.lifecycleState = body.status === 'AVAILABLE' ? 'FORECOURT' : body.status
        if (['SOLD', 'DUE_IN', 'DELETED'].includes(body.status)) v.channels.advertiserAdvert = false
      }
      if (!action && typeof body.websiteHighlight === 'string')
        v.websiteHighlight = body.websiteHighlight
      json({
        stockId: v.stockId,
        status: v.status,
        price: v.price,
        vatStatus: v.vatStatus,
        websiteHighlight: v.websiteHighlight,
      })
      return
    }
    json({ error: 'Fixture route unavailable' }, 404)
  })
  const proxy = https.createServer(tls, (req, res) => {
    const upstream = http.request(
      {
        hostname: '127.0.0.1',
        port: Number(APP_PORT),
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${SITE_PORT}` },
      },
      (response) => {
        res.writeHead(response.statusCode, response.headers)
        response.pipe(res)
      },
    )
    upstream.on('error', () => {
      if (!res.headersSent && !res.destroyed) {
        res.writeHead(503)
        res.end('Starting verification server')
      } else if (!res.destroyed) res.destroy()
    })
    req.on('aborted', () => upstream.destroy())
    res.on('close', () => upstream.destroy())
    req.pipe(upstream)
  })
  await Promise.all([
    new Promise((resolve) => dms.listen(Number(DMS_PORT), '127.0.0.1', resolve)),
    new Promise((resolve) => proxy.listen(Number(SITE_PORT), '127.0.0.1', resolve)),
  ])
  return {
    cert,
    stop: async () => {
      const closing = Promise.all([
        new Promise((resolve) => dms.close(resolve)),
        new Promise((resolve) => proxy.close(resolve)),
      ])
      dms.closeAllConnections()
      proxy.closeAllConnections()
      await closing
      await rm(dir, { recursive: true, force: true })
    },
  }
}
