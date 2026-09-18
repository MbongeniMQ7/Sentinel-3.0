import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { workforceSummary } from '../../lib/workforce.ts'

test('sample workforce is authorized, tenant-scoped, consistent and idempotent', async () => {
  const database = new PGlite()
  const ownerId = '10000000-0000-0000-0000-000000000001'
  const employeeId = '10000000-0000-0000-0000-000000000002'
  const managerId = '10000000-0000-0000-0000-000000000003'
  const firstOrg = '20000000-0000-0000-0000-000000000001'
  const secondOrg = '20000000-0000-0000-0000-000000000002'
  const migration = async (name) => readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8')
  const scalar = async (sql) => (await database.query(sql)).rows[0].value
  const signIn = async (userId) => database.query("select set_config('request.jwt.claim.sub', $1, false)", [userId])

  try {
    await database.exec(`
      create role authenticated;
      create role anon;
      create schema auth;
      create table auth.users (id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
    `)
    const schema = await migration('20260822000000_init_schema.sql')
    await database.exec(schema.split('-- organizations')[0].replace('create extension if not exists "pgcrypto";', ''))
    await database.exec(await migration('20260822010000_invites.sql'))
    await database.exec(await migration('20260918000000_sample_workforce.sql'))
    await database.exec(`
      insert into public.organizations (id, name) values ('${firstOrg}', 'First company'), ('${secondOrg}', 'Second company');
      insert into auth.users (id, email) values
        ('${ownerId}', 'owner@example.invalid'), ('${employeeId}', 'employee@example.invalid'), ('${managerId}', 'manager@example.invalid');
      insert into public.profiles (id, organization_id, email, role) values
        ('${ownerId}', '${firstOrg}', 'owner@example.invalid', 'owner'),
        ('${employeeId}', '${firstOrg}', 'employee@example.invalid', 'employee'),
        ('${managerId}', '${secondOrg}', 'manager@example.invalid', 'manager');
      insert into public.employees (organization_id, full_name) values ('${firstOrg}', 'Existing employee');
      grant usage on schema public to authenticated, anon;
      grant select, insert, update, delete on all tables in schema public to authenticated;
      set role authenticated;
    `)

    await assert.rejects(database.query('select public.load_sample_workforce()'), /active owner or manager/)
    await signIn(employeeId)
    await assert.rejects(database.query('select public.load_sample_workforce()'), /active owner or manager/)
    await signIn(ownerId)
    assert.equal((await scalar('select public.load_sample_workforce() as value')).created, true)
    assert.equal(await scalar('select count(*)::int as value from public.employees'), 9)
    assert.equal(await scalar('select count(*)::int as value from public.sites'), 2)
    assert.equal(await scalar('select count(*)::int as value from public.attendance_records'), 112)
    assert.equal(await scalar('select count(*)::int as value from public.shift_assignments'), 112)
    assert.equal(await scalar('select count(*)::int as value from public.biometric_readings'), 192)
    assert.equal(await scalar('select count(*)::int as value from public.fatigue_assessments'), 112)
    assert.equal(await scalar('select count(*)::int as value from public.fatigue_alerts'), 8)
    assert.equal(await scalar('select count(*)::int as value from public.earnings_records'), 8)
    assert.equal(await scalar("select count(*)::int as value from public.employees where full_name = 'Existing employee'"), 1)
    assert.equal(await scalar('select count(*)::int as value from public.employees where user_id is not null'), 0)
    assert.equal(await scalar(`select count(*)::int as value from public.attendance_records
      where clock_in_time > now() or clock_out_time > now() or clock_out_time < clock_in_time
        or hours_worked <> regular_hours + overtime_hours`), 0)
    assert.equal(await scalar(`select count(*)::int as value from public.earnings_records
      where total_earnings <> regular_earnings + overtime_earnings`), 0)
    assert.equal((await scalar('select public.load_sample_workforce() as value')).created, false)
    assert.equal(await scalar('select count(*)::int as value from public.employees'), 9)
    assert.equal(await scalar('select count(*)::int as value from public.audit_logs'), 1)

    await signIn(managerId)
    assert.equal(await scalar('select count(*)::int as value from public.employees'), 0)
    assert.equal((await scalar('select public.load_sample_workforce() as value')).created, true)
    assert.equal(await scalar('select count(*)::int as value from public.employees'), 8)
    await database.exec('reset role; set role anon;')
    await assert.rejects(database.query('select public.load_sample_workforce()'), /permission denied/)
    await database.exec('reset role;')
    const originalEmployees = await scalar('select count(*)::int as value from public.employees')
    const originalHours = await scalar('select sum(hours_worked)::float as value from public.attendance_records')
    const existingSamples = await migration('20260918010000_existing_employee_samples.sql')
    await database.exec(existingSamples)
    assert.equal(await scalar('select count(*)::int as value from public.employees'), originalEmployees)
    assert.equal(await scalar('select sum(hours_worked)::float as value from public.attendance_records where not is_sample'), originalHours)
    assert.equal(await scalar(`select count(*)::int as value from public.employees employee
      where not exists (select 1 from public.attendance_records attendance where attendance.employee_id = employee.id)`), 0)
    assert.equal(await scalar(`select count(*)::int as value from public.attendance_records where is_sample
      and (clock_out_time > now() or clock_in_time >= clock_out_time or hours_worked <> regular_hours + overtime_hours)`), 0)
    assert.equal(await scalar(`select count(*)::int as value from public.fatigue_assessments where is_sample and
      ((fatigue_score >= 75 and risk_level <> 'high') or (fatigue_score < 50 and risk_level <> 'low')
        or (fatigue_score >= 50 and fatigue_score < 75 and risk_level <> 'moderate'))`), 0)
    const countsBefore = await scalar(`select jsonb_build_array(
      (select count(*) from public.attendance_records), (select count(*) from public.pay_rates),
      (select count(*) from public.fatigue_assessments), (select count(*) from public.activity_logs)) as value`)
    await database.exec(existingSamples)
    assert.deepEqual(await scalar(`select jsonb_build_array(
      (select count(*) from public.attendance_records), (select count(*) from public.pay_rates),
      (select count(*) from public.fatigue_assessments), (select count(*) from public.activity_logs)) as value`), countsBefore)
    await signIn(managerId)
    await database.exec('set role authenticated;')
    assert.equal(await scalar(`select count(*)::int as value from public.workforce_daily_assessments where organization_id <> '${secondOrg}'`), 0)
  } finally {
    await database.close()
  }
})

test('shared reports reconcile across roles, dates, filters and effective pay rates', () => {
  const employees = [{ id: 'alice', full_name: 'Alice', site_id: 'north' }, { id: 'bob', full_name: 'Bob', site_id: 'south' }]
  const attendance = [
    { id: 'one', employee_id: 'alice', site_id: 'north', shift_id: 'day', date: '2026-09-16', hours_worked: 10, regular_hours: 8, overtime_hours: 2, status: 'late', is_sample: true },
    { id: 'two', employee_id: 'alice', site_id: 'north', shift_id: 'day', date: '2026-09-17', hours_worked: 8, regular_hours: 8, overtime_hours: 0, status: 'present', is_sample: true },
    { id: 'three', employee_id: 'bob', site_id: 'south', shift_id: 'night', date: '2026-09-17', hours_worked: 7.5, regular_hours: 7.5, overtime_hours: 0, status: 'present', is_sample: false },
  ]
  const rates = [
    { employee_id: 'alice', site_id: null, rate_per_hour: 100, overtime_multiplier: 1.5, effective_date: '2026-09-01', end_date: null, is_sample: false },
    { employee_id: 'alice', site_id: null, rate_per_hour: 120, overtime_multiplier: 1.5, effective_date: '2026-09-17', end_date: null, is_sample: false },
    { employee_id: null, site_id: 'south', rate_per_hour: 80, overtime_multiplier: 1.5, effective_date: '2026-09-01', end_date: null, is_sample: false },
    { employee_id: 'alice', site_id: null, rate_per_hour: 200, overtime_multiplier: 2, effective_date: '2026-09-01', end_date: null, is_sample: true },
  ]
  const assessments = [
    { employee_id: 'alice', assessed_at: '2026-09-17T16:00:00Z', risk_level: 'moderate', fatigue_score: 58, is_sample: true },
    { employee_id: 'alice', assessed_at: '2026-09-16T16:00:00Z', risk_level: 'high', fatigue_score: 78, is_sample: true },
    { employee_id: 'bob', assessed_at: '2026-09-17T16:00:00Z', risk_level: 'low', fatigue_score: 32, is_sample: false },
  ]
  const data = { employees, attendance, rates, assessments, sites: [{ id: 'north', name: 'North' }, { id: 'south', name: 'South' }], shifts: [], currency: 'ZAR' }
  const period = { start: '2026-09-16', end: '2026-09-18' }
  const total = workforceSummary(data, period)
  const personal = workforceSummary({ ...data, employees: employees.slice(0, 1), attendance: attendance.slice(0, 2), assessments: assessments.slice(0, 2) }, period)
  const filtered = workforceSummary(data, { ...period, employee: 'alice' })
  assert.deepEqual(personal.totals, filtered.totals)
  assert.equal(total.totals.hours, 25.5)
  assert.equal(total.totals.totalPay, 2660)
  assert.equal(total.totals.totalPay, total.workers.reduce((sum, worker) => sum + worker.totalPay, 0))
  assert.equal(total.totals.totalPay, total.daily.reduce((sum, day) => sum + day.pay, 0))
  assert.equal(total.sites.reduce((sum, site) => sum + site.hours, 0), total.totals.hours)
  assert.equal(total.latest.size, 2)
  assert.deepEqual(total.risk.map(risk => risk.value), [1, 1, 0])
  assert.equal(total.daily[0].late, 1)
  assert.equal(total.fatigueTrend[1].score, 45)
  assert.equal(total.fatigueTrend[2].score, null)
  assert.equal(workforceSummary(data, { ...period, site: 'south' }).totals.totalPay, 600)
  assert.equal(workforceSummary(data, { ...period, shift: 'night' }).totals.hours, 7.5)
  assert.equal(workforceSummary(data, { start: '2026-09-17', end: '2026-09-17' }).totals.totalPay, 1560)
  assert.equal(workforceSummary({ ...data, rates: [] }, period).totals.missingRates, 3)
})