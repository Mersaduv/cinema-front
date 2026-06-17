import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SeekBar } from "../components/SeekBar";
import { usePlayerStore } from "../store/playerStore";

describe("SeekBar", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      duration: 120,
      currentTime: 30,
      bufferedEnd: 60,
      fsmState: "playing",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not call onSeekCommit during drag — only on pointerup", () => {
    const onSeekCommit = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();

    render(
      <SeekBar
        onSeekCommit={onSeekCommit}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />,
    );

    const slider = screen.getByRole("slider");

    fireEvent.pointerDown(slider, { clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 50, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 90, pointerId: 1 });

    expect(onSeekCommit).not.toHaveBeenCalled();
    expect(onDragStart).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(window, { clientX: 90, pointerId: 1 });

    expect(onSeekCommit).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
