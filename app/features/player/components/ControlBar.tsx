"use client";

import { memo, useMemo } from "react";
import {
  HiChevronLeft,
  HiOutlineArrowsExpand,
  HiOutlineCog,
  HiOutlineFastForward,
  HiOutlineRewind,
  HiOutlineSpeakerphone,
  HiOutlineVolumeOff,
} from "react-icons/hi";
import { MdPictureInPictureAlt } from "react-icons/md";
import { IoPauseSharp, IoPlaySharp } from "react-icons/io5";
import { PlayerMenu } from "./PlayerMenu";
import { PlayerMenuRadioOption } from "./PlayerMenuRadioOption";
import { SeekBar } from "./SeekBar";
import { usePlayerStore } from "../store/playerStore";
import type {
  SubtitleBackground,
  SubtitleFontColor,
  SubtitleFontSize,
} from "../types/player.types";
import { formatSeconds } from "../utils/format";
import { SlVolume2, SlVolumeOff } from "react-icons/sl";

type ControlBarProps = {
  onTogglePlay: () => void;
  onSeekBy: (seconds: number) => void;
  onSeekTo: (time: number) => void;
  onSeekDragStart?: () => void;
  onSeekDragEnd?: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSelectQuality: (level: number) => void;
  onSelectAudio: (index: number) => void;
  onSelectSubtitle: (index: number) => void;
  onSelectSpeed: (rate: number) => void;
  onSubtitleDelayChange: (delay: number) => void;
  onSubtitleStyleChange: (style: {
    fontSize?: SubtitleFontSize;
    fontColor?: SubtitleFontColor;
    background?: SubtitleBackground;
  }) => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  canUsePiP: boolean;
  hasSeriesNav: boolean;
};

const playbackRates = [
  { value: 0.5, label: "۰.۵ برابر — خیلی آهسته" },
  { value: 0.75, label: "۰.۷۵ برابر — آهسته" },
  { value: 1, label: "عادی — ۱×" },
  { value: 1.25, label: "۱.۲۵ برابر — کمی سریع" },
  { value: 1.5, label: "۱.۵ برابر — سریع" },
  { value: 2, label: "۲ برابر — خیلی سریع" },
];

const subtitleFontSizeOptions: Array<{ value: SubtitleFontSize; label: string }> = [
  { value: "small", label: "کوچک" },
  { value: "medium", label: "متوسط" },
  { value: "large", label: "بزرگ" },
];

const subtitleColorOptions: Array<{ value: SubtitleFontColor; label: string }> = [
  { value: "white", label: "سفید" },
  { value: "yellow", label: "زرد" },
  { value: "black", label: "مشکی" },
];

const subtitleBackgroundOptions: Array<{ value: SubtitleBackground; label: string }> = [
  { value: "transparent", label: "بدون پس‌زمینه" },
  { value: "black", label: "پس‌زمینه تیره" },
  { value: "white", label: "پس‌زمینه روشن" },
];

function ControlBarComponent({
  onTogglePlay,
  onSeekBy,
  onSeekTo,
  onSeekDragStart,
  onSeekDragEnd,
  onToggleMute,
  onVolumeChange,
  onSelectQuality,
  onSelectAudio,
  onSelectSubtitle,
  onSelectSpeed,
  onSubtitleDelayChange,
  onSubtitleStyleChange,
  onToggleFullscreen,
  onTogglePiP,
  onNextEpisode,
  onPrevEpisode,
  canUsePiP,
  hasSeriesNav,
}: ControlBarProps) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const volume = usePlayerStore((s) => s.volume);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const openMenu = usePlayerStore((s) => s.openMenu);
  const setOpenMenu = usePlayerStore((s) => s.setOpenMenu);
  const qualityOptions = usePlayerStore((s) => s.qualityOptions);
  const selectedQuality = usePlayerStore((s) => s.selectedQuality);
  const autoQualityLabel = usePlayerStore((s) => s.autoQualityLabel);
  const currentBandwidthMbps = usePlayerStore((s) => s.currentBandwidthMbps);
  const audioOptions = usePlayerStore((s) => s.audioOptions);
  const selectedAudio = usePlayerStore((s) => s.selectedAudio);
  const subtitleOptions = usePlayerStore((s) => s.subtitleOptions);
  const selectedSubtitle = usePlayerStore((s) => s.selectedSubtitle);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const subtitlePanel = usePlayerStore((s) => s.subtitlePanel);
  const setSubtitlePanel = usePlayerStore((s) => s.setSubtitlePanel);
  const subtitleDelay = usePlayerStore((s) => s.subtitleDelay);
  const subtitleFontSize = usePlayerStore((s) => s.subtitleFontSize);
  const subtitleFontColor = usePlayerStore((s) => s.subtitleFontColor);
  const subtitleBackground = usePlayerStore((s) => s.subtitleBackground);
  const showNextEpisodePrompt = usePlayerStore((s) => s.showNextEpisodePrompt);
  const isTv = usePlayerStore((s) => s.isTv);

  const tvFocus = isTv ? ({ "data-tv-focusable": true as const }) : {};

  const openMenuExclusive = (menu: NonNullable<typeof openMenu>) => {
    setSubtitlePanel("tracks");
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenus = () => {
    setSubtitlePanel("tracks");
    setOpenMenu(null);
  };

  const buttonClass = isTv
    ? "inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/35 text-white transition hover:border-white/20 hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
    : "inline-flex items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus:outline-none";

  const playButtonClass = isTv
    ? `${buttonClass} h-16 min-w-16 px-4`
    : `${buttonClass} h-14 min-w-14 px-4`;

  const iconButtonClass = isTv
    ? `${buttonClass} h-16 w-16`
    : `${buttonClass} h-11 min-w-11 px-4`;

  const menuTriggerClass = isTv
    ? "inline-flex h-14 items-center justify-center rounded-xl border border-white/10 bg-black/35 px-5 text-2xl font-bold text-white transition hover:border-white/20 hover:bg-black/50 focus:outline-none focus:ring-4 focus:ring-white"
    : "inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-sm text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]";

  const playIconClass = isTv ? "h-9 w-9" : "h-8 w-8";
  const smallIconClass = isTv ? "h-9 w-9" : "h-5 w-5";
  const timeClass = isTv ? "text-2xl font-bold" : "text-sm";

  const activeQualityLabel = useMemo(() => {
    if (selectedQuality === -1) {
      const bandwidthSuffix =
        currentBandwidthMbps != null && currentBandwidthMbps > 0
          ? ` · ${currentBandwidthMbps.toFixed(1)} Mbps`
          : "";
      return autoQualityLabel
        ? `خودکار (${autoQualityLabel})${bandwidthSuffix}`
        : `خودکار${bandwidthSuffix}`;
    }

    return qualityOptions.find((o) => o.value === selectedQuality)?.label || "کیفیت";
  }, [autoQualityLabel, currentBandwidthMbps, qualityOptions, selectedQuality]);

  const activeAudioLabel =
    audioOptions.find((o) => o.value === selectedAudio)?.label || "زبان اصلی";

  const activeSubtitleLabel =
    subtitleOptions.find((o) => o.value === selectedSubtitle)?.label || "خاموش";

  const subtitleTriggerLabel =
    selectedSubtitle >= 0 ? `زیرنویس: ${activeSubtitleLabel}` : "زیرنویس";

  return (
    <div className="space-y-4" data-player-controls>
      <SeekBar
        onSeekCommit={onSeekTo}
        onDragStart={onSeekDragStart}
        onDragEnd={onSeekDragEnd}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-player-controls
            tabIndex={0}
            {...tvFocus}
            onClick={onTogglePlay}
            aria-label={isPlaying ? "توقف" : "پخش"}
            className={playButtonClass}
          >
            {isPlaying ? (
              <IoPauseSharp className={playIconClass} />
            ) : (
              <IoPlaySharp className={playIconClass} />
            )}
          </button>

          <button
            type="button"
            data-player-controls
            tabIndex={0}
            {...tvFocus}
            onClick={() => onSeekBy(-10)}
            aria-label="عقب ۱۰ ثانیه"
            className={iconButtonClass}
          >
            <HiOutlineRewind className={smallIconClass} />
          </button>

          <button
            type="button"
            data-player-controls
            tabIndex={0}
            {...tvFocus}
            onClick={() => onSeekBy(10)}
            aria-label="جلو ۱۰ ثانیه"
            className={iconButtonClass}
          >
            <HiOutlineFastForward className={smallIconClass} />
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-white">
            <button
              type="button"
              {...tvFocus}
              onClick={onToggleMute}
              aria-label={isMuted ? "روشن کردن صدا" : "قطع صدا"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            >
              {isMuted || volume === 0 ? (
                <SlVolumeOff className="h-5 w-5" />
              ) : (
                <SlVolume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="بلندی صدا"
              className="h-1.5 w-24 accent-[#38bdf8]"
            />
          </div>

          <div
            className={`rounded-full border border-white/10 bg-black/35 px-3 py-2 text-white ${timeClass}`}
          >
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasSeriesNav && onPrevEpisode ? (
            <button
              type="button"
              {...tvFocus}
              onClick={onPrevEpisode}
              className="inline-flex h-11 items-center rounded-full border border-white/10 bg-black/35 px-4 text-sm text-white hover:bg-black/50"
            >
              قبلی
            </button>
          ) : null}

          {showNextEpisodePrompt && onNextEpisode ? (
            <button
              type="button"
              {...tvFocus}
              onClick={onNextEpisode}
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-black"
            >
              قسمت بعد
            </button>
          ) : null}

          {qualityOptions.length > 0 ? (
            <PlayerMenu
              menuId="quality"
              title="کیفیت تصویر"
              isOpen={openMenu === "quality"}
              triggerLabel={`کیفیت: ${activeQualityLabel}`}
              triggerClassName={menuTriggerClass}
              onOpen={() => openMenuExclusive("quality")}
              onClose={closeMenus}
            >
              {qualityOptions.map((option) => (
                <PlayerMenuRadioOption
                  key={`${option.value}-${option.label}`}
                  label={option.label}
                  detail={
                    option.value === -1 &&
                    currentBandwidthMbps != null &&
                    currentBandwidthMbps > 0
                      ? `${option.detail} · ${currentBandwidthMbps.toFixed(1)} Mbps`
                      : option.detail
                  }
                  selected={selectedQuality === option.value}
                  onSelect={() => onSelectQuality(option.value)}
                />
              ))}
            </PlayerMenu>
          ) : null}

          {audioOptions.length > 1 ? (
            <PlayerMenu
              menuId="audio"
              title="انتخاب صدا"
              isOpen={openMenu === "audio"}
              triggerLabel={`صدا: ${activeAudioLabel}`}
              triggerClassName={menuTriggerClass}
              onOpen={() => openMenuExclusive("audio")}
              onClose={closeMenus}
            >
              {audioOptions.map((option) => (
                <PlayerMenuRadioOption
                  key={option.value}
                  label={option.label}
                  detail={
                    option.language
                      ? `زبان: ${option.language.toUpperCase()}`
                      : undefined
                  }
                  selected={selectedAudio === option.value}
                  onSelect={() => onSelectAudio(option.value)}
                />
              ))}
            </PlayerMenu>
          ) : null}

          {subtitleOptions.length > 0 ? (
            <PlayerMenu
              menuId="subtitle"
              title="زیرنویس"
              isOpen={openMenu === "subtitle"}
              triggerLabel={subtitleTriggerLabel}
              triggerClassName={menuTriggerClass}
              onOpen={() => {
                setSubtitlePanel("tracks");
                openMenuExclusive("subtitle");
              }}
              onClose={closeMenus}
              footer={
                subtitlePanel === "tracks" ? (
                  <button
                    type="button"
                    data-player-menu-item
                    tabIndex={0}
                    onClick={() => setSubtitlePanel("settings")}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white transition hover:bg-white/[0.05]"
                  >
                    <HiChevronLeft className="h-5 w-5 rotate-180 text-[#8ea4b3]" aria-hidden />
                    <span className="inline-flex items-center gap-2">
                      <span>تنظیمات</span>
                      <HiOutlineCog className="h-5 w-5" />
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    data-player-menu-item
                    tabIndex={0}
                    onClick={() => setSubtitlePanel("tracks")}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[#d6e3ea] transition hover:bg-white/[0.05]"
                  >
                    <HiChevronLeft className="h-5 w-5 rotate-180" aria-hidden />
                    <span>بازگشت به لیست زیرنویس</span>
                  </button>
                )
              }
            >
              {subtitlePanel === "tracks" ? (
                subtitleOptions.map((option) => (
                  <PlayerMenuRadioOption
                    key={option.value}
                    label={option.label}
                    selected={selectedSubtitle === option.value}
                    onSelect={() => onSelectSubtitle(option.value)}
                  />
                ))
              ) : (
                <div className="space-y-3 px-1 py-1">
                  <div>
                    <p className="mb-2 px-2 text-xs text-[#8ea4b3]">اندازه متن</p>
                    <div className="space-y-0.5">
                      {subtitleFontSizeOptions.map((option) => (
                        <PlayerMenuRadioOption
                          key={option.value}
                          label={option.label}
                          selected={subtitleFontSize === option.value}
                          onSelect={() =>
                            onSubtitleStyleChange({ fontSize: option.value })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 px-2 text-xs text-[#8ea4b3]">رنگ متن</p>
                    <div className="space-y-0.5">
                      {subtitleColorOptions.map((option) => (
                        <PlayerMenuRadioOption
                          key={option.value}
                          label={option.label}
                          selected={subtitleFontColor === option.value}
                          onSelect={() =>
                            onSubtitleStyleChange({ fontColor: option.value })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 px-2 text-xs text-[#8ea4b3]">پس‌زمینه</p>
                    <div className="space-y-0.5">
                      {subtitleBackgroundOptions.map((option) => (
                        <PlayerMenuRadioOption
                          key={option.value}
                          label={option.label}
                          selected={subtitleBackground === option.value}
                          onSelect={() =>
                            onSubtitleStyleChange({ background: option.value })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="px-2 pb-1 pt-1">
                    <label className="text-xs text-[#8ea4b3]">
                      تأخیر نمایش: {subtitleDelay.toFixed(1)} ثانیه
                    </label>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.1"
                      value={subtitleDelay}
                      onChange={(e) => onSubtitleDelayChange(Number(e.target.value))}
                      className="mt-2 w-full accent-[#38bdf8]"
                    />
                  </div>
                </div>
              )}
            </PlayerMenu>
          ) : null}

          <PlayerMenu
            menuId="speed"
            title="سرعت پخش"
            isOpen={openMenu === "speed"}
            triggerLabel={`سرعت: ${playbackRate}x`}
            triggerClassName={menuTriggerClass}
            onOpen={() => openMenuExclusive("speed")}
            onClose={closeMenus}
          >
            {playbackRates.map((rate) => (
              <PlayerMenuRadioOption
                key={rate.value}
                label={rate.label}
                selected={playbackRate === rate.value}
                onSelect={() => onSelectSpeed(rate.value)}
              />
            ))}
          </PlayerMenu>

          {canUsePiP ? (
            <button
              type="button"
              onClick={onTogglePiP}
              aria-label="تصویر در تصویر"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            >
              <MdPictureInPictureAlt className="h-5 w-5" />
            </button>
          ) : null}

          <button
            type="button"
            data-player-controls
            tabIndex={0}
            onClick={onToggleFullscreen}
            aria-label="تمام‌صفحه"
            className={iconButtonClass}
          >
            <HiOutlineArrowsExpand className={smallIconClass} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const ControlBar = memo(ControlBarComponent);
