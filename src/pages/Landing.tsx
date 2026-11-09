import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';

export function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand-lockup">
          <BrandMark size="sm" />
          <div className="brand">Goi Cleaning</div>
        </div>
        <Link to="/login" className="btn btn-ghost btn-sm">
          Sign in
        </Link>
      </nav>
      <section className="landing-hero">
        <BrandMark size="hero" className="brand-mark-hero-glow" />
        <div className="brand-hero">Goi Cleaning Project</div>
        <h1>Run the day. Own the schedule.</h1>
        <p>
          Field service ops for HVAC, plumbing, and cleaning teams — dispatch,
          estimates, and invoices in one place that actually feels built for the
          truck and the office.
        </p>
        <div className="cta-row">
          <Link to="/login" className="btn btn-primary">
            Open demo workspace
          </Link>
          <a href="#features" className="btn btn-ghost" onClick={(e) => e.preventDefault()}>
            See how it works
          </a>
        </div>
      </section>
    </div>
  );
}
