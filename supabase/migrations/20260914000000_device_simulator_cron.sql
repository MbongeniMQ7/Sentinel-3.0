-- Schedules the device-simulator edge function to tick every 5 minutes so the
-- app receives a continuous stream of wristband data while real hardware is
-- not yet deployed. Idempotent: re-running replaces the existing schedule.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('device-simulator-tick');
exception when others then
  null; -- job did not exist yet
end $$;

select cron.schedule(
  'device-simulator-tick',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://folwqawwrohkxhuksbgr.supabase.co/functions/v1/device-simulator',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
