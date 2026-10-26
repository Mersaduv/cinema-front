export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  await import("./app/lib/catalog/server-fetch-dns");
}
