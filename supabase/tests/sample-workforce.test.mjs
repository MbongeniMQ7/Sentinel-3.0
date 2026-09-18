import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

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
  } finally {
    await database.close()
  }
})