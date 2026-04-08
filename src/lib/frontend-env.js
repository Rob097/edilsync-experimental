const PUBLIC_FRONTEND_ENV_ALLOWLIST = new Set([
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_AUTH_PROVIDER',
  'VITE_APP_ID',
  'VITE_FUNCTIONS_VERSION',
  'VITE_APP_BASE_URL',
]);

const FRONTEND_SECRET_NAME_PATTERN = /^VITE_.*(SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|ACCESS_TOKEN|REFRESH_TOKEN)$/i;

export function assertNoFrontendSecrets(env = import.meta.env) {
  const disallowedKeys = Object.keys(env).filter(
    (key) =>
      key.startsWith('VITE_') &&
      FRONTEND_SECRET_NAME_PATTERN.test(key) &&
      !PUBLIC_FRONTEND_ENV_ALLOWLIST.has(key),
  );

  if (disallowedKeys.length === 0) {
    return;
  }

  throw new Error(
    `Sensitive values must not be exposed to the frontend. Remove these Vite env vars: ${disallowedKeys.join(', ')}`,
  );
}