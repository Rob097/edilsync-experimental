process.env.TZ = 'UTC';

if (!process.env.PLAYWRIGHT_BASE_URL) {
  process.env.PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173';
}