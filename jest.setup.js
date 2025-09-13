import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

// Mock Logto (commented out - will be enabled when @logto/next is installed)
// jest.mock('@logto/next', () => ({
//   LogtoProvider: ({ children }) => children,
//   useLogto: jest.fn(() => ({
//     isAuthenticated: true,
//     isLoading: false,
//     signIn: jest.fn(),
//     signOut: jest.fn(),
//     getAccessToken: jest.fn(),
//     getIdTokenClaims: jest.fn(),
//     getUserInfo: jest.fn(),
//   })),
// }))

// Mock environment variables
process.env.LOGTO_ENDPOINT = 'https://z3zlta.logto.app/'
process.env.LOGTO_APP_ID = 'test_app_id'
process.env.LOGTO_APP_SECRET = 'test_secret'
process.env.LOGTO_BASE_URL = 'http://localhost:6789'
process.env.LOGTO_COOKIE_SECRET = 'test_cookie_secret'
process.env.LOGTO_M2M_APP_ID = 'test_m2m_id'
process.env.LOGTO_M2M_APP_SECRET = 'test_m2m_secret'

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}