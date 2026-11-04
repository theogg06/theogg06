import React from "react";
import type { InfographicData } from "../data/types";
import {
  CENTER_PATH,
  LAYOUT,
  pointAt,
  SEGMENTS,
  segmentPath,
  sOnRow,
  subPath,
  TOTAL_LENGTH,
} from "../lib/geometry";
import { FONT_FAMILY, theme, type } from "../lib/theme";

type Props = {
  data: InfographicData;
  /** Length of the band drawn so far (0 → TOTAL_LENGTH). */
  drawn: number;
  /** Static export: no reveal mask, everything fully drawn. */
  isStatic?: boolean;
};

type Year = InfographicData["years"][number];

/** Position/rotation of a year label: row start, or following the U-turn. */
const yearPlacement = (year: Year) => {
  if (year.kind === "start") {
    const seg = SEGMENTS.find((s) => s.kind === "row" && s.row === year.row)!;
    const p = pointAt(seg.s0 + 22);
    return { transform: `translate(${p.x} ${p.y})`, anchor: "start" as const };
  }
  const bend = SEGMENTS.find((s) => s.kind === "bend" && s.after === year.row)!;
  const p = pointAt(bend.s0 + bend.length * (year.row === 0 ? 0.5 : 0.6));
  const right = bend.kind === "bend" && bend.side === "right";
  // Text reads upward on right-hand turns and downward on left-hand ones.
  const rot = right ? p.angle - 180 : p.angle;
  return {
    transform: `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${rot.toFixed(2)})`,
    anchor: "middle" as const,
  };
};

export const tagWidth = (label: string) => 16 + label.length * 10.5;

/**
 * The serpentine band with everything that lives inside it (year labels,
 * pink meeting counters, the dotted meetings line, the consultation pill and
 * the "Next steps" label). The whole group is revealed by a mask whose stroke
 * follows the centre line, driven by strokeDasharray / strokeDashoffset.
 */
export const AnimatedTimeline: React.FC<Props> = ({ data, drawn, isStatic }) => {
  const tagS = data.tags.map((tag) => sOnRow(tag.row, tag.x));
  const spanFrom = data.milestones.find((m) => m.id === data.span.fromMilestone)!;
  const spanTo = data.milestones.find((m) => m.id === data.span.toMilestone)!;
  const spanY = LAYOUT.rowY[spanFrom.row];
  const spanX1 = Math.min(spanFrom.x, spanTo.x);
  const spanX2 = Math.max(spanFrom.x, spanTo.x);
  const lastRow = LAYOUT.rowY.length - 1;

  return (
    <g id="timeline">
      <defs>
        {SEGMENTS.map((seg, i) => {
          if (seg.kind === "row") {
            const c = data.rows[seg.row];
            return (
              <linearGradient
                key={i}
                id={`band-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={seg.x1}
                y1={seg.y}
                x2={seg.x2}
                y2={seg.y}
              >
                <stop offset="0" stopColor={c.from} />
                <stop offset="1" stopColor={c.to} />
              </linearGradient>
            );
          }
          return (
            <linearGradient
              key={i}
              id={`band-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={seg.cx}
              y1={seg.cy - LAYOUT.band * 3}
              x2={seg.cx}
              y2={seg.cy + LAYOUT.band * 3}
            >
              <stop offset="0" stopColor={data.rows[seg.after].to} />
              <stop offset="1" stopColor={data.rows[seg.after + 1].from} />
            </linearGradient>
          );
        })}
        <linearGradient id="span-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={theme.mint[0]} />
          <stop offset="1" stopColor={theme.mint[1]} />
        </linearGradient>
        {/* Keeps the dotted line clear of the year labels in the U-turns. */}
        <mask id="meetings-line-gaps" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect width={1920} height={1080} fill="#fff" />
          {data.years
            .filter((y) => y.kind === "bend")
            .map((year) => (
              <rect
                key={year.label}
                transform={yearPlacement(year).transform}
                x={-38}
                y={-15}
                width={76}
                height={30}
                fill="#000"
              />
            ))}
        </mask>
        {isStatic ? null : (
          <mask id="timeline-reveal" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <path
              d={CENTER_PATH}
              fill="none"
              stroke="#fff"
              strokeWidth={84}
              strokeDasharray={`${TOTAL_LENGTH} ${TOTAL_LENGTH}`}
              strokeDashoffset={TOTAL_LENGTH - drawn}
            />
          </mask>
        )}
      </defs>

      <g mask={isStatic ? undefined : "url(#timeline-reveal)"}>
        <g id="band">
          {SEGMENTS.map((seg, i) => (
            <path
              key={i}
              id={`band-segment-${i + 1}`}
              d={segmentPath(seg, seg.kind === "row" ? 1 : 0)}
              fill="none"
              stroke={`url(#band-${i})`}
              strokeWidth={LAYOUT.band}
            />
          ))}
        </g>

        <path
          id="rdg-meetings-line"
          mask="url(#meetings-line-gaps)"
          d={subPath(tagS[data.meetingsLine.fromTag], tagS[data.meetingsLine.toTag])}
          fill="none"
          stroke={theme.pinkDots}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="0.1 9"
        />

        <g id="consultation">
          <rect
            x={spanX1}
            y={spanY - 22}
            width={spanX2 - spanX1}
            height={44}
            rx={22}
            fill="url(#span-fill)"
          />
          <text
            x={(spanX1 + spanX2) / 2}
            y={spanY + 8}
            textAnchor="middle"
            fontFamily={FONT_FAMILY}
            fontWeight={600}
            fontSize={type.span}
            fill={theme.mintText}
          >
            {data.span.label}
          </text>
        </g>

        <g id="meeting-tags">
          {data.tags.map((tag) => {
            const w = tagWidth(tag.label);
            const y = LAYOUT.rowY[tag.row];
            return (
              <g key={tag.label} id={`tag-${tag.label}`}>
                <rect x={tag.x - w / 2} y={y - 13} width={w} height={26} rx={3} fill={theme.pink} />
                <text
                  x={tag.x}
                  y={y + 6}
                  textAnchor="middle"
                  fontFamily={FONT_FAMILY}
                  fontWeight={700}
                  fontSize={type.tag}
                  fill="#fff"
                >
                  {tag.label}
                </text>
              </g>
            );
          })}
        </g>

        <g id="years">
          {data.years.map((year) => {
            const pos = yearPlacement(year);
            return (
              <text
                key={year.label}
                id={`year-${year.label}`}
                transform={pos.transform}
                y={8.5}
                textAnchor={pos.anchor}
                fontFamily={FONT_FAMILY}
                fontWeight={600}
                fontSize={type.year}
                fill="#fff"
              >
                {year.label}
              </text>
            );
          })}
        </g>

        <text
          id="next-steps-label"
          x={LAYOUT.startX + 22}
          y={LAYOUT.rowY[lastRow] + 9}
          fontFamily={FONT_FAMILY}
          fontWeight={700}
          fontSize={type.nextStepsLabel}
          fill="#fff"
        >
          {data.nextSteps.label}
        </text>
      </g>
    </g>
  );
};
