import type { ApiResponse } from "./api";

export function adminApiErrorMessage(
  response: ApiResponse<unknown>,
  fallback: string,
): string {
  if (response.status === 401) {
    return "نشست شما منقضی شده است. دوباره وارد شوید.";
  }

  if (response.status === 403) {
    return "دسترسی ادمین ندارید. یک‌بار خارج شوید و با حساب ادمین دوباره وارد شوید.";
  }

  return response.message || fallback;
}

export function unwrapAdminListPayload<T extends object>(
  response: ApiResponse<unknown>,
  key: string,
): T | null {
  if (!response.success) {
    return null;
  }

  const root = response.data;

  if (root && typeof root === "object" && key in root) {
    return root as T;
  }

  const nested = (root as { data?: Record<string, unknown> } | undefined)?.data;

  if (nested && typeof nested === "object" && key in nested) {
    return nested as T;
  }

  return null;
}
