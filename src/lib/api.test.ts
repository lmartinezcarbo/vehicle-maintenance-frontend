import { describe, expect, it } from 'vitest'
import { buildQuery } from './api'

describe('buildQuery', () => {
  it('serializes a plain object', () => {
    expect(buildQuery({ limit: 10, offset: 0 })).toBe('limit=10&offset=0')
  })

  it('drops undefined, null and empty-string values', () => {
    const qs = buildQuery({ search: '', sort_by: undefined, order: null, limit: 10 })
    expect(qs).toBe('limit=10')
  })

  it('keeps the number zero (it is a real value)', () => {
    expect(buildQuery({ offset: 0, limit: 5 })).toBe('offset=0&limit=5')
  })

  it('returns an empty string when nothing survives', () => {
    expect(buildQuery({ search: '', order: undefined })).toBe('')
  })
})