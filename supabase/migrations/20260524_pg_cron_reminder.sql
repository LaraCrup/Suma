SELECT
  cron.schedule(
    'daily-habit-reminder',
    '0 1 * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-habit-reminder',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
        body := '{}'::jsonb
      ) AS request_id;
    $$
  );


