/** True when the touch/click target is player chrome — skip video-area gestures. */
export function isPlayerChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "[data-player-controls]",
        "[data-player-menu]",
        "[data-player-menu-item]",
        "[data-player-menu-scroll]",
        "[data-episode-panel]",
        "button",
        "a",
        "input",
        "select",
        "textarea",
        "label",
        '[role="slider"]',
        '[role="listbox"]',
        '[role="option"]',
        '[role="menu"]',
        '[role="menuitem"]',
        '[role="dialog"]',
      ].join(", "),
    ),
  );
}
