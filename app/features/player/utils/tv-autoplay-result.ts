/**
 * Play gate is shown when silent autoplay fails (common after soft navigation).
 * TV and browser both need a one-tap start when the gesture window has expired.
 */
export function shouldShowTvPlayGate(
  autoplayStarted: boolean,
  _isTv: boolean,
): boolean {
  return !autoplayStarted;
}
