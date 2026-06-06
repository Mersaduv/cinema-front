export function normalizeListItemLabel(item: unknown): string {
  if (typeof item === "string") {
    return item.trim();
  }

  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;

    if (typeof record.name === "string") {
      return record.name.trim();
    }

    if (typeof record.label === "string") {
      return record.label.trim();
    }
  }

  return String(item ?? "").trim();
}

export function normalizeStringList(values: unknown[]): string[] {
  const seen = new Set<string>();

  return values
    .map(normalizeListItemLabel)
    .filter((label) => {
      if (!label || seen.has(label)) {
        return false;
      }

      seen.add(label);
      return true;
    });
}
