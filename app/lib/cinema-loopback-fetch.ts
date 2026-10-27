import http from "node:http";

const LOOPBACK_HOSTS = new Set(["cinema.af", "www.cinema.af"]);

/**
 * IIS on this machine serves the Laravel API at 127.0.0.1:8005.
 * cinema.af:80 is the public name and times out from the server itself.
 * Browser code keeps NEXT_PUBLIC_API_URL; only Node requests use loopback.
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

  if (!LOOPBACK_HOSTS.has(target.hostname)) {
    return fetch(url, init);
  }

  const port = loopbackPort();
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  headers.set("Accept-Encoding", "identity");
  headers.set("Host", target.hostname);

  const options: http.RequestOptions = {
    protocol: "http:",
    hostname: "127.0.0.1",
    port,
    method: init?.method ?? "GET",
    path: `${target.pathname}${target.search}`,
    headers: Object.fromEntries(headers.entries()),
    timeout: 8000,
  };

  return new Promise((resolve, reject) => {
    const request = http.request(
      options,
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        response.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(response.headers)) {
            if (typeof value === "string") {
              responseHeaders.set(key, value);
            } else if (Array.isArray(value)) {
              responseHeaders.set(key, value.join(", "));
            }
          }

          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode ?? 500,
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("cinema loopback timeout"));
    });
    request.on("error", reject);
    if (typeof init?.body === "string") {
      request.write(init.body);
    }
    request.end();
  });
}
