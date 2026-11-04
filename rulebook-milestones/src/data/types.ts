export type RowStyle = { from: string; to: string; text: string };

export type MilestoneLabel = {
  side: "above" | "below";
  text: "before" | "after";
  date: string;
  lines: string[];
};

export type MilestoneData = {
  id: string;
  row: number;
  x: number;
  labels: MilestoneLabel[];
};

export type InfographicData = {
  title: { kicker: string; heading: string };
  rows: RowStyle[];
  years: { label: string; kind: "start" | "bend"; row: number }[];
  milestones: MilestoneData[];
  tags: { label: string; row: number; x: number }[];
  meetingsCaption: { label: string; tagIndex: number };
  meetingsLine: { fromTag: number; toTag: number };
  span: { label: string; fromMilestone: string; toMilestone: string };
  nextSteps: { label: string; lines: string[] };
};
