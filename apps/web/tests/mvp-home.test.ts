// The MVP keeps the real timeline contract and the /all search route. Its first screen is an
// editorial reading surface, including when the selected pool is empty.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import * as cheerio from "cheerio";
import type { TimelineResponse } from "@aihot/contracts/site";
import { startWebServer, type WebServer } from "./web-server.ts";

let web: WebServer;
const fixture: TimelineResponse = {
  filters: { channel: "all", category: null, tag: null }, nextCursor: null, hot: [],
  dayCounts: { "2026-10-09": 1 },
  cards: [{ key: "article-a", anchorAt: "2026-10-09T08:00:00Z", group: null, item: {
    id: "article-a", title: "测试：一手 AI 发布", summary: "用于 SSR 回归测试的摘要。", reason: null,
    source: { name: "测试来源" }, publishedAt: "2026-10-09T17:45:00Z", timelineAt: "2026-10-09T17:45:00Z",
    category: "ai-models", tags: [], score: null, selected: true, channel: "news", x: null,
  } }],
};
const api = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/health") return res.end(JSON.stringify({ ok: true }));
  if (req.url === "/api/site/meta") return res.end(JSON.stringify({ changelogVersion: null }));
  if (req.url?.startsWith("/api/site/timeline")) {
    return res.end(JSON.stringify(req.url.includes("category=paper") ? { ...fixture, cards: [], dayCounts: {} } : fixture));
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ code: "not_found" }));
});
before(async () => { web = await startWebServer(api); });
after(() => web.stop());

test("home exposes an independent masthead, sourced lead and search route", async () => {
  const response = await fetch(web.origin);
  assert.equal(response.status, 200, web.logs());
  const $ = cheerio.load(await response.text());
  assert.equal($("[data-site-masthead] nav[aria-label='主导航']").length, 1);
  assert.equal($("[data-reading-lead] a[href='/items/article-a']").length, 1);
  assert.ok($("[data-reading-lead]").text().includes("测试来源"));
  assert.ok($("main").text().includes("重点阅读"));
  assert.ok(!$("[data-reading-lead]").text().includes("今日重点"));
  assert.equal($("[data-reading-lead] time").text(), "2026-10-10");
  assert.ok($("form[action='/all'] input[name='q']").length > 0);
});

test("an empty selection shows the category and an honest next reading action", async () => {
  const response = await fetch(`${web.origin}/?category=paper`);
  assert.equal(response.status, 200, web.logs());
  const $ = cheerio.load(await response.text());
  assert.equal($("[data-reading-lead]").length, 0);
  assert.ok($("main").text().includes("论文"));
  assert.ok($("main a[href='/all']").length > 0);
  assert.ok(!$("main").text().includes("测试：一手 AI 发布"));
});

test("the existing home search redirect preserves the query", async () => {
  const response = await fetch(`${web.origin}/?q=agent`, { redirect: "manual" });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/all?q=agent");
});
