import assert from "node:assert/strict";
import { createServer, get } from "node:http";
import { after, before, test } from "node:test";
import * as cheerio from "cheerio";
import { chromium, expect } from "@playwright/test";
import { startWebServer, type WebServer } from "./web-server.ts";

let web: WebServer;
let rankingsUnavailable = false;
const groups = [{ key: "company", name: "公司与模型", blurb: "厂商动态" }, { key: "field", name: "技术方向", blurb: "技术进展" }, { key: "genre", name: "内容形态", blurb: "内容类型" }];
const topics = groups.map((g, i) => ({ slug: `topic-${g.key}`, name: `主题${g.key}`, group: g.key, definition: "来源支持的主题", total: 1, recent: 1, indexable: true, latest: null, brand: null }));
const metrics = [{ key: "overall", label: "综合" }, { key: "coding", label: "编程" }];
const api = createServer((req, res) => {
  const url = new URL(req.url!, "http://local");
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/api/health") return res.end('{"ok":true}');
  if (url.pathname === "/api/site/meta") return res.end('{"changelogVersion":null}');
  if (url.pathname === "/api/site/timeline") return res.end(JSON.stringify({ filters: { channel: "all", category: null, tag: null }, cards: [], dayCounts: {}, nextCursor: null, hot: [] }));
  if (url.pathname === "/api/site/topics") return res.end(JSON.stringify({ groups, topics }));
  if (url.pathname === "/api/site/model-rankings" && !rankingsUnavailable) return res.end(JSON.stringify({ source: { name: "LiveBench", url: "https://livebench.ai/", release: "2026-06-25", observedAt: "2026-10-10T01:00:00Z" }, metrics, models: [
    { name: "Alpha model", organization: "First org", openWeights: false, scores: { overall: 80, coding: 70 } },
    { name: "Beta model", organization: "Second org", openWeights: true, scores: { overall: 70, coding: 90 } },
    { name: "Gamma model", organization: "Third org", openWeights: false, scores: { overall: 70, coding: 70 } },
  ] }));
  res.statusCode = 503; res.end('{"code":"unavailable"}');
});
before(async () => { web = await startWebServer(api); });
after(() => web.stop());

test("GA4 is installed once on the public domain and excluded from local development", async () => {
  const local = cheerio.load(await (await fetch(web.origin)).text());
  assert.equal(local("script[src*='googletagmanager.com/gtag/js']").length, 0);
  // Node fetch replaces Host, so use the HTTP client to exercise the actual production authority.
  const html = await new Promise<string>((resolve, reject) => {
    get(web.origin, { headers: { host: "aihot.lol" } }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => body += chunk);
      response.on("end", () => resolve(body));
      response.on("error", reject);
    }).on("error", reject);
  });
  const published = cheerio.load(html);
  assert.equal(published("head script[src='https://www.googletagmanager.com/gtag/js?id=G-MHMRHTRMJ3']").length, 1);
  assert.notEqual(published("head script[src*='googletagmanager.com/gtag/js']").attr("async"), undefined);
  assert.equal(published("head script").filter((_, script) => (published(script).html() ?? "").includes("gtag('config', \"G-MHMRHTRMJ3\")")).length, 1);
});

test("the five primary sections include grouped news and topics, with closed future entries", async () => {
  const $ = cheerio.load(await (await fetch(web.origin)).text());
  const nav = $("[data-site-masthead] nav[aria-label='主导航']");
  assert.deepEqual(nav.children().map((_, el) => $(el).attr("data-nav-label")).get(), ["AI 动态", "主题", "模型榜", "出海建站", "SEO 内容"]);
  assert.deepEqual(nav.find("details[data-nav-label='AI 动态'] a").map((_, el) => $(el).text().trim()).get(), ["精选动态", "全部资讯", "热点榜", "AI 日报"]);
  assert.deepEqual(nav.find("details[data-nav-label='主题'] a").map((_, el) => $(el).text().trim()).get(), ["公司与模型", "技术方向", "内容类型"]);
  for (const label of ["出海建站", "SEO 内容"]) {
    const entry = nav.find(`[data-nav-label='${label}']`);
    assert.equal(entry.attr("aria-disabled"), "true");
    assert.equal(entry.find("a").length, 0);
    assert.match(entry.text(), /暂未开放/);
  }
  for (const path of ["about", "changelog", "feedback", "starred", "agent"]) assert.equal($("[data-site-masthead]").find(`a[href='/${path}']`).length, 1);
});

test("each topic group query shows only its own group and retains scope navigation", async () => {
  for (const group of groups) {
    const $ = cheerio.load(await (await fetch(`${web.origin}/topics?group=${group.key}&scope=all`)).text());
    assert.equal($("main section[aria-labelledby^='topics-']").length, 1);
    assert.equal($(`main #topics-${group.key}`).text().trim(), group.name);
    for (const href of $("nav[aria-label='主题范围'] a").map((_, a) => $(a).attr("href")).get()) assert.equal(new URL(href!, web.origin).searchParams.get("group"), group.key);
  }
});

test("rankings expose source, snapshot date, actual scores, sorting and stable ranks through search", async () => {
  const response = await fetch(`${web.origin}/leaderboard?metric=coding&q=Beta`);
  assert.equal(response.status, 200);
  const $ = cheerio.load(await response.text());
  assert.match($("main").text(), /LiveBench/);
  assert.match($("main").text(), /2026-06-25/);
  assert.match($("main").text(), /2026-10-10/);
  assert.equal($("tbody tr[data-model]").length, 1);
  assert.equal($("tbody tr[data-model]").attr("data-model"), "Beta model");
  assert.equal($("tbody tr[data-model] [data-model-rank]").text().trim(), "1");
  assert.equal($("tbody tr[data-model] [data-model-score]").text().trim(), "90.0");
  const overall = cheerio.load(await (await fetch(`${web.origin}/leaderboard?q=Gamma`)).text());
  assert.equal(overall("tbody tr[data-model] [data-model-rank]").text().trim(), "2");
  assert.match(overall("main").text(), /同分并列/);
});

test("rankings API failure remains a real unavailable response", async () => {
  rankingsUnavailable = true;
  try { assert.equal((await fetch(`${web.origin}/leaderboard`)).status, 503); }
  finally { rankingsUnavailable = false; }
});

test("desktop and phone menus open, navigate and close with keyboard without page overflow", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await page.goto(web.origin);
      const news = page.locator("[data-site-masthead] details[data-nav-label='AI 动态']");
      await news.locator("summary").click();
      await expect(news.getByRole("link", { name: "热点榜", exact: true })).toBeVisible();
      await news.locator("summary").press("Escape");
      await expect(news).not.toHaveAttribute("open", "");
      await news.locator("summary").click();
      await news.getByRole("link", { name: "精选动态", exact: true }).click();
      await expect(news).not.toHaveAttribute("open", "", { timeout: 1500 });
      const topic = page.locator("[data-site-masthead] details[data-nav-label='主题']");
      await topic.locator("summary").click();
      await topic.getByRole("link", { name: "技术方向", exact: true }).click();
      await page.waitForURL(`${web.origin}/topics?group=field`);
      await expect(page.locator("#topics-field")).toBeVisible();
      await expect(topic).not.toHaveAttribute("open", "");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.close();
    }
  } finally { await browser.close(); }
});
