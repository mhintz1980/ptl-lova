import type { Stage } from "../types";

export const STAGE_SEQUENCE: Stage[] = [
  "UNSCHEDULED",
  "NOT STARTED",
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
  "CLOSED",
];

export const PRODUCTION_STAGES: Stage[] = [
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
];

export const STAGE_LABELS: Record<Stage, string> = {
  "UNSCHEDULED": "Unscheduled",
  "NOT STARTED": "Not Started",
  FABRICATION: "Fabrication",
  "POWDER COAT": "Powder Coat",
  ASSEMBLY: "Assembly",
  TESTING: "Testing",
  SHIPPING: "Shipping",
  CLOSED: "Closed",
};

export const STAGE_COLORS: Record<Stage, string> = {
  "UNSCHEDULED": "stage-color stage-color-unscheduled",
  "NOT STARTED": "stage-color stage-color-not-started",
  FABRICATION: "stage-color stage-color-fabrication",
  "POWDER COAT": "stage-color stage-color-powder",
  ASSEMBLY: "stage-color stage-color-assembly",
  TESTING: "stage-color stage-color-testing",
  SHIPPING: "stage-color stage-color-shipping",
  CLOSED: "stage-color stage-color-closed",
};
