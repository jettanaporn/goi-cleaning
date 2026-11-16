-- Scope live workspace rows to a signed-in person (identity.sub).
-- Additive only: nullable column + index; the API always writes owner_sub
-- and selects with owner_sub = identity.sub.
alter table workspaces add column if not exists owner_sub text;

create index if not exists workspaces_owner_sub_idx on workspaces (owner_sub);
