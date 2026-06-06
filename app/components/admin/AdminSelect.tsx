"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiCheck, HiOutlineChevronDown } from "react-icons/hi";

export interface AdminSelectOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
}

interface AdminSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const VIEWPORT_MARGIN = 12;
const MENU_GAP = 12;
const MIN_MENU_HEIGHT = 160;
const DEFAULT_OPTION_HEIGHT = 56;

export default function AdminSelect({
  value,
  onChange,
  options,
  placeholder = "انتخاب کنید",
  disabled = false,
  className = "",
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const isOpen = open && !disabled;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const triggerRect = buttonRef.current?.getBoundingClientRect();

      if (!triggerRect) {
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const availableBelow = Math.max(
        0,
        viewportHeight - triggerRect.bottom - VIEWPORT_MARGIN - MENU_GAP,
      );
      const availableAbove = Math.max(
        0,
        triggerRect.top - VIEWPORT_MARGIN - MENU_GAP,
      );
      const estimatedMenuHeight = Math.min(
        420,
        Math.max(MIN_MENU_HEIGHT, options.length * DEFAULT_OPTION_HEIGHT),
      );
      const measuredHeight = listboxRef.current?.offsetHeight ?? estimatedMenuHeight;
      const preferredOpenDown = availableBelow >= availableAbove;
      const maxHeight = Math.max(
        MIN_MENU_HEIGHT,
        preferredOpenDown ? availableBelow : availableAbove,
      );
      const resolvedHeight = Math.min(measuredHeight, maxHeight);

      const initialTop = preferredOpenDown
        ? triggerRect.bottom + MENU_GAP
        : triggerRect.top - MENU_GAP - resolvedHeight;
      const top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(initialTop, viewportHeight - VIEWPORT_MARGIN - resolvedHeight),
      );
      const width = Math.min(
        triggerRect.width,
        viewportWidth - VIEWPORT_MARGIN * 2,
      );
      const left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(triggerRect.left, viewportWidth - VIEWPORT_MARGIN - width),
      );

      setDropdownPosition({
        top,
        left,
        width,
        maxHeight,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !listboxRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const dropdown = isOpen && dropdownPosition
    ? createPortal(
        <div
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          style={{
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
          }}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1821] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <div
            className="space-y-1 overflow-y-auto"
            style={{ maxHeight: dropdownPosition.maxHeight }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-right transition ${
                    isSelected
                      ? "bg-[#f5c518]/12 text-white"
                      : "bg-transparent text-[#dbe6ed] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    {(option.description || option.meta) && (
                      <span className="mt-1 block text-xs leading-6 text-[#8ea4b3]">
                        {option.description || option.meta}
                      </span>
                    )}
                  </span>
                  <span
                    className={`mt-0.5 rounded-full p-1 ${
                      isSelected ? "bg-[#f5c518]/20 text-[#f8d977]" : "text-transparent"
                    }`}
                  >
                    <HiCheck className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-right transition ${
          isOpen
            ? "border-[#38bdf8]/45 bg-white/[0.08]"
            : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <HiOutlineChevronDown
          className={`h-5 w-5 shrink-0 text-[#8ea4b3] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdown}
    </div>
  );
}
