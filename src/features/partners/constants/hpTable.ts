import type { CategoryCode, PartnerModality, SanctionTier } from "../types";

export const TIER_ORDER: SanctionTier[] = [
  "HEZI_50",
  "HEZI_100",
  "HEZI_250",
  "HEZI_500",
  "HEZI_1000",
];

export const TIER_LABELS: Record<SanctionTier, string> = {
  HEZI_50: "HEZI 50",
  HEZI_100: "HEZI 100",
  HEZI_250: "HEZI 250",
  HEZI_500: "HEZI 500",
  HEZI_1000: "HEZI 1000",
};

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  open_masc: "Open Masc",
  open_fem: "Open Fem",
  u18_masc: "Sub-18 Masc",
  u18_fem: "Sub-18 Fem",
  u16: "Sub-16",
};

export const MODALITY_LABELS: Record<PartnerModality, string> = {
  "1x1": "1x1",
  "3x3": "3x3",
  "5x5": "5x5",
  dunk: "Dunk",
  "3pt": "3 Pontos",
  skills: "Habilidades",
};

export type PlacementBracketKey =
  | "1"
  | "2"
  | "3_match"
  | "semi_no_3rd"
  | "4_match"
  | "5_8"
  | "9_16"
  | "17_plus"
  | "zero";

export const HP_TABLE: Record<
  PlacementBracketKey,
  Record<SanctionTier, number>
> = {
  "1": { HEZI_50: 50, HEZI_100: 100, HEZI_250: 250, HEZI_500: 500, HEZI_1000: 1000 },
  "2": { HEZI_50: 40, HEZI_100: 80, HEZI_250: 200, HEZI_500: 400, HEZI_1000: 800 },
  "3_match": { HEZI_50: 30, HEZI_100: 60, HEZI_250: 150, HEZI_500: 300, HEZI_1000: 600 },
  semi_no_3rd: { HEZI_50: 25, HEZI_100: 50, HEZI_250: 125, HEZI_500: 250, HEZI_1000: 500 },
  "4_match": { HEZI_50: 20, HEZI_100: 40, HEZI_250: 100, HEZI_500: 200, HEZI_1000: 400 },
  "5_8": { HEZI_50: 10, HEZI_100: 20, HEZI_250: 50, HEZI_500: 100, HEZI_1000: 200 },
  "9_16": { HEZI_50: 5, HEZI_100: 10, HEZI_250: 25, HEZI_500: 50, HEZI_1000: 100 },
  "17_plus": { HEZI_50: 2, HEZI_100: 4, HEZI_250: 10, HEZI_500: 20, HEZI_1000: 40 },
  zero: { HEZI_50: 0, HEZI_100: 0, HEZI_250: 0, HEZI_500: 0, HEZI_1000: 0 },
};

export function downgradeTierOneStep(tier: SanctionTier): SanctionTier {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx <= 0) return "HEZI_50";
  return TIER_ORDER[idx - 1];
}

export function isChallengeModality(m: PartnerModality): boolean {
  return m === "dunk" || m === "3pt" || m === "skills";
}
