"use client";

import { useEffect, useRef, type ReactNode } from "react";

type PlayerMenuProps = {
  menuId: string;
  title: string;
  isOpen: boolean;
  triggerLabel: string;
  triggerClassName?: string;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Dropdown menu for player settings — closes on outside click. */
export function PlayerMenu({
  menuId,
  title,
  isOpen,
  triggerLabel,
  triggerClassName,
  onOpen,
  onClose,
  children,
  footer,
}: PlayerMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={rootRef} className="relative" dir="rtl" data-player-menu={menuId}>
      <button
        type="button"
        data-player-controls
        tabIndex={0}
        onClick={() => (isOpen ? onClose() : onOpen())}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={
          triggerClassName ??
          "inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-black/35 px-4 text-sm text-white transition hover:border-white/20 hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
        }
      >
        {triggerLabel}
      </button>
      {isOpen ? (
        <div
          role="listbox"
          aria-label={title}
          className="absolute bottom-[calc(100%+10px)] left-0 z-40 min-w-[248px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/96 shadow-[0_20px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <div className="max-h-64 space-y-0.5 overflow-y-auto px-2 py-2">{children}</div>
          {footer ? (
            <div className="border-t border-white/10 px-2 py-2">{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
