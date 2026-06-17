const TAB_SESSION_KEY = "cinema_progress_tab_id";

/** Per-tab session id for deduplication metadata. */
export class SessionGuard {
  readonly tabId: string;

  constructor() {
    if (typeof window === "undefined") {
      this.tabId = "ssr";
      return;
    }

    const existing = window.sessionStorage.getItem(TAB_SESSION_KEY);
    if (existing) {
      this.tabId = existing;
      return;
    }

    const id = crypto.randomUUID();
    window.sessionStorage.setItem(TAB_SESSION_KEY, id);
    this.tabId = id;
  }
}
