import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { InfographicData } from "../data/types";
import { Infographic } from "./Infographic";

export const InfographicComposition: React.FC<{ data: InfographicData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill name="Infographic" style={{ backgroundColor: "#ffffff" }}>
      <Infographic data={data} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
