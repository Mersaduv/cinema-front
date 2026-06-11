"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { HiChevronUp } from "react-icons/hi2";
import { useFilterDropdownPosition } from "./useFilterDropdownPosition";

const FILTER_DROPDOWN_OPEN_EVENT = "cinema:filter-dropdown-open";

export default function FilterDropdown({
  label,
  valueLabel,
  children,
  className = "",
  panelClassName = "",
  minWidth = "220px",
  fitContent = false,
  allowHorizontalScroll = false,
  panelOverflow = "hidden",
}: {
  label: string;
  valueLabel?: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  minWidth?: string;
  fitContent?: boolean;
  allowHorizontalScroll?: boolean;
  panelOverflow?: "hidden" | "visible";
}) {
  const dropdownId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const position = useFilterDropdownPosition({
    open,
    triggerRef,
    panelRef,
    minWidth,
    fitContent,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const onAnotherOpen = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== dropdownId) {
        setOpen(false);
      }
    };

    window.addEventListener(FILTER_DROPDOWN_OPEN_EVENT, onAnotherOpen);
    return () => window.removeEventListener(FILTER_DROPDOWN_OPEN_EVENT, onAnotherOpen);
  }, [dropdownId]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(FILTER_DROPDOWN_OPEN_EVENT, { detail: dropdownId }),
    );
  }, [dropdownId, open]);

  const panel =
    open && mounted && position ? (
      <div
        ref={panelRef}
        dir="rtl"
        className={`fixed z-[120] rounded-xl border border-white/10 bg-[#0d1118]/98 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl ${panelOverflow === "visible" ? "overflow-visible" : "overflow-hidden"} ${panelClassName}`}
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxWidth: position.maxWidth,
          maxHeight: position.maxHeight,
        }}
      >
        <div
          className={`max-h-[inherit] w-full overscroll-contain ${
            panelOverflow === "visible"
              ? "overflow-visible"
              : allowHorizontalScroll
                ? "overflow-x-auto overflow-y-auto"
                : "overflow-x-hidden overflow-y-auto"
          }`}
        >
          {children}
        </div>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-sm transition ${
          open
            ? "border-[#3b82f6]/50 bg-[#0d1118] text-white"
            : "border-white/10 bg-[#0d1118] text-white/90 hover:border-white/20"
        }`}
      >
        <span className="truncate text-right font-medium">{valueLabel || label}</span>
        <HiChevronUp
          aria-hidden
          className={`h-5 w-5 shrink-0 text-white/55 transition-transform duration-200 ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>

      {panel && typeof document !== "undefined"
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
