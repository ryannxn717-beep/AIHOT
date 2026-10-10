import { test } from "node:test";
import assert from "node:assert/strict";
import type postgres from "postgres";
import { sql, withDatabase } from "../../../packages/backend/src/db.ts";
import { withApiFetch, fetchApi } from "../../../apps/web/app/lib/api-fetch.server.ts";
import { cached, withRequestCache } from "../../../packages/backend/src/lib/cache.ts";

test("overlapping requests keep their own SQL client and methods", async () => {
  const client = (label: string) => Object.assign(() => label, { json: () => label }) as unknown as postgres.Sql;
  const [a, b] = await Promise.all(["a", "b"].map(label => withDatabase(client(label), async () => {
    await new Promise(resolve => setTimeout(resolve, label === "a" ? 10 : 2));
    return [sql`select 1`, sql.json({})];
  })));
  assert.deepEqual(a, ["a", "a"]);
  assert.deepEqual(b, ["b", "b"]);
});

test("HTTP service bindings are isolated across overlapping SSR", async () => {
  const results = await Promise.all(["a", "b"].map(label => withApiFetch(async () => new Response(label), async () => {
    await new Promise(resolve => setTimeout(resolve, label === "a" ? 10 : 2));
    return (await fetchApi("https://api.internal/api/site/meta")).text();
  })));
  assert.deepEqual(results, ["a", "b"]);
});

test("request caches never share pending I/O or background refresh with another request", async () => {
  let reads = 0;
  const read = cached(async () => { const n = ++reads; await new Promise(resolve => setTimeout(resolve, 3)); return n; }, { freshMs: 1000, maxStaleMs: 2000 });
  const [a, b] = await Promise.all([1, 2].map(() => withRequestCache(() => Promise.all([read.get(), read.get()]))));
  assert.deepEqual(a, [1, 1]);
  assert.deepEqual(b, [2, 2]);
  assert.equal(await withRequestCache(() => read.get()), 3);
});
