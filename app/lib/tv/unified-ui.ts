/**
 * Unified TV UI (Movieland-style): same desktop chrome on TV browsers.
 * Playback/CSS/remote-focus layers stay TV-aware via useIsTvCompat().
 *
 * Set NEXT_PUBLIC_UNIFIED_TV_UI=0 to restore the legacy TvSidebarNav shell.
 */
export function isUnifiedTvUiEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_UNIFIED_TV_UI?.trim().toLowerCase();

  if (raw === "0" || raw === "false" || raw === "off" || raw === "legacy") {
    return false;
  }

  return true;
}

/** Legacy sidebar + TvFilterSheet shell is active on TV. */
export function isLegacyTvUiEnabled(): boolean {
  return !isUnifiedTvUiEnabled();
}
