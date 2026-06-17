type PlayerMenuRadioOptionProps = {
  label: string;
  selected: boolean;
  onSelect: () => void;
  detail?: string;
};

/** Radio-style row for player dropdown menus (RTL). */
export function PlayerMenuRadioOption({
  label,
  selected,
  onSelect,
  detail,
}: PlayerMenuRadioOptionProps) {
  return (
    <button
      type="button"
      data-player-menu-item
      tabIndex={0}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right transition ${
        selected ? "text-white" : "text-[#d6e3ea] hover:bg-white/[0.05]"
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{label}</span>
        {/* {detail ? (
          <span className="mt-0.5 text-xs text-[#8ea4b3]">{detail}</span>
        ) : null} */}
      </span>
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-[#38bdf8]" : "border-white/35"
        }`}
        aria-hidden
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" /> : null}
      </span>
    </button>
  );
}
