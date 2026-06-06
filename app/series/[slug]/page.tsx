import { notFound } from "next/navigation";
import {
  graphqlSeriesOverviewToPublic,
  type GraphqlSeriesOverview,
} from "../../lib/graphql/adapters";
import { graphqlRequest } from "../../lib/graphql/server";
import { GET_SERIES_OVERVIEW } from "../../lib/graphql/queries";
import SeriesDetailClient from "./SeriesDetailClient";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const data = await graphqlRequest<{
      seriesOverview: GraphqlSeriesOverview | null;
    }>(GET_SERIES_OVERVIEW, { slug }, { revalidate: 300, tags: ["series", `series:${slug}`] });

    const series = data.seriesOverview;
    if (!series) {
      return {};
    }

    return {
      title: series.title,
      description: series.synopsis?.slice(0, 160),
      openGraph: {
        images: series.poster_url ? [series.poster_url] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function PublicSeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const data = await graphqlRequest<{
      seriesOverview: GraphqlSeriesOverview | null;
    }>(GET_SERIES_OVERVIEW, { slug }, { revalidate: 300, tags: ["series", `series:${slug}`] });

    if (!data.seriesOverview) {
      notFound();
    }

    return (
      <SeriesDetailClient
        series={graphqlSeriesOverviewToPublic(data.seriesOverview)}
      />
    );
  } catch {
    notFound();
  }
}
