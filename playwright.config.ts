import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const isCI = Boolean(process.env.CI);
const isRemoteQaRun = process.env.EDILSYNC_REMOTE_QA === '1' || Boolean(process.env.EDILSYNC_QA_ENV_FILE);
const configuredWorkers = process.env.PLAYWRIGHT_WORKERS
  ? Number.parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
  : null;
const htmlOutputFolder = process.env.PLAYWRIGHT_HTML_OUTPUT_FOLDER || 'tests/playwright-report';
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR || 'tests/test-results';
const testTimeout = isRemoteQaRun ? 120_000 : 60_000;
const expectTimeout = isRemoteQaRun ? 20_000 : 10_000;
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
  workers: configuredWorkers && configuredWorkers > 0 ? configuredWorkers : (isRemoteQaRun ? 1 : undefined),
  timeout: testTimeout,
  expect: {
    timeout: expectTimeout,
  },
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter,
  outputDir,
  use: {
    baseURL,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...(isRemoteQaRun
      ? {
          actionTimeout: 20_000,
          navigationTimeout: 45_000,
          launchOptions: {
            args: ['--disable-dev-shm-usage'],
          },
        }
      : {}),
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