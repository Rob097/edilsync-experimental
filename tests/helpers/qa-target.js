const MAIN_PROJECT_REF = 'eeautkvckrbuorngkvyi';
const QA_PROJECT_REF = 'csjphzmyacnfmhllgqnq';

export function extractSupabaseProjectRef(supabaseUrl) {
  const match = String(supabaseUrl || '').match(/^https?:\/\/([^/.]+)\.supabase\.co/i);
  return match ? match[1] : null;
}

export function assertQaSupabaseUrl(supabaseUrl, envName = 'SUPABASE_URL') {
  const projectRef = extractSupabaseProjectRef(supabaseUrl);

  if (!projectRef) {
    throw new Error(`Unable to extract a Supabase project ref from ${envName}.`);
  }

  if (projectRef === MAIN_PROJECT_REF) {
    throw new Error(`Refusing to run remote QA tests against production/main (${MAIN_PROJECT_REF}).`);
  }

  if (projectRef !== QA_PROJECT_REF) {
    throw new Error(`Refusing to run remote QA tests against '${projectRef}'. Expected QA '${QA_PROJECT_REF}'.`);
  }
}

export { MAIN_PROJECT_REF, QA_PROJECT_REF };