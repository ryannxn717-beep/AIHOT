import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sql, closeDb } from "@aihot/backend/db";
import { runMigrations } from "./migrate.ts";
import { assertNeonTarget } from "./neon-target.ts";
import { seedReviewedMvpArticles } from "./reviewed-mvp-articles.ts";

assertNeonTarget(process.env.DATABASE_URL ?? "", process.env.AIHOT_NEON_HOST ?? "", process.env.AIHOT_NEON_PROJECT ?? "");
try {
  const [count] = await sql`SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public'`;
  if (Number(count?.count) !== 0) throw new Error("Initialization refused: this database already has public tables. Use the regular migration flow after inspecting its contents.");
  const migrated = await runMigrations(sql, fileURLToPath(new URL("../", import.meta.url)));
  console.log(`New Neon database: ${migrated} migrations applied.`);
  const seed = spawnSync(process.execPath, ["scripts/seed.ts"], { env: process.env, encoding: "utf8" });
  if (seed.status !== 0) throw new Error("Source initialization failed; inspect the isolated deployment database before retrying.");
  await seedReviewedMvpArticles();
  console.log("Independent Neon MVP initialized; collectors and models have not run.");
} finally { await closeDb(); }
