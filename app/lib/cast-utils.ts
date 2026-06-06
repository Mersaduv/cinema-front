export interface CastOrderable {
  order?: number | null;
  name?: string | null;
}

function compareCastOrder(first: CastOrderable, second: CastOrderable) {
  const firstOrder =
    typeof first.order === "number" ? first.order : Number.MAX_SAFE_INTEGER;
  const secondOrder =
    typeof second.order === "number" ? second.order : Number.MAX_SAFE_INTEGER;

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  return (first.name || "").localeCompare(second.name || "", "fa");
}

export function sortCastByOrder<T extends CastOrderable>(items: T[]): T[] {
  return [...items].sort(compareCastOrder);
}

export function sortCastRows<T, A extends CastOrderable>(
  items: T[],
  pickActor: (item: T) => A,
): T[] {
  return [...items].sort((first, second) =>
    compareCastOrder(pickActor(first), pickActor(second)),
  );
}
