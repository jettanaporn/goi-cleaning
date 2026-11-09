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
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { sameDay, timeRange } from '../lib/format';
import { useStore } from '../store/StoreContext';
import type { Job, JobStatus, Technician } from '../types';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const UNASSIGNED = 'unassigned';
const WEEK_START_HOUR = 7;
const WEEK_END_HOUR = 20;
const HOUR_PX = 52;

function jobColor(job: Job, techs: Technician[]): string {
  return techs.find((t) => t.id === job.technicianId)?.color ?? '#0c7a75';
}

function hourOffset(iso: string): number {
  const d = parseISO(iso);
  return getHours(d) + getMinutes(d) / 60;
}

function jobsOnDay(jobs: Job[], day: Date): Job[] {
  return jobs.filter((j) => sameDay(j.scheduledStart, day) && j.status !== 'cancelled');
}

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
      style={style}
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

function WeekView({
  weekStart,
  jobs,
  techs,
  customers,
}: {
  weekStart: Date;
  jobs: Job[];
  techs: Technician[];
  customers: Record<string, string>;
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const hours = useMemo(
    () => Array.from({ length: WEEK_END_HOUR - WEEK_START_HOUR }, (_, i) => WEEK_START_HOUR + i),
    [],
  );
  const gridHeight = (WEEK_END_HOUR - WEEK_START_HOUR) * HOUR_PX;

  return (
    <div className="cal-week">
      <div className="cal-week-head">
        <div className="cal-week-gutter" />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={`cal-week-dayhead${isToday(d) ? ' today' : ''}`}
          >
            <span className="cal-dow">{format(d, 'EEE')}</span>
            <span className="cal-dom">{format(d, 'd')}</span>
          </div>
        ))}
      </div>
      <div className="cal-week-body">
        <div className="cal-week-gutter" style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div key={h} className="cal-hour-label" style={{ height: HOUR_PX }}>
              {format(new Date().setHours(h, 0, 0, 0), 'h a')}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayJobs = jobsOnDay(jobs, d);
          return (
            <div key={d.toISOString()} className="cal-week-col" style={{ height: gridHeight }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="cal-hour-line"
                  style={{ top: (h - WEEK_START_HOUR) * HOUR_PX }}
                />
              ))}
              {dayJobs.map((j) => {
                const start = Math.max(hourOffset(j.scheduledStart), WEEK_START_HOUR);
                const end = Math.min(hourOffset(j.scheduledEnd), WEEK_END_HOUR);
                if (end <= WEEK_START_HOUR || start >= WEEK_END_HOUR) return null;
                const top = (start - WEEK_START_HOUR) * HOUR_PX;
                const height = Math.max((end - start) * HOUR_PX, 36);
                const color = jobColor(j, techs);
                const tech = techs.find((t) => t.id === j.technicianId);
                const cust = customers[j.customerId] ?? 'Customer';
                return (
                  <Link
                    key={j.id}
                    to={`/app/jobs/${j.id}`}
                    className="cal-block"
                    style={{ top, height, borderLeftColor: color }}
                    title={`${cust} · ${j.title} · ${timeRange(j.scheduledStart, j.scheduledEnd)}`}
                  >
                    <div className="cal-block-top">
                      <strong>{cust}</strong>
                      {tech && (
                        <span className="cal-block-avatar" style={{ background: color }}>
                          {tech.name
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="cal-block-time">
                      {format(parseISO(j.scheduledStart), 'h:mma').toLowerCase()}
                    </span>
                    <span className="cal-block-title">{j.title}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  month,
  jobs,
  techs,
  customers,
  focusedDay,
  onSelectDay,
  onOpenDay,
}: {
  month: Date;
  jobs: Job[];
  techs: Technician[];
  customers: Record<string, string>;
  focusedDay: Date | null;
  onSelectDay: (d: Date) => void;
  onOpenDay: (d: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const focusedJobs = focusedDay ? jobsOnDay(jobs, focusedDay) : [];

  return (
    <div className="cal-month-wrap">
      <div className="cal-month">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="cal-month-dow">
            {label}
          </div>
        ))}
        {days.map((d) => {
          const dayJobs = jobsOnDay(jobs, d);
          const inMonth = isSameMonth(d, month);
          const selected = focusedDay != null && isSameDay(d, focusedDay);
          const show = dayJobs.slice(0, 3);
          const more = dayJobs.length - show.length;
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={`cal-month-cell${inMonth ? '' : ' muted-month'}${isToday(d) ? ' today' : ''}${selected ? ' selected' : ''}`}
              onClick={() => onSelectDay(d)}
              onDoubleClick={() => onOpenDay(d)}
            >
              <span className="cal-month-date">{format(d, 'd')}</span>
              <div className="cal-month-pills">
                {show.map((j) => (
                  <span
                    key={j.id}
                    className="cal-pill"
                    style={{ borderLeftColor: jobColor(j, techs) }}
                    title={customers[j.customerId] ?? j.title}
                  >
                    <em>{format(parseISO(j.scheduledStart), 'h:mma').toLowerCase()}</em>{' '}
                    {customers[j.customerId] ?? j.title}
                  </span>
                ))}
                {more > 0 && <span className="cal-more">+{more} more</span>}
              </div>
            </button>
          );
        })}
      </div>

      {focusedDay && (
        <aside className="cal-day-detail">
          <div className="section-head">
            <h2>{format(focusedDay, 'EEEE, MMM d')}</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenDay(focusedDay)}>
              Open Day
            </button>
          </div>
          <p className="muted" style={{ marginTop: 0, fontSize: '0.85rem' }}>
            {focusedJobs.length} job{focusedJobs.length === 1 ? '' : 's'} · double-click a day or use Open Day
          </p>
          {focusedJobs.length === 0 ? (
            <p className="empty">No jobs on this day.</p>
          ) : (
            <ul className="cal-day-list">
              {focusedJobs.map((j) => {
                const tech = techs.find((t) => t.id === j.technicianId);
                return (
                  <li key={j.id}>
                    <span className="cal-day-swatch" style={{ background: jobColor(j, techs) }} />
                    <div className="cal-day-copy">
                      <Link to={`/app/jobs/${j.id}`}>
                        <strong>{j.title}</strong>
                      </Link>
                      <div className="muted">
                        {timeRange(j.scheduledStart, j.scheduledEnd)} ·{' '}
                        {customers[j.customerId] ?? '—'}
                        {tech ? ` · ${tech.name}` : ' · Unassigned'}
                      </div>
                    </div>
                    <StatusBadge kind="job" status={j.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      )}
    </div>
  );
}

function YearView({
  year,
  jobs,
  onOpenMonth,
}: {
  year: Date;
  jobs: Job[];
  onOpenMonth: (month: Date) => void;
}) {
  const yearStart = startOfYear(year);
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i)),
    [yearStart],
  );

  return (
    <div className="cal-year">
      {months.map((month) => {
        const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
        const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
        const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
        const monthJobCount = jobs.filter(
          (j) =>
            j.status !== 'cancelled' &&
            isSameMonth(parseISO(j.scheduledStart), month),
        ).length;
        return (
          <button
            key={month.toISOString()}
            type="button"
            className="cal-year-month"
            onClick={() => onOpenMonth(month)}
          >
            <div className="cal-year-month-head">
              <strong>{format(month, 'MMMM')}</strong>
              <span className="muted">{monthJobCount}</span>
            </div>
            <div className="cal-year-dows">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
            </div>
            <div className="cal-year-grid">
              {days.map((d) => {
                const count = jobsOnDay(jobs, d).length;
                const inMonth = isSameMonth(d, month);
                return (
                  <span
                    key={d.toISOString()}
                    className={`cal-year-day${inMonth ? '' : ' out'}${isToday(d) ? ' today' : ''}${count ? ' has-jobs' : ''}`}
                    title={
                      inMonth && count
                        ? `${format(d, 'MMM d')}: ${count} job${count === 1 ? '' : 's'}`
                        : undefined
                    }
                  >
                    {format(d, 'd')}
                    {count > 0 && inMonth && <i className="cal-year-dot" />}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayView({
  day,
  dayOffset,
  setDayOffset,
}: {
  day: Date;
  dayOffset: number;
  setDayOffset: (n: number) => void;
}) {
  const { data, assignJob, setJobStatus } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfDay(new Date()), i - 1);
        return { offset: i - 1, label: format(d, 'EEE d'), date: d };
      }),
    [],
  );

  const dayJobs = jobsOnDay(data.jobs, day);
  const customerNames = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const activeJob = dayJobs.find((j) => j.id === activeId);
  const statuses: JobStatus[] = ['scheduled', 'en_route', 'in_progress', 'done'];

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

  return (
    <>
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
              <th>Cleaner</th>
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
    </>
  );
}

export function Schedule() {
  const { data } = useStore();
  const [view, setView] = useState<ViewMode>('day');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [dayOffset, setDayOffset] = useState(0);
  const [focusedDay, setFocusedDay] = useState<Date | null>(() => startOfDay(new Date()));

  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const dayDate = startOfDay(addDays(new Date(), dayOffset));
  const customerNames = Object.fromEntries(data.customers.map((c) => [c.id, c.name]));
  const activeJobs = data.jobs.filter((j) => j.status !== 'cancelled');

  const weekEnd = addDays(weekStart, 6);
  const rangeLabel =
    view === 'year'
      ? format(anchor, 'yyyy')
      : view === 'month'
        ? format(anchor, 'MMMM yyyy')
        : view === 'week'
          ? format(weekStart, 'MMMM') === format(weekEnd, 'MMMM')
            ? `${format(weekStart, 'MMMM d')}–${format(weekEnd, 'd, yyyy')}`
            : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
          : format(dayDate, 'EEE, MMM d');

  function shift(dir: -1 | 1) {
    if (view === 'year') setAnchor((a) => addYears(a, dir));
    else if (view === 'month') setAnchor((a) => addMonths(a, dir));
    else if (view === 'week') setAnchor((a) => addDays(a, dir * 7));
    else setDayOffset((o) => o + dir);
  }

  function goToday() {
    const today = startOfDay(new Date());
    setAnchor(today);
    setDayOffset(0);
    setFocusedDay(today);
  }

  function openDay(d: Date) {
    const today = startOfDay(new Date());
    setFocusedDay(d);
    setAnchor(startOfDay(d));
    setDayOffset(differenceInCalendarDays(startOfDay(d), today));
    setView('day');
  }

  function openMonth(month: Date) {
    setAnchor(startOfMonth(month));
    setFocusedDay(startOfMonth(month));
    setView('month');
  }

  const subtitle =
    view === 'day'
      ? 'Drag jobs onto technicians to dispatch'
      : view === 'week'
        ? 'Week calendar for cleaning crews'
        : view === 'month'
          ? 'Month overview — click a day, Open Day for the board'
          : 'Year overview — click a month to open Month view';

  return (
    <div className="page-enter stack">
      <div className="topbar">
        <div>
          <h1>Schedule</h1>
          <div className="sub">{subtitle}</div>
        </div>
      </div>

      <div className="view-tabs" role="tablist" aria-label="Schedule views">
        {(
          [
            ['day', 'Day'],
            ['week', 'Week'],
            ['month', 'Month'],
            ['year', 'Year'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={`view-tab${view === id ? ' active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {view !== 'day' && (
        <div className="cal-toolbar">
          <div className="cal-toolbar-left">
            <button type="button" className="btn btn-outline btn-sm" onClick={goToday}>
              Today
            </button>
            <div className="cal-arrow-group">
              <button
                type="button"
                className="cal-arrow"
                aria-label="Previous"
                onClick={() => shift(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="cal-arrow"
                aria-label="Next"
                onClick={() => shift(1)}
              >
                ›
              </button>
            </div>
            <span className="cal-range-label">{rangeLabel}</span>
          </div>
        </div>
      )}

      {view === 'day' && (
        <DayView day={dayDate} dayOffset={dayOffset} setDayOffset={setDayOffset} />
      )}
      {view === 'week' && (
        <WeekView
          weekStart={weekStart}
          jobs={activeJobs}
          techs={data.technicians}
          customers={customerNames}
        />
      )}
      {view === 'month' && (
        <MonthView
          month={anchor}
          jobs={activeJobs}
          techs={data.technicians}
          customers={customerNames}
          focusedDay={focusedDay}
          onSelectDay={(d) => {
            setFocusedDay(d);
            setAnchor(startOfDay(d));
          }}
          onOpenDay={openDay}
        />
      )}
      {view === 'year' && (
        <YearView year={anchor} jobs={activeJobs} onOpenMonth={openMonth} />
      )}
    </div>
  );
}
