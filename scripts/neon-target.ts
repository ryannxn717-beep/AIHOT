/** Initialization is destructive if pointed at the wrong deployment; match an explicit host and DB. */
export function assertNeonTarget(uri: string, expectedHost: string, project: string): void {
  const target = new URL(uri);
  if (project !== "aihot-lol" || !expectedHost.endsWith(".neon.tech") || target.hostname !== expectedHost || target.pathname !== "/aibrief" || target.searchParams.get("sslmode") !== "require") {
    throw new Error("Neon initialization requires the explicitly acknowledged aihot-lol host, aibrief database and TLS.");
  }
}
