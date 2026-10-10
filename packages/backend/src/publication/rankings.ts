// One public read face for the site's manually verified benchmark snapshot; no live provider calls.
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { ModelRankings } from "@aihot/contracts/rankings";
import { REPO_ROOT } from "../config.ts";

const metricKeys = ["overall", "reasoning", "coding", "agenticCoding", "mathematics", "dataAnalysis", "language", "instructionFollowing"] as const;
const snapshot = z.object({
  source: z.object({ name: z.literal("LiveBench"), url: z.url().refine(value => new URL(value).protocol === "https:"), release: z.iso.date(), observedAt: z.iso.datetime() }),
  metrics: z.array(z.object({ key: z.enum(metricKeys), label: z.string().min(1) })).length(metricKeys.length).refine(rows => new Set(rows.map(row => row.key)).size === metricKeys.length, "Duplicate benchmark dimensions"),
  models: z.array(z.object({ name: z.string().min(1), organization: z.string().min(1), openWeights: z.boolean(), scores: z.record(z.enum(metricKeys), z.number().min(0).max(100)) })).min(1).refine(rows => new Set(rows.map(row => row.name)).size === rows.length, "Duplicate model names"),
});

export function parseModelRankings(value: unknown): ModelRankings {
  return snapshot.parse(value);
}

export function readModelRankings(): ModelRankings {
  return parseModelRankings(JSON.parse(readFileSync(path.join(REPO_ROOT, "site/rankings/livebench.json"), "utf8")));
}
