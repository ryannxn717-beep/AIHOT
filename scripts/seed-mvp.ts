// Local-only entry point; cloud initialization has its own project and empty-database guard.
import { closeDb } from "@aihot/backend/db";
import { seedReviewedMvpArticles } from "./reviewed-mvp-articles.ts";

const database = new URL(process.env.DATABASE_URL ?? "postgres://unset/unset");
if (process.env.NODE_ENV === "production" || !["127.0.0.1", "localhost", "[::1]"].includes(database.hostname) || !database.pathname.endsWith("_mvp")) {
  throw new Error(`MVP samples require a local *_mvp database (got host=${database.hostname}, database=${database.pathname})`);
}
try { await seedReviewedMvpArticles(); } finally { await closeDb(); }
