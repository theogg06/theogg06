import React from "react";
import { interpolate, spring } from "remotion";
import type { MilestoneData, RowStyle } from "../data/types";
import { LAYOUT } from "../lib/geometry";
import { theme } from "../lib/theme";
import { ramp } from "../lib/timing";
import { AnimatedLabel, labelHeight } from "./AnimatedLabel";

type Props = {
  milestone: MilestoneData;
  row: RowStyle;
  /** Frames since the drawing head reached this milestone (negative = not yet). */
  t: number;
  fps: number;
  layer: "labels" | "marker";
};

/**
 * A white marker on the band plus one or two dated labels joined to it by
 * dotted connectors. Rendered in two layers so markers sit above the band.
 */
export const Milestone: React.FC<Props> = ({ milestone, row, t, fps, layer }) => {
  const y = LAYOUT.rowY[milestone.row];
  const half = LAYOUT.band / 2;

  if (layer === "marker") {
    const pop = spring({ frame: t, fps, config: { damping: 200 }, durationInFrames: 14 });
    const scale = interpolate(pop, [0, 1], [0.4, 1]);
    return (
      <g
        id={`${milestone.id}-marker`}
        opacity={interpolate(t, [0, 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        transform={`translate(${milestone.x} ${y}) scale(${scale})`}
      >
        <circle r={12} fill={theme.marker} filter="url(#marker-shadow)" />
      </g>
    );
  }

  return (
    <g id={`${milestone.id}-labels`}>
      {milestone.labels.map((label, i) => {
        const h = labelHeight(label.lines.length);
        const above = label.side === "above";
        const top = above ? y - half - LAYOUT.textGap - h : y + half + LAYOUT.textGap;
        const lineStart = above ? y - half : y + half;
        const lineEnd = above ? top + 3 : top + h - 2;
        const lineP = ramp(t, 3, 15);
        const x = label.text === "after" ? milestone.x + 12 : milestone.x - 12;
        return (
          <g key={i} id={`${milestone.id}-${label.side}`}>
            <line
              x1={milestone.x}
              x2={milestone.x}
              y1={lineStart}
              y2={lineStart + (lineEnd - lineStart) * lineP}
              stroke={row.text}
              strokeOpacity={0.75}
              strokeWidth={2}
              strokeDasharray="2 5"
              strokeLinecap="round"
              opacity={lineP > 0 ? 1 : 0}
            />
            <AnimatedLabel
              id={`${milestone.id}-${label.side}-text`}
              x={x}
              top={top}
              anchor={label.text === "after" ? "start" : "end"}
              color={row.text}
              date={label.date}
              lines={label.lines}
              t={t}
              drift={above ? 1 : -1}
            />
          </g>
        );
      })}
    </g>
  );
};
