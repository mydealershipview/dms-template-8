// All verification uses disposable Mongo and deliberately replaces deployment credentials.
import { MongoMemoryServer } from 'mongodb-memory-server'
import { spawn } from 'node:child_process'
import net from 'node:net'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fixtureServices } from './fixture-services.mjs'
const DMS_PORT = process.env.FIXTURE_MOCK_PORT || '9843'
const SITE_PORT = process.env.FIXTURE_SITE_PORT || '9844'
const APP_PORT = process.env.FIXTURE_APP_PORT || '54820'
// Refuse busy fixture ports before creating Mongo or temporary media.
if (process.argv[2] === '--services') {
  for (const port of [DMS_PORT, SITE_PORT, APP_PORT]) {
    await new Promise((resolve, reject) => {
      const probe = net.createServer()
      probe.once('error', () => reject(new Error(`Fixture port ${port} is already in use`)))
      probe.listen(Number(port), '127.0.0.1', () => probe.close(resolve))
    })
  }
}
const mediaDir = await mkdtemp(join(tmpdir(), 'template8-media-'))
const mongo = await MongoMemoryServer.create({ instance: { dbName: 'template8-verification' } })
const input = process.argv.slice(2)
const services = input[0] === '--services' ? await fixtureServices() : null
if (services) input.shift()
const [command, ...args] = input
if (!command) throw new Error('Supply a verification command')
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      !/(DMS|DATABASE|PAYLOAD|S3_|RESEND|EMAIL_|WEBHOOK|DEALER_|CRON|TURNSTILE|SENTRY|GLITCHTIP)/.test(
        key,
      ),
  ),
)
for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  const content = await readFile(name, 'utf8').catch(() => '')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)
    if (match) env[match[1]] = ''
  }
}
Object.assign(env, {
  DATABASE_URI: mongo.getUri(),
  MEDIA_LOCAL_DIR: mediaDir,
  PAYLOAD_SECRET: 'isolated-verification-secret-at-least-32-characters',
  NEXT_PUBLIC_SERVER_URL: services
    ? `https://localhost:${SITE_PORT}`
    : 'https://fixture.example.test',
  NEXT_PUBLIC_SITE_URL: services
    ? `https://localhost:${SITE_PORT}`
    : 'https://fixture.example.test',
  SITE_NOINDEX: 'true',
  DMS_URL: `https://localhost:${DMS_PORT}`,
  DMS_WEBSITE_KEY: 'fixture-key',
  DEALER_ID: '11111111-1111-4111-8111-111111111111',
  LEAD_SOURCE_WEBSITE: 'fixture.example.test',
  FORM_SUBMIT_WEBHOOK_URL: `https://127.0.0.1:${DMS_PORT}/api/webhooks/external-notifications`,
  EXTERNAL_NOTIFICATIONS_WEBHOOK_SECRET: 'fixture-lead-secret',
  TURNSTILE_SECRET_KEY: 'fixture-not-live',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  CRON_SECRET: 'fixture-cron-secret-at-least-32-characters',
  READ_ONLY_VERIFICATION: 'false',
  S3_BUCKET: '',
})
if (services)
  Object.assign(env, {
    NODE_EXTRA_CA_CERTS: services.cert,
    DMS_IMAGE_ORIGINS: `https://localhost:${DMS_PORT}`,
    REVIEW_BASE_URL: `https://localhost:${SITE_PORT}`,
    PLAYWRIGHT_BASE_URL: `https://localhost:${SITE_PORT}`,
  })
const child = spawn(command, args, { stdio: 'inherit', env })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
try {
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
} finally {
  await mongo.stop()
  await rm(mediaDir, { recursive: true, force: true })
  if (services) await services.stop()
}
