import { readFileSync } from "node:fs";
import { sql } from "@aihot/backend/db";
import { identityKeyFor, upsertMaterial } from "@aihot/backend/content/materials";
import { publishArticleTx } from "@aihot/backend/publication/publish";
import { CATEGORY_KEYS } from "@aihot/contracts/taxonomy";

const { articles } = JSON.parse(readFileSync(new URL("../site/mvp/articles.json", import.meta.url), "utf8")) as {
  articles: Array<{ sourceId: string; url: string; originalTitle: string; title: string; summary: string; publishedAt: string; category: string; tags: string[] }>;
};
export async function seedReviewedMvpArticles(): Promise<void> {
  for (const article of articles) {
    if (!article.title || !article.summary || !article.originalTitle || !article.tags.every(tag => typeof tag === "string") || !CATEGORY_KEYS.some(key => key === article.category)
      || !Number.isFinite(Date.parse(article.publishedAt)) || new URL(article.url).protocol !== "https:") {
      throw new Error(`Invalid reviewed MVP article: ${article.url}`);
    }
  }
  const created = await sql.begin(async tx => {
    // A local sample import must not revise a concurrent collector's or editor's material.
    // This short, development-only transaction serialises inserts and publishes atomically.
    await tx`LOCK TABLE articles IN SHARE ROW EXCLUSIVE MODE`;
    let added = 0;
    for (const article of articles) {
      const source = await tx`SELECT id FROM sources WHERE id=${article.sourceId}`;
      if (!source.length) throw new Error(`MVP source ${article.sourceId} missing; run scripts/seed.ts first`);
      const input = { sourceId: article.sourceId, url: article.url, title: article.originalTitle,
      excerpt: article.summary, bodyStatus: "none", via: "import", publishedAt: new Date(article.publishedAt),
        backfill: "reviewed-mvp-sample", raw: { reviewedMvpSample: true, reviewedAt: "2026-10-10", summaryMethod: "manual" } } as const;
      if ((await tx`SELECT 1 FROM articles WHERE identity_key=${identityKeyFor(input)}`).length) continue;
      const material = await upsertMaterial(input, tx);
      const fields = { title: article.title, summary: article.summary, relevance: "pass", category: article.category, tags: article.tags, selected: true, score: null };
      await tx`INSERT INTO editorial_overrides(article_id,fields,reason,updated_by)
      VALUES (${material.articleId},${sql.json(fields)},'人工核验的本地 MVP 阅读样本，无模型评分','mvp-seed')`;
      await tx`UPDATE articles SET grouping_status='complete',grouped_at=now(),selection_adds_value=true WHERE id=${material.articleId}`;
      await publishArticleTx(tx, material.articleId);
      added++;
    }
    return added;
  });
  console.log(`Reviewed MVP articles: ${created} added, ${articles.length - created} already present.`);
}
