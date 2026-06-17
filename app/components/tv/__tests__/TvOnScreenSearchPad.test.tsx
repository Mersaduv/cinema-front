import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TvOnScreenSearchPad, { needsOnScreenSearchKeyboard } from "../TvOnScreenSearchPad";

describe("needsOnScreenSearchKeyboard", () => {
  it("is enabled only for roku and generic platforms", () => {
    expect(needsOnScreenSearchKeyboard("roku")).toBe(true);
    expect(needsOnScreenSearchKeyboard("generic")).toBe(true);
    expect(needsOnScreenSearchKeyboard("tizen")).toBe(false);
    expect(needsOnScreenSearchKeyboard("webos")).toBe(false);
    expect(needsOnScreenSearchKeyboard("androidtv")).toBe(false);
  });
});

describe("TvOnScreenSearchPad", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Persian character rows and updates value", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TvOnScreenSearchPad
        open
        value=""
        onChange={onChange}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("ا")).toBeTruthy();
    expect(screen.getByText("ی")).toBeTruthy();

    fireEvent.click(screen.getByText("ا"));
    expect(onChange).toHaveBeenCalledWith("ا");

    fireEvent.click(screen.getByText("⌫"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
