alter table public.attendance_records add column if not exists is_sample boolean not null default false;
alter table public.pay_rates add column if not exists is_sample boolean not null default false;
alter table public.fatigue_assessments add column if not exists is_sample boolean not null default false;

create or replace view public.workforce_daily_assessments with (security_invoker = true) as
select distinct on (employee_id, (assessed_at at time zone 'UTC')::date)
  organization_id, employee_id, assessed_at, risk_level, fatigue_score, is_sample
from public.fatigue_assessments
order by employee_id, (assessed_at at time zone 'UTC')::date, assessed_at desc, id desc;
grant select on public.workforce_daily_assessments to authenticated;

do $$
declare
  person record;
  day_offset integer;
  sample_date date;
  sample_start timestamptz;
  worked numeric;
  late integer;
  score integer;
  person_seed integer;
  attendance_id uuid;
  sample_site uuid;
  sample_shift uuid;
  sample_today date := (now() at time zone 'UTC')::date;
begin
  for person in select * from public.employees where status = 'active' loop
    person_seed := abs(hashtextextended(person.id::text, 0) % 1000)::integer;
    sample_site := person.site_id;
    if sample_site is null then
      select id into sample_site from public.sites where organization_id = person.organization_id order by created_at limit 1;
    end if;
    select id into sample_shift from public.shifts
      where organization_id = person.organization_id and site_id = sample_site order by start_time limit 1;

    if not exists (
      select 1 from public.pay_rates where organization_id = person.organization_id
        and (employee_id = person.id or (employee_id is null and (site_id is null or site_id = sample_site)))
        and effective_date <= sample_today - 1 and (end_date is null or end_date >= sample_today - 14)
    ) then
      insert into public.pay_rates (organization_id, employee_id, rate_per_hour, overtime_multiplier, effective_date, end_date, is_sample)
      values (person.organization_id, person.id, 90 + (person_seed % 9) * 10, 1.5, sample_today - 14, sample_today - 1, true);
    end if;

    for day_offset in 1..14 loop
      sample_date := sample_today - day_offset;
      if extract(isodow from sample_date) = 7 then continue; end if;
      late := case when (person_seed + day_offset) % 9 = 0 then 10 + person_seed % 11 else 0 end;
      worked := case when extract(isodow from sample_date) = 6 then 4 + (person_seed % 3) * 0.5
        else 7.5 + ((person_seed + day_offset) % 5) * 0.5 end;
      sample_start := (sample_date + time '06:00') at time zone 'UTC' + late * interval '1 minute';
      attendance_id := null;
      insert into public.attendance_records (organization_id, employee_id, site_id, shift_id, date,
        clock_in_time, clock_out_time, status, hours_worked, regular_hours, overtime_hours, late_minutes, is_sample)
      values (person.organization_id, person.id, sample_site, sample_shift, sample_date, sample_start,
        sample_start + worked * interval '1 hour',
        case when late > 0 then 'late'::public.attendance_status else 'present'::public.attendance_status end,
        worked, least(worked, 8), greatest(worked - 8, 0), late, true)
      on conflict (employee_id, date) do nothing returning id into attendance_id;

      if attendance_id is not null then
        insert into public.activity_logs (organization_id, employee_id, site_id, event_type, event_time, metadata)
        values
          (person.organization_id, person.id, sample_site, 'clock_in', sample_start, '{"sample":true,"source":"existing_employee_samples"}'),
          (person.organization_id, person.id, sample_site, 'clock_out', sample_start + worked * interval '1 hour', '{"sample":true,"source":"existing_employee_samples"}');
      end if;

      score := 24 + (person_seed % 19) + ((day_offset + person_seed) % 5) * 6 + greatest(worked - 8, 0)::integer * 8;
      if not exists (select 1 from public.fatigue_assessments where employee_id = person.id
        and assessed_at >= sample_date::timestamp at time zone 'UTC'
        and assessed_at < (sample_date + 1)::timestamp at time zone 'UTC') then
        insert into public.fatigue_assessments (organization_id, employee_id, site_id, assessed_at,
          risk_level, fatigue_score, heart_rate_avg, hrv_avg, temperature_avg, movement_pattern, factors, is_sample)
        values (person.organization_id, person.id, sample_site, sample_start + worked * interval '1 hour',
          case when score >= 75 then 'high'::public.risk_level when score >= 50 then 'moderate'::public.risk_level else 'low'::public.risk_level end,
          score, 65 + score / 3, 78 - score / 2, 36.3 + (person_seed % 6) * 0.1,
          'Sample shift activity', '["Synthetic demonstration data; not a medical assessment"]', true);
      end if;
    end loop;
  end loop;
end;
$$;