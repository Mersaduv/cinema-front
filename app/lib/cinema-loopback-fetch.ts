import http from "node:http";
import https from "node:https";

const LOOPBACK_HOSTS = new Set(["cinema.af", "www.cinema.af"]);

/**
 * The host that builds this app cannot open cinema.af:80 (ConnectTimeoutError).
 * Talk to the local web server instead, and keep Host: cinema.af so the right site answers.
 */
export function cinemaLoopbackFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const target = new URL(url);

  if (!LOOPBACK_HOSTS.has(target.hostname)) {
    return fetch(url, init);
  }

  const transport = target.protocol === "https:" ? https : http;
  const port = target.port || (target.protocol === "https:" ? 443 : 80);
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  headers.set("Accept-Encoding", "identity");
  headers.set("Host", target.host);

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: target.protocol,
        hostname: "127.0.0.1",
        port,
        method: init?.method ?? "GET",
        path: `${target.pathname}${target.search}`,
        headers: Object.fromEntries(headers.entries()),
        servername: target.hostname,
        timeout: 8000,
      },
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
