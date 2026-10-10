import { defineModule } from "@aihot/contracts/modules";

export const rankings = defineModule({
  name: "rankings",
  pages: [{ path: "leaderboard", file: "web/leaderboard.tsx", id: "rankings-leaderboard" }],
  apiPaths: [/^\/api\/site\/model-rankings$/],
});
