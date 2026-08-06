"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { EpisodeStillImage } from "../../../components/images";
import { useIsTvCompat } from "../../../hooks/useTvCapabilities";
import { useSeriesEpisodes } from "../../../lib/useSeriesEpisodes";
import {
  focusFirstInRoot,
  isBackKey,
  TV_FOCUS_RING_CLASS,
} from "../../../lib/tv/focus";
import type { PublicSeriesSeason } from "../../../lib/series";
import type { EpisodeSummary, SeasonSummary } from "../types/player.types";

type EpisodePanelNav = {
  seriesSlug: string;
  seriesTitle: string;
  currentSeason: number;
  currentEpisode: number;
};

type EpisodePanelProps = {
  nav: EpisodePanelNav;
  onSelect: (season: number, episode: number) => void;
  onOpenChange?: (open: boolean) => void;
  controlsVisible: boolean;
};

function mapRestSeasons(seasons: PublicSeriesSeason[]): SeasonSummary[] {
  return seasons.map((season) => ({
    seasonNumber: season.season_number,
    name: season.name,
    episodes: season.episodes.map(
      (ep): EpisodeSummary => ({
        id: String(ep.id),
        seasonNumber: season.season_number,
        episodeNumber: ep.episode_number,
        title: ep.title,
        hlsUrl: ep.hls_url,
        subtitleUrl: ep.subtitle_url,
        dubbedAudioUrl: ep.dubbed_audio_url,
        durationSeconds: ep.duration_minutes ? ep.duration_minutes * 60 : null,
        stillUrl: ep.still_url,
        stillImage: ep.still_image ?? null,
        synopsis: ep.synopsis,
      }),
    ),
  }));
}

function formatEpisodeDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) {
    return "";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes.toLocaleString("fa-IR")} دقیقه`;
}

function formatSeasonLabel(seasonNumber: number, name?: string | null): string {
  if (name?.trim()) {
    return name.trim();
  }

  return `فصل ${seasonNumber.toLocaleString("fa-IR")}`;
}

/** Corner episode picker — loads season/episode list only after first open. */
function EpisodePanelComponent({
  nav,
  onSelect,
  onOpenChange,
  controlsVisible,
}: EpisodePanelProps) {
  const isTvCompat = useIsTvCompat();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadRequested, setLoadRequested] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(nav.currentSeason);

  const { data, error, isLoading, mutate } = useSeriesEpisodes(
    nav.seriesSlug,
    loadRequested,
  );

  const seasons = useMemo(() => mapRestSeasons(data ?? []), [data]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedSeason(nav.currentSeason);
  }, [isOpen, nav.currentSeason]);

  const setOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!controlsVisible && isOpen) {
      setOpen(false);
    }
  }, [controlsVisible, isOpen, setOpen]);

  useEffect(() => {
    if (!isOpen || !isTvCompat) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (isBackKey(event)) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [isOpen, isTvCompat, setOpen]);

  const visibleEpisodes = useMemo(() => {
    return seasons.find((season) => season.seasonNumber === selectedSeason)?.episodes ?? [];
  }, [seasons, selectedSeason]);

  useEffect(() => {
    if (!isOpen || !isTvCompat || !panelRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      if (panelRef.current) {
        focusFirstInRoot(panelRef.current);
      }
    });
  }, [isOpen, isTvCompat, visibleEpisodes.length, selectedSeason, isLoading]);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      if (loadRequested) {
        void mutate();
      }
      setLoadRequested(true);
      setOpen(true);
      return;
    }

    setOpen(false);
  }, [isOpen, loadRequested, mutate, setOpen]);

  const handleBackdropClick = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleSelect = useCallback(
    (season: number, episode: number, playable: boolean) => {
      if (!playable) {
        return;
      }

      onSelect(season, episode);
      setOpen(false);
    },
    [onSelect, setOpen],
  );

  const showTrigger = controlsVisible;

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="بستن لیست قسمت‌ها"
          className="absolute inset-0 z-[35] border-0 bg-transparent p-0"
          onClick={handleBackdropClick}
        />
      ) : null}

      <div
        className={`absolute top-4 right-4 z-40 ${showTrigger ? "pointer-events-auto" : "pointer-events-none"}`}
        dir="rtl"
      >
        <button
          type="button"
          data-tv-focusable={isTvCompat ? true : undefined}
          onClick={handleToggle}
          aria-label={isOpen ? "بستن لیست قسمت‌ها" : "لیست قسمت‌ها"}
          aria-expanded={isOpen}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-lg text-white transition ${
            isTvCompat ? TV_FOCUS_RING_CLASS : ""
          } ${isOpen ? "bg-white/15" : "bg-black/35 hover:bg-black/50"}`}
        >
          <HiOutlineMenuAlt2 className="h-6 w-6" />
        </button>

        {isOpen ? (
          <div
            ref={panelRef}
            role={isTvCompat ? "dialog" : undefined}
            aria-label={isTvCompat ? "لیست قسمت‌ها" : undefined}
            data-tv-focus-group="episode-panel"
            data-episode-panel
            className="absolute top-full right-0 mt-2 flex w-[min(92vw,22rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b0f14]/95 shadow-2xl backdrop-blur-md sm:w-[24rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="truncate text-right text-base font-bold text-white">
                {nav.seriesTitle}
              </h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-10">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-center text-sm text-[#fecdd3]">
                {error instanceof Error ? error.message : "خطا در بارگذاری قسمت‌ها"}
              </p>
            ) : seasons.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-white/60">
                قسمتی برای نمایش وجود ندارد.
              </p>
            ) : (
              <>
                <div
                  className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3"
                  style={{ touchAction: "pan-x" }}
                >
                  {seasons.map((season) => {
                    const active = season.seasonNumber === selectedSeason;

                    return (
                      <button
                        key={season.seasonNumber}
                        type="button"
                        data-tv-focusable={isTvCompat ? true : undefined}
                        onClick={() => setSelectedSeason(season.seasonNumber)}
                        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                          isTvCompat ? TV_FOCUS_RING_CLASS : ""
                        } ${
                          active
                            ? "border border-white bg-white/10 text-white"
                            : "border border-transparent bg-black/30 text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {formatSeasonLabel(season.seasonNumber, season.name)}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain"
                  style={{ touchAction: "pan-y" }}
                >
                  {visibleEpisodes.map((ep) => {
                    const isCurrent =
                      ep.seasonNumber === nav.currentSeason &&
                      ep.episodeNumber === nav.currentEpisode;
                    const playable = Boolean(ep.hlsUrl);
                    const durationLabel = formatEpisodeDuration(ep.durationSeconds);

                    return (
                      <button
                        key={`${ep.seasonNumber}-${ep.episodeNumber}`}
                        type="button"
                        data-tv-focusable={isTvCompat ? true : undefined}
                        data-tv-grid-item={isTvCompat ? true : undefined}
                        disabled={!playable}
                        onClick={() =>
                          handleSelect(ep.seasonNumber, ep.episodeNumber, playable)
                        }
                        className={`flex w-full items-center gap-3 px-4 py-3 text-right transition ${
                          isTvCompat ? TV_FOCUS_RING_CLASS : ""
                        } ${
                          isCurrent
                            ? "bg-white/10"
                            : playable
                              ? "hover:bg-white/5"
                              : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white/70">
                            قسمت {ep.episodeNumber.toLocaleString("fa-IR")}
                          </p>
                          <p className="truncate text-base font-bold text-white">
                            {ep.title || `قسمت ${ep.episodeNumber}`}
                          </p>
                          {durationLabel ? (
                            <p className="text-sm text-white/60">{durationLabel}</p>
                          ) : !playable ? (
                            <p className="text-sm text-white/50">به زودی</p>
                          ) : null}
                        </div>

                        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-white/10">
                          {ep.stillUrl || ep.stillImage ? (
                            <EpisodeStillImage
                              seriesTitle={nav.seriesTitle}
                              seasonNumber={ep.seasonNumber}
                              episodeNumber={ep.episodeNumber}
                              image={ep.stillImage}
                              src={ep.stillUrl}
                              usage="episode-card"
                              sizes="112px"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}

export const EpisodePanel = memo(EpisodePanelComponent);
