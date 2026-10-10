import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import * as cheerio from "cheerio";
import { chromium, expect } from "@playwright/test";
import { startWebServer, type WebServer } from "./web-server.ts";

let web: WebServer;
let emptyReports = false;
let unavailableReports = false;
const api = createServer((req, res) => {
  const url = new URL(req.url!, "http://local");
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/api/health") return res.end('{"ok":true}');
  if (url.pathname === "/api/site/meta") return res.end('{"changelogVersion":null}');
  const filters = { channel: "all", category: url.searchParams.get("category"), tag: url.searchParams.get("tag") };
  if (url.pathname === "/api/site/timeline") return res.end(JSON.stringify({ filters, cards: [], dayCounts: {}, nextCursor: null, hot: [] }));
  if (url.pathname === "/api/site/pool") return res.end(JSON.stringify({ filters: { ...filters, q: null, tab: "time" }, items: [], page: 1, pageCount: 1, total: 0, todayCount: 0, freshness: "2026-10-10T00:00:00Z" }));
  const kind = url.pathname.match(/^\/api\/site\/reports\/(daily|weekly|monthly)$/)?.[1];
  if (kind && !unavailableReports) return res.end(JSON.stringify({ kind, items: emptyReports || kind === "monthly" ? [] : [{ key: kind === "daily" ? "2026-10-09" : "2026-W41", issueNumber: 1, title: `已发布${kind}`, count: 3 }] }));
  res.statusCode = 503;
  res.end('{"code":"unavailable"}');
});
before(async () => { web = await startWebServer(api); });
after(() => web.stop());

test("primary navigation groups reading paths and keeps personal actions reachable", async () => {
  const $ = cheerio.load(await (await fetch(web.origin)).text());
  assert.deepEqual($("[data-site-masthead] nav[aria-label='主导航'] a").map((_, a) => $(a).text().trim()).get(), ["资讯", "热点", "主题", "报告", "订阅"]);
  assert.equal($("[data-site-masthead] details a[href='/more']").length, 1);
  assert.equal($("[data-site-masthead] details a[href='/starred']").length, 1);
});

test("desktop feed scope preserves topic filters and clears pagination and search", async () => {
  const home = cheerio.load(await (await fetch(`${web.origin}/?category=paper&tag=安全&cursor=old`)).text());
  const scope = home("nav[aria-label='资讯范围']");
  assert.equal(scope.length, 1);
  const allHref = scope.find("a").last().attr("href")!;
  const target = new URL(allHref, web.origin);
  assert.equal(target.pathname, "/all");
  assert.equal(target.searchParams.get("category"), "paper");
  assert.equal(target.searchParams.get("tag"), "安全");
  assert.equal(target.searchParams.has("cursor"), false);
  const all = cheerio.load(await (await fetch(`${web.origin}/all?category=paper&tag=安全&page=3&q=old&tab=relevance`)).text());
  const back = new URL(all("nav[aria-label='资讯范围'] a").first().attr("href")!, web.origin);
  assert.equal(back.pathname, "/");
  assert.equal(back.searchParams.get("category"), "paper");
  for (const param of ["q", "tab", "page"]) assert.equal(back.searchParams.has(param), false);
  assert.equal(all("[data-site-masthead] nav a[aria-current='page']").text().trim(), "资讯");
});

test("report centre exposes published issues and each period without fabricating missing issues", async () => {
  const response = await fetch(`${web.origin}/reports`);
  assert.equal(response.status, 200);
  const $ = cheerio.load(await response.text());
  for (const kind of ["daily", "weekly", "monthly"]) assert.equal($(`main a[href='/${kind}']`).length, 1);
  assert.equal($("main a[href='/daily/2026-10-09']").length, 1);
  assert.equal($("main a[href='/weekly/2026-W41']").length, 1);
  assert.equal($("main a[href='/monthly/2026-10']").length, 0);
  assert.ok($("main").text().includes("月报尚未发布"));
  assert.equal($("[data-site-masthead] nav a[aria-current='page']").text().trim(), "报告");
});

test("an empty report centre links to reading and archives instead of promising automatic publication", async () => {
  emptyReports = true;
  try {
    const $ = cheerio.load(await (await fetch(`${web.origin}/reports`)).text());
    assert.equal($("main a[href='/daily/archive']").length, 1);
    assert.equal($("main a[href='/']").length, 1);
    assert.ok(!$("main").text().includes("每天 08:00"));
  } finally { emptyReports = false; }
});

test("report API failure is not presented as an empty published archive", async () => {
  unavailableReports = true;
  try { assert.equal((await fetch(`${web.origin}/reports`)).status, 503); }
  finally { unavailableReports = false; }
});

test("phone readers can return offline to the report centre they just opened", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${web.origin}/reports`);
    await expect(page.getByRole("heading", { name: "按你的时间，读一份报告" })).toBeVisible();
    await page.getByRole("navigation", { name: "底部导航" }).getByRole("link", { name: "我的", exact: true }).click();
    await page.waitForURL(`${web.origin}/more`);
    await expect(page.getByRole("link", { name: "收藏", exact: true })).toBeVisible();
    await context.setOffline(true);
    await page.goBack();
    await page.waitForURL(`${web.origin}/reports`);
    await expect(page.getByRole("heading", { name: "按你的时间，读一份报告" })).toBeVisible();
  } finally { await browser.close(); }
});
