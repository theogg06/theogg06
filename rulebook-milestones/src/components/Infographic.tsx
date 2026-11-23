import React from "react";
import type { InfographicData } from "../data/types";
import { CANVAS, LAYOUT, sOnRow } from "../lib/geometry";
import { FONT_FAMILY, theme, type } from "../lib/theme";
import { drawnLength, ramp, reachFrame } from "../lib/timing";
import { AnimatedTimeline, tagWidth } from "./AnimatedTimeline";
import { Milestone } from "./Milestone";
import { Title } from "./Title";

type Props = {
  data: InfographicData;
  frame: number;
  fps: number;
  /** Render the finished figure without masks (for the editable SVG export). */
  isStatic?: boolean;
};

/**
 * The full figure as one SVG. Every element is a pure function of `frame`,
 * so the same tree renders the video frames and the static SVG export.
 */
export const Infographic: React.FC<Props> = ({ data, frame, fps, isStatic }) => {
  const { panel } = LAYOUT;
  const lastRow = LAYOUT.rowY.length - 1;
  const half = LAYOUT.band / 2;

  const firstTag = data.tags[data.meetingsCaption.tagIndex];
  const captionT = frame - reachFrame(sOnRow(firstTag.row, firstTag.x));
  const captionP = ramp(captionT, 4, 18);
  const captionX = firstTag.x - tagWidth(firstTag.label) / 2;
  const captionY = LAYOUT.rowY[firstTag.row] + half + LAYOUT.textGap;
  const captionW = 26 + data.meetingsCaption.label.length * 11.4;

  // "Next steps" items appear as the head approaches the end of the band.
  const nextT = frame - reachFrame(sOnRow(lastRow, LAYOUT.startX + 260));
  const nextTop = LAYOUT.rowY[lastRow] + half + LAYOUT.textGap;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={CANVAS.width}
      height={CANVAS.height}
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
    >
      <defs>
        <linearGradient id="panel-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={theme.panelLight} />
          <stop offset="0.55" stopColor={theme.panelMid} />
          <stop offset="1" stopColor={theme.panelDeep} />
        </linearGradient>
        <radialGradient id="panel-glow" cx="0.3" cy="0.35" r="0.55">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="panel-haze" cx="0.95" cy="0.9" r="0.45">
          <stop offset="0" stopColor="#b9d1f0" stopOpacity={0.55} />
          <stop offset="1" stopColor="#b9d1f0" stopOpacity={0} />
        </radialGradient>
        <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#0b1f5c" floodOpacity="0.3" />
        </filter>
      </defs>

      <rect id="page" width={CANVAS.width} height={CANVAS.height} fill={theme.pageBackground} />
      <g id="panel">
        <rect x={panel.x} y={panel.y} width={panel.width} height={panel.height} fill="url(#panel-fill)" />
        <rect x={panel.x} y={panel.y} width={panel.width} height={panel.height} fill="url(#panel-glow)" />
        <rect x={panel.x} y={panel.y} width={panel.width} height={panel.height} fill="url(#panel-haze)" />
      </g>

      <Title kicker={data.title.kicker} heading={data.title.heading} frame={frame} />

      <g id="milestone-labels">
        {data.milestones.map((m) => (
          <Milestone
            key={m.id}
            milestone={m}
            row={data.rows[m.row]}
            t={frame - reachFrame(sOnRow(m.row, m.x))}
            fps={fps}
            layer="labels"
          />
        ))}
      </g>

      <AnimatedTimeline data={data} drawn={drawnLength(frame)} isStatic={isStatic} />

      <g id="milestone-markers">
        {data.milestones.map((m) => (
          <Milestone
            key={m.id}
            milestone={m}
            row={data.rows[m.row]}
            t={frame - reachFrame(sOnRow(m.row, m.x))}
            fps={fps}
            layer="marker"
          />
        ))}
      </g>

      <g
        id="rdg-meetings-caption"
        opacity={captionP}
        transform={`translate(0 ${(1 - captionP) * -6})`}
      >
        <rect x={captionX} y={captionY} width={captionW} height={34} fill={theme.pink} />
        <text
          x={captionX + 13}
          y={captionY + 24}
          fontFamily={FONT_FAMILY}
          fontWeight={600}
          fontSize={type.caption}
          fill="#fff"
        >
          {data.meetingsCaption.label}
        </text>
      </g>

      <g id="next-steps">
        {data.nextSteps.lines.map((line, i) => {
          const p = ramp(nextT, 4 + i * 5, 18 + i * 5);
          return (
            <text
              key={line}
              x={LAYOUT.startX + 36}
              y={nextTop + 21 + i * type.descriptionLine}
              opacity={p}
              transform={`translate(0 ${(1 - p) * -6})`}
              fontFamily={FONT_FAMILY}
              fontWeight={400}
              fontSize={type.description}
              fill={data.rows[lastRow].text}
            >
              {line}
            </text>
          );
        })}
      </g>
    </svg>
  );
};
