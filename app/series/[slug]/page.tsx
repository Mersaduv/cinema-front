import { notFound } from "next/navigation";
import {
  graphqlSeriesOverviewToPublic,
  type GraphqlSeriesOverview,
} from "../../lib/graphql/adapters";
import { normalizeImageAsset, pickImageSrc } from "../../lib/cinema-image";
import { graphqlRequest } from "../../lib/graphql/server";
import { GET_SERIES_OVERVIEW_PREVIEW } from "../../lib/graphql/queries";
import {
  fetchSeriesCriticalBySlug,
  fetchSeriesMetaBySlug,
} from "../../lib/detail/detail-fetch";
import DetailLcpPreload from "../../components/content/DetailLcpPreload";
import SeriesDetailClient from "./SeriesDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const series = await fetchSeriesMetaBySlug(slug);

    if (!series) {
      return {};
    }

    return {
      title: series.meta_title?.trim() || series.title,
      description:
        series.meta_description?.trim() || series.synopsis?.slice(0, 160) || undefined,
      openGraph: {
        images: [
          pickImageSrc(normalizeImageAsset(series.poster_image), series.poster_url) ??
            series.poster_url,
        ].filter(Boolean) as string[],
      },
    };
  } catch {
    return {};
  }
}

export default async function PublicSeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  try {
    if (preview) {
      const data = await graphqlRequest<{
        seriesOverviewPreview: GraphqlSeriesOverview | null;
      }>(GET_SERIES_OVERVIEW_PREVIEW, { slug, token: preview }, { cache: "no-store" });

      if (!data.seriesOverviewPreview) {
        notFound();
      }

      const series = graphqlSeriesOverviewToPublic(data.seriesOverviewPreview);

      return (
        <>
          <DetailLcpPreload item={series} />
          <SeriesDetailClient series={series} previewMode />
        </>
      );
    }

    const series = await fetchSeriesCriticalBySlug(slug);

    if (!series) {
      notFound();
    }

    return (
      <>
        <DetailLcpPreload item={series} />
        <SeriesDetailClient series={series} />
      </>
    );
  } catch {
    notFound();
  }
}
