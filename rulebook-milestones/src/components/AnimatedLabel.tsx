import React from "react";
import { FONT_FAMILY, type } from "../lib/theme";
import { ramp } from "../lib/timing";

export const labelHeight = (lines: number) => type.dateLine + lines * type.descriptionLine;

type Props = {
  id: string;
  x: number;
  top: number;
  anchor: "start" | "end";
  color: string;
  date: string;
  lines: string[];
  /** Frames since the label's milestone was reached by the drawing head. */
  t: number;
  /** Direction (+1 down / -1 up) the text drifts in from. */
  drift: number;
};

/** Bold date heading followed by its description, revealed in two beats. */
export const AnimatedLabel: React.FC<Props> = ({
  id,
  x,
  top,
  anchor,
  color,
  date,
  lines,
  t,
  drift,
}) => {
  const dateP = ramp(t, 5, 17);
  const descP = ramp(t, 10, 24);
  return (
    <g id={id}>
      <text
        x={x}
        y={top + 24}
        opacity={dateP}
        transform={`translate(0 ${(1 - dateP) * 8 * drift})`}
        textAnchor={anchor}
        fontFamily={FONT_FAMILY}
        fontWeight={700}
        fontSize={type.date}
        fill={color}
      >
        {date}
      </text>
      <text
        x={x}
        y={top + type.dateLine + 21}
        opacity={descP}
        transform={`translate(0 ${(1 - descP) * 6 * drift})`}
        textAnchor={anchor}
        fontFamily={FONT_FAMILY}
        fontWeight={400}
        fontSize={type.description}
        fill={color}
      >
        {lines.map((line, i) => (
          <tspan key={line} x={x} dy={i === 0 ? 0 : type.descriptionLine}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};
