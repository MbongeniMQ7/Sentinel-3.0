-- Tick the device simulator every minute so device data streams in near
-- real time. Replaces the previous 5-minute schedule.
do $$
begin
  perform cron.unschedule('device-simulator-tick');
exception when others then
  null;
end $$;

select cron.schedule(
  'device-simulator-tick',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://folwqawwrohkxhuksbgr.supabase.co/functions/v1/device-simulator',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
