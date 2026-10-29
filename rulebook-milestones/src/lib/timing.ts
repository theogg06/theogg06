import { Easing, interpolate } from "remotion";
import { TOTAL_LENGTH } from "./geometry";

export const FPS = 30;
export const DURATION_IN_FRAMES = 10 * FPS;

// Phase 1: 0–1 s intro. Phase 2: path drawn from 1 s to 6.5 s.
// Phase 3: remaining labels settle, then the finished figure holds (>2 s).
export const TIMING = {
  titleIn: [0, 24] as const,
  drawStart: 30,
  drawEnd: 195,
};

const drawEasing = Easing.bezier(0.42, 0, 0.58, 1);

/** Drawn length of the timeline at a given frame. */
export const drawnLength = (frame: number) =>
  interpolate(frame, [TIMING.drawStart, TIMING.drawEnd], [0, TOTAL_LENGTH], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: drawEasing,
  });

/** (Fractional) frame at which the drawing head reaches arc length s. */
export const reachFrame = (s: number) => {
  let lo = TIMING.drawStart;
  let hi = TIMING.drawEnd;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (drawnLength(mid) < s) lo = mid;
    else hi = mid;
  }
  return hi;
};

/** Eased 0→1 ramp between two frames (relative to a start). */
export const ramp = (t: number, from: number, to: number) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
