import { Navigate } from 'react-router-dom';

/**
 * No client-side email/password check.
 * Live Postgres auth is Cursor sign-in (private/team visibility).
 * Public / local builds use the sample-data fallback without a fake login gate.
 */
export function Login() {
  return <Navigate to="/app" replace />;
}
