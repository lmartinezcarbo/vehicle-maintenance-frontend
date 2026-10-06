import { describe, expect, it } from 'vitest'
import { tokens } from './tokens'

describe('tokens', () => {
  it('starts empty', () => {
    expect(tokens.getAccess()).toBeNull()
    expect(tokens.getRefresh()).toBeNull()
  })

  it('stores and reads back a token pair', () => {
    tokens.set({ access_token: 'a.b.c', refresh_token: 'r-1' })
    expect(tokens.getAccess()).toBe('a.b.c')
    expect(tokens.getRefresh()).toBe('r-1')
  })

  it('overwrites both tokens on the next set', () => {
    tokens.set({ access_token: 'old', refresh_token: 'old-r' })
    tokens.set({ access_token: 'new', refresh_token: 'new-r' })
    expect(tokens.getAccess()).toBe('new')
    expect(tokens.getRefresh()).toBe('new-r')
  })

  it('clear drops both tokens', () => {
    tokens.set({ access_token: 'a', refresh_token: 'r' })
    tokens.clear()
    expect(tokens.getAccess()).toBeNull()
    expect(tokens.getRefresh()).toBeNull()
  })
})