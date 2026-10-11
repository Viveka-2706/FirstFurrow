// Turns an API error code into the i18n key of a message the farmer can read (English or Tamil).
const KNOWN = new Set([
  'email_taken', 'bad_credentials', 'weak_password', 'invalid_email', 'validation', 'network', 'rate_limited',
  'server_error', 'unauthorized', 'invalid_reset_token', 'email_unavailable', 'plan_limit', 'stage_locked', 'plan_completed', 'not_finished', 'journal_full',
]);
export const errKey = (code) => `err.${KNOWN.has(code) ? code : 'generic'}`;
