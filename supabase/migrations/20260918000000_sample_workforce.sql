create or replace function public.load_sample_workforce()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  org_id uuid;
  actor_id uuid := auth.uid();
  site_ids uuid[] := '{}';
  shift_ids uuid[] := '{}';
  employee_id_value uuid;
  device_id_value uuid;
  new_site_id uuid;
  new_shift_id uuid;
  site_index integer;
  person_index integer;
  day_offset integer;
  reading_index integer;
  sample_date date;
  sample_start timestamptz;
  sample_end timestamptz;
  sample_hours numeric;
  sample_risk public.risk_level;
  sample_today date := (now() at time zone 'UTC')::date;
  names text[] := array['Thabo Molefe', 'Lerato Dlamini', 'Sipho Nkosi', 'Ayesha Khan', 'Daniel Jacobs', 'Nomsa Ndlovu', 'James Williams', 'Zanele Mokoena'];
  titles text[] := array['Site Supervisor', 'Safety Officer', 'Plant Operator', 'Warehouse Coordinator', 'Maintenance Technician', 'Dispatch Operator', 'Forklift Operator', 'Team Lead'];
begin
  select organization_id into org_id
  from public.profiles
  where id = actor_id and role in ('owner', 'manager') and status = 'active';

  if org_id is null then
    raise exception 'An active owner or manager account with an organization is required.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(org_id::text || ':sample_workforce', 0));
  if exists (
    select 1 from public.company_settings
    where organization_id = org_id and setting_key = 'sample_workforce_v1'
  ) then
    return jsonb_build_object('created', false);
  end if;

  for site_index in 1..2 loop
    insert into public.sites (organization_id, name, location, timezone)
    values (org_id, case site_index when 1 then 'Sample - Johannesburg Plant' else 'Sample - Durban Depot' end,
      case site_index when 1 then 'Johannesburg' else 'Durban' end, 'Africa/Johannesburg')
    returning id into new_site_id;
    site_ids := array_append(site_ids, new_site_id);

    insert into public.shifts (organization_id, site_id, name, start_time, end_time, break_duration)
    values (org_id, new_site_id, 'Sample - Day Shift', '08:00', '17:00', 60)
    returning id into new_shift_id;
    shift_ids := array_append(shift_ids, new_shift_id);
  end loop;

  for person_index in 1..8 loop
    site_index := case when person_index <= 4 then 1 else 2 end;
    sample_risk := case when person_index = 3 then 'high'::public.risk_level
      when person_index in (2, 6) then 'moderate'::public.risk_level else 'low'::public.risk_level end;

    insert into public.employees (organization_id, site_id, full_name, email, invited_role, role_title)
    values (org_id, site_ids[site_index], 'Sample - ' || names[person_index],
      'sample-' || person_index || '-' || org_id || '@example.invalid',
      case when person_index = 1 then 'manager'::public.user_role else 'employee'::public.user_role end,
      titles[person_index])
    returning id into employee_id_value;

    insert into public.devices (organization_id, site_id, employee_id, device_id, connection_status, battery_level, last_sync_time)
    values (org_id, site_ids[site_index], employee_id_value, 'SAMPLE-' || org_id || '-' || person_index,
      case when person_index = 8 then 'disconnected'::public.device_connection else 'connected'::public.device_connection end,
      100 - person_index * 9, now() - person_index * interval '1 minute')
    returning id into device_id_value;

    insert into public.pay_rates (organization_id, employee_id, rate_per_hour, effective_date)
    values (org_id, employee_id_value, 85 + person_index * 5, sample_today - 13);

    for day_offset in 0..13 loop
      sample_date := sample_today - day_offset;
      sample_hours := 7 + ((person_index + day_offset) % 5) * 0.5;
      sample_start := (sample_date + time '06:00') at time zone 'UTC';
      if day_offset = 0 then
        sample_hours := least(sample_hours, extract(epoch from (now() - (sample_today::timestamp at time zone 'UTC'))) / 3600 * 0.75);
        sample_start := now() - sample_hours * interval '1 hour';
      end if;
      sample_end := sample_start + sample_hours * interval '1 hour';

      insert into public.shift_assignments (organization_id, shift_id, employee_id, assigned_date)
      values (org_id, shift_ids[site_index], employee_id_value, sample_date);

      insert into public.attendance_records (organization_id, employee_id, site_id, shift_id, date,
        clock_in_time, clock_out_time, status, hours_worked, regular_hours, overtime_hours, late_minutes)
      values (org_id, employee_id_value, site_ids[site_index], shift_ids[site_index], sample_date,
        sample_start, case when day_offset = 0 and person_index <= 4 then null else sample_end end,
        case when (person_index + day_offset) % 5 = 0 then 'late'::public.attendance_status else 'present'::public.attendance_status end,
        round(sample_hours, 2), round(least(sample_hours, 8), 2), round(greatest(sample_hours - 8, 0), 2),
        case when (person_index + day_offset) % 5 = 0 then 12 else 0 end);

      insert into public.activity_logs (organization_id, employee_id, site_id, event_type, event_time, metadata)
      values (org_id, employee_id_value, site_ids[site_index], 'clock_in', sample_start, '{"sample":true}');

      insert into public.fatigue_assessments (organization_id, employee_id, site_id, assessed_at, risk_level,
        fatigue_score, heart_rate_avg, hrv_avg, temperature_avg, movement_pattern, factors)
      values (org_id, employee_id_value, site_ids[site_index], now() - day_offset * interval '1 day', sample_risk,
        case sample_risk when 'high' then 82 when 'moderate' then 56 else 22 end,
        68 + person_index * 3, 65 - person_index * 4, 36.2 + person_index * 0.1,
        'Sample reading', '["Synthetic demonstration data"]');
    end loop;

    for reading_index in 0..23 loop
      insert into public.biometric_readings (organization_id, employee_id, device_id, site_id,
        reading_time, heart_rate, hrv, skin_temperature, movement, activity_score)
      values (org_id, employee_id_value, device_id_value, site_ids[site_index],
        now() - reading_index * interval '5 minutes', 68 + person_index * 3 + reading_index % 7,
        65 - person_index * 4 + reading_index % 5, 36.2 + (reading_index % 5) * 0.1, 'moderate', 50 + reading_index % 30);
    end loop;

    insert into public.fatigue_alerts (organization_id, employee_id, site_id, risk_level, message, severity, acknowledged)
    values (org_id, employee_id_value, site_ids[site_index], sample_risk,
      case sample_risk when 'high' then 'Sample - Elevated fatigue detected; supervisor review recommended.'
        when 'moderate' then 'Sample - Fatigue increasing; a rest break is recommended.'
        else 'Sample - Routine wellbeing check completed.' end,
      case sample_risk when 'high' then 'critical'::public.alert_severity when 'moderate' then 'warning'::public.alert_severity else 'info'::public.alert_severity end,
      sample_risk = 'low');

    insert into public.earnings_records (organization_id, employee_id, period_start, period_end,
      regular_hours, overtime_hours, regular_earnings, overtime_earnings, total_earnings, currency)
    select org_id, employee_id_value, sample_today - 13, sample_today,
      sum(regular_hours), sum(overtime_hours), sum(regular_hours) * (85 + person_index * 5),
      sum(overtime_hours) * (85 + person_index * 5) * 1.5,
      (sum(regular_hours) + sum(overtime_hours) * 1.5) * (85 + person_index * 5),
      (select coalesce(currency, 'ZAR') from public.organizations where id = org_id)
    from public.attendance_records where employee_id = employee_id_value;
  end loop;

  insert into public.company_settings (organization_id, setting_key, setting_value)
  values (org_id, 'sample_workforce_v1', jsonb_build_object('loaded_at', now(), 'loaded_by', actor_id));

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_name)
  values (org_id, actor_id, 'Loaded sample workforce data', 'organization', 'Sample workforce: 8 employees, 2 sites, 14 days');

  return jsonb_build_object('created', true, 'employees', 8, 'sites', 2, 'days', 14);
end;
$$;

revoke all on function public.load_sample_workforce() from public, anon;
grant execute on function public.load_sample_workforce() to authenticated;