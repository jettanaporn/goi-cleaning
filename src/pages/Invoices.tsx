import { useState } from 'react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { money, when } from '../lib/format';
import { useStore } from '../store/StoreContext';
import type { Invoice } from '../types';
import { lineTotal } from '../types';

export function Invoices() {
  const { data, markInvoicePaid, upsertInvoice } = useStore();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  function mockPay() {
    if (!selected) return;
    markInvoicePaid(selected.id);
    setSelected({
      ...selected,
      status: 'paid',
      paidAt: new Date().toISOString(),
    });
    setPayOpen(false);
  }

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Invoices</h1>
          <div className="sub">Mock payments — no processor connected</div>
        </div>
      </div>

      <table className="list-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Due</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.invoices.map((inv) => {
            const cust = data.customers.find((c) => c.id === inv.customerId);
            return (
              <tr key={inv.id} onClick={() => setSelected(inv)}>
                <td>
                  <strong>{inv.number}</strong>
                  {inv.jobId && (
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      From job
                    </div>
                  )}
                </td>
                <td>{cust?.name}</td>
                <td>{when(inv.dueDate, 'MMM d')}</td>
                <td>
                  <StatusBadge kind="invoice" status={inv.status} />
                </td>
                <td>{money(lineTotal(inv.lineItems))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selected && (
        <Modal title={selected.number} onClose={() => setSelected(null)}>
          <div className="stack">
            <div className="row">
              <StatusBadge kind="invoice" status={selected.status} />
              <span className="muted">Due {when(selected.dueDate, 'MMM d, yyyy')}</span>
            </div>
            <div>{data.customers.find((c) => c.id === selected.customerId)?.name}</div>
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
            {selected.paidAt && (
              <p className="muted">Paid {when(selected.paidAt, 'MMM d, h:mm a')}</p>
            )}
            <div className="modal-actions">
              {selected.status === 'draft' && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    upsertInvoice({ ...selected, status: 'sent' });
                    setSelected({ ...selected, status: 'sent' });
                  }}
                >
                  Send invoice
                </button>
              )}
              {(selected.status === 'sent' || selected.status === 'overdue') && (
                <button type="button" className="btn btn-solid" onClick={() => setPayOpen(true)}>
                  Record payment
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {payOpen && selected && (
        <Modal title="Record payment" onClose={() => setPayOpen(false)}>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Simulated card payment — no real processor. Amount{' '}
            <strong>{money(lineTotal(selected.lineItems))}</strong>.
          </p>
          <div className="form-grid">
            <div className="field full">
              <label>Card number</label>
              <input defaultValue="4242 4242 4242 4242" readOnly />
            </div>
            <div className="field">
              <label>Expiry</label>
              <input defaultValue="12/28" readOnly />
            </div>
            <div className="field">
              <label>CVC</label>
              <input defaultValue="123" readOnly />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setPayOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-solid" onClick={mockPay}>
              Charge {money(lineTotal(selected.lineItems))}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
