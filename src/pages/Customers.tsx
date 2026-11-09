import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { money, when } from '../lib/format';
import { uid } from '../lib/ids';
import { useStore } from '../store/StoreContext';
import type { Customer } from '../types';
import { lineTotal } from '../types';

const emptyCustomer = (): Omit<Customer, 'id' | 'createdAt'> => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: 'Austin',
  state: 'TX',
  zip: '',
  notes: '',
});

export function Customers() {
  const { data, upsertCustomer } = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCustomer());
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data.customers;
    return data.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.phone.includes(needle) ||
        c.address.toLowerCase().includes(needle),
    );
  }, [data.customers, q]);

  function onSave(e: FormEvent) {
    e.preventDefault();
    const c: Customer = {
      ...form,
      id: uid('cust'),
      createdAt: new Date().toISOString(),
    };
    upsertCustomer(c);
    setOpen(false);
    setForm(emptyCustomer());
    navigate(`/app/customers/${c.id}`);
  }

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Customers</h1>
          <div className="sub">{data.customers.length} accounts</div>
        </div>
        <div className="row">
          <input
            className="search"
            placeholder="Search name, phone, address…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>
            Add customer
          </button>
        </div>
      </div>

      <table className="list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Jobs</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const jobs = data.jobs.filter((j) => j.customerId === c.id).length;
            return (
              <tr key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>
                  <div>{c.phone}</div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    {c.email}
                  </div>
                </td>
                <td>
                  {c.address}
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    {c.city}, {c.state} {c.zip}
                  </div>
                </td>
                <td>{jobs}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {open && (
        <Modal title="New customer" onClose={() => setOpen(false)}>
          <form onSubmit={onSave}>
            <div className="form-grid">
              <div className="field full">
                <label>Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field full">
                <label>Street</label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="field">
                <label>City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="field">
                <label>ZIP</label>
                <input
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                />
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
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const { data } = useStore();
  const customer = data.customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="page-enter">
        <p className="empty">Customer not found.</p>
        <Link to="/app/customers">← Customers</Link>
      </div>
    );
  }

  const jobs = data.jobs
    .filter((j) => j.customerId === customer.id)
    .sort((a, b) => b.scheduledStart.localeCompare(a.scheduledStart));
  const invoices = data.invoices.filter((i) => i.customerId === customer.id);

  return (
    <div className="page-enter stack">
      <Link to="/app/customers" className="muted">
        ← Customers
      </Link>
      <div className="detail-hero">
        <h1>{customer.name}</h1>
        <div className="muted" style={{ marginTop: '0.35rem' }}>
          Customer since {when(customer.createdAt, 'MMM yyyy')}
        </div>
      </div>

      <div className="split">
        <section className="stack">
          <div>
            <div className="section-head">
              <h2>Contact & address</h2>
            </div>
            <p>
              <strong>{customer.phone}</strong>
              {customer.secondaryPhone && (
                <span className="muted"> · {customer.secondaryPhone}</span>
              )}
            </p>
            <p className="muted">{customer.email}</p>
            <p style={{ marginTop: '0.75rem' }}>
              {customer.address}
              <br />
              {customer.city}, {customer.state} {customer.zip}
            </p>
            {customer.notes && (
              <p style={{ marginTop: '0.75rem' }}>
                <span className="muted">Notes · </span>
                {customer.notes}
              </p>
            )}
          </div>

          <div>
            <div className="section-head">
              <h2>Job history</h2>
            </div>
            <table className="list-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>{when(j.scheduledStart, 'MMM d')}</td>
                    <td>
                      <Link to={`/app/jobs/${j.id}`}>
                        <strong>{j.title}</strong>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>
                          {j.number}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <StatusBadge kind="job" status={j.status} />
                    </td>
                    <td>{money(lineTotal(j.lineItems))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && <p className="empty">No jobs yet.</p>}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Invoices</h2>
          </div>
          {invoices.map((i) => (
            <div
              key={i.id}
              className="row"
              style={{
                justifyContent: 'space-between',
                padding: '0.55rem 0',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div>
                <Link to="/app/invoices">
                  <strong>{i.number}</strong>
                </Link>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Due {when(i.dueDate, 'MMM d')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{money(lineTotal(i.lineItems))}</div>
                <StatusBadge kind="invoice" status={i.status} />
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="empty">No invoices.</p>}
        </section>
      </div>
    </div>
  );
}
