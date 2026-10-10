export function isClosedAdminPath(pathname: string): boolean {
  return /^\/admin(?:\/|\.|$)|^\/api\/admin(?:\/|$)/i.test(decodeURIComponent(pathname));
}

/** The edge, not visitor-supplied forwarding headers, decides the client identity. */
export function publicRequestHeaders(request: Request, apiAuthority = new URL(request.url).host): Headers {
  const headers = new Headers(request.headers);
  const ip = headers.get("cf-connecting-ip") ?? "";
  headers.set("x-real-ip", ip);
  headers.set("x-forwarded-for", ip);
  headers.delete("x-forwarded-host");
  headers.set("host", apiAuthority);
  headers.delete("x-aihot-ssr");
  return headers;
}

/** Match the Node web server's cache boundary for documents and single-fetch navigation. */
export function finishPageResponse(request: Request, response: Response, nowSeconds = Math.floor(Date.now() / 1000)): Response {
  const url = new URL(request.url);
  const headers = new Headers(response.headers);
  const publicRead = ["GET", "HEAD"].includes(request.method) && !isClosedAdminPath(url.pathname);
  const cacheControl = headers.get("Cache-Control") ?? "";
  if (url.pathname.endsWith(".data") && headers.get("Content-Type") === "text/x-script") headers.set("Content-Type", "text/plain; charset=utf-8");
  if (!publicRead || response.status !== 200 || headers.has("Set-Cookie") || !cacheControl || /private|no-store/i.test(cacheControl)) {
    headers.delete("Expires");
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Accel-Expires", "0");
  } else {
    const shared = Number(cacheControl.match(/(?:^|,)\s*s-maxage=(\d+)/i)?.[1] ?? 0);
    const expires = headers.get("X-Accel-Expires") ?? `@${nowSeconds + shared}`;
    const seconds = /(?:^|,)\s*no-cache(?:,|$)/i.test(cacheControl) || expires === "0" ? 0 : Math.max(0, Math.min(shared, Number(expires.slice(1)) - nowSeconds));
    headers.set("Cache-Control", seconds > 0 ? `public, max-age=${Math.min(seconds, 300)}, s-maxage=${seconds}, must-revalidate` : "no-cache");
    headers.set("Date", new Date(nowSeconds * 1000).toUTCString());
    headers.set("X-Accel-Expires", seconds > 0 ? expires : "0");
  }
  return new Response(request.method === "HEAD" ? null : response.body, { status: response.status, statusText: response.statusText, headers });
}
