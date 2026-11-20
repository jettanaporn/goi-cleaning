import { APP_DATA_VERSION, type AppData } from '../types';

/**
 * One-time AppData migrations. Version 1: clear every technician display name
 * (records kept). Safe to run repeatedly; no-op when dataVersion is current.
 */
export function migrateAppData(data: AppData): { data: AppData; changed: boolean } {
  const version = data.dataVersion ?? 0;
  if (version >= APP_DATA_VERSION) {
    return { data, changed: false };
  }

  let next: AppData = data;

  if (version < 1) {
    next = {
      ...next,
      technicians: next.technicians.map((t) =>
        t.name === '' ? t : { ...t, name: '' },
      ),
    };
  }

  next = { ...next, dataVersion: APP_DATA_VERSION };
  return { data: next, changed: true };
}
