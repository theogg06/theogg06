import React from "react";
import { Composition } from "remotion";
import { InfographicComposition } from "./components/InfographicComposition";
import { rulebookData } from "./data/rulebook";
import { CANVAS } from "./lib/geometry";
import { DURATION_IN_FRAMES, FPS } from "./lib/timing";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="RulebookMilestones"
      component={InfographicComposition}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={CANVAS.width}
      height={CANVAS.height}
      defaultProps={{ data: rulebookData }}
    />
  );
};
