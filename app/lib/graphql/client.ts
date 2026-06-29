"use client";

import { cacheExchange, createClient, fetchExchange } from "@urql/core";
import { tokenStorage } from "../token-storage";

export function createUrqlClient() {
  return createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8005/graphql",
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => {
      const token = tokenStorage.getToken();

      return {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
    },
  });
}

let browserClient: ReturnType<typeof createUrqlClient> | null = null;

export function getUrqlClient() {
  if (!browserClient) {
    browserClient = createUrqlClient();
  }

  return browserClient;
}
