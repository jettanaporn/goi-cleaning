import type { AppData } from '../src/types.ts';

export function createEmptyWorkspace(): AppData {
  return {
    customers: [],
    technicians: [],
    jobs: [],
    invoices: [],
    seededAt: new Date().toISOString(),
  };
}

export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.customers) &&
    Array.isArray(v.technicians) &&
    Array.isArray(v.jobs) &&
    Array.isArray(v.invoices)
  );
}
