import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addHours, formatISO } from 'date-fns';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { money, timeRange, when } from '../lib/format';
import { nextNumber, uid } from '../lib/ids';
import { useStore } from '../store/StoreContext';
import type { Job, JobStatus, LineItem } from '../types';
import { lineTotal } from '../types';

export function Jobs() {
  const { data, upsertJob } = useStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerId: data.customers[0]?.id ?? '',
    technicianId: '',
    title: '',
    scheduledStart: formatISO(addHours(new Date(), 2)).slice(0, 16),
    durationHours: '2',
    serviceId: data.services[0]?.id ?? '',
    notes: '',
  });

  const sorted = useMemo(
    () => [...data.jobs].sort((a, b) => b.scheduledStart.localeCompare(a.scheduledStart)),
    [data.jobs],
  );

  function onSave(e: FormEvent) {
    e.preventDefault();
    const start = new Date(form.scheduledStart);
    const end = addHours(start, Number(form.durationHours) || 2);
    const svc = data.services.find((s) => s.id === form.serviceId);
    const lineItems: LineItem[] = svc
      ? [{ serviceId: svc.id, name: svc.name, quantity: 1, unitPrice: svc.price }]
      : [];
    const job: Job = {
      id: uid('job'),
      number: nextNumber(
        data.jobs.map((j) => j.number),
        'JOB',
      ),
      customerId: form.customerId,
      technicianId: form.technicianId || null,
      title: form.title || svc?.name || 'Service job',
      status: 'scheduled',
      scheduledStart: formatISO(start),
      scheduledEnd: formatISO(end),
      lineItems,
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    upsertJob(job);
    setOpen(false);
    navigate(`/app/jobs/${job.id}`);
  }

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Jobs</h1>
          <div className="sub">{data.jobs.length} total</div>
        </div>
        <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>
          Create job
        </button>
      </div>

      <table className="list-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Customer</th>
            <th>When</th>
            <th>Tech</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((j) => {
            const cust = data.customers.find((c) => c.id === j.customerId);
            const tech = data.technicians.find((t) => t.id === j.technicianId);
            return (
              <tr key={j.id} onClick={() => navigate(`/app/jobs/${j.id}`)}>
                <td>
                  <strong>{j.title}</strong>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {j.number}
                  </div>
                </td>
                <td>{cust?.name}</td>
                <td>
                  {when(j.scheduledStart, 'MMM d')}
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {timeRange(j.scheduledStart, j.scheduledEnd)}
                  </div>
                </td>
                <td>{tech?.name ?? <span className="muted">Unassigned</span>}</td>
                <td>
                  <StatusBadge kind="job" status={j.status} />
                </td>
                <td>{money(lineTotal(j.lineItems))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {open && (
        <Modal title="Create job" onClose={() => setOpen(false)} wide>
          <form onSubmit={onSave}>
            <div className="form-grid">
              <div className="field full">
                <label>Title</label>
                <input
                  value={form.title}
                  placeholder="Optional — defaults to service name"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Customer</label>
                <select
                  required
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                >
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Service</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                >
                  {data.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {money(s.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Start</label>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduledStart}
                  onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Duration (hours)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Technician</label>
                <select
                  value={form.technicianId}
                  onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {data.technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-solid">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function JobDetail() {
  const { id } = useParams();
  const { data, upsertJob, setJobStatus, createInvoiceFromJob } = useStore();
  const navigate = useNavigate();
  const job = data.jobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="page-enter">
        <p className="empty">Job not found.</p>
        <Link to="/app/jobs">← Jobs</Link>
      </div>
    );
  }

  const cust = data.customers.find((c) => c.id === job.customerId);
  const tech = data.technicians.find((t) => t.id === job.technicianId);
  const statuses: JobStatus[] = ['scheduled', 'en_route', 'in_progress', 'done', 'cancelled'];

  return (
    <div className="page-enter stack">
      <Link to="/app/jobs" className="muted">
        ← Jobs
      </Link>
      <div className="detail-hero row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="muted">{job.number}</div>
          <h1>{job.title}</h1>
          <div className="row" style={{ marginTop: '0.5rem' }}>
            <StatusBadge kind="job" status={job.status} />
            <span className="muted">
              {when(job.scheduledStart, 'EEE, MMM d')} ·{' '}
              {timeRange(job.scheduledStart, job.scheduledEnd)}
            </span>
          </div>
        </div>
        <div className="row">
          {!job.invoiceId && job.status === 'done' && (
            <button
              type="button"
              className="btn btn-solid btn-sm"
              onClick={() => {
                const inv = createInvoiceFromJob(job.id);
                if (inv) navigate(`/app/invoices/${inv.id}`);
              }}
            >
              Create invoice
            </button>
          )}
          {job.invoiceId && (
            <Link to={`/app/invoices/${job.invoiceId}`} className="btn btn-outline btn-sm">
              View invoice
            </Link>
          )}
        </div>
      </div>

      <div className="split">
        <section className="stack">
          <div>
            <div className="section-head">
              <h2>Details</h2>
            </div>
            <p>
              <strong>Customer · </strong>
              {cust ? (
                <Link to={`/app/customers/${cust.id}`}>{cust.name}</Link>
              ) : (
                '—'
              )}
            </p>
            {cust && (
              <p className="muted">
                {cust.address}, {cust.city} {cust.zip} · {cust.phone}
              </p>
            )}
            <p style={{ marginTop: '0.75rem' }}>
              <strong>Technician · </strong>
              {tech?.name ?? 'Unassigned'}
            </p>
            <div className="field" style={{ marginTop: '0.75rem', maxWidth: 240 }}>
              <label>Assign tech</label>
              <select
                value={job.technicianId ?? ''}
                onChange={(e) =>
                  upsertJob({ ...job, technicianId: e.target.value || null })
                }
              >
                <option value="">Unassigned</option>
                {data.technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginTop: '0.75rem', maxWidth: 240 }}>
              <label>Status</label>
              <select
                value={job.status}
                onChange={(e) => setJobStatus(job.id, e.target.value as JobStatus)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            {job.notes && (
              <p style={{ marginTop: '1rem' }}>
                <span className="muted">Notes · </span>
                {job.notes}
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Line items</h2>
          </div>
          <div className="line-items">
            {job.lineItems.map((li, idx) => (
              <div key={idx} className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  {li.name}
                  <span className="muted"> × {li.quantity}</span>
                </div>
                <div>{money(li.quantity * li.unitPrice)}</div>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>Total</span>
            <strong>{money(lineTotal(job.lineItems))}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
