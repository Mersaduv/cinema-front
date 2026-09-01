export const STAFF_ACCESS_COOKIE = "cinema_staff_access";
export const STAFF_ACCESS_COOKIE_VALUE = "1";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function setStaffAccessCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${STAFF_ACCESS_COOKIE}=${STAFF_ACCESS_COOKIE_VALUE}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearStaffAccessCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${STAFF_ACCESS_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
