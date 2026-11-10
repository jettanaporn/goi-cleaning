import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { money, when } from '../lib/format';
import { useStore } from '../store/StoreContext';
import { lineTotal } from '../types';

export function Invoices() {
  const { data } = useStore();
  const navigate = useNavigate();

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
              <tr key={inv.id} onClick={() => navigate(`/app/invoices/${inv.id}`)}>
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
    </div>
  );
}

export function InvoiceDetail() {
  const { id } = useParams();
  const { data, markInvoicePaid, upsertInvoice } = useStore();
  const [payOpen, setPayOpen] = useState(false);

  const invoice = data.invoices.find((i) => i.id === id);

  if (!invoice) {
    return (
      <div className="page-enter">
        <p className="empty">Invoice not found.</p>
        <Link to="/app/invoices">← Invoices</Link>
      </div>
    );
  }

  const customer = data.customers.find((c) => c.id === invoice.customerId);
  const job = invoice.jobId ? data.jobs.find((j) => j.id === invoice.jobId) : undefined;
  const invoiceId = invoice.id;

  function mockPay() {
    markInvoicePaid(invoiceId);
    setPayOpen(false);
  }

  function printInvoice() {
    window.print();
  }

  return (
    <div className="page-enter invoice-page">
      <Link to="/app/invoices" className="muted no-print invoice-back">
        ← Invoices
      </Link>

      <div className="invoice-viewer invoice-viewer-page">
        <div className="invoice-toolbar no-print">
          <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
            <StatusBadge kind="invoice" status={invoice.status} />
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              {invoice.number}
            </span>
          </div>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <button type="button" className="btn btn-outline" onClick={printInvoice}>
              Print / PDF
            </button>
            {invoice.status === 'draft' && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => upsertInvoice({ ...invoice, status: 'sent' })}
              >
                Send invoice
              </button>
            )}
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <button type="button" className="btn btn-solid" onClick={() => setPayOpen(true)}>
                Record payment
              </button>
            )}
          </div>
        </div>

        <div className="invoice-scroll invoice-scroll-page" tabIndex={-1}>
          <InvoiceDocument invoice={invoice} customer={customer} job={job} />
        </div>
      </div>

      {payOpen && (
        <Modal title="Record payment" onClose={() => setPayOpen(false)}>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            Simulated card payment — no real processor. Amount{' '}
            <strong>{money(lineTotal(invoice.lineItems))}</strong>.
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
              Charge {money(lineTotal(invoice.lineItems))}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
