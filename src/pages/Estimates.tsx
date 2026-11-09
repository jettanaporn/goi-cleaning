import { useState, type FormEvent } from 'react';
import { addDays, formatISO } from 'date-fns';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { money, when } from '../lib/format';
import { nextNumber, uid } from '../lib/ids';
import { useStore } from '../store/StoreContext';
import type { Estimate, LineItem } from '../types';
import { lineTotal } from '../types';
import { useNavigate } from 'react-router-dom';

export function Estimates() {
  const { data, upsertEstimate, convertEstimateToJob } = useStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Estimate | null>(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerId: data.customers[0]?.id ?? '',
    serviceId: data.services[0]?.id ?? '',
    notes: '',
  });

  function onSave(e: FormEvent) {
    e.preventDefault();
    const svc = data.services.find((s) => s.id === form.serviceId);
    const lineItems: LineItem[] = svc
      ? [{ serviceId: svc.id, name: svc.name, quantity: 1, unitPrice: svc.price }]
      : [];
    const est: Estimate = {
      id: uid('est'),
      number: nextNumber(
        data.estimates.map((x) => x.number),
        'EST',
      ),
      customerId: form.customerId,
      status: 'draft',
      lineItems,
      notes: form.notes,
      validUntil: formatISO(addDays(new Date(), 14)),
      createdAt: new Date().toISOString(),
    };
    upsertEstimate(est);
    setOpen(false);
    setSelected(est);
  }

  function convert(est: Estimate) {
    const start = addDays(new Date(), 2);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);
    const job = convertEstimateToJob(est.id, formatISO(start), formatISO(end));
    if (job) navigate(`/app/jobs/${job.id}`);
  }

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Estimates</h1>
          <div className="sub">Price-book driven quotes · convert to jobs</div>
        </div>
        <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>
          New estimate
        </button>
      </div>

      <table className="list-table">
        <thead>
          <tr>
            <th>Estimate</th>
            <th>Customer</th>
            <th>Created</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.estimates.map((e) => {
            const cust = data.customers.find((c) => c.id === e.customerId);
            return (
              <tr key={e.id} onClick={() => setSelected(e)}>
                <td>
                  <strong>{e.number}</strong>
                </td>
                <td>{cust?.name}</td>
                <td>{when(e.createdAt, 'MMM d')}</td>
                <td>
                  <StatusBadge kind="estimate" status={e.status} />
                </td>
                <td>{money(lineTotal(e.lineItems))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {open && (
        <Modal title="New estimate" onClose={() => setOpen(false)}>
          <form onSubmit={onSave}>
            <div className="form-grid">
              <div className="field">
                <label>Customer</label>
                <select
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
                <label>Line item</label>
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
                Create draft
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.number} onClose={() => setSelected(null)}>
          <div className="stack">
            <div className="row">
              <StatusBadge kind="estimate" status={selected.status} />
              <span className="muted">Valid until {when(selected.validUntil, 'MMM d')}</span>
            </div>
            <div>
              {data.customers.find((c) => c.id === selected.customerId)?.name}
            </div>
            <div className="line-items">
              {selected.lineItems.map((li, i) => (
                <div key={i} className="row" style={{ justifyContent: 'space-between' }}>
                  <span>
                    {li.name} × {li.quantity}
                  </span>
                  <span>{money(li.quantity * li.unitPrice)}</span>
                </div>
              ))}
            </div>
            <div className="total-row">
              <span>Total</span>
              <strong>{money(lineTotal(selected.lineItems))}</strong>
            </div>
            {selected.notes && <p className="muted">{selected.notes}</p>}
            <div className="modal-actions">
              {selected.status === 'draft' && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    upsertEstimate({ ...selected, status: 'sent' });
                    setSelected({ ...selected, status: 'sent' });
                  }}
                >
                  Mark sent
                </button>
              )}
              {(selected.status === 'sent' || selected.status === 'accepted') && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    upsertEstimate({ ...selected, status: 'accepted' });
                    setSelected({ ...selected, status: 'accepted' });
                  }}
                >
                  Mark accepted
                </button>
              )}
              {['sent', 'accepted'].includes(selected.status) && (
                <button type="button" className="btn btn-solid" onClick={() => convert(selected)}>
                  Convert to job
                </button>
              )}
              {selected.status === 'converted' && selected.jobId && (
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => navigate(`/app/jobs/${selected.jobId}`)}
                >
                  Open job
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
