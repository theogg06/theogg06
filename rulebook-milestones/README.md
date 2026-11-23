# Rulebook milestones: animated infographic (Remotion)

This project rebuilds *Figure 3 – Rulebook milestones* as vector shapes in React, TypeScript and SVG, then animates it with Remotion.

## Deliverables (`deliverables/`)

| File | What it is |
| --- | --- |
| `rulebook-milestones-animation.mp4` | Final video: 1920×1080, 30 fps, H.264 (High, yuv420p), 10.0 s (300 frames), no audio |
| `rulebook-milestones.svg` | Static, editable vector version of the finished figure. Each element is its own shape, and all text is live `<text>` set in Inter, so it imports into Figma Free (drag the file onto the canvas) |

## Animation

| Time | Phase |
| --- | --- |
| 0–1 s | The background panel is shown, the title fades in and the rule draws across |
| 1–6.5 s | The band draws itself along the serpentine path. A mask stroke on the path's centre line reveals it, driven by `strokeDasharray` and `strokeDashoffset`. When the head of the band reaches a milestone, the marker pops in (scale and opacity), the dotted connector grows, then the date fades in, followed by the description |
| 6.5–10 s | The last labels settle by about 7.6 s. The finished figure then holds for about 2.4 s, with no fade-out |

Every value comes from `useCurrentFrame()` through `interpolate()` and `spring()`. Nothing uses CSS transitions or timers.

## Project structure

```
src/
  data/rulebook.ts                  ← all content: text, order, positions, colours (edit this to reuse)
  data/types.ts                     ← data schema
  lib/geometry.ts                   ← serpentine path builder, arc-length helpers
  lib/timing.ts                     ← phase timings, draw easing, "when does the head reach s"
  lib/theme.ts                      ← colours and type sizes
  components/InfographicComposition.tsx  ← Remotion entry component (reads the frame)
  components/Infographic.tsx        ← whole figure as one SVG; pure function of `frame`
  components/AnimatedTimeline.tsx   ← band, year labels, pink meeting tags, consultation pill
  components/Milestone.tsx          ← marker + dotted connectors + labels
  components/AnimatedLabel.tsx      ← date + description reveal
  components/Title.tsx              ← "Figure 3 / Rulebook milestones" header
  fonts.ts                          ← loads local Inter from public/fonts (no network needed)
scripts/export-svg.tsx              ← renders the final frame to deliverables/rulebook-milestones.svg
```

Each component is a pure function of `frame`, so the video and the SVG export are rendered from the same tree.

## Commands

```bash
npm install
npm run dev          # Remotion Studio → http://localhost:3000/RulebookMilestones
npm run render       # → deliverables/rulebook-milestones-animation.mp4
npm run export-svg   # → deliverables/rulebook-milestones.svg
npm run lint
```

To change the content, edit `src/data/rulebook.ts`. To change the pacing, edit `TIMING` in `src/lib/timing.ts`. Row positions and the turn radius are in `LAYOUT` in `src/lib/geometry.ts`.

## Fidelity notes

- All text is transcribed verbatim from the reference. Every word in the source image was legible.
- The reference is portrait, so the serpentine is stretched horizontally to fit 16:9. The order, the shape (four runs joined by three U-turns) and the relative positions are kept.
- Some descriptions were re-flowed onto fewer lines so labels don't collide in the wider layout. No wording was changed:
  - Jan 2023
  - Sep 2024
  - Jun 2025
  - Jul 2026
- The reference doesn't show where the pink dotted "RDG meetings" line ends. Here it runs from the *1st* tag to the *29th* tag.
- Font: Inter, bundled locally. The original uses a similar neo-grotesque sans.
