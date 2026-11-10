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

  const openInvoices = data.invoices.filter((i) =>
    ['draft', 'sent', 'overdue'].includes(i.status),
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
          <div className="sub">Today’s cleaning picture · sample data</div>
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
          <div className="label">Open invoices</div>
          <div className="value">{openInvoices.length}</div>
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
                  <th>Cleaner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayJobs.map((j) => {
                  const cust = data.customers.find((c) => c.id === j.customerId);
                  const tech = data.technicians.find((t) => t.id === j.technicianId);
                  return (
                    <tr key={j.id}>
                      <td>
                        <Link to={`/app/jobs/${j.id}`}>
                          {timeRange(j.scheduledStart, j.scheduledEnd)}
                        </Link>
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
              <h2>Cleaners on jobs</h2>
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
              <h2>Open invoices</h2>
              <Link to="/app/invoices" className="muted">
                All →
              </Link>
            </div>
            {openInvoices.slice(0, 4).map((inv) => {
              const cust = data.customers.find((c) => c.id === inv.customerId);
              return (
                <div
                  key={inv.id}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    padding: '0.55rem 0',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <Link to={`/app/invoices/${inv.id}`}>
                      <strong>{inv.number}</strong>
                    </Link>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {cust?.name} · {when(inv.createdAt, 'MMM d')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>{money(lineTotal(inv.lineItems))}</div>
                    <StatusBadge kind="invoice" status={inv.status} />
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
