import { BrandMark } from './BrandMark';
import { StatusBadge } from './StatusBadge';
import { money, when } from '../lib/format';
import { lineTotal, type Customer, type Invoice, type Job } from '../types';

export const BUSINESS = {
  name: 'Goi Cleaning',
  legalName: 'Goi Cleaning Project',
  addressLines: ['Po Box 3025', 'Nantucket, MA 02584'],
  phone: '(508) 333-8303',
  email: 'goicleaning@gmail.com',
  paymentTerms: 'Upon receipt',
} as const;

export function InvoiceDocument({
  invoice,
  customer,
  job,
}: {
  invoice: Invoice;
  customer: Customer | undefined;
  job: Job | undefined;
}) {
  const subtotal = lineTotal(invoice.lineItems);
  const tax = 0;
  const total = subtotal + tax;
  const amountDue = invoice.status === 'paid' ? 0 : total;
  const serviceDate = job?.scheduledStart ?? invoice.createdAt;

  return (
    <article className="invoice-doc" aria-label={`Invoice ${invoice.number}`}>
      <header className="invoice-doc-header">
        <div className="invoice-doc-brand">
          <BrandMark size="md" />
          <div>
            <div className="invoice-doc-biz">{BUSINESS.name}</div>
            <div className="invoice-doc-legal">{BUSINESS.legalName}</div>
          </div>
        </div>
        <div className="invoice-doc-contact">
          <div className="invoice-doc-label">Contact us</div>
          {BUSINESS.addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div>{BUSINESS.phone}</div>
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </div>
      </header>

      <div className="invoice-doc-parties">
        <div>
          <div className="invoice-doc-label">Bill to</div>
          {customer ? (
            <>
              <div className="invoice-doc-party-name">{customer.name}</div>
              <div>
                {customer.address}
                <br />
                {customer.city}, {customer.state} {customer.zip}
              </div>
              <div>{customer.phone}</div>
              <div>{customer.email}</div>
            </>
          ) : (
            <div className="muted">Customer unavailable</div>
          )}
        </div>
        <div>
          <div className="invoice-doc-label">Service address</div>
          {customer ? (
            <>
              <div>
                {customer.address}
                <br />
                {customer.city}, {customer.state} {customer.zip}
              </div>
              {job && <div className="invoice-doc-job-ref">Job {job.number}</div>}
            </>
          ) : (
            <div className="muted">—</div>
          )}
        </div>
      </div>

      <div className="invoice-doc-meta">
        <div>
          <div className="invoice-doc-label">Invoice</div>
          <div className="invoice-doc-meta-value">{invoice.number}</div>
        </div>
        <div>
          <div className="invoice-doc-label">Service date</div>
          <div className="invoice-doc-meta-value">{when(serviceDate, 'MMM d, yyyy')}</div>
        </div>
        <div>
          <div className="invoice-doc-label">Payment terms</div>
          <div className="invoice-doc-meta-value">{BUSINESS.paymentTerms}</div>
        </div>
        <div>
          <div className="invoice-doc-label">Due date</div>
          <div className="invoice-doc-meta-value">{when(invoice.dueDate, 'MMM d, yyyy')}</div>
        </div>
        <div className="invoice-doc-amount-due">
          <div className="invoice-doc-label">Amount due</div>
          <div className="invoice-doc-meta-value">{money(amountDue)}</div>
          <StatusBadge kind="invoice" status={invoice.status} />
        </div>
      </div>

      <table className="invoice-doc-table">
        <thead>
          <tr>
            <th>Services</th>
            <th className="num">Qty</th>
            <th className="num">Unit price</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((li, i) => (
            <tr key={`${li.serviceId}-${i}`}>
              <td>{li.name}</td>
              <td className="num">{li.quantity.toFixed(1)}</td>
              <td className="num">{money(li.unitPrice)}</td>
              <td className="num">{money(li.quantity * li.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-doc-totals">
        <div className="invoice-doc-totals-rows">
          <div>
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div>
              <span>Tax</span>
              <span>{money(tax)}</span>
            </div>
          )}
          <div>
            <span>Job total</span>
            <span>{money(total)}</span>
          </div>
          <div className="invoice-doc-totals-due">
            <span>Amount due</span>
            <strong>{money(amountDue)}</strong>
          </div>
        </div>
      </div>

      {(invoice.status === 'paid' || invoice.paidAt) && (
        <section className="invoice-doc-section">
          <div className="invoice-doc-label">Payment history</div>
          <div className="invoice-doc-payment">
            <span>{invoice.paidAt ? when(invoice.paidAt, 'MMM d') : '—'}</span>
            <span className="muted">
              {invoice.paidAt ? when(invoice.paidAt, 'EEE h:mmaaa') : ''}
            </span>
            <span>Card</span>
            <span className="num">{money(total)}</span>
          </div>
        </section>
      )}

      <section className="invoice-doc-section">
        <div className="invoice-doc-label">Notes / payment terms</div>
        <p className="invoice-doc-notes">
          {invoice.notes?.trim()
            ? invoice.notes
            : `Payment due ${BUSINESS.paymentTerms.toLowerCase()}. Thank you for choosing ${BUSINESS.name}.`}
        </p>
      </section>

      <footer className="invoice-doc-footer">
        <div>
          Thank you for your business.
          <br />
          <span className="muted">
            {BUSINESS.name} · {BUSINESS.phone} · {BUSINESS.email}
          </span>
        </div>
        <div className="invoice-doc-footer-right muted">
          See our Terms &amp; Conditions
        </div>
      </footer>
    </article>
  );
}
