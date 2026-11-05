alter table public.fatigue_alerts
  add column if not exists is_sample boolean not null default false;

update public.fatigue_alerts
set is_sample = true,
    message = regexp_replace(message, '^(DEMO ALERT - SIMULATED:|Sample -)[[:space:]]*', '', 'i')
where message ~* '^(DEMO ALERT - SIMULATED:|Sample -)';