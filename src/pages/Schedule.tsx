import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { addDays, format, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { sameDay, timeRange } from '../lib/format';
import { useStore } from '../store/StoreContext';
import type { Job, JobStatus } from '../types';

const UNASSIGNED = 'unassigned';

function JobChip({
  job,
  customerName,
  dragging,
}: {
  job: Job;
  customerName: string;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftColor: undefined,
      }}
      className={`job-chip${isDragging || dragging ? ' dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <h4>{job.title}</h4>
      <div className="meta">
        {timeRange(job.scheduledStart, job.scheduledEnd)} · {customerName}
      </div>
      <div style={{ marginTop: '0.4rem' }} className="row">
        <StatusBadge kind="job" status={job.status} />
        <Link
          to={`/app/jobs/${job.id}`}
          className="muted"
          style={{ fontSize: '0.75rem' }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Details
        </Link>
      </div>
    </div>
  );
}

function TechColumn({
  id,
  title,
  color,
  jobs,
  customers,
}: {
  id: string;
  title: string;
  color?: string;
  jobs: Job[];
  customers: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`tech-col board-enter${id === UNASSIGNED ? ' unassigned' : ''}${isOver ? ' over' : ''}`}
    >
      <div className="tech-col-head">
        {color && <span className="tech-dot" style={{ background: color }} />}
        <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
        <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
          {jobs.length}
        </span>
      </div>
      {jobs.length === 0 && <div className="empty">Drop jobs here</div>}
      {jobs.map((j) => (
        <JobChip key={j.id} job={j} customerName={customers[j.customerId] ?? '—'} />
      ))}
    </div>
  );
}

export function Schedule() {
  const { data, assignJob, setJobStatus } = useStore();
  const [dayOffset, setDayOffset] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const day = startOfDay(addDays(new Date(), dayOffset));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfDay(new Date()), i - 1);
        return { offset: i - 1, label: format(d, 'EEE d'), date: d };
      }),
    [],
  );

  const dayJobs = data.jobs.filter(
    (j) => sameDay(j.scheduledStart, day) && j.status !== 'cancelled',
  );

  const customerNames = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const activeJob = dayJobs.find((j) => j.id === activeId);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const jobId = String(e.active.id);
    const over = e.over?.id ? String(e.over.id) : null;
    if (!over) return;
    assignJob(jobId, over === UNASSIGNED ? null : over);
  }

  const statuses: JobStatus[] = ['scheduled', 'en_route', 'in_progress', 'done'];

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Schedule</h1>
          <div className="sub">Drag jobs onto technicians to dispatch</div>
        </div>
      </div>

      <div className="day-tabs">
        {days.map((d) => (
          <button
            key={d.offset}
            type="button"
            className={`day-tab${dayOffset === d.offset ? ' active' : ''}`}
            onClick={() => setDayOffset(d.offset)}
          >
            {d.offset === 0 ? 'Today' : d.label}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="dispatch">
          <TechColumn
            id={UNASSIGNED}
            title="Unassigned"
            jobs={dayJobs.filter((j) => !j.technicianId)}
            customers={customerNames}
          />
          {data.technicians
            .filter((t) => t.availability !== 'off')
            .map((t) => (
              <TechColumn
                key={t.id}
                id={t.id}
                title={t.name}
                color={t.color}
                jobs={dayJobs.filter((j) => j.technicianId === t.id)}
                customers={customerNames}
              />
            ))}
        </div>
        <DragOverlay>
          {activeJob ? (
            <JobChip
              job={activeJob}
              customerName={customerNames[activeJob.customerId] ?? '—'}
              dragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <section>
        <div className="section-head">
          <h2>Quick status updates</h2>
        </div>
        <table className="list-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Tech</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dayJobs.map((j) => {
              const tech = data.technicians.find((t) => t.id === j.technicianId);
              return (
                <tr key={j.id} style={{ cursor: 'default' }}>
                  <td>
                    <strong>{j.title}</strong>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {timeRange(j.scheduledStart, j.scheduledEnd)}
                    </div>
                  </td>
                  <td>{tech?.name ?? '—'}</td>
                  <td>
                    <div className="row">
                      <StatusBadge kind="job" status={j.status} />
                      <select
                        value={j.status}
                        onChange={(e) => setJobStatus(j.id, e.target.value as JobStatus)}
                        aria-label={`Status for ${j.number}`}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <select
                        value={j.technicianId ?? ''}
                        onChange={(e) =>
                          assignJob(j.id, e.target.value ? e.target.value : null)
                        }
                        aria-label={`Assign ${j.number}`}
                      >
                        <option value="">Unassigned</option>
                        {data.technicians
                          .filter((t) => t.availability !== 'off')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {dayJobs.length === 0 && <p className="empty">No jobs on this day.</p>}
      </section>
    </div>
  );
}
