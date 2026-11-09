import { Link } from 'react-router-dom';
import { isToday, parseISO } from 'date-fns';
import { money, timeRange, when } from '../lib/format';
import { useStore } from '../store/StoreContext';
import { lineTotal } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export function Dashboard() {
  const { data } = useStore();
  const todayJobs = data.jobs
    .filter((j) => isToday(parseISO(j.scheduledStart)) && j.status !== 'cancelled')
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));

  const paidThisWeek = data.invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + lineTotal(i.lineItems), 0);

  const openEstimates = data.estimates.filter((e) =>
    ['draft', 'sent', 'accepted'].includes(e.status),
  );

  const techsOnJobs = data.technicians.filter((t) => t.availability === 'on_job');

  const outstanding = data.invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + lineTotal(i.lineItems), 0);

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Today’s field picture · sample data</div>
        </div>
        <div className="row">
          <Link to="/app/jobs" className="btn btn-solid btn-sm">
            New job
          </Link>
          <Link to="/app/schedule" className="btn btn-outline btn-sm">
            Open schedule
          </Link>
        </div>
      </div>

      <div className="grid-4">
        <div className="metric">
          <div className="label">Today’s jobs</div>
          <div className="value">{todayJobs.length}</div>
        </div>
        <div className="metric">
          <div className="label">Collected (paid)</div>
          <div className="value">{money(paidThisWeek)}</div>
        </div>
        <div className="metric">
          <div className="label">Open estimates</div>
          <div className="value">{openEstimates.length}</div>
        </div>
        <div className="metric">
          <div className="label">Outstanding AR</div>
          <div className="value">{money(outstanding)}</div>
        </div>
      </div>

      <div className="split">
        <section>
          <div className="section-head">
            <h2>Today’s schedule</h2>
            <Link to="/app/schedule" className="muted">
              Dispatch →
            </Link>
          </div>
          {todayJobs.length === 0 ? (
            <p className="empty">No jobs scheduled for today.</p>
          ) : (
            <table className="list-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Job</th>
                  <th>Tech</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayJobs.map((j) => {
                  const cust = data.customers.find((c) => c.id === j.customerId);
                  const tech = data.technicians.find((t) => t.id === j.technicianId);
                  return (
                    <tr key={j.id} onClick={() => (window.location.hash = '')}>
                      <td>
                        <Link to={`/app/jobs/${j.id}`}>{timeRange(j.scheduledStart, j.scheduledEnd)}</Link>
                      </td>
                      <td>
                        <Link to={`/app/jobs/${j.id}`}>
                          <strong>{j.title}</strong>
                          <div className="muted" style={{ fontSize: '0.85rem' }}>
                            {cust?.name} · {j.number}
                          </div>
                        </Link>
                      </td>
                      <td>{tech?.name ?? <span className="muted">Unassigned</span>}</td>
                      <td>
                        <StatusBadge kind="job" status={j.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="stack">
          <div>
            <div className="section-head">
              <h2>Techs on jobs</h2>
            </div>
            {techsOnJobs.length === 0 ? (
              <p className="empty">Everyone is available.</p>
            ) : (
              <div className="stack">
                {techsOnJobs.map((t) => {
                  const job = data.jobs.find(
                    (j) =>
                      j.technicianId === t.id &&
                      (j.status === 'en_route' || j.status === 'in_progress'),
                  );
                  return (
                    <div key={t.id} className="row" style={{ gap: '0.75rem' }}>
                      <div className="tech-avatar" style={{ background: t.color }}>
                        {t.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <strong>{t.name}</strong>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>
                          {job?.title ?? 'On assignment'}
                        </div>
                      </div>
                      <StatusBadge kind="availability" status={t.availability} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="section-head">
              <h2>Open estimates</h2>
              <Link to="/app/estimates" className="muted">
                All →
              </Link>
            </div>
            {openEstimates.slice(0, 4).map((e) => {
              const cust = data.customers.find((c) => c.id === e.customerId);
              return (
                <div
                  key={e.id}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    padding: '0.55rem 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <Link to="/app/estimates">
                      <strong>{e.number}</strong>
                    </Link>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {cust?.name} · {when(e.createdAt, 'MMM d')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{money(lineTotal(e.lineItems))}</div>
                    <StatusBadge kind="estimate" status={e.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
