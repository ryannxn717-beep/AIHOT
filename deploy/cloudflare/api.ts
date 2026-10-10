import { handleAsNodeRequest } from "cloudflare:node";
import { connectDatabase, withDatabase } from "@aihot/backend/db";
import { assertProductionSecrets } from "@aihot/backend/config";
import { withRequestCache } from "@aihot/backend/lib/cache";
import { feedbackSourceHash } from "@aihot/backend/operations/feedback";
import { logError } from "@aihot/backend/lib/log-error";
import { buildPublicApi } from "./public-api.ts";

interface Bindings { HYPERDRIVE: { connectionString: string } }
assertProductionSecrets([["auth", "SESSION_SECRET"], ["auth", "IMG_PROXY_SIGN_SECRET"]]);
const app = buildPublicApi();
let listening = false;

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    // Fastify's boot queue uses timers; workerd only runs them inside a request handler.
    await app.ready();
    if (!listening) { app.server.listen(8080); listening = true; }
    const database = connectDatabase(env.HYPERDRIVE.connectionString, 5, true);
    try {
      return await withDatabase(database, () => withRequestCache(async () => {
        const answer = async (): Promise<Response> => {
          // A transaction-scoped lock keeps the original feedback form's limit effective across isolates.
          if (request.method === "POST" && new URL(request.url).pathname === "/api/site/feedback") {
            const source = feedbackSourceHash(request.headers.get("x-real-ip") ?? "", request.headers.get("user-agent") ?? "");
            return database.begin(tx => withDatabase(tx as unknown as typeof database, async () => {
              await tx`SELECT pg_advisory_xact_lock(hashtextextended(${source}, 0))`;
              const [count] = await tx`SELECT count(*)::int AS count FROM feedback WHERE source_hash=${source} AND created_at > now() - interval '1 minute'`;
              if (Number(count?.count) >= 5) return Response.json({ error: "rate_limited", detail: "提交太频繁，请稍后再试。" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
              return handleAsNodeRequest(8080, request);
            })) as Promise<Response>;
          }
          return handleAsNodeRequest(8080, request);
        };
        const response = await answer();
        // Finish finite MCP/SSE work while its SQL/cache request contexts are still active.
        return response.body ? new Response(await response.arrayBuffer(), { status: response.status, statusText: response.statusText, headers: response.headers }) : response;
      }));
    } catch (error) {
      console.error(logError(error));
      return Response.json({ error: "temporarily_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } });
    } finally {
      await database.end({ timeout: 1 });
    }
  },
};
