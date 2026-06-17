import {
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";
import type {
  SubtitleBackground,
  SubtitleFontColor,
  SubtitleFontSize,
} from "../types/player.types";

type SubtitleLayerProps = {
  fontSize: SubtitleFontSize;
  fontColor: SubtitleFontColor;
  background: SubtitleBackground;
};

export type SubtitleLayerHandle = {
  updateLines: (lines: string[]) => void;
};

const fontSizeMap: Record<SubtitleFontSize, string> = {
  large: "clamp(1.2rem, 2vw, 1.8rem)",
  medium: "clamp(1rem, 1.65vw, 1.45rem)",
  small: "clamp(0.92rem, 1.3vw, 1.2rem)",
};

const colorMap: Record<SubtitleFontColor, string> = {
  black: "#000000",
  white: "#ffffff",
  yellow: "#fde047",
};

const backgroundMap: Record<SubtitleBackground, string> = {
  black: "rgba(0, 0, 0, 0.82)",
  white: "rgba(255, 255, 255, 0.82)",
  transparent: "transparent",
};

function linesEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((line, index) => line === b[index]);
}

/** Custom subtitle overlay renderer with imperative line updates. */
const SubtitleLayerComponent = forwardRef(function SubtitleLayer(
  { fontSize, fontColor, background }: SubtitleLayerProps,
  ref: Ref<SubtitleLayerHandle>,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<string[]>([]);

  useImperativeHandle(ref, () => ({
    updateLines(lines: string[]) {
      if (linesEqual(lines, linesRef.current)) {
        return;
      }

      linesRef.current = lines;
      const root = rootRef.current;
      const container = containerRef.current;
      if (!root || !container) {
        return;
      }

      if (lines.length === 0) {
        root.style.display = "none";
        container.replaceChildren();
        return;
      }

      root.style.display = "";
      container.replaceChildren(
        ...lines.map((line) => {
          const paragraph = document.createElement("p");
          paragraph.className = "whitespace-pre-wrap";
          paragraph.textContent = line;
          return paragraph;
        }),
      );
    },
  }));

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-4 md:bottom-28 md:px-10"
      aria-live="polite"
      style={{ display: "none" }}
    >
      <div
        ref={containerRef}
        className="max-w-5xl rounded-2xl px-4 py-2 text-center font-bold leading-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        dir="rtl"
        style={{
          fontSize: fontSizeMap[fontSize],
          color: colorMap[fontColor],
          backgroundColor: backgroundMap[background],
        }}
      />
    </div>
  );
});

export const SubtitleLayer = memo(SubtitleLayerComponent);
