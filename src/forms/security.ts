import { siteOrigin } from '@/lightdms/config'
import { uuid } from '@/lib/services/dmsConfig'
import { getInventory } from '@/utilities/vehicleInventory'
import { vehiclePrice } from '@/utilities/vehiclePresentation'
import { boundedBody } from '@/security/body'
import { consumeFormLimit } from './rateLimit'
import { siteNoindex } from '@/lib/noindex'
export class FormError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}
/**
 * Explicit opt-in for demo deployments only: TURNSTILE_DEMO_BYPASS=true is honoured solely when the
 * site is also non-indexable (SEO_NOINDEX=true). Honeypot, origin checks, rate limiting and the
 * durable outbox still apply. Never set this on a live client site.
 */
export function turnstileDemoBypass(env: Record<string, string | undefined> = process.env): boolean {
  return env.TURNSTILE_DEMO_BYPASS === 'true' && siteNoindex(env)
}
export async function validatedSubmission(
  request: Request,
  kind: 'enquiry' | 'reservation' = 'enquiry',
) {
  const origin = request.headers.get('origin')
  if (!origin || origin !== siteOrigin()) throw new FormError('Request refused', 403)
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new FormError('Expected JSON', 415)
  if (!(await consumeFormLimit(request)))
    throw new FormError('Too many requests. Please try again later.', 429)
  let body: Record<string, unknown>
  try {
    body = JSON.parse(new TextDecoder().decode(await boundedBody(request, 32768)))
  } catch {
    throw new FormError('Invalid or oversized form')
  }
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new FormError('Invalid form')
  const bypass = turnstileDemoBypass()
  if (body.website || (!bypass && typeof body.turnstileToken !== 'string'))
    throw new FormError('Please complete the verification')
  if (!bypass && !process.env.TURNSTILE_SECRET_KEY)
    throw new FormError('Form verification is unavailable. Please contact the dealership.', 503)
  if (!bypass) {
  const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY as string,
      response: body.turnstileToken as string,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!verification.ok) throw new FormError('Verification service is unavailable', 503)
  const result = (await verification.json()) as {
    success?: boolean
    hostname?: string
    action?: string
  }
  const host = new URL(process.env.NEXT_PUBLIC_SERVER_URL || request.url).hostname
  if (!result.success || result.hostname !== host || result.action !== 'dealer-form')
    throw new FormError('Please retry the verification')
  }
  if (body.privacyAccepted !== true) throw new FormError('Please agree to be contacted about this enquiry.')
  delete body.privacyAccepted
  const submissionId = body.submissionId
  if (typeof submissionId !== 'string' || !uuid.test(submissionId))
    throw new FormError('Invalid submission identity')
  delete body.submissionId
  // Routing is server-owned even when a legacy caller includes these fields.
  for (const key of ['affiliateId', 'advertiserId', 'dealerId', 'sourceWebsite', 'id', 'leadId'])
    delete body[key]
  if (kind === 'reservation') {
    const customer = body.customerDetails as Record<string, unknown> | undefined
    if (!customer) throw new FormError('Missing customer details')
    body.personal = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phone,
      title: customer.title,
      address: customer.address,
    }
    body.vehicle = body.vehicleDetails
    body.enquiryType = 'find-your-next-car'
    body.findYourNextCar = { enquiryType: 'stock-vehicle', vehiclePreferences: null }
    body.notes = 'Reservation enquiry only. No payment taken and no reservation confirmed.'
    delete body.customerDetails
    delete body.vehicleDetails
    delete body.amount
  }
  const touches: Record<string, unknown> = {}
  for (const name of ['attribution', 'firstTouchAttribution']) {
    const source = body[name]
    if (source != null) {
      if (typeof source !== 'object' || Array.isArray(source))
        throw new FormError('Invalid attribution')
      const allowedTouch = [
        'gclid',
        'gbraid',
        'wbraid',
        'fbclid',
        'utmSource',
        'utmMedium',
        'utmCampaign',
        'utmContent',
        'referrer',
        'landingPage',
        'capturedAt',
      ]
      const clean: Record<string, string> = {}
      for (const [key, value] of Object.entries(source)) {
        if (!allowedTouch.includes(key) || typeof value !== 'string' || value.length > 300)
          throw new FormError('Invalid attribution')
        if (['landingPage','referrer'].includes(key)) {
          try { const url = new URL(value); if(!['https:','http:'].includes(url.protocol)||url.username||url.password) throw new Error(); clean[key] = url.origin + url.pathname }
          catch { throw new FormError('Invalid attribution URL') }
        } else clean[key] = value
      }
      touches[name] = clean
    }
    delete body[name]
  }
  delete body.website
  delete body.turnstileToken
  delete body.advertiserId
  function validate(value: unknown, depth = 0): void {
    if (depth > 4) throw new FormError('Invalid nested form fields')
    if (value == null || typeof value === 'boolean') return
    if (typeof value === 'string' && value.length <= 4000) return
    if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 100000000) return
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length <= 30) {
      for (const [key, child] of Object.entries(value)) {
        if (!/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(key)) throw new FormError('Invalid field')
        validate(child, depth + 1)
      }
      return
    }
    throw new FormError('Invalid or oversized field')
  }
  validate(body)
  const personal = (body.personal || body.customerDetails) as Record<string, unknown> | undefined
  if (
    !personal ||
    typeof personal.email !== 'string' ||
    personal.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email) ||
    typeof personal.firstName !== 'string' ||
    !personal.firstName.trim() ||
    personal.firstName.length > 100
  )
    throw new FormError('Enter your name and a valid email address')
  const fields: Record<string, string[]> = {
    personal: [
      'title',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'gender',
      'countryOfOrigin',
      'dateOfBirth',
      'maritalStatus',
      'dependents',
      'address',
    ],
    vehicle: [
      'stockId',
      'make',
      'model',
      'registration',
      'mileage',
      'year',
      'recentValuations',
      'price',
      'initialDeposit',
      'loanTerm',
      'apr',
      'amountToFinance',
      'monthlyPayment',
    ],
    userVehicle: ['make', 'model', 'registration', 'mileage', 'year', 'recentValuations'],
    findYourNextCar: ['enquiryType', 'vehiclePreferences'],
    testDrive: ['isTestDrive', 'testDriveDate', 'testDriveTime', 'additionalRequirements'],
    employment: ['status', 'annualIncome', 'employerName', 'timeInEmployment', 'grossAnnualIncome'],
    finance: ['monthlyExpenses', 'existenceCreditCommitments'],
    bank: ['accountHolderName', 'bankName', 'sortCode', 'accountNumber', 'timeWithBank'],
    customerDetails: ['title', 'firstName', 'lastName', 'email', 'phone', 'address'],
    vehicleDetails: ['make', 'model', 'registration', 'stockId'],
  }
  const allowed = new Set(['enquiryType', 'notes', ...Object.keys(fields)])
  const longFields = new Set([
    'address',
    'vehiclePreferences',
    'additionalRequirements',
    'recentValuations',
  ])
  for (const [key, value] of Object.entries(body)) {
    if (!allowed.has(key)) throw new FormError('Unexpected form field')
    if (key === 'enquiryType') {
      if (
        ![
          'part-exchange',
          'find-your-next-car',
          'book-appointment',
          'request-finance',
          'general-contact',
        ].includes(String(value))
      )
        throw new FormError('Choose a valid enquiry type')
    } else if (key === 'notes') {
      if (value !== null && typeof value !== 'string') throw new FormError('Invalid notes')
    } else if (value != null) {
      if (typeof value !== 'object' || Array.isArray(value))
        throw new FormError('Invalid form section')
      for (const [field, item] of Object.entries(value)) {
        if (!fields[key].includes(field) || (item !== null && typeof item === 'object'))
          throw new FormError('Unexpected nested field')
        if (
          typeof item === 'string' &&
          item.length > (longFields.has(field) ? 2000 : field === 'email' ? 254 : 100)
        )
          throw new FormError('A form field is too long')
      }
    }
  }
  for (const field of ['phoneNumber', 'phone']) {
    const value = personal[field]
    if (
      value != null &&
      (typeof value !== 'string' || value.length > 30 || !/^[+()\d\s.-]*$/.test(value))
    )
      throw new FormError('Enter a valid telephone number')
  }
  const appointment = body.testDrive as Record<string, unknown> | null
  if (appointment?.isTestDrive) {
    const date = String(appointment.testDriveDate || ''),
      time = String(appointment.testDriveTime || '')
    const parsed = new Date(`${date}T12:00:00Z`)
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date ||
      date <= today ||
      !/^(1[0-7]):(00|30)$/.test(time) ||
      (parsed.getUTCDay() === 0 && Number(time.slice(0, 2)) >= 15)
    )
      throw new FormError('Choose a valid future test-drive date and time')
  }
  const bank = body.bank as Record<string, unknown> | null
  if (
    bank &&
    (!/^\d{6}$/.test(String(bank.sortCode).replace(/[- ]/g, '')) ||
      !/^\d{8}$/.test(String(bank.accountNumber)))
  )
    throw new FormError('Check your bank details')
  for (const section of ['finance', 'employment', 'vehicle']) {
    const fields = body[section] as Record<string, unknown> | null
    if (fields)
      for (const key of [
        'annualIncome',
        'grossAnnualIncome',
        'monthlyExpenses',
        'existenceCreditCommitments',
        'price',
        'initialDeposit',
        'loanTerm',
        'apr',
        'amountToFinance',
        'monthlyPayment',
      ]) {
        const n = fields[key]
        if (n != null && (typeof n !== 'number' || !Number.isFinite(n) || n < 0))
          throw new FormError('Invalid financial value')
      }
  }

  return { ...body, ...touches, submissionId }
}

/** Resolve new enquiries once. Replays use the already verified private snapshot. */
export async function resolveSubmissionStock(submission: Record<string, unknown>, kind: 'enquiry'|'reservation') {
  const vehicle = submission.vehicle as Record<string, unknown> | null
  if (vehicle?.stockId) {
    if (typeof vehicle.stockId !== 'string') throw new FormError('Invalid stock reference')
    const current = (await getInventory()).find((v) => v.metadata.stockId === vehicle.stockId)
    if (!current)
      throw new FormError(
        'This vehicle is no longer available. Please contact the dealership.',
        409,
      )
    submission.vehicle = {
      ...vehicle,
      stockId: current.metadata.stockId,
      make: current.vehicle.make,
      model: current.vehicle.model,
      registration: current.vehicle.registration,
      price: vehiclePrice(current),
      year:
        current.vehicle.yearOfManufacture == null
          ? null
          : String(current.vehicle.yearOfManufacture),
      mileage:
        current.vehicle.odometerReadingMiles == null
          ? null
          : String(current.vehicle.odometerReadingMiles),
    }
  } else if (kind === 'reservation') throw new FormError('A current vehicle reference is required')
  return submission
}
