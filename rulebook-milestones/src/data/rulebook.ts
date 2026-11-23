// Content and visual identity of the "Rulebook milestones" infographic (Figure 3).
// All text is transcribed verbatim from the reference image. Line breaks are
// only re-flowed where the 16:9 layout needed it; no wording was changed.

import type { InfographicData } from "./types";

export const rulebookData: InfographicData = {
  title: { kicker: "Figure 3", heading: "Rulebook milestones" },

  // One entry per horizontal run of the serpentine timeline (top → bottom).
  // Colours are sampled from the reference: light steel blue → navy.
  rows: [
    { from: "#3f7cc2", to: "#5d9fe6", text: "#3f78bb" },
    { from: "#3e67ea", to: "#3049d6", text: "#2d50cf" },
    { from: "#2436b2", to: "#1a2a8f", text: "#1d2c98" },
    { from: "#111d63", to: "#0b1447", text: "#0f1a5a" },
  ],

  // Year labels drawn inside the band: "start" sits at the row start,
  // "bend" sits in the U-turn that follows row `row`.
  years: [
    { label: "2023", kind: "start", row: 0 },
    { label: "2024", kind: "bend", row: 0 },
    { label: "2025", kind: "bend", row: 1 },
    { label: "2026", kind: "bend", row: 2 },
  ],

  // Milestones in chronological order (= order along the path).
  // `x` is the horizontal position of the white marker on its row.
  // `text`: "after" puts the text to the right of the dotted connector,
  // "before" to the left (right-aligned), matching the reference.
  milestones: [
    {
      id: "jan-2023",
      row: 0,
      x: 307,
      labels: [
        {
          side: "above",
          text: "after",
          date: "Jan 2023",
          lines: ["Establishment of the Rulebook", "Development Group (RDG)"],
        },
      ],
    },
    {
      id: "jun-2023",
      row: 0,
      x: 1003,
      labels: [
        { side: "above", text: "after", date: "Jun 2023", lines: ["1st RDG", "progress report"] },
      ],
    },
    {
      id: "jan-2024",
      row: 1,
      x: 1561,
      labels: [
        {
          side: "above",
          text: "before",
          date: "Jan 2024",
          lines: ["Delivery of draft", "rulebook v0.8 for", "RDG review"],
        },
        { side: "below", text: "before", date: "Jan 2024", lines: ["2nd RDG", "progress report"] },
      ],
    },
    {
      id: "apr-2024",
      row: 1,
      x: 1031,
      labels: [
        {
          side: "below",
          text: "before",
          date: "Apr 2024",
          lines: ["Conclusion of v0.8", "review by RDG"],
        },
      ],
    },
    {
      id: "sep-2024",
      row: 1,
      x: 401,
      labels: [
        { side: "above", text: "after", date: "Sep 2024", lines: ["3rd RDG", "progress report"] },
      ],
    },
    {
      id: "apr-2025",
      row: 2,
      x: 401,
      labels: [
        { side: "above", text: "after", date: "Apr 2025", lines: ["4th RDG", "progress report"] },
      ],
    },
    {
      id: "jun-2025",
      row: 2,
      x: 673,
      labels: [
        {
          side: "below",
          text: "before",
          date: "Jun 2025",
          lines: ["Delivery of draft rulebook v0.9 for RDG review"],
        },
      ],
    },
    {
      id: "oct-2025",
      row: 2,
      x: 1143,
      labels: [
        { side: "above", text: "after", date: "Oct 2025", lines: ["5th RDG", "progress report"] },
        {
          side: "below",
          text: "after",
          date: "Oct 2025",
          lines: ["Conclusion of v0.9", "review by RDG"],
        },
      ],
    },
    {
      id: "apr-2026",
      row: 3,
      x: 1031,
      labels: [
        {
          side: "below",
          text: "before",
          date: "Apr 2026",
          lines: ["Rulebook v0.91", "delivery to RDG"],
        },
      ],
    },
    {
      id: "jul-2026",
      row: 3,
      x: 753,
      labels: [
        { side: "above", text: "before", date: "Jul 2026", lines: ["6th RDG progress report"] },
      ],
    },
  ],

  // Pink RDG-meeting counters sitting on the band.
  tags: [
    { label: "1st", row: 0, x: 464 },
    { label: "26th", row: 2, x: 1623 },
    { label: "27th", row: 3, x: 1620 },
    { label: "28th", row: 3, x: 1334 },
    { label: "29th", row: 3, x: 1115 },
  ],

  // Pink "RDG meetings" caption, attached under the first tag.
  meetingsCaption: { label: "RDG meetings", tagIndex: 0 },

  // Pink dotted line inside the band, running from the first to the last tag.
  meetingsLine: { fromTag: 0, toTag: 4 },

  // Mint "Consultation v0.9" pill, spanning two milestones on the same row.
  span: { label: "Consultation v0.9", fromMilestone: "jun-2025", toMilestone: "oct-2025" },

  nextSteps: {
    label: "Next steps",
    lines: ["Complete draft rulebook", "Align with regulation", "Final RDG review"],
  },
};
