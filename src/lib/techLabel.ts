import type { Technician } from '../types';

/** Initials for avatars; empty name → empty string (no crash). */
export function techInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
}

/**
 * Display / a11y label for a technician. Stored `name` may be blank after the
 * clear-team-names migration; fall back to role then a stable id fragment.
 */
export function techLabel(t: Pick<Technician, 'id' | 'name' | 'role'>): string {
  const name = t.name.trim();
  if (name) return name;
  const role = t.role.trim();
  if (role) return role;
  return t.id;
}
