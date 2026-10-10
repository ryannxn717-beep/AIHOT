import { defineModule } from "@aihot/contracts/modules";

export const reading = defineModule({
  name: "reading",
  pages: [{ path: "reports", file: "web/reports.tsx", id: "reading-reports" }],
});
