import { test, expect } from '@playwright/test'
async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByRole('link', { name: /Sign in with MYDEALERSHIPVIEW/ }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'My stock', exact: true })).toBeVisible()
}
test('authenticated stock and premium finder remain usable at all required widths', async ({
  page,
}, testInfo) => {
  await signIn(page)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.screenshot({ path: testInfo.outputPath(`stock-${width}.png`), fullPage: true })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
  await page.getByRole('button', { name: 'Vehicle finder', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Add a car to your stock' })).toBeVisible()
  await page.getByLabel('Registration').fill('ZZ99ZZZ')
  await page.getByLabel(/Mileage/).fill('45000')
  await page.getByRole('button', { name: 'Find vehicle', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ford Focus', exact: true })).toBeVisible()
  await page.getByLabel(/Advert price/).fill('12500')
  await page.getByRole('switch', { name: /AA Cars/ }).check()
  await page.getByRole('switch', { name: /Local partner/ }).check()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.screenshot({
      path: testInfo.outputPath(`finder-result-${width}.png`),
      fullPage: true,
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
  await page.getByRole('button', { name: 'Review listing' }).click()
  await expect(page.getByRole('heading', { name: 'Review this listing' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('finder-review.png'), fullPage: true })
  // This mutation goes only to the disposable in-process HTTPS DMS fixture.
  await page.getByRole('button', { name: 'Add to stock', exact: true }).click()
  await expect(page).toHaveURL(/vehicle=fixture-added-/)
  await page.getByRole('button', { name: /Listings/ }).click()
  await expect(page.getByRole('heading', { name: 'Partner feeds', exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('listing-feeds-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.screenshot({ path: testInfo.outputPath('listing-feeds-mobile.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
async function publicPage(page: import('@playwright/test').Page, path: string) {
  await page.goto(path)
  await expect(page.locator('[class*="z-[9999]"]')).toBeHidden()
  const necessary = page.getByRole('button', { name: 'Necessary only' })
  if (!(await page.evaluate(() => localStorage.getItem('cookies-accepted')))) {
    await expect(necessary).toBeVisible()
    await necessary.click()
  }
}
async function verification(page: import('@playwright/test').Page) {
  await page.route('https://challenges.cloudflare.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.turnstile={render:(node,options)=>{window.fixtureVerification={node,options};options.callback('fixture-token');return 'fixture-widget'},remove:()=>{},reset:()=>setTimeout(()=>window.fixtureVerification.options.callback('fixture-token'),0)};`,
    }),
  )
}
async function fillRequired(form: import('@playwright/test').Locator) {
  for (const input of await form
    .locator('input[required]:not([type=checkbox]),textarea[required]')
    .all()) {
    const type = await input.getAttribute('type')
    await input.fill(
      type === 'email'
        ? 'fixture@example.test'
        : type === 'tel'
          ? '07700900123'
          : type === 'number'
            ? '45000'
            : type === 'date'
              ? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
              : type === 'time'
                ? '11:00'
                : 'Fixture Customer',
    )
  }
  for (const checkbox of await form.locator('input[type=checkbox][required]').all())
    await checkbox.check()
  await expect(form.locator('[data-form-verification]')).toHaveAttribute(
    'data-token',
    'fixture-token',
  )
}
test('public full-stock search, Reserved detail and saved vehicles stay current', async ({
  page,
}, testInfo) => {
  await publicPage(page, '/used-cars')
  const response = page.waitForResponse(
    (response) =>
      response.url().includes('/api/listings?') &&
      response.url().includes('search=Mercedes-Benz') &&
      response.status() === 200,
  )
  await page.getByRole('textbox', { name: 'Search make, model or colour' }).fill('Mercedes-Benz')
  await page.getByRole('button', { name: 'Search all stock', exact: true }).click()
  expect((await (await response).json()).totalResults).toBe(112)
  await expect(page).toHaveURL(/search=Mercedes-Benz/)
  await publicPage(page, '/used-cars/ford-focus-2023-fixture-stock-000002')
  await expect(page.getByText('Reserved', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Enquire about reserving', exact: true }),
  ).toBeVisible()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`public-detail-${width}.png`),
      fullPage: true,
    })
  }
  await page.getByRole('button', { name: 'Save vehicle', exact: true }).click()
  await page.goto('/wishlist')
  await expect(page.getByRole('link', { name: 'View vehicle', exact: true })).toBeVisible()
  expect(await page.content()).not.toMatch(/fixture-key|fixture-lead-secret|PRIVATE_VIN/)
})
for (const [button, label] of [
  ['Enquire Now', 'Vehicle email enquiry', 'Open Mail'],
  ['Request callback', 'Vehicle callback enquiry', 'Call Now'],
  ['Apply For Finance', 'Finance application', 'Submit Application'],
  ['Part Exchange', 'Part exchange valuation', 'Submit Request'],
  ['Enquire about reserving', 'Reservation enquiry', 'Send reservation enquiry'],
]) {
  test(`${label} retains inputs and UUID through pending delivery`, async ({ page }) => {
    await verification(page)
    const posts: Record<string, unknown>[] = []
    await page.route('**/api/submit-*', async (route) => {
      posts.push(route.request().postDataJSON())
      await route.fulfill({
        status: posts.length === 1 ? 202 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          posts.length === 1
            ? {
                success: false,
                pending: true,
                message: 'Delivery pending. Retry the same enquiry.',
              }
            : { success: true },
        ),
      })
    })
    await publicPage(page, '/used-cars/ford-focus-2023-fixture-stock-000002')
    await page.getByRole('button', { name: button, exact: true }).first().click()
    const dialog = page.getByRole('dialog', { name: label, exact: true }),
      form = dialog.locator('form')
    await expect(dialog).toBeVisible()
    await fillRequired(form)
    await form.locator('button[type=submit]').click()
    await expect(dialog.getByRole('status')).toContainText('Delivery pending')
    await expect(form.locator('input[required]').first()).not.toHaveValue('')
    await expect(form.locator('[data-form-verification]')).toHaveAttribute(
      'data-token',
      'fixture-token',
    )
    await form.locator('button[type=submit]').click()
    await expect(dialog).toBeHidden()
    expect(posts).toHaveLength(2)
    expect(posts[0].submissionId).toBe(posts[1].submissionId)
    expect(posts[0]).not.toHaveProperty('advertiserId')
    expect(posts[0]).not.toHaveProperty('amount')
    const stock = (posts[0].vehicle || posts[0].vehicleDetails) as Record<string, unknown>
    expect(stock.stockId).toBe('fixture-stock-000002')
  })
}
for (const [path, heading] of [
  ['/contact', 'Message Sent!'],
  ['/services', 'Booking Request Sent!'],
]) {
  test(`${path} keeps the same request after pending delivery`, async ({ page }) => {
    await verification(page)
    const posts: Record<string, unknown>[] = []
    await page.route('**/api/submit-form', async (route) => {
      posts.push(route.request().postDataJSON())
      await route.fulfill({
        status: posts.length === 1 ? 202 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          posts.length === 1
            ? {
                success: false,
                pending: true,
                message: 'Delivery pending. Retry the same enquiry.',
              }
            : { success: true },
        ),
      })
    })
    await publicPage(page, path)
    const form = page.locator('form')
    await fillRequired(form)
    await form.locator('button[type=submit]').click()
    await expect(form.getByRole('status')).toContainText('Delivery pending')
    await expect(form.locator('[data-form-verification]')).toHaveAttribute(
      'data-token',
      'fixture-token',
    )
    await form.locator('button[type=submit]').click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    expect(posts).toHaveLength(2)
    expect(posts[0].submissionId).toBe(posts[1].submissionId)
    expect(posts[0]).not.toHaveProperty('advertiserId')
    expect(posts[0].vehicle).toBeNull()
    if (path === '/services') expect(posts[0].userVehicle).toBeTruthy()
  })
}
test('legacy showroom aliases preserve query and percent names do not crash', async ({ page }) => {
  await publicPage(page, '/showroom?make=50%25')
  await expect(page).toHaveURL(/\/used-cars\?make=50%25/)
  await expect(page.getByRole('heading', { name: /Something went wrong/i })).toHaveCount(0)
})
