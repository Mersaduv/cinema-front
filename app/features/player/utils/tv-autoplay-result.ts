/**
 * TV play gate is shown only when silent autoplay fails on a TV-class device.
 * Browser shells (Tizen / webOS) attempt autoplay first; gate is the fallback.
 */
export function shouldShowTvPlayGate(
  autoplayStarted: boolean,
  isTv: boolean,
): boolean {
  return !autoplayStarted && isTv;
}
