import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { uid } from '../lib/ids';
import { useStore } from '../store/StoreContext';
import type { TechAvailability, Technician } from '../types';

const colors = ['#0C7A75', '#2A6F97', '#C45C26', '#5B6C5D', '#8B6F47', '#6B4E71'];

export function Team() {
  const { data, upsertTechnician } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Technician',
    skills: '',
  });

  function onSave(e: FormEvent) {
    e.preventDefault();
    const t: Technician = {
      id: uid('tech'),
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      color: colors[data.technicians.length % colors.length],
      availability: 'available',
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    upsertTechnician(t);
    setOpen(false);
    setForm({ name: '', email: '', phone: '', role: 'Technician', skills: '' });
  }

  function setAvailability(t: Technician, availability: TechAvailability) {
    upsertTechnician({ ...t, availability });
  }

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Team</h1>
          <div className="sub">Technicians & availability</div>
        </div>
        <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpen(true)}>
          Add technician
        </button>
      </div>

      <div className="stack">
        {data.technicians.map((t) => (
          <div
            key={t.id}
            className="row"
            style={{
              justifyContent: 'space-between',
              padding: '0.85rem 0',
              borderBottom: '1px solid var(--line)',
              alignItems: 'flex-start',
            }}
          >
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="tech-avatar" style={{ background: t.color, width: 44, height: 44 }}>
                {t.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem' }}>{t.name}</strong>
                <div className="muted">{t.role}</div>
                <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {t.phone} · {t.email}
                </div>
                <div style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
                  {t.skills.join(' · ')}
                </div>
              </div>
            </div>
            <div className="stack" style={{ alignItems: 'flex-end', gap: '0.4rem' }}>
              <StatusBadge kind="availability" status={t.availability} />
              <select
                value={t.availability}
                onChange={(e) => setAvailability(t, e.target.value as TechAvailability)}
                aria-label={`Availability for ${t.name}`}
              >
                <option value="available">Available</option>
                <option value="on_job">On a job</option>
                <option value="off">Off duty</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Add technician" onClose={() => setOpen(false)}>
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
                <label>Role</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field full">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field full">
                <label>Skills (comma-separated)</label>
                <input
                  value={form.skills}
                  placeholder="Deep Clean, Move-out"
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
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
