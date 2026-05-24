-- Requiere las extensiones pg_cron y pg_net (disponibles en Supabase)
-- Ejecutar en el SQL Editor del Dashboard de Supabase

-- Cron job: llama a la Edge Function daily-habit-reminder a las 01:00 UTC (22:00 ARG)
-- Reemplazar <PROJECT_REF> con el ref del proyecto (ej: abcdefghijklmno)
-- Reemplazar <SERVICE_ROLE_KEY> con la service role key del proyecto

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

-- Para verificar que el cron fue registrado:
-- SELECT * FROM cron.job;

-- Para eliminarlo si fuera necesario:
-- SELECT cron.unschedule('daily-habit-reminder');
