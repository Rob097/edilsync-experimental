import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const isCI = Boolean(process.env.CI);
const htmlOutputFolder = process.env.PLAYWRIGHT_HTML_OUTPUT_FOLDER || 'tests/playwright-report';
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR || 'tests/test-results';
const criticalTestMatch = [
  '**/auth.regression.spec.ts',
  '**/context-switch.regression.spec.ts',
  '**/company-invitations.regression.spec.ts',
  '**/calendar-event-details.regression.spec.ts',
  '**/project-invite-response.regression.spec.ts',
  '**/project-participants.regression.spec.ts',
  '**/notifications-targets.regression.spec.ts',
];

const reporter: Parameters<typeof defineConfig>[0]['reporter'] = [
  ['list'],
  ['html', { outputFolder: htmlOutputFolder, open: 'never' }],
];

if (process.env.PLAYWRIGHT_JSON_OUTPUT_FILE) {
  reporter.push(['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE }]);
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter,
  outputDir,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'smoke',
      testMatch: '**/*.smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'critical',
      testMatch: criticalTestMatch,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'regression',
      testMatch: '**/*.spec.ts',
      testIgnore: ['**/*.smoke.spec.ts', ...criticalTestMatch],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});