SELECT
  cron.schedule(
    'community-habit-reminder',
    '0 2 * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/community-habit-reminder',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
      ) AS request_id;
    $$
  );

SELECT
  cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'daily-habit-reminder'),
    command := $$
    SELECT
      net.http_post(
        url := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-habit-reminder',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
      ) AS request_id;
    $$
  );
