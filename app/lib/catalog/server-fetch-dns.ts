import { createRequire } from "node:module";
import * as net from "node:net";
import type * as DnsTypes from "node:dns";

/**
 * cinema.af resolves to a public address this server cannot open.
 * Rewriting the name to 127.0.0.1 does not change the port: the URL is still :80.
 * Node requests that must reach Laravel go through cinemaLoopbackFetch, which
 * uses 127.0.0.1:8005.
 */
const LOOPBACK_HOSTS = new Set(["cinema.af", "www.cinema.af"]);

const require = createRequire(import.meta.url);
const dns = require("node:dns") as typeof DnsTypes;

dns.setDefaultResultOrder("ipv4first");

const netWithTimeout = net as typeof net & {
  setDefaultAutoSelectFamilyAttemptTimeout?: (timeout: number) => void;
};
netWithTimeout.setDefaultAutoSelectFamilyAttemptTimeout?.(250);

const originalLookup = dns.lookup as (
  hostname: string,
  options?: unknown,
  callback?: unknown,
) => void;
const originalPromisesLookup = dns.promises.lookup.bind(dns.promises);

dns.lookup = function loopbackLookup(
  hostname: string,
  options?: unknown,
  callback?: unknown,
) {
  const cb = typeof options === "function" ? options : callback;
  const opts =
    typeof options === "function" || typeof options === "number" ? {} : (options ?? {});

  if (isLoopbackHost(hostname) && typeof cb === "function") {
    if (wantsAllAddresses(opts)) {
      cb(null, [{ address: "127.0.0.1", family: 4 }], 4);
      return;
    }

    cb(null, "127.0.0.1", 4);
    return;
  }

  if (typeof options === "function") {
    originalLookup(hostname, options);
    return;
  }

  originalLookup(hostname, options ?? {}, cb);
} as typeof dns.lookup;

dns.promises.lookup = (async (
  hostname: string,
  options?: DnsTypes.LookupOptions | DnsTypes.LookupOneOptions,
) => {
  if (isLoopbackHost(hostname)) {
    if (wantsAllAddresses(options)) {
      return [{ address: "127.0.0.1", family: 4 }];
    }

    return { address: "127.0.0.1", family: 4 };
  }

  return originalPromisesLookup(hostname, options as DnsTypes.LookupOptions);
}) as typeof dns.promises.lookup;

function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname.toLowerCase().replace(/\.$/, ""));
}

function wantsAllAddresses(options: unknown): boolean {
  return Boolean(
    options &&
      typeof options === "object" &&
      "all" in options &&
      (options as { all?: boolean }).all,
  );
}
