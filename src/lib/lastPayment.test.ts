import { describe, expect, it } from 'vitest'
import { lastPayment } from './lastPayment'

describe('lastPayment', () => {
  it('reads null when nothing was saved', () => {
    expect(lastPayment.read()).toBeNull()
  })

  it('round-trips a payment id as a number', () => {
    lastPayment.save(42)
    expect(lastPayment.read()).toBe(42)
  })

  it('keeps the id as a number, never a string', () => {
    lastPayment.save(7)
    expect(typeof lastPayment.read()).toBe('number')
  })

  it('clear removes the remembered id', () => {
    lastPayment.save(1)
    lastPayment.clear()
    expect(lastPayment.read()).toBeNull()
  })

  it('treats a corrupted value as absent', () => {
    localStorage.setItem('vmapi.last_payment_id', 'not-a-number')
    expect(lastPayment.read()).toBeNull()
  })
})