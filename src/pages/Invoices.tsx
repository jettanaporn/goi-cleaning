import { useState } from 'react';
import { InvoiceDocument } from '../components/InvoiceDocument';
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

  function printInvoice() {
    window.print();
  }

  const selectedCustomer = selected
    ? data.customers.find((c) => c.id === selected.customerId)
    : undefined;
  const selectedJob = selected?.jobId
    ? data.jobs.find((j) => j.id === selected.jobId)
    : undefined;

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
            const job = inv.jobId ? data.jobs.find((j) => j.id === inv.jobId) : undefined;
            return (
              <tr key={inv.id} onClick={() => setSelected(inv)}>
                <td>
                  <strong>{inv.number}</strong>
                  {job && (
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      Job {job.number}
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
        <Modal
          title={`Invoice ${selected.number}`}
          onClose={() => setSelected(null)}
          wide
          hideTitle
        >
          <div className="invoice-viewer">
            <div className="invoice-toolbar no-print">
              <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatusBadge kind="invoice" status={selected.status} />
                <span className="muted" style={{ fontSize: '0.9rem' }}>
                  {selected.number}
                </span>
              </div>
              <div className="modal-actions" style={{ marginTop: 0 }}>
                <button type="button" className="btn btn-outline" onClick={printInvoice}>
                  Print / PDF
                </button>
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

            <div className="invoice-scroll" tabIndex={-1}>
              <InvoiceDocument
                invoice={selected}
                customer={selectedCustomer}
                job={selectedJob}
              />
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
