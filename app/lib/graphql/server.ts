const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8005/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type GraphqlRequestOptions = {
  revalidate?: number | false;
  tags?: string[];
  /** Retry transient network / 5xx failures (catalog pages). */
  retries?: number;
  cache?: RequestCache;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphqlRequestOptions,
): Promise<T> {
  const attempts = Math.max(1, options?.retries ?? 1);
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const useCache = options?.cache ?? "default";
      const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query, variables }),
        cache: useCache,
        next:
          useCache === "no-store"
            ? undefined
            : {
                revalidate: options?.revalidate ?? 60,
                tags: options?.tags,
              },
      });

      if (!response.ok) {
        throw new Error(`GraphQL HTTP ${response.status}`);
      }

      const payload = (await response.json()) as GraphQLResponse<T>;

      if (payload.errors?.length) {
        throw new Error(payload.errors[0]?.message ?? "GraphQL error");
      }

      if (!payload.data) {
        throw new Error("GraphQL response missing data");
      }

      return payload.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("GraphQL request failed");

      if (attempt < attempts) {
        await sleep(200 * attempt);
      }
    }
  }

  throw lastError ?? new Error("GraphQL request failed");
}
