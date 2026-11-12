import type { AppData } from '../types';

export type WorkspaceMode = 'live' | 'sample';

export type WorkspaceResponse =
  | { available: false; mode: 'sample' }
  | { available: true; mode: 'live'; data: AppData };

export async function fetchWorkspace(): Promise<WorkspaceResponse | null> {
  try {
    const res = await fetch('/api/workspace', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    return (await res.json()) as WorkspaceResponse;
  } catch {
    return null;
  }
}

export async function saveWorkspace(data: AppData): Promise<boolean> {
  try {
    const res = await fetch('/api/workspace', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
