import { test } from "node:test";
import assert from "node:assert/strict";
import { finishPageResponse, publicRequestHeaders, isClosedAdminPath } from "../web-policy.ts";

test("encoded admin and single-fetch paths remain closed; malformed encoding is rejected", () => {
  for (const path of ["/admin/login", "/%61dmin/login", "/%41DMIN/login", "/%61dmin.data", "/api/%61dmin/sources", "/admin%2flogin"]) assert(isClosedAdminPath(path));
  assert(!isClosedAdminPath("/all"));
  assert.throws(() => isClosedAdminPath("/%zz"), URIError);
});

test("failed, private and cookie responses never enter public caches", () => {
  for (const [url, status, cookie] of [["/", 503, false], ["/admin", 200, false], ["/", 200, true]] as const) {
    const response = new Response("body", { status, headers: { "Cache-Control": "public, s-maxage=300", ...(cookie ? { "Set-Cookie": "session=secret" } : {}) } });
    const result = finishPageResponse(new Request(`https://aihot.lol${url}`), response);
    assert.equal(result.headers.get("Cache-Control"), "private, no-store");
  }
});

test("data navigation shares the upstream absolute cache deadline", () => {
  const response = new Response("body", { headers: { "Content-Type": "text/x-script", "Cache-Control": "public, s-maxage=60", "X-Accel-Expires": "@1050" } });
  const result = finishPageResponse(new Request("https://aihot.lol/all.data"), response, 1000);
  assert.equal(result.headers.get("Cache-Control"), "public, max-age=50, s-maxage=50, must-revalidate");
  assert.equal(result.headers.get("Content-Type"), "text/plain; charset=utf-8");
});

test("client cannot supply forwarded visitor identities", () => {
  const headers = publicRequestHeaders(new Request("https://aihot.lol/api/site/feedback", {headers:{"x-real-ip":"spoof","x-forwarded-for":"spoof","x-forwarded-host":"spoof","host":"spoof","cf-connecting-ip":"203.0.113.8"}}));
  assert.equal(headers.get("x-real-ip"), "203.0.113.8");
  assert.equal(headers.get("x-forwarded-for"), "203.0.113.8");
  assert.equal(headers.get("x-forwarded-host"), null);
  assert.equal(headers.get("host"), "aihot.lol");
});
