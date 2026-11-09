import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';

const AUTH_KEY = 'goi-cleaning-authed';
const LEGACY_AUTH_KEY = 'cleanpro-authed';

export function Login() {
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(AUTH_KEY, '1');
    sessionStorage.removeItem(LEGACY_AUTH_KEY);
    navigate('/app');
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand-lockup brand-lockup-stack">
          <BrandMark size="lg" />
          <div className="brand">Goi Cleaning</div>
        </div>
        <p className="lede">Sign in to your cleaning ops workspace. Demo accepts any email.</p>
        <div className="stack">
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" defaultValue="ops@goi.demo" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" defaultValue="demo" required />
          </div>
          <button type="submit" className="btn btn-solid" style={{ width: '100%' }}>
            Enter workspace
          </button>
          <Link to="/" className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            ← Back to Goi Cleaning Project
          </Link>
        </div>
      </form>
    </div>
  );
}
