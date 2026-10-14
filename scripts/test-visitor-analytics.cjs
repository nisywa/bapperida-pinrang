const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');

const moduleResult = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/visitor-analytics.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module: moduleResult, exports: moduleResult.exports, Intl, Date, URLSearchParams });
const { localDate, parseVisitRange, visitBuckets } = moduleResult.exports;

assert.equal(localDate(new Date('2026-10-13T16:00:00Z')), '2026-10-14');
const range = parseVisitRange(new URLSearchParams({ start: '2024-02-29', end: '2024-02-29' }));
assert.equal(range.from.toISOString(), '2024-02-28T16:00:00.000Z');
assert.equal(range.until.toISOString(), '2024-02-29T16:00:00.000Z');
for (const query of [
  { start: '2026-02-29' }, { start: '2026-01-02', end: '2026-01-01' },
  { start: '2024-01-01', end: '2025-01-01' }, { granularity: 'week' },
]) assert.throws(() => parseVisitRange(new URLSearchParams(query)));
assert.equal(JSON.stringify(visitBuckets('2024-02-28', '2024-03-01', 'day')), JSON.stringify(['2024-02-28', '2024-02-29', '2024-03-01']));
assert.equal(JSON.stringify(visitBuckets('2025-12-31', '2026-02-02', 'month')), JSON.stringify(['2025-12', '2026-01', '2026-02']));
assert.equal(JSON.stringify(visitBuckets('2024-12-31', '2026-02-02', 'year')), JSON.stringify(['2024', '2025', '2026']));
console.log('PASS: WITA boundaries, leap days, invalid filters, and empty period buckets.');

async function integration() {
  require('@next/env').loadEnvConfig(process.cwd());
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const visitorA = randomUUID(), visitorB = randomUUID();
  const fixtures = [
    { id: randomUUID(), visitorId: visitorA, createdAt: new Date('2096-02-28T15:59:59Z') },
    { id: randomUUID(), visitorId: visitorA, createdAt: new Date('2096-02-28T16:00:00Z') },
    { id: randomUUID(), visitorId: visitorB, createdAt: new Date('2096-02-29T15:59:59Z') },
    { id: randomUUID(), visitorId: visitorA, createdAt: new Date('2096-02-29T16:00:00Z') },
  ].map(row => ({ ...row, pathname: '/analisis-pengunjung' }));
  const event = { id: randomUUID(), visitorId: visitorA, pathname: '/' };
  const ids = [...fixtures.map(row => row.id), event.id];
  const post = (payload, headers = {}) => fetch(`${base}/api/public/pengunjung`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload),
  });
  try {
    await db.websiteVisit.createMany({ data: fixtures });
    for (const granularity of ['day', 'month', 'year']) {
      const response = await fetch(`${base}/api/public/pengunjung?start=2096-02-28&end=2096-03-02&granularity=${granularity}`);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.visits, 4);
      assert.equal(data.visitors, 2, 'unique visitors must be distinct across the full range');
      if (granularity === 'day') assert.deepEqual(data.series.map(row => [row.visits, row.visitors]), [[1, 1], [2, 2], [1, 1], [0, 0]]);
      if (granularity === 'month') assert.deepEqual(data.series.map(row => row.visits), [3, 1]);
      if (granularity === 'year') assert.deepEqual(data.series.map(row => row.visits), [4]);
    }
    const responses = await Promise.all([post(event), post(event)]);
    assert.ok(responses.every(response => response.ok));
    assert.equal(await db.websiteVisit.count({ where: { id: event.id } }), 1, 'retry must not duplicate events');
    assert.equal((await post({ ...event, pathname: '/backoffice' })).status, 400);
    assert.equal((await post(event, { Origin: 'https://external.example' })).status, 403);
    assert.equal((await fetch(`${base}/api/public/pengunjung?start=2026-02-30`)).status, 400);
    const botEvent = { ...event, id: randomUUID() };
    assert.equal((await post(botEvent, { 'User-Agent': 'Googlebot' })).status, 204);
    assert.equal(await db.websiteVisit.count({ where: { id: botEvent.id } }), 0);
    console.log('PASS: live WITA aggregation, inclusive range, unique totals, zero counts, duplicate requests, path/origin validation and bot exclusion.');
  } finally {
    await db.websiteVisit.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
}
if (process.argv.includes('--integration')) integration().catch(error => { console.error(error); process.exitCode = 1; });
