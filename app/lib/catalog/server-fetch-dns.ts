import { createRequire } from "node:module";
import * as net from "node:net";
import type * as DnsTypes from "node:dns";

/**
 * The production host cannot open a TCP connection to its own public name
 * (cinema.af:80 times out). Keep the Host header as cinema.af, but connect
 * to loopback so nginx/IIS on this machine answers during `next build` and SSR.
 */
const LOOPBACK_HOSTS = new Set(["cinema.af", "www.cinema.af"]);

const require = createRequire(import.meta.url);
const dns = require("node:dns") as typeof DnsTypes;

dns.setDefaultResultOrder("ipv4first");

const netWithTimeout = net as typeof net & {
  setDefaultAutoSelectFamilyAttemptTimeout?: (timeout: number) => void;
};
netWithTimeout.setDefaultAutoSelectFamilyAttemptTimeout?.(250);

const originalLookup = dns.lookup;
const originalPromisesLookup = dns.promises.lookup.bind(dns.promises);

dns.lookup = function loopbackLookup(
  hostname: string,
  options?:
    | number
    | DnsTypes.LookupOptions
    | DnsTypes.LookupOneOptions
    | ((
        err: NodeJS.ErrnoException | null,
        address: string,
        family: number,
      ) => void),
  callback?: (
    err: NodeJS.ErrnoException | null,
    address: string | DnsTypes.LookupAddress[],
    family: number,
  ) => void,
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
    return originalLookup(hostname, options);
  }

  if (typeof options === "number") {
    return originalLookup(
      hostname,
      options,
      cb as (
        err: NodeJS.ErrnoException | null,
        address: string,
        family: number,
      ) => void,
    );
  }

  return originalLookup(
    hostname,
    options ?? {},
    cb as (
      err: NodeJS.ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  );
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
