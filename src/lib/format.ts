import { format, parseISO, isToday, isSameDay } from 'date-fns';
import type { JobStatus, InvoiceStatus, TechAvailability } from '../types';

export function money(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function when(iso: string, pattern = 'MMM d, h:mm a'): string {
  return format(parseISO(iso), pattern);
}

export function dayLabel(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  return format(d, 'EEE, MMM d');
}

export function timeRange(start: string, end: string): string {
  return `${format(parseISO(start), 'h:mm a')} – ${format(parseISO(end), 'h:mm a')}`;
}

export function sameDay(a: string, b: Date): boolean {
  return isSameDay(parseISO(a), b);
}

export const jobStatusLabel: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  en_route: 'En route',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

export const availabilityLabel: Record<TechAvailability, string> = {
  available: 'Available',
  on_job: 'On a job',
  off: 'Off duty',
};
