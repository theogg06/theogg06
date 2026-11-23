// Writes a static, editable SVG of the finished infographic (last frame,
// no reveal masks) – separate shapes and live <text>, importable in Figma.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Infographic } from "../src/components/Infographic";
import { rulebookData } from "../src/data/rulebook";
import { DURATION_IN_FRAMES, FPS } from "../src/lib/timing";

const out = resolve(process.argv[2] ?? "deliverables/rulebook-milestones.svg");
const markup = renderToStaticMarkup(
  <Infographic data={rulebookData} frame={DURATION_IN_FRAMES - 1} fps={FPS} isStatic />,
);
mkdirSync(resolve(out, ".."), { recursive: true });
writeFileSync(out, `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`);
console.log(`Wrote ${out}`);
