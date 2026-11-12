import { requireIdentity } from '../cursor/identity.ts';
import { hasDatabase, sql } from '../server/db.ts';
import { createEmptyWorkspace, isAppData } from '../server/workspaceData.ts';
import type { AppData } from '../src/types.ts';

type WorkspaceRow = { data: AppData };

function workspaceIdFor(identity: { stage?: string }): string {
  return identity.stage === 'preview' ? 'preview' : 'default';
}

const noStore = { 'cache-control': 'private, no-store' };

/**
 * Live workspace when DATABASE_URL is set (published Postgres).
 * Without it, clients fall back to local sample storage — no DB is touched.
 */
export async function GET(request: Request): Promise<Response> {
  if (!hasDatabase()) {
    return Response.json({ available: false, mode: 'sample' }, { headers: noStore });
  }

  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;

  const id = workspaceIdFor(identity);
  const rows = await sql<WorkspaceRow>('select data from workspaces where id = $1', [id]);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers: noStore });
  }

  const data = (body as { data?: unknown })?.data;
  if (!isAppData(data)) {
    return Response.json({ error: 'invalid_workspace' }, { status: 400, headers: noStore });
  }

  const id = workspaceIdFor(identity);
  const payload = JSON.stringify({
    customers: data.customers,
    technicians: data.technicians,
    services: data.services,
    jobs: data.jobs,
    invoices: data.invoices,
    seededAt: data.seededAt ?? new Date().toISOString(),
  });

  await sql(
    `insert into workspaces (id, data, updated_at, updated_by)
     values ($1, $2::jsonb, now(), $3)
     on conflict (id) do update set
       data = excluded.data,
       updated_at = now(),
       updated_by = excluded.updated_by`,
    [id, payload, identity.sub],
  );

  return Response.json({ ok: true, mode: 'live' }, { headers: noStore });
}
