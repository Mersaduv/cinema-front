"use client";

import { HiOutlineVolumeUp } from "react-icons/hi";

type PlaybackSubtitleDubFieldsProps = {
  playbackProtocol: "hls" | "mp4";
  subtitleUrl: string;
  dubbedAudioUrl: string;
  hasSubtitle: boolean;
  hasDubbed: boolean;
  onSubtitleUrlChange: (value: string) => void;
  onDubbedAudioUrlChange: (value: string) => void;
  onHasSubtitleChange: (value: boolean) => void;
  onHasDubbedChange: (value: boolean) => void;
  ltrInputClass?: string;
};

export default function PlaybackSubtitleDubFields({
  playbackProtocol,
  subtitleUrl,
  dubbedAudioUrl,
  hasSubtitle,
  hasDubbed,
  onSubtitleUrlChange,
  onDubbedAudioUrlChange,
  onHasSubtitleChange,
  onHasDubbedChange,
  ltrInputClass = "",
}: PlaybackSubtitleDubFieldsProps) {
  return (
    <>
      <label className="block md:col-span-2">
        <span className="mb-2 flex flex-wrap items-center gap-3 text-sm text-[#8ea4b3]">
          <span>
            لینک زیرنویس{" "}
            <span className="font-normal text-[#607684]">(اختیاری — VTT یا SRT)</span>
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#d6e2e9]">
            <input
              type="checkbox"
              checked={hasSubtitle}
              onChange={(event) => onHasSubtitleChange(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#071019] text-[#f5c518] focus:ring-[#f5c518]/40"
            />
          </label>
        </span>
        <input
          type="text"
          dir="ltr"
          value={subtitleUrl}
          onChange={(event) => onSubtitleUrlChange(event.target.value)}
          placeholder="https://cdn.example.com/subtitles/fa.vtt یا .srt"
          className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrInputClass}`}
        />
        <p className="mt-2 text-xs text-[#8ea4b3]">
          اگر زیرنویس در خود ویدیو چسبیده است، تیک را بزنید؛ نیازی به مسیر جدا نیست.
        </p>
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 flex flex-wrap items-center gap-3 text-sm text-[#8ea4b3]">
          <span className="inline-flex items-center gap-2">
            <HiOutlineVolumeUp className="h-4 w-4" />
            {playbackProtocol === "mp4"
              ? "لینک فایل صوتی دوبله"
              : "لینک پلی‌لیست صوتی دوبله (از پکیج HLS)"}{" "}
            <span className="font-normal text-[#607684]">(اختیاری)</span>
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#d6e2e9]">
            <input
              type="checkbox"
              checked={hasDubbed}
              onChange={(event) => onHasDubbedChange(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#071019] text-[#f5c518] focus:ring-[#f5c518]/40"
            />
          </label>
        </span>
        <input
          type="text"
          dir="ltr"
          value={dubbedAudioUrl}
          onChange={(event) => onDubbedAudioUrlChange(event.target.value)}
          placeholder={
            playbackProtocol === "mp4"
              ? "https://cdn.example.com/audio/fa.mp3 یا .m4a / .aac"
              : "معمولاً audio/fa/index.m3u8 — با ست شدن HLS پر می‌شود"
          }
          className={`w-full rounded-2xl border border-white/10 bg-[#071019] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f5c518]/45 ${ltrInputClass}`}
        />
        {playbackProtocol === "mp4" ? (
          <p className="mt-2 text-xs text-[#8ea4b3]">
            برای MP4 خارجی، فایل progressive صوتی بگذارید؛ برای دوبله داخل خود MP4 فقط تیک را فعال
            کنید.
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#8ea4b3]">
            برای چندراهه HLS، تیک «دوبله داخل فایل» کافی است؛ پلیر بین صوت‌ها جابه‌جا می‌شود.
          </p>
        )}
      </label>
    </>
  );
}
