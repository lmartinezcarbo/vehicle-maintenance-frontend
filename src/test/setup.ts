import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount anything a test rendered and drop its localStorage between
// tests, so the token/payment helpers never leak state into the next one.
afterEach(() => {
  cleanup()
  localStorage.clear()
})