import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
const DMS_PORT = process.env.FIXTURE_MOCK_PORT || '9843'
const SITE_PORT = process.env.FIXTURE_SITE_PORT || '9844'
const APP_PORT = process.env.FIXTURE_APP_PORT || '54820'
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !/^npm_config_(call|package)$/i.test(key)),
    )
    const p = spawn(command, args, { stdio: 'inherit', env })
    p.once('error', reject)
    p.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} failed (${code})`)),
    )
  })
if (
  process.env.NEXT_PUBLIC_SERVER_URL !== `https://localhost:${SITE_PORT}` ||
  !process.env.DATABASE_URI?.includes('127.0.0.1')
)
  throw new Error('Production verification requires disposable fixtures')
if (!process.argv.includes('--skip-build')) await run('npm', ['run', 'build'])
const server = spawn(
  'node',
  ['node_modules/next/dist/bin/next', 'start', '-p', `${APP_PORT}`, '-H', '127.0.0.1'],
  { stdio: 'inherit', env: process.env },
)
try {
  let ready = false
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${APP_PORT}/api/health`)
      if (response.status === 200) {
        ready = true
        break
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  if (!ready) throw new Error('Verification server did not become healthy')
  await run('node', ['--test', 'tests/smoke/production-smoke.test.mjs'])
  await run('npm', ['run', 'test:e2e'])
  if (process.argv.includes('--lighthouse')) {
    await mkdir('docs/verification', { recursive: true })
    for (const [name, path] of [
      ['home', '/'],
      ['showroom', '/used-cars'],
      ['detail', '/used-cars/ford-focus-2023-fixture-stock-000002'],
    ]) {
      await run('npx', [
        '--yes',
        'lighthouse@13.0.1',
        `https://localhost:${SITE_PORT}${path}`,
        '--quiet',
        '--chrome-flags=--headless --no-sandbox --ignore-certificate-errors',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output=json',
        `--output-path=docs/verification/lighthouse-${name}.json`,
      ])
    }
  }
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve))
    const force = setTimeout(() => server.kill('SIGKILL'), 5000)
    server.kill('SIGTERM')
    await exited
    clearTimeout(force)
  }
}
