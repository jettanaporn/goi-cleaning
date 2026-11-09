import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { useStore } from '../store/StoreContext';

const links = [
  { to: '/app', end: true, label: 'Dashboard' },
  { to: '/app/schedule', label: 'Schedule' },
  { to: '/app/customers', label: 'Customers' },
  { to: '/app/jobs', label: 'Jobs' },
  { to: '/app/invoices', label: 'Invoices' },
  { to: '/app/price-book', label: 'Price book' },
  { to: '/app/team', label: 'Team' },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { resetDemo } = useStore();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <div
        className={`mobile-backdrop${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`nav${open ? ' open' : ''}`}>
        <div className="brand-lockup brand-lockup-nav">
          <BrandMark size="sm" />
          <div className="brand">Goi Cleaning</div>
        </div>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="nav-footer">
          <div style={{ marginBottom: '0.5rem' }}>Sample data demo</div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%' }}
            onClick={() => {
              resetDemo();
              setOpen(false);
            }}
          >
            Reset demo data
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginTop: '0.4rem' }}
            onClick={() => navigate('/')}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="main">
        <button
          type="button"
          className="mobile-toggle"
          style={{ marginBottom: '0.75rem' }}
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
        <Outlet />
      </div>
    </div>
  );
}
