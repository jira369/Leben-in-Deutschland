import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Timer } from "../timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders countdown time correctly", () => {
    const now = Date.now();
    render(
      <Timer mode="countdown" initialSeconds={3600} startTime={now} />,
    );
    // 3600 seconds = 1 hour, formatted as h:mm:ss
    expect(screen.getByText("1:00:00")).toBeInTheDocument();
  });

  it("renders countup starting from 0", () => {
    const now = Date.now();
    render(<Timer mode="countup" startTime={now} />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("counts down over time", () => {
    const now = Date.now();
    render(
      <Timer mode="countdown" initialSeconds={3600} startTime={now} />,
    );

    // Advance 10 seconds
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText("59:50")).toBeInTheDocument();
  });

  it("counts up over time", () => {
    const now = Date.now();
    render(<Timer mode="countup" startTime={now} />);

    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    expect(screen.getByText("1:05")).toBeInTheDocument();
  });

  it("calls onTimeUp when countdown reaches 0", () => {
    const onTimeUp = vi.fn();
    const now = Date.now();
    render(
      <Timer
        mode="countdown"
        initialSeconds={5}
        startTime={now}
        onTimeUp={onTimeUp}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(6_000);
    });

    expect(onTimeUp).toHaveBeenCalled();
  });

  it("never goes below 0 in countdown", () => {
    const now = Date.now();
    render(
      <Timer mode="countdown" initialSeconds={3} startTime={now} />,
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("shows red color when <= 5 minutes remaining", () => {
    const now = Date.now();
    const { container } = render(
      <Timer mode="countdown" initialSeconds={300} startTime={now} />,
    );

    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain("text-red-600");
  });

  it("shows orange color when <= 10 minutes remaining", () => {
    const now = Date.now();
    const { container } = render(
      <Timer mode="countdown" initialSeconds={600} startTime={now} />,
    );

    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain("text-orange-600");
  });

  it("shows default color when > 10 minutes remaining", () => {
    const now = Date.now();
    const { container } = render(
      <Timer mode="countdown" initialSeconds={3600} startTime={now} />,
    );

    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain("text-muted-foreground");
  });

  it("formats hours correctly for long countup", () => {
    // Start time is 2 hours ago
    const twoHoursAgo = Date.now() - 7200_000;
    render(<Timer mode="countup" startTime={twoHoursAgo} />);
    expect(screen.getByText("2:00:00")).toBeInTheDocument();
  });
});
