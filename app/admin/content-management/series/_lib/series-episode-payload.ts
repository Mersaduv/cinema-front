import { resolveEpisodeTitle } from "../../../../lib/episode-title";
import {
  buildSeasonHlsBase,
  normalizeHlsBaseUrl,
} from "../../../../lib/series-hls-paths";
import type { AdminSeriesEpisode } from "../../../../lib/admin-series";
import type { EpisodeDraft, SeasonDraft, SeriesFormState } from "./series-tmdb-sync";
import type { SeriesPublishStatus } from "../../../../lib/admin-series";

function nullableString(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

function nullableNumber(value: string) {
  const trimmed = value.trim();

  return trimmed === "" ? null : Number(trimmed);
}

function downloadMapFromEpisode(episode: EpisodeDraft): Record<string, string> | undefined {
  const links = Object.entries(episode.download_links || {}).reduce<Record<string, string>>(
    (accumulator, [quality, url]) => {
      const qualityKey = quality.trim();
      const urlValue = url.trim();

      if (!qualityKey || !urlValue) {
        return accumulator;
      }

      accumulator[qualityKey] = urlValue;

      return accumulator;
    },
    {},
  );

  return Object.keys(links).length > 0 ? links : undefined;
}

export function episodeDraftFingerprint(episode: EpisodeDraft): string {
  const normalized = {
    episode_number: episode.episode_number.trim(),
    title: episode.title.trim(),
    synopsis: episode.synopsis.trim(),
    synopsis_en: episode.synopsis_en.trim(),
    air_date: episode.air_date.trim(),
    duration_minutes: episode.duration_minutes.trim(),
    still_url: episode.still_url.trim(),
    source_method: episode.source_method,
    video_url: episode.video_url.trim(),
    embed_url: episode.embed_url.trim(),
    hls_url: episode.hls_url.trim(),
    hls_verified: episode.hls_verified,
    dash_url: episode.dash_url.trim(),
    dash_verified: episode.dash_verified,
    download_links: episode.download_links,
    subtitle_url: episode.subtitle_url.trim(),
    dubbed_audio_url: episode.dubbed_audio_url.trim(),
    publish_status: episode.publish_status,
  };

  return JSON.stringify(normalized);
}

export type EpisodeUpsertPayload = AdminSeriesEpisode & {
  season?: {
    hls_base_url?: string | null;
    name?: string | null;
  };
};

export function buildEpisodeUpsertPayload(
  episode: EpisodeDraft,
  season: SeasonDraft,
  form: Pick<SeriesFormState, "hls_base_url" | "publish_status">,
): EpisodeUpsertPayload {
  const seasonNumber = Number(season.season_number);
  const seriesHlsBase = normalizeHlsBaseUrl(form.hls_base_url);
  const seasonHlsBase =
    normalizeHlsBaseUrl(season.hls_base_url) ||
    buildSeasonHlsBase(seriesHlsBase, seasonNumber);

  return {
    season_number: seasonNumber,
    episode_number: Number(episode.episode_number),
    title: resolveEpisodeTitle([episode.title], episode.episode_number),
    synopsis: nullableString(episode.synopsis) || null,
    synopsis_en: nullableString(episode.synopsis_en) || null,
    air_date: nullableString(episode.air_date) || null,
    duration_minutes: nullableNumber(episode.duration_minutes),
    still_url: nullableString(episode.still_url) || null,
    source_method: episode.source_method || "hls",
    video_url:
      episode.source_method === "url" || episode.source_method === "upload"
        ? nullableString(episode.video_url) || null
        : null,
    embed_url:
      episode.source_method === "embed" ? nullableString(episode.embed_url) || null : null,
    hls_url:
      episode.source_method === "hls" && episode.hls_verified
        ? nullableString(episode.hls_url) || null
        : null,
    hls_verified: episode.source_method === "hls" ? Boolean(episode.hls_verified) : false,
    dash_url: episode.dash_verified ? nullableString(episode.dash_url) || null : null,
    dash_verified: Boolean(episode.dash_verified),
    download_links: downloadMapFromEpisode(episode),
    subtitle_url: nullableString(episode.subtitle_url) || null,
    dubbed_audio_url: nullableString(episode.dubbed_audio_url) || null,
    publish_status: (episode.publish_status || form.publish_status) as SeriesPublishStatus,
    season: {
      hls_base_url: seasonHlsBase || null,
      name: nullableString(season.name) || null,
    },
  };
}

export function mergeSavedEpisodeIntoDraft(
  episode: EpisodeDraft,
  saved: AdminSeriesEpisode,
): Partial<EpisodeDraft> {
  return {
    title: saved.title || episode.title,
    synopsis: saved.synopsis ?? episode.synopsis,
    synopsis_en: saved.synopsis_en ?? episode.synopsis_en,
    air_date: saved.air_date || episode.air_date,
    duration_minutes:
      saved.duration_minutes != null ? String(saved.duration_minutes) : episode.duration_minutes,
    still_url: saved.still_url || episode.still_url,
    source_method: saved.source_method || episode.source_method,
    video_url: saved.video_url || episode.video_url,
    embed_url: saved.embed_url || episode.embed_url,
    hls_url: saved.hls_url || episode.hls_url,
    hls_verified: Boolean(saved.hls_verified),
    dash_url: saved.dash_url || episode.dash_url,
    dash_verified: Boolean(saved.dash_verified),
    download_links: saved.download_links || episode.download_links,
    subtitle_url: saved.subtitle_url || episode.subtitle_url,
    dubbed_audio_url: saved.dubbed_audio_url || episode.dubbed_audio_url,
    publish_status: saved.publish_status || episode.publish_status,
  };
}

export function seedEpisodeSavedFingerprints(form: SeriesFormState): Record<string, string> {
  const fingerprints: Record<string, string> = {};

  for (const season of form.seasons) {
    for (const episode of season.episodes) {
      fingerprints[`${season.id}:${episode.id}`] = episodeDraftFingerprint(episode);
    }
  }

  return fingerprints;
}
