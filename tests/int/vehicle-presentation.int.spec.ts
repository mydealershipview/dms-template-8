import { describe, expect, it } from 'vitest'
import { highlightLine } from '@/utilities/vehiclePresentation'

describe('highlightLine', () => {
  it('accepts string and { name } highlights and never renders [object Object]', () => {
    expect(highlightLine({ highlights: ['A', { name: 'B' }, { description: 'x' }, null, ''] })).toBe('A · B')
    expect(highlightLine({})).toBe('')
  })
})
