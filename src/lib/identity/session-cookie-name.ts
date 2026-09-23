// Split out from session.ts so the Edge middleware can read the cookie
// name without pulling in node:crypto (unsupported in the Edge runtime).
export const SESSION_COOKIE_NAME = "csas_session";
