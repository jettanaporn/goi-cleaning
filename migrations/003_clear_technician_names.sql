-- One-time: clear technician display names in workspace JSON payloads.
-- Does not delete technician rows/objects or other collections.
UPDATE workspaces
SET
  data =
    jsonb_set(
      data,
      '{technicians}',
      COALESCE(
        (
          SELECT jsonb_agg(
            CASE
              WHEN jsonb_typeof(tech) = 'object'
              THEN tech || '{"name": ""}'::jsonb
              ELSE tech
            END
          )
          FROM jsonb_array_elements(COALESCE(data->'technicians', '[]'::jsonb)) AS tech
        ),
        '[]'::jsonb
      )
    ) || jsonb_build_object('dataVersion', 1),
  updated_at = now()
WHERE COALESCE((data->>'dataVersion')::int, 0) < 1;
