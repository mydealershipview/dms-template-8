import { test } from 'node:test'
import assert from 'node:assert/strict'
const DMS_PORT = process.env.FIXTURE_MOCK_PORT || '9843'
const SITE_PORT = process.env.FIXTURE_SITE_PORT || '9844'
const APP_PORT = process.env.FIXTURE_APP_PORT || '54820'
const base = process.env.REVIEW_BASE_URL
if (base !== `https://localhost:${SITE_PORT}`)
  throw new Error('Only isolated local production smoke is allowed')
const get = (path, init = {}) => fetch(`${base}${path}`, { redirect: 'manual', ...init })
const cookie = (response, name) =>
  response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${name}=`))
    ?.split(';')[0]
let session
async function login() {
  const start = await get('/api/admin/auth/login'),
    state = cookie(start, 'lightdms_state')
  assert.ok(state)
  assert.match(start.headers.getSetCookie().join(';'), /HttpOnly/i)
  const connect = await fetch(start.headers.get('location'), { redirect: 'manual' })
  const callback = await fetch(connect.headers.get('location'), {
    redirect: 'manual',
    headers: { cookie: state },
  })
  assert.equal(callback.status, 307)
  assert.equal(new URL(callback.headers.get('location')).pathname, '/admin')
  session = cookie(callback, 'lightdms_api_session')
  assert.ok(session)
  return callback
}
test('public production routes, real missing statuses, headers and keyed complete stock', async () => {
  const robots = await (await get('/robots.txt')).text(); assert.match(robots,/Disallow: \/(?:\s|$)/); assert.ok(robots.includes(`${base}/vehicles-sitemap.xml`))
  for (const path of ['/', '/used-cars', '/sold-cars', '/admin/login']) {
    const response = await get(path)
    assert.equal(response.status, 200, path)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.ok(response.headers.get('content-security-policy-report-only'))
  }
  assert.equal((await get('/definitely-missing-fixture-page')).status, 404)
  assert.equal((await get('/used-cars/unknown-car-id')).status, 404)
  const data = await (await get('/api/listings?pageSize=100&page=2')).json()
  assert.equal(data.totalResults, 225)
  assert.equal(data.results.length, 100)
  const text = JSON.stringify(data)
  assert.doesNotMatch(text, /fixture-key|advertiserId|purchasePrice|sessionToken|"vin"/)
  assert.equal((await get('/api/listings?page=NaN')).status, 400)
  const reserved = (await (await get('/api/listing/fixture-stock-000002')).json()).vehicle
  assert.equal(reserved.reserved, true)
  assert.equal((await get('/used-cars/ford-focus-2023-fixture-stock-000002')).status, 200)
  assert.equal((await get('/used-cars/old-name-fixture-stock-000002')).status, 308)
  const sitemap = await (await get('/vehicles-sitemap.xml')).text()
  assert.match(sitemap, /fixture-stock-000002/)
})
test('CMS setup, anonymous admin and retired routes fail closed', async () => {
  for (const path of ['/api/users/first-register', '/websiteadmin/create-first-user'])
    assert.equal((await get(path, { method: 'POST' })).status, 403)
  assert.equal((await get('/api/admin/dms/me')).status, 401)
  assert.equal((await get('/api/admin/sold')).status, 401)
  assert.equal((await get('/api/payments/status')).status, 410)
  assert.equal((await get('/api/affiliate-id')).status, 404)
  assert.equal((await get('/api/cron/housekeeping')).status, 401)
  assert.equal((await get('/api/graphql')).status, 404)
  assert.equal((await get('/api/health')).status, 200)
})
test('real HTTPS callback cookies, scoped proxy mutation, immediate public refresh and logout revocation', async () => {
  const callback = await login()
  const cookies = callback.headers.getSetCookie().join(';')
  assert.match(cookies, /Path=\/admin/)
  assert.match(cookies, /Path=\/api\/admin/)
  assert.match(cookies, /Secure/)
  const me = await get('/api/admin/dms/me', { headers: { cookie: session } })
  assert.equal(me.status, 200)
  assert.equal(
    (await get('/api/admin/dms/customers', { headers: { cookie: session } })).status,
    404,
  )
  const mutation = {
    method: 'PATCH',
    headers: {
      cookie: session,
      origin: base,
      'x-lightdms': '1',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ price: 15000, vatStatus: 'Ex VAT' }),
  }
  assert.equal(
    (
      await get('/api/admin/dms/stock/fixture-stock-000001/price', {
        ...mutation,
        headers: { ...mutation.headers, origin: 'https://attacker.test' },
      })
    ).status,
    403,
  )
  assert.equal((await get('/api/admin/dms/stock/fixture-stock-000001/price', mutation)).status, 200)
  const vehicle = (await (await get('/api/listing/fixture-stock-000001')).json()).vehicle
  assert.equal(vehicle.adverts.retailAdverts.totalPrice.amountGBP, 18000)
  const mutationHeaders = {cookie:session,origin:base,'x-lightdms':'1','content-type':'application/json'}
  const sale = await get('/api/admin/vehicles/fixture-stock-000003/status',{method:'POST',headers:mutationHeaders,body:JSON.stringify({status:'SOLD',soldDate:'2026-10-01',keepOnSoldPage:true})})
  assert.equal(sale.status,200);assert.equal((await sale.json()).keptOnSoldPage,true)
  assert.equal((await get('/api/listing/fixture-stock-000003')).status,404)
  const archive = await (await get('/api/admin/sold',{headers:{cookie:session}})).json()
  assert.equal(archive.docs.length,1);assert.equal(archive.docs[0].confirmed,true)
  const soldHtml = await (await get('/sold-cars')).text();assert.match(soldHtml,/2023 Mercedes-Benz E-Class/);assert.doesNotMatch(soldHtml,/sourceImages|archivedBy|fixture@example.test/)
  const media = await (await get('/api/media?limit=1')).json();assert.ok(media.docs[0].url)
  await fetch(`https://localhost:${DMS_PORT}/__fixture/remove-source`,{method:'POST',headers:{authorization:'Bearer fixture-key'}})
  assert.equal((await fetch(`https://localhost:${DMS_PORT}/fixture-image.webp`)).status,404)
  assert.equal((await get(media.docs[0].url)).status,200)
  for (const action of ['hide','show','remove']) {
    assert.equal((await get('/api/admin/sold',{method:'POST',headers:mutationHeaders,body:JSON.stringify({id:archive.docs[0].id,action})})).status,200)
  }
  assert.equal(
    (
      await get('/api/admin/auth/logout', {
        method: 'POST',
        headers: { cookie: session, origin: base, 'x-lightdms': '1' },
      })
    ).status,
    200,
  )
  assert.equal((await get('/api/admin/dms/me', { headers: { cookie: session } })).status, 401)
})
