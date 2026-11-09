import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { money } from '../lib/format';
import { uid } from '../lib/ids';
import { useStore } from '../store/StoreContext';
import type { ServiceItem } from '../types';

export function PriceBook() {
  const { data, upsertService } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'HVAC',
    description: '',
    price: '100',
    durationMinutes: '60',
  });

  const byCategory = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    for (const s of data.services) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return [...map.entries()];
  }, [data.services]);

  function onSave(e: FormEvent) {
    e.preventDefault();
    const s: ServiceItem = {
      id: uid('svc'),
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price) || 0,
      durationMinutes: Number(form.durationMinutes) || 60,
    };
    upsertService(s);
    setOpen(false);
    setForm({
      name: '',
      category: 'HVAC',
      description: '',
      price: '100',
      durationMinutes: '60',
    });
  }

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Price book</h1>
          <div className="sub">Flat-rate services for estimates & jobs</div>
        </div>
        <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>
          Add service
        </button>
      </div>

      {byCategory.map(([cat, items]) => (
        <section key={cat}>
          <div className="section-head">
            <h2>{cat}</h2>
          </div>
          <table className="list-table static">
            <thead>
              <tr>
                <th>Service</th>
                <th>Duration</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {s.description}
                    </div>
                  </td>
                  <td>{s.durationMinutes} min</td>
                  <td>
                    <strong>{money(s.price)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {open && (
        <Modal title="Add service" onClose={() => setOpen(false)}>
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
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>HVAC</option>
                  <option>Plumbing</option>
                  <option>Cleaning</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Duration (min)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                />
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
