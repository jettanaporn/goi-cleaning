import { requireIdentity, type VerifiedIdentity } from '../cursor/identity.ts';
import { hasDatabase, sql } from '../server/db.ts';
import { createEmptyWorkspace, isAppData } from '../server/workspaceData.ts';
import type { AppData } from '../src/types.ts';

type WorkspaceRow = { data: AppData; owner_sub: string };

const noStore = { 'cache-control': 'private, no-store' };
/** Hard cap so a caller cannot store unbounded jsonb payloads. */
const MAX_PAYLOAD_BYTES = 256_000;
const MAX_COLLECTION = 500;

function forbidden(reason: string): Response {
  return Response.json({ error: 'forbidden', reason }, { status: 403, headers: noStore });
}

/**
 * Only signed-in people may use the live workspace API.
 * API keys are rejected so a public-app key cannot read or overwrite PII.
 */
function requirePerson(identity: VerifiedIdentity): Response | null {
  if (identity.kind !== 'person') {
    return forbidden('person_required');
  }
  if (identity.appVisibility === 'public') {
    return forbidden('public_visibility');
  }
  return null;
}

/** Stable per-person row id; preview hosts never touch production rows. */
function workspaceIdFor(identity: VerifiedIdentity): string {
  const stage = identity.stage === 'preview' ? 'preview' : 'prod';
  return `${stage}:${identity.sub}`;
}

function withinLimits(data: AppData): boolean {
  return (
    data.customers.length <= MAX_COLLECTION &&
    data.technicians.length <= MAX_COLLECTION &&
    data.jobs.length <= MAX_COLLECTION &&
    data.invoices.length <= MAX_COLLECTION
  );
}

/**
 * Live workspace when DATABASE_URL is set (published Postgres).
 * Rows are owner-scoped to identity.sub. Without a database, clients fall
 * back to local sample storage — no DB is touched.
 */
export async function GET(request: Request): Promise<Response> {
  if (!hasDatabase()) {
    return Response.json({ available: false, mode: 'sample' }, { headers: noStore });
  }

  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const denied = requirePerson(identity);
  if (denied) return denied;

  const id = workspaceIdFor(identity);
  const rows = await sql<WorkspaceRow>(
    'select data, owner_sub from workspaces where id = $1 and owner_sub = $2',
    [id, identity.sub],
  );
  const data = rows[0]?.data ?? createEmptyWorkspace();

  return Response.json(
    { available: true, mode: 'live', data },
    { headers: noStore },
  );
}

export async function PUT(request: Request): Promise<Response> {
  if (!hasDatabase()) {
    return Response.json(
      { available: false, mode: 'sample', error: 'database_unset' },
      { status: 503, headers: noStore },
    );
  }

  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const denied = requirePerson(identity);
  if (denied) return denied;

  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: 'payload_too_large' }, { status: 413, headers: noStore });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers: noStore });
  }

  const data = (body as { data?: unknown })?.data;
  if (!isAppData(data)) {
    return Response.json({ error: 'invalid_workspace' }, { status: 400, headers: noStore });
  }
  if (!withinLimits(data)) {
    return Response.json({ error: 'collection_too_large' }, { status: 413, headers: noStore });
  }

  const id = workspaceIdFor(identity);
  const payload = JSON.stringify({
    customers: data.customers,
    technicians: data.technicians,
    jobs: data.jobs,
    invoices: data.invoices,
    seededAt: data.seededAt ?? new Date().toISOString(),
  });
  if (payload.length > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: 'payload_too_large' }, { status: 413, headers: noStore });
  }

  await sql(
    `insert into workspaces (id, owner_sub, data, updated_at, updated_by)
     values ($1, $2, $3::jsonb, now(), $2)
     on conflict (id) do update set
       data = excluded.data,
       updated_at = now(),
       updated_by = excluded.updated_by
     where workspaces.owner_sub = excluded.owner_sub`,
    [id, identity.sub, payload],
  );

  return Response.json({ ok: true, mode: 'live' }, { headers: noStore });
}
