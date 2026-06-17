import { describe, expect, it } from "vitest";
import {
  clusterGridRows,
  findGridFocusTarget,
  findPaginationFocusTarget,
} from "../focus";

function mockEl(left: number, top: number, width = 100, height = 100): HTMLElement {
  const el = document.createElement("button");
  el.setAttribute("data-tv-grid-item", "true");
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

describe("clusterGridRows", () => {
  it("groups items into rows by vertical position", () => {
    const a = mockEl(0, 0);
    const b = mockEl(120, 0);
    const c = mockEl(0, 150);

    const rows = clusterGridRows([c, b, a]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([a, b]);
    expect(rows[1]).toEqual([c]);
  });
});

describe("findGridFocusTarget", () => {
  it("moves down to the next row at the same column index", () => {
    const grid = document.createElement("div");
    grid.setAttribute("data-tv-grid", "poster");
    const a = mockEl(0, 0);
    const b = mockEl(120, 0);
    const c = mockEl(0, 150);
    grid.append(a, b, c);
    document.body.append(grid);

    const next = findGridFocusTarget(a, "down", grid);

    expect(next).toBe(c);
    grid.remove();
  });

  it("moves right within the same row", () => {
    const grid = document.createElement("div");
    const a = mockEl(0, 0);
    const b = mockEl(120, 0);
    grid.append(a, b);
    document.body.append(grid);

    expect(findGridFocusTarget(a, "right", grid)).toBe(b);
    grid.remove();
  });
});

describe("findPaginationFocusTarget", () => {
  it("moves from pagination up to the last grid row", () => {
    const grid = document.createElement("div");
    const a = mockEl(0, 0);
    const b = mockEl(120, 0);
    grid.append(a, b);

    const pagination = document.createElement("div");
    pagination.setAttribute("data-tv-focus-group", "pagination");
    const prev = document.createElement("button");
    prev.setAttribute("data-tv-focusable", "true");
    prev.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 200,
        right: 80,
        bottom: 240,
        width: 80,
        height: 40,
        x: 0,
        y: 200,
        toJSON: () => ({}),
      }) as DOMRect;
    const next = document.createElement("button");
    next.setAttribute("data-tv-focusable", "true");
    pagination.append(prev, next);

    const target = findPaginationFocusTarget(prev, "up", pagination, grid);

    expect(target === a || target === b).toBe(true);
  });
});
