import { randomUUID } from "../../../lib/random-id";
import { DEVICE_ID_KEY } from "./progressKeys";

/** Stable anonymous device fingerprint stored in localStorage. */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const stored = window.localStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      return stored;
    }

    const id = randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return randomUUID();
  }
}
