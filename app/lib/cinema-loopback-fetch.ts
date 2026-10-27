const LOOPBACK_HOSTS = new Set(["cinema.af", "www.cinema.af"]);

/**
 * IIS serves Laravel on 127.0.0.1:8005 with an empty host binding.
 * A request that keeps Host: cinema.af is sent onward to the public
 * address, which this server cannot open. Call 127.0.0.1:8005 directly,
 * the same way the health check that returned 200 was made.
 * Browser bundles keep NEXT_PUBLIC_API_URL.
 */
function loopbackPort(): number {
  const configured = Number(process.env.CINEMA_API_LOOPBACK_PORT || "8005");
  return Number.isFinite(configured) && configured > 0 ? configured : 8005;
}

export function cinemaLoopbackFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const target = new URL(url);
  const hostname = target.hostname.toLowerCase().replace(/\.$/, "");

  if (!LOOPBACK_HOSTS.has(hostname)) {
    return fetch(url, init);
  }

  const local = new URL(`${target.pathname}${target.search}`, `http://127.0.0.1:${loopbackPort()}`);
  return fetch(local, init);
}
