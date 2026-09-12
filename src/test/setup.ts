import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// `globals: false` in vite.config.ts disables React Testing Library's
// automatic cleanup, so it must be called explicitly after every test.
afterEach(cleanup)
