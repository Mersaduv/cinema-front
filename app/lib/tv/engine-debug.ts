/** Dev-only engine lifecycle logging for TV devices without easy DevTools. */
export function logEngineLifecycle(
  event: "destroyed" | "attached",
  engineId: string,
  extra?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.debug("[cinema-engine]", {
    event,
    engineId,
    timestamp: Date.now(),
    ...extra,
  });
}
