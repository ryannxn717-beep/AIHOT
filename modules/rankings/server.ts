import { defineServerModule } from "@aihot/backend/modules";
import { readModelRankings } from "@aihot/backend/publication/rankings";

export const rankingsServer = defineServerModule({
  name: "rankings",
  http(app) {
    app.get("/api/site/model-rankings", (_request, reply) => reply.header("Cache-Control", "public, max-age=300").send(readModelRankings()));
  },
  sitemap: { pages: [{ loc: "/leaderboard", changefreq: "weekly", priority: 0.7 }] },
});
