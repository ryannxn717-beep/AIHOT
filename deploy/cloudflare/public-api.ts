import Fastify from "fastify";
import { sql } from "@aihot/backend/db";
import { installModules } from "@aihot/backend/modules";
import { SERVER_MODULES } from "../../site/modules/server.ts";
import { registerSite } from "../../apps/api/src/routes/site.ts";
import { registerV1, registerV1Fallbacks } from "../../apps/api/src/routes/v1.ts";
import { registerAgent } from "../../apps/api/src/routes/agent.ts";
import { registerFeeds } from "../../apps/api/src/routes/feeds.ts";
import { registerStatic } from "../../apps/api/src/routes/static.ts";
import { registerMcp } from "../../apps/api/src/routes/mcp.ts";
import { logError } from "@aihot/backend/lib/log-error";

export function buildPublicApi() {
  installModules(SERVER_MODULES);
  const app = Fastify({ logger: { level: "error", redact: ["req.headers.authorization", "req.headers.cookie"], serializers: { err: logError, req: request => ({ method: request.method, path: request.url.split("?")[0] }) } }, disableRequestLogging: true, trustProxy: true, bodyLimit: 12 * 1024 * 1024 });
  app.get("/api/health", async (_request, reply) => {
    await sql`SELECT 1`;
    return reply.header("Cache-Control", "no-store").send({ ok: true, db: "ok", runtime: "cloudflare", release: process.env.AIHOT_RELEASE ?? "dev" });
  });
  registerSite(app);
  registerV1(app);
  registerAgent(app);
  registerFeeds(app);
  registerStatic(app);
  registerMcp(app);
  for (const module of SERVER_MODULES) module.http?.(app);
  registerV1Fallbacks(app);
  app.setErrorHandler((error, _request, reply) => {
    console.error(logError(error));
    return reply.code(503).header("Cache-Control", "no-store").header("Retry-After", "30").send({ error: "temporarily_unavailable" });
  });
  return app;
}
