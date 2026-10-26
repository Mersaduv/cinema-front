import { setDefaultResultOrder } from "node:dns";
import * as net from "node:net";

/**
 * Server-side catalog fetch was waiting on IPv6 (about 10s, then another 10s)
 * and then failing with Node's "fetch failed", while the browser reached the API.
 * Prefer IPv4 and fail over quickly.
 */
setDefaultResultOrder("ipv4first");

const netDns = net as typeof net & {
  setDefaultAutoSelectFamilyAttemptTimeout?: (timeout: number) => void;
};

netDns.setDefaultAutoSelectFamilyAttemptTimeout?.(250);
