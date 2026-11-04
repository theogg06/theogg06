import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Inter is bundled locally in public/fonts – no network access needed to render.
export const fontsLoaded = Promise.all(
  [
    ["Inter-Regular.otf", "400"],
    ["Inter-SemiBold.otf", "600"],
    ["Inter-Bold.otf", "700"],
  ].map(([file, weight]) =>
    loadFont({ family: "Inter", url: staticFile(`fonts/${file}`), weight, format: "opentype" }),
  ),
);
