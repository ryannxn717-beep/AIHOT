import { createRequestHandler, type ServerBuild } from "react-router";
// @ts-expect-error React Router emits this JavaScript bundle without a declaration file.
import * as build from "../../apps/web/build/server/index.js";
import { isApiOwned, resolveRedirect } from "@aihot/contracts/http-policy";
import type { withApiFetch } from "../../apps/web/app/lib/api-fetch.server.ts";
import { finishPageResponse, publicRequestHeaders, isClosedAdminPath } from "./web-policy.ts";

interface Bindings {
  API: { fetch(request: Request): Promise<Response> };
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const ssr = createRequestHandler(build as unknown as ServerBuild, "production");
// Use the context bundled with the route loaders, rather than creating a second ALS instance.
const withBoundApiFetch = (build.entry.module as unknown as { withApiFetch: typeof withApiFetch }).withApiFetch;

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    const url = new URL(request.url);
    const decision = resolveRedirect(url.pathname, url.search);
    if (decision) return new Response(null, { status: decision.status, headers: { ...decision.headers, ...(decision.location ? { Location: decision.location } : {}) } });
    // The original Node administration server is not exposed by this reading-only deployment.
    try {
      if (isClosedAdminPath(url.pathname)) return new Response("管理后台暂未开放", { status: 404, headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
      if (error instanceof URIError) return new Response("Bad request", { status: 400, headers: { "Cache-Control": "private, no-store" } });
      throw error;
    }
    if (url.pathname.startsWith("/og/") || (!isApiOwned(url.pathname) && url.pathname.includes(".") && !url.pathname.endsWith(".data"))) return env.ASSETS.fetch(request);
    // The private API receives this deployment's canonical authority, including in signed previews.
    if (isApiOwned(url.pathname)) return env.API.fetch(new Request(request, { headers: publicRequestHeaders(request, new URL(process.env.SITE_URL!).host) }));
    if (["GET", "HEAD"].includes(request.method) && url.pathname.endsWith(".data")) url.searchParams.delete("_routes");
    const page = new Request(url, request);
    try {
      return await withBoundApiFetch((input, init) => env.API.fetch(new Request(input, init)), async () => finishPageResponse(page, await ssr(page)));
    } catch {
      return new Response("暂时无法加载，请稍后重试。", { status: 503, headers: { "Cache-Control": "private, no-store", "Retry-After": "30" } });
    }
  },
};
