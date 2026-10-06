import { describe, expect, it } from 'vitest'
import {
  formatMoney,
  paymentStatusCx,
  statusCx,
  statusLabel,
  today,
  verifiedCx,
} from './ui'

describe('formatMoney', () => {
  it('formats a decimal string with two places', () => {
    expect(formatMoney('89.99')).toBe('$89.99')
  })

  it('formats a number and pads the decimals', () => {
    expect(formatMoney(100)).toBe('$100.00')
  })

  it('rounds to two places', () => {
    expect(formatMoney('10.005')).toBe('$10.01')
  })
})

describe('statusLabel', () => {
  it('maps each backend status to a label', () => {
    expect(statusLabel('in_progress')).toBe('In progress')
    expect(statusLabel('ready')).toBe('Ready')
    expect(statusLabel('completed')).toBe('Completed')
  })
})

describe('status/payment/verified pills', () => {
  it('statusCx returns distinct tones per state', () => {
    const tones = new Set([
      statusCx('completed'),
      statusCx('ready'),
      statusCx('in_progress'),
    ])
    expect(tones.size).toBe(3)
    expect(statusCx('completed')).toContain('emerald')
  })

  it('paymentStatusCx colors paid vs pending differently', () => {
    expect(paymentStatusCx('paid')).toContain('emerald')
    expect(paymentStatusCx('pending')).toContain('amber')
  })

  it('verifiedCx branches on the boolean', () => {
    expect(verifiedCx(true)).toContain('emerald')
    expect(verifiedCx(false)).toContain('amber')
  })
})

describe('today', () => {
  it('returns the local date as YYYY-MM-DD', () => {
    const d = new Date()
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
    expect(today()).toBe(expected)
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})