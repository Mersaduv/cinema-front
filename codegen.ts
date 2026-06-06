import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8005/graphql",
  documents: ["app/lib/graphql/queries.ts"],
  generates: {
    "app/lib/graphql/__generated__/": {
      preset: "client",
      config: {
        useTypeImports: true,
      },
    },
  },
};

export default config;
