/**
 * Read-only Finish-field guidance. Inputs are decisions already made by the
 * existing daily-rest workflow. Weekly Rest deadline guidance intentionally
 * waits for a later authoritative actionable-deadline presentation state.
 * This selector never evaluates the Rest Engine or writes factual state.
 */
import { getDailyRestFinishBoundaries } from "./daily-rest-boundaries.ts";
export type FinishGuidanceKind = "DAILY_11" | "DAILY_9" | "SPLIT";
export type FinishGuidanceTone = "success";

export type FinishGuidanceItem = {
  kind: FinishGuidanceKind;
  boundaryAbsMinutes: number;
  tone: FinishGuidanceTone;
};

export type FinishGuidanceInput = {
  factualStartAbsMinutes: number | null;
  hasFactualStart: boolean;
  reducedDailyRestAvailable: boolean;
  splitRestAvailable: boolean;
};

function validMinute(value: number | null): value is number {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Raw editing is factual for Finish guidance only after a complete HHMM value. */
export function isCompleteFactualStartInput(rawStart: string): boolean {
  return rawStart.replace(/\D/g, "").length === 4;
}

export function selectFinishGuidance(input: FinishGuidanceInput): FinishGuidanceItem[] {
  // A suggested Start never becomes a fact. This first slice emits guidance
  // only after a complete factual Start is present.
  if (!input.hasFactualStart || !validMinute(input.factualStartAbsMinutes)) {
    return [];
  }

  const boundaries = getDailyRestFinishBoundaries(input.factualStartAbsMinutes);
  const regular = boundaries.regularFinishAbsMinutes;
  const laterKind: FinishGuidanceKind | null = input.splitRestAvailable
    ? "SPLIT"
    : input.reducedDailyRestAvailable ? "DAILY_9" : null;
  const later = laterKind == null
    ? null
    : boundaries.reducedFinishAbsMinutes;

  const result: FinishGuidanceItem[] = [{ kind: "DAILY_11", boundaryAbsMinutes: regular, tone: "success" }];
  if (later != null && laterKind != null) result.push({ kind: laterKind, boundaryAbsMinutes: later, tone: "success" });
  return result;
}
