import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import * as cheerio from "cheerio";
import { startWebServer, type WebServer } from "./web-server.ts";

let web: WebServer;
let statsAvailable = true;
let emptyTopics = false;
const topics = [
  { slug: "coding", name: "AI 编码", group: "field", definition: "开发实践", brand: null, total: 3, recent: 3, indexable: true, latest: { title: "已核验的代码审查资料", at: "2026-10-07T10:00:00Z" } },
  { slug: "voice", name: "语音与音频", group: "field", definition: "语音模型", brand: null, total: 0, recent: 0, indexable: false, latest: null },
];
const api = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/health") return res.end('{"ok":true}');
  if (req.url === "/api/site/meta") return res.end('{"changelogVersion":null}');
  if (req.url === "/api/site/topics") return res.end(JSON.stringify({ groups: [{ key: "field", name: "技术方向", blurb: "按方向阅读" }], topics: emptyTopics ? topics.map(topic => ({ ...topic, total: 0, recent: 0, indexable: false, latest: null })) : topics }));
  if (req.url === "/api/site/stats" && statsAvailable) return res.end(JSON.stringify({
    sources: 18, sourceKinds: { rss: 18 }, items: 5, selected: 5, dailies: 0, day: { collected: 0, selected: 0 },
    sampleSources: [{ name: "Hugging Face Blog", kind: "rss", heatOnly: false }], latest: [],
  }));
  if (req.url === "/api/site/contact") return res.end("{}");
  res.statusCode = 503;
  res.end('{"code":"unavailable"}');
});
before(async () => { web = await startWebServer(api); });
after(() => web.stop());

test("topic discovery starts with readable content and can reveal all configured topics", async () => {
  const $ = cheerio.load(await (await fetch(`${web.origin}/topics`)).text());
  assert.equal($("main a[href='/topics/coding']").length, 1);
  assert.equal($("main a[href='/topics/voice']").length, 0);
  assert.equal($("main a[href='/topics?scope=all']").length, 1);
  const all = cheerio.load(await (await fetch(`${web.origin}/topics?scope=all`)).text());
  assert.equal(all("main a[href='/topics/voice']").length, 1);
  assert.ok(all("main").text().includes("近 30 天暂无新精选"));
  assert.match(all("meta[name='robots']").attr("content") ?? "", /noindex/);
  assert.ok(all("link[rel='canonical']").attr("href")?.endsWith("/topics"));
});

test("an entirely empty topic catalogue provides a real reading route", async () => {
  emptyTopics = true;
  try {
    const $ = cheerio.load(await (await fetch(`${web.origin}/topics`)).text());
    assert.equal($("main a[href='/topics/voice']").length, 0);
    assert.ok($("main").text().includes("主题内容正在整理"));
    assert.equal($("main a[href='/all']").length, 1);
  } finally { emptyTopics = false; }
});

test("source disclosure identifies configured samples without promising a running collector", async () => {
  const $ = cheerio.load(await (await fetch(`${web.origin}/about`)).text());
  assert.equal($("section[aria-label='公开来源样本']").length, 1);
  assert.ok($("section[aria-label='公开来源样本']").text().includes("Hugging Face Blog"));
  assert.ok($("section[aria-label='公开来源样本']").text().includes("来源样本"));
  assert.equal($("input[aria-label='查找来源']").length, 1);
  assert.ok(!$("main header").text().includes("替你盯着"));
  assert.ok(!$("main").text().includes("订阅源都在看"));
  assert.ok(!$("main").text().includes("汇入每天的"));
});

test("unavailable source statistics remain unavailable instead of becoming a zero claim", async () => {
  statsAvailable = false;
  try {
    const $ = cheerio.load(await (await fetch(`${web.origin}/about`)).text());
    assert.ok($("section[aria-label='公开来源样本']").text().includes("暂时无法读取"));
    assert.ok(!$("section[aria-label='公开来源样本']").text().includes("0 个来源"));
    assert.ok(!$("main").text().includes("已配置十几"));
  } finally { statsAvailable = true; }
});
