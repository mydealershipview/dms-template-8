import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureAttribution, clearAttribution, getAttribution } from '@/forms/attribution'
beforeEach(() => {
  localStorage.clear()
  clearAttribution()
  window.history.replaceState({}, '', '/')
})
afterEach(() => {
  localStorage.clear()
  clearAttribution()
  vi.restoreAllMocks()
})
describe('consent-compatible first and last touch', () => {
  it('does not store anything before affirmative consent, or for necessary/rejected choices', () => {
    window.history.replaceState({}, '', '/?utm_source=google')
    for (const consent of ['', 'necessary-only', 'rejected']) {
      if (consent) localStorage.setItem('cookies-accepted', consent)
      captureAttribution()
      expect(getAttribution()).toEqual({})
      expect(document.cookie).not.toContain('mydv_ad_attribution=')
    }
  })
  it('captures UTM-only visits, retains first touch, and does not replace campaigns on direct return', () => {
    localStorage.setItem('cookies-accepted', 'true')
    window.history.replaceState(
      {},
      '',
      '/?utm_source=google&utm_medium=cpc&email=private@example.test',
    )
    captureAttribution()
    const first = getAttribution()
    expect(first.attribution?.utmSource).toBe('google')
    expect(first.attribution?.landingPage).not.toContain('email=')
    window.history.replaceState({}, '', '/?utm_source=second')
    captureAttribution()
    expect(getAttribution().attribution?.utmSource).toBe('second')
    expect(getAttribution().firstTouchAttribution?.utmSource).toBe('google')
    window.history.replaceState({}, '', '/used-cars')
    captureAttribution()
    expect(getAttribution().attribution?.utmSource).toBe('second')
    localStorage.setItem('cookies-accepted', 'rejected')
    captureAttribution()
    expect(getAttribution()).toEqual({})
  })
  it('fails denied when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => captureAttribution()).not.toThrow()
    expect(getAttribution()).toEqual({})
  })
})
