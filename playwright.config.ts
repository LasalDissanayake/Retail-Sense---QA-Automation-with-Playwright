import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory and execution settings
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0, // Retry twice in CI, no retries in local
  workers: process.env.CI ? 3 : undefined, // Parallel workers in CI, auto in local
  timeout: 30000, // Global timeout for tests (30 seconds)

  // Test reporting
  reporter: [
    ['html', { open: 'never' }],
    ['list'], // Show test progress in console
  ],

  // Global test settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000, // Timeout for individual actions
    navigationTimeout: 30000, // Timeout for navigation
    testIdAttribute: 'data-testid', // For better test selectors
  },

  // Browser configurations
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
    },
  },

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Ignore files in node_modules
  testIgnore: '**/node_modules/**',

  // Pattern for test files
  testMatch: '**/*.test.ts',
});