import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { rankModels } from "@aihot/contracts/rankings";
import { parseModelRankings } from "@aihot/backend/publication/rankings";
import Fastify from "fastify";
import { rankingsServer } from "../server.ts";

const snapshot = () => JSON.parse(readFileSync(new URL("../../../site/rankings/livebench.json", import.meta.url), "utf8"));

test("the public snapshot has source provenance and all score dimensions", () => {
  const data = parseModelRankings(snapshot());
  assert.equal(data.source.name, "LiveBench");
  assert.equal(data.source.release, "2026-06-25");
  assert.ok(data.models.length > 30);
  assert.equal(data.metrics.length, 8);
  for (const row of data.models) for (const metric of data.metrics) assert.ok(row.scores[metric.key] >= 0 && row.scores[metric.key] <= 100);
});

test("invalid scores, missing dimensions and duplicate names reject the snapshot", () => {
  for (const change of [(d: any) => { d.models[0].scores.overall = 101; }, (d: any) => { delete d.models[0].scores.coding; }, (d: any) => { d.models[1].name = d.models[0].name; }]) {
    const invalid = snapshot(); change(invalid);
    assert.throws(() => parseModelRankings(invalid));
  }
});

test("descending ranks preserve ties and are computed before search", () => {
  const rows = [
    { name: "A", organization: "org", openWeights: false, scores: { overall: 70 } },
    { name: "B", organization: "org", openWeights: false, scores: { overall: 90 } },
    { name: "C", organization: "org", openWeights: true, scores: { overall: 70 } },
  ];
  assert.deepEqual(rankModels(rows, "overall").map(row => [row.name, row.rank]), [["B", 1], ["A", 2], ["C", 2]]);
  assert.deepEqual(rows.map(row => row.name), ["A", "B", "C"]);
});

test("the public HTTP route reads the same verified publication snapshot", async () => {
  const app = Fastify();
  try {
    rankingsServer.http!(app);
    const response = await app.inject({ method: "GET", url: "/api/site/model-rankings" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), parseModelRankings(snapshot()));
    assert.equal(response.headers["cache-control"], "public, max-age=300");
  } finally { await app.close(); }
});
