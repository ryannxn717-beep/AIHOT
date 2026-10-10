import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { precompilePublicApi } from "./precompile.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const output = path.join(root, ".data/cloudflare-build");
const common = {
  bundle: true, format: "esm" as const, platform: "node" as const, target: "es2022", minify: true, keepNames: true,
  external: ["node:*", "cloudflare:*"],
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire("/bundle/index.js");' },
};
// Remove obsolete share cards when public content is withdrawn or changes identity.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const compilerFile = path.join(output, "compiled-functions.js");
await precompilePublicApi(compilerFile);
await build({ ...common, entryPoints: [path.join(root, "deploy/cloudflare/api.ts")], outfile: path.join(output, "api/index.js"),
  define: { "import.meta.dirname": JSON.stringify("/bundle/packages/backend/src") },
  plugins: [{ name: "static-api-compilers", setup(builder) {
    builder.onLoad({ filter: /node_modules\/.*\.js$/ }, async args => {
      const contents = await readFile(args.path, "utf8");
      if (!/new Function\s*\(/.test(contents)) return undefined;
      return { contents: `import { compileStaticFunction } from ${JSON.stringify(compilerFile)};\n${contents.replace(/new Function\s*\(/g, "compileStaticFunction(")}`, loader: "js" };
    });
  } }, { name: "persistent-feedback-boundary", setup(builder) {
    builder.onResolve({ filter: /^\.\/feedback-screenshots\.ts$/ }, () => ({ path: path.join(root, "deploy/cloudflare/feedback-screenshots.ts") }));
  } }],
});
for (const relative of ["industry/topics.json", "industry/prompts", "site/changelog.json", "site/rankings", "site/pages", "site/public", "site/brand"]) {
  await cp(path.join(root, relative), path.join(output, "api", relative), { recursive: true });
}
await build({ ...common, entryPoints: [path.join(root, "deploy/cloudflare/web.ts")], outfile: path.join(output, "web/index.js") });
await cp(path.join(root, "apps/web/build/client"), path.join(output, "web/assets"), { recursive: true });
// Static brand share cards are rendered by the Node build tool, never by a reader's request.
const { renderOg } = await import("../../packages/backend/src/media/og.ts");
const { CARDS, ITEM_COPY, withSubject } = await import("../../site/site.ts");
const ogDir = path.join(output, "web/assets/og/pages");
await mkdir(ogDir, { recursive: true });
for (const [name, card] of Object.entries(CARDS)) await writeFile(path.join(ogDir, `${name}.png`), (await renderOg(card)).png);
await cp(path.join(ogDir, "site.png"), path.join(output, "web/assets/og/site.png"));
const { TOPICS, TOPIC_GROUPS } = await import("../../packages/backend/src/publication/topics.ts");
await writeFile(path.join(ogDir, "topics.png"), (await renderOg({ kicker: "主题", title: `${TOPICS.length} 个 AI 方向`, subtitle: TOPIC_GROUPS.map(group => group.name).join("、") })).png);
await mkdir(path.join(output, "web/assets/og/topics"), { recursive: true });
for (const topic of TOPICS) await writeFile(path.join(output, "web/assets/og/topics", `${topic.slug}.png`), (await renderOg({ kicker: "主题", title: `${topic.name} 最新动态`, subtitle: topic.definition })).png);
if (!process.env.DATABASE_URL) throw new Error("Cloudflare asset build requires the deployment database to prepare the public item share images.");
const { loadPool } = await import("../../packages/backend/src/publication/pool.ts");
const { loadItemOgCard, loadItemShare } = await import("../../packages/backend/src/publication/og.ts");
const { renderPoster } = await import("../../packages/backend/src/media/poster.ts");
const { CATEGORY_LABELS } = await import("../../packages/contracts/src/taxonomy.ts");
const { beijingDate } = await import("../../packages/contracts/src/time.ts");
const { closeDb } = await import("../../packages/backend/src/db.ts");
await mkdir(path.join(output, "web/assets/og/items"), { recursive: true });
await mkdir(path.join(output, "web/assets/og/posters"), { recursive: true });
try {
  let pageCount = 1;
  for (let page = 1; page <= pageCount; page++) {
    const pool = await loadPool({ channel: "all", category: null, tag: null, q: null, tab: "time", page });
    pageCount = pool.pageCount;
    for (const item of pool.items) {
      const [card, share] = await Promise.all([loadItemOgCard(item.id), loadItemShare(item.id)]);
      if (card) await writeFile(path.join(output, "web/assets/og/items", `${item.id}.png`), (await renderOg(card)).png);
      if (share) await writeFile(path.join(output, "web/assets/og/posters", `${item.id}.png`), (await renderPoster({ url: `${process.env.SITE_URL}/items/${share.id}`, kicker: share.category ? CATEGORY_LABELS[share.category] : withSubject("动态"), title: share.title, summary: share.summary, source: share.source.name, date: beijingDate(share.timelineAt), score: share.selected && ITEM_COPY.showScore ? share.score : null })).png);
    }
  }
} finally { await closeDb(); }
for (const name of ["api", "web"]) {
  const source = JSON.parse(await readFile(path.join(root, `deploy/cloudflare/${name}.json`), "utf8"));
  if (name === "api") source.hyperdrive[0].id = process.env.AIHOT_HYPERDRIVE_ID ?? source.hyperdrive[0].id;
  await writeFile(path.join(output, name, "wrangler.json"), JSON.stringify(source, null, 2));
}
const localSecrets = path.join(root, ".data/cloudflare-secrets.env");
if (existsSync(localSecrets)) await cp(localSecrets, path.join(output, "api/.dev.vars"));
console.log("Cloudflare API, SSR, static assets and configuration built.");
