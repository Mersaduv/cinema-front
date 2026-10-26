import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import "../server-fetch-dns";

const require = createRequire(import.meta.url);
const dns = require("node:dns") as typeof import("node:dns");

describe("cinema.af server lookup", () => {
  it("connects cinema.af to loopback so the host does not time out on its public name", () => {
    return new Promise<void>((resolve, reject) => {
      dns.lookup("cinema.af", (error, address) => {
        if (error) {
          reject(error);
          return;
        }

        expect(address).toBe("127.0.0.1");
        resolve();
      });
    });
  });

  it("returns all addresses as loopback when undici asks for every family", () => {
    return new Promise<void>((resolve, reject) => {
      dns.lookup("www.cinema.af", { all: true }, (error, addresses) => {
        if (error) {
          reject(error);
          return;
        }

        expect(addresses).toEqual([{ address: "127.0.0.1", family: 4 }]);
        resolve();
      });
    });
  });
});
