// Geometry of the serpentine timeline. Rows run alternately left→right and
// right→left and are joined by semicircular U-turns. Everything that sits on
// the path is located by its arc length `s`, which drives the reveal timing.

export const CANVAS = { width: 1920, height: 1080 };

export const LAYOUT = {
  panel: { x: 40, y: 140, width: 1840, height: 910 },
  rule: { y: 122 },
  rowY: [295, 495, 695, 895],
  startX: 40, // row 1 starts / last row ends at the panel edge
  rightTurnX: 1700,
  leftTurnX: 220,
  band: 36,
  textGap: 12,
};

export const TURN_RADIUS = (LAYOUT.rowY[1] - LAYOUT.rowY[0]) / 2;
const ARC = Math.PI * TURN_RADIUS;

type Segment =
  | { kind: "row"; row: number; x1: number; x2: number; y: number; s0: number; length: number }
  | {
      kind: "bend";
      after: number;
      side: "right" | "left";
      cx: number;
      cy: number;
      s0: number;
      length: number;
    };

const buildSegments = (): Segment[] => {
  const segs: Segment[] = [];
  const rows = LAYOUT.rowY.length;
  let s = 0;
  for (let i = 0; i < rows; i++) {
    const ltr = i % 2 === 0;
    const first = i === 0;
    const last = i === rows - 1;
    const x1 = ltr ? (first ? LAYOUT.startX : LAYOUT.leftTurnX) : LAYOUT.rightTurnX;
    const x2 = ltr ? LAYOUT.rightTurnX : last ? LAYOUT.startX : LAYOUT.leftTurnX;
    const length = Math.abs(x2 - x1);
    segs.push({ kind: "row", row: i, x1, x2, y: LAYOUT.rowY[i], s0: s, length });
    s += length;
    if (!last) {
      const side = ltr ? "right" : "left";
      segs.push({
        kind: "bend",
        after: i,
        side,
        cx: x2,
        cy: LAYOUT.rowY[i] + TURN_RADIUS,
        s0: s,
        length: ARC,
      });
      s += ARC;
    }
  }
  return segs;
};

export const SEGMENTS = buildSegments();
export const TOTAL_LENGTH = SEGMENTS.reduce((a, seg) => a + seg.length, 0);

const segmentD = (seg: Segment, overlap = 0) => {
  if (seg.kind === "row") {
    const dir = Math.sign(seg.x2 - seg.x1);
    return `M ${seg.x1 - dir * overlap} ${seg.y} H ${seg.x2 + dir * overlap}`;
  }
  const sweep = seg.side === "right" ? 1 : 0;
  return `M ${seg.cx} ${seg.cy - TURN_RADIUS} A ${TURN_RADIUS} ${TURN_RADIUS} 0 0 ${sweep} ${seg.cx} ${seg.cy + TURN_RADIUS}`;
};

export const segmentPath = segmentD;

// Centre line of the whole timeline, as one path.
export const CENTER_PATH = SEGMENTS.map((seg, i) => {
  const d = segmentD(seg);
  return i === 0 ? d : d.replace(/^M [^A-Z]+/, "");
}).join(" ");

/** Arc length of the point at horizontal position `x` on row `row`. */
export const sOnRow = (row: number, x: number) => {
  const seg = SEGMENTS.find((s) => s.kind === "row" && s.row === row);
  if (!seg || seg.kind !== "row") throw new Error(`No row ${row}`);
  return seg.s0 + Math.abs(x - seg.x1);
};

/** Point and tangent angle (deg) at arc length s. */
export const pointAt = (s: number) => {
  const seg =
    SEGMENTS.find((g) => s >= g.s0 && s <= g.s0 + g.length) ?? SEGMENTS[SEGMENTS.length - 1];
  const t = s - seg.s0;
  if (seg.kind === "row") {
    const dir = Math.sign(seg.x2 - seg.x1);
    return { x: seg.x1 + dir * t, y: seg.y, angle: dir > 0 ? 0 : 180 };
  }
  const phi = t / TURN_RADIUS; // 0 → π
  if (seg.side === "right") {
    const a = -Math.PI / 2 + phi;
    return {
      x: seg.cx + TURN_RADIUS * Math.cos(a),
      y: seg.cy + TURN_RADIUS * Math.sin(a),
      angle: (a * 180) / Math.PI + 90,
    };
  }
  const a = -Math.PI / 2 - phi;
  return {
    x: seg.cx + TURN_RADIUS * Math.cos(a),
    y: seg.cy + TURN_RADIUS * Math.sin(a),
    angle: (a * 180) / Math.PI - 90,
  };
};

/** Sub-path of the centre line between two arc lengths. */
export const subPath = (sFrom: number, sTo: number) => {
  const parts: string[] = [];
  for (const seg of SEGMENTS) {
    const a = Math.max(sFrom, seg.s0);
    const b = Math.min(sTo, seg.s0 + seg.length);
    if (b <= a) continue;
    const p = pointAt(a);
    const q = pointAt(b);
    const move = parts.length === 0 ? `M ${p.x} ${p.y} ` : "";
    if (seg.kind === "row") {
      parts.push(`${move}H ${q.x}`);
    } else {
      const sweep = seg.side === "right" ? 1 : 0;
      parts.push(`${move}A ${TURN_RADIUS} ${TURN_RADIUS} 0 0 ${sweep} ${q.x} ${q.y}`);
    }
  }
  return parts.join(" ");
};
