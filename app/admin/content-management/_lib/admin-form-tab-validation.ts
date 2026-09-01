export type TabFieldIssue = {
  field: string;
  message: string;
};

export function issuesToErrorMap(issues: TabFieldIssue[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const issue of issues) {
    if (!map[issue.field]) {
      map[issue.field] = issue.message;
    }
  }

  return map;
}

export function scrollToFormField(field: string) {
  window.requestAnimationFrame(() => {
    const element = document.querySelector(`[data-form-field="${field}"]`);

    if (!(element instanceof HTMLElement)) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });

    const focusable = element.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])",
    );

    focusable?.focus({ preventScroll: true });
  });
}

export function formFieldBorderClass(hasError: boolean, baseClass = "border-white/10") {
  return hasError ? "border-red-400/70 focus:border-red-400" : baseClass;
}
