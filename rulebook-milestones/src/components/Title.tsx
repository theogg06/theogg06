import React from "react";
import { interpolate } from "remotion";
import { CANVAS, LAYOUT } from "../lib/geometry";
import { FONT_FAMILY, theme, type } from "../lib/theme";
import { ramp, TIMING } from "../lib/timing";

type Props = { kicker: string; heading: string; frame: number };

/** "Figure 3 / Rulebook milestones" header with its hairline rule. */
export const Title: React.FC<Props> = ({ kicker, heading, frame }) => {
  const p = ramp(frame, TIMING.titleIn[0], TIMING.titleIn[1]);
  const rule = ramp(frame, 6, 30);
  const x = LAYOUT.panel.x;
  return (
    <g id="title">
      <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [10, 0])})`}>
        <text
          id="title-kicker"
          x={x}
          y={62}
          fontFamily={FONT_FAMILY}
          fontWeight={700}
          fontSize={type.kicker}
          fill={theme.titleColor}
        >
          {kicker}
        </text>
        <text
          id="title-heading"
          x={x}
          y={101}
          fontFamily={FONT_FAMILY}
          fontWeight={400}
          fontSize={type.heading}
          fill={theme.titleColor}
        >
          {heading}
        </text>
      </g>
      <line
        id="title-rule"
        x1={x}
        x2={x + (CANVAS.width - 2 * x) * rule}
        y1={LAYOUT.rule.y}
        y2={LAYOUT.rule.y}
        stroke={theme.ruleColor}
        strokeWidth={1.5}
      />
    </g>
  );
};
