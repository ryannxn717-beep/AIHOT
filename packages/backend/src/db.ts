import postgres from "postgres";
import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "./config.ts";

// int8 and numeric come back as numbers: ids and scores in this schema stay far below 2^53.
const numberType = (oid: number) => ({
  to: oid,
  from: [oid],
  serialize: (value: unknown) => String(value),
  parse: (value: string) => Number(value),
});

export function connectDatabase(url: string, max = Number(process.env.DATABASE_POOL_MAX || 10), requestScoped = false): postgres.Sql {
  return postgres(url, {
    max,
    // Keep connections through quiet minutes: a reconnect costs a SCRAM exchange on the next request.
    idle_timeout: requestScoped ? 0 : 600,
    connect_timeout: 10,
    onnotice: () => {},
    // Prepared statements keep PostgreSQL's plan cache: planning a detail read took longer than running
    // it. Searches plan every execution instead (withCustomPlans). JIT compilation costs more than
    // these short queries ever run.
    connection: { jit: "off" },
    types: {
      int8: numberType(20),
      numeric: numberType(1700),
    },
  });
}

const requestDatabase = new AsyncLocalStorage<postgres.Sql>();
let processDatabase: postgres.Sql | undefined;
const activeDatabase = () => requestDatabase.getStore() ?? (processDatabase ??= connectDatabase(config.databaseUrl));

/** Workers cannot reuse TCP connections from a different request; Node retains its process pool. */
export function withDatabase<T>(database: postgres.Sql, run: () => T): T {
  return requestDatabase.run(database, run);
}

export const sql = new Proxy((...args: unknown[]) => Reflect.apply(activeDatabase(), undefined, args), {
  get(_target, key) {
    const database = activeDatabase();
    const value = Reflect.get(database, key);
    return typeof value === "function" ? value.bind(database) : value;
  },
}) as unknown as postgres.Sql;

export type Sql = typeof sql;
export type Tx = postgres.TransactionSql;
export type Db = Sql | Tx;

/**
 * Runs queries with plans made for their actual values. A cached generic plan cannot tell a
 * two-character search term (no usable trigram) from a longer one and would scan the whole trigram
 * index, so every search goes through here.
 */
export function withCustomPlans<T>(fn: (db: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`SET LOCAL plan_cache_mode = force_custom_plan`;
    return fn(tx);
  }) as Promise<T>;
}

export async function closeDb(): Promise<void> {
  await sql.end({ timeout: 5 });
}

/** First row of a query that always returns one (aggregates). */
export function one<T>(rows: readonly T[]): T {
  const row = rows[0];
  if (row === undefined) throw new Error("expected one row");
  return row;
}
