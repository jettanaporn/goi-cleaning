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
        <Link to="/app" className="btn btn-ghost btn-sm">
          Sign in
        </Link>
      </nav>
      <section className="landing-hero">
        <BrandMark size="hero" className="brand-mark-hero-glow" />
        <div className="brand-hero">Goi Cleaning Project</div>
        <h1>Run the day. Own the schedule.</h1>
        <p>
          Cleaning ops for residential and commercial crews — dispatch,
          jobs, and invoices in one place that actually feels built for the
          crew and the office.
        </p>
        <div className="cta-row">
          <Link to="/app" className="btn btn-primary">
            Open workspace
          </Link>
          <a href="#features" className="btn btn-ghost" onClick={(e) => e.preventDefault()}>
            See how it works
          </a>
        </div>
      </section>
    </div>
  );
}
