import { evaluateRestEngine, type EngineEvaluation, type RestEngineRuleset } from "./evaluate.ts";
import { migrateLegacyFacts, type LegacyStorageSnapshot, type RestEngineMigration } from "./migration.ts";
import { fixedLegalWeekForInstant, formatLondonInstant, londonCivilDayBounds } from "./time.ts";
import type {
  ActivityFactInput,
  BranchCompensationEvaluation,
  CompensationObligation,
  CompensationObligationResult,
  CompensationResultStatus,
  RestInterval,
  RollingCycleStatus,
} from "./types.ts";
import { aggregateBranchWarnings, type WarningAggregation, type WarningLevel } from "./warnings.ts";

const HOUR = 60 * 60 * 1000;
const ORDINARY_DAILY_REST = 9 * HOUR;

export const REST_ENGINE_V1_UI_ACTIVE = true as const;

export const PRODUCTION_REST_ENGINE_RULESET: RestEngineRuleset = {
  rulesetId: "EU_561_2006_REST_ENGINE_V1",
  rulesetVersion: "1",
  policyVersion: "2026-09",
};

export type Phase8Language = "en" | "bg";

export type FactualRestCardPresentation = {
  source: "EngineEvaluation";
  restIntervalId: string | null;
  durationMilliseconds: number | null;
  state: "NONE" | "OPEN" | "CLOSED";
  classification: "UNKNOWN" | "BELOW_9H" | "DAILY_REDUCED" | "DAILY_REGULAR" | "WEEKLY_REDUCED" | "WEEKLY_REGULAR";
  reviewRequired: boolean;
  reviewReasons: string[];
};

export type WeeklyRestPlanPresentation = {
  source: "EngineEvaluation";
  visible: boolean;
  allocationPending: boolean;
  dueEpochMilliseconds: number | null;
  status: RollingCycleStatus | "NONE";
  warningLevel: WarningLevel;
  text: Record<Phase8Language, string>;
};

export type CompensationLifecycle =
  | "NONE"
  | "OUTSTANDING"
  | "FINAL_WEEK"
  | "IN_PROGRESS"
  | "PROVISIONAL"
  | "ALLOCATION_PENDING"
  | "COMPLETED"
  | "IMPOSSIBLE"
  | "OVERDUE"
  | "REVIEW";

export type CompensationPresentationItem = {
  key: string;
  lifecycle: CompensationLifecycle;
  warningLevel: WarningLevel;
  requiredCompensationMilliseconds: number | null;
  remainingCompensationMilliseconds: number | null;
  deadlineEpochMilliseconds: number | null;
  completionEpochMilliseconds: number | null;
  progressMilliseconds: number | null;
  selectedOptionMilliseconds: number | null;
  text: Record<Phase8Language, string>;
  planningText: Record<Phase8Language, string> | null;
};

export type CompensationPanelPresentation = {
  source: "EngineEvaluation";
  visible: boolean;
  level: WarningLevel;
  warningId: string;
  debtOutstanding: boolean;
  allocationPending: boolean;
  items: CompensationPresentationItem[];
  reasons: string[];
};

export type WeekPreviewRestState = {
  source: "EngineEvaluation";
  evaluationFingerprint: string;
  warningLevel: WarningLevel;
  compensation: CompensationPanelPresentation;
  weeklyRestPlan: WeeklyRestPlanPresentation;
};

export type ProductionEngineState = {
  migration: RestEngineMigration;
  evaluation: EngineEvaluation;
  warning: WarningAggregation;
};

type VisibleWeekSnapshotInput = {
  baseSnapshot: LegacyStorageSnapshot;
  visibleDays: unknown[];
  visibleSaturdayISO: string;
  activeSaturdayISO: string;
  archive: unknown[];
};

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function addCivilDay(dateISO: string): string {
  return formatLondonInstant(londonCivilDayBounds(dateISO).endEpochMilliseconds).wallDate;
}

function evaluationHorizon(facts: readonly ActivityFactInput[], asOfEpochMilliseconds: number): {
  evaluationWeekIds: string[];
  historyStartEpochMilliseconds: number | null;
} {
  const factStarts = facts.map((fact) => londonCivilDayBounds(fact.sourceRef.wallDate).startEpochMilliseconds).sort((a, b) => a - b);
  const historyStartEpochMilliseconds = factStarts[0] ?? null;
  const currentWeek = fixedLegalWeekForInstant(asOfEpochMilliseconds);
  const firstWeek = historyStartEpochMilliseconds == null
    ? fixedLegalWeekForInstant(currentWeek.startEpochMilliseconds - 1)
    : fixedLegalWeekForInstant(historyStartEpochMilliseconds);
  const start = historyStartEpochMilliseconds == null
    ? firstWeek.startEpochMilliseconds
    : fixedLegalWeekForInstant(firstWeek.startEpochMilliseconds - 1).startEpochMilliseconds;
  const weekIds: string[] = [];
  let cursor = fixedLegalWeekForInstant(start);
  let guard = 0;
  while (cursor.startEpochMilliseconds <= currentWeek.startEpochMilliseconds && guard < 10_000) {
    weekIds.push(cursor.weekId);
    cursor = fixedLegalWeekForInstant(cursor.endEpochMilliseconds);
    guard += 1;
  }
  return { evaluationWeekIds: unique(weekIds).sort(), historyStartEpochMilliseconds };
}

function coverageCompleteThroughAsOf(migration: RestEngineMigration, asOfEpochMilliseconds: number): boolean {
  if (migration.status !== "COMPLETE") return false;
  const asOfDate = formatLondonInstant(asOfEpochMilliseconds).wallDate;
  const relevant = migration.facts.filter((fact) => fact.sourceRef.wallDate <= asOfDate);
  if (!relevant.length) return false;
  if (relevant.some((fact) => fact.factStatus !== "FACTUAL" || fact.coverage !== "FULL_CIVIL_DAY")) return false;
  const fullDates = new Set(relevant.map((fact) => fact.sourceRef.wallDate));
  let date = [...fullDates].sort()[0];
  let guard = 0;
  while (date <= asOfDate && guard < 10_000) {
    if (!fullDates.has(date)) return false;
    date = addCivilDay(date);
    guard += 1;
  }
  return guard < 10_000;
}

/**
 * Adds the visible pay week as a saved-week source while preserving the true
 * live/current aliases. Selecting history therefore changes presentation only;
 * it never promotes historical rows to live/current factual precedence.
 */
export function buildAuthoritativeLegacySnapshot(input: VisibleWeekSnapshotInput): LegacyStorageSnapshot {
  const snapshot = { ...input.baseSnapshot };
  snapshot.archive = JSON.stringify(input.archive);
  snapshot[`driverApp_week_${input.visibleSaturdayISO}`] = JSON.stringify({ days: input.visibleDays });
  if (input.visibleSaturdayISO === input.activeSaturdayISO) {
    const current = JSON.stringify(input.visibleDays);
    snapshot.days = current;
    snapshot.driverApp_days = current;
  }
  return Object.fromEntries(Object.entries(snapshot).sort(([left], [right]) => left.localeCompare(right)));
}

/** One authoritative Phase 1-7 recomputation. Display/navigation state is not an input. */
export function evaluateProductionRestEngine(
  snapshot: LegacyStorageSnapshot,
  asOfEpochMilliseconds: number,
): ProductionEngineState {
  const migration = migrateLegacyFacts(snapshot, asOfEpochMilliseconds);
  const factualFacts = migration.facts.filter((fact) => fact.factStatus === "FACTUAL");
  const horizon = evaluationHorizon(factualFacts, asOfEpochMilliseconds);
  const evaluation = evaluateRestEngine({
    facts: factualFacts,
    asOfEpochMilliseconds,
    ruleset: PRODUCTION_REST_ENGINE_RULESET,
    evaluationWeekIds: horizon.evaluationWeekIds,
    historyStartEpochMilliseconds: horizon.historyStartEpochMilliseconds,
    factualCoverageCompleteThroughAsOf: coverageCompleteThroughAsOf(migration, asOfEpochMilliseconds),
  });
  return { migration, evaluation, warning: aggregateBranchWarnings(evaluation) };
}

function intervalForDate(engine: EngineEvaluation, wallDate: string): RestInterval | null {
  const factIds = new Set(engine.activityFacts.filter((fact) => fact.sourceRef.wallDate === wallDate).map((fact) => fact.factId));
  const closed = engine.restIntervals.filter((interval) =>
    interval.endBoundary?.role === "WORK_START"
    && interval.endBoundary.sourceFactIds.some((id) => factIds.has(id))
  ).sort((a, b) => (b.endEpochMilliseconds ?? -1) - (a.endEpochMilliseconds ?? -1));
  if (closed[0]) return closed[0];
  const asOfDate = formatLondonInstant(engine.asOfEpochMilliseconds).wallDate;
  if (wallDate !== asOfDate) return null;
  return [...engine.restIntervals]
    .filter((interval) => interval.state === "OPEN")
    .sort((a, b) => (b.startEpochMilliseconds ?? -1) - (a.startEpochMilliseconds ?? -1))[0] ?? null;
}

export function selectFactualRestCard(engine: EngineEvaluation, wallDate: string): FactualRestCardPresentation {
  const interval = intervalForDate(engine, wallDate);
  const duration = interval?.elapsedMilliseconds ?? null;
  let classification: FactualRestCardPresentation["classification"] = "UNKNOWN";
  if (duration != null) {
    if (duration >= 45 * HOUR) classification = "WEEKLY_REGULAR";
    else if (duration >= 24 * HOUR) classification = "WEEKLY_REDUCED";
    else if (duration >= 11 * HOUR) classification = "DAILY_REGULAR";
    else if (duration >= 9 * HOUR) classification = "DAILY_REDUCED";
    else classification = "BELOW_9H";
  }
  return {
    source: "EngineEvaluation",
    restIntervalId: interval?.restIntervalId ?? null,
    durationMilliseconds: duration,
    state: interval?.state ?? "NONE",
    classification,
    reviewRequired: interval?.reviewStatus === "REVIEW_REQUIRED",
    reviewReasons: interval?.reviewReasons ?? [],
  };
}

function dateLabel(epochMilliseconds: number, language: Phase8Language): string {
  return new Intl.DateTimeFormat(language === "bg" ? "bg-BG" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  }).format(new Date(epochMilliseconds)).replace(/\s+/g, " ");
}

function deadlineDateLabel(epochMilliseconds: number, language: Phase8Language): string {
  return dateLabel(epochMilliseconds - 1, language);
}

function timeLabel(epochMilliseconds: number, language: Phase8Language): string {
  return new Intl.DateTimeFormat(language === "bg" ? "bg-BG" : "en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(new Date(epochMilliseconds)).replace(/\s+/g, " ");
}

function durationLabel(milliseconds: number, language: Phase8Language): string {
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (language === "bg") return remainder ? `${hours} ч. ${remainder} мин.` : `${hours} ч.`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function obligationKey(obligation: CompensationObligation): string {
  return [
    obligation.sourceRestIntervalId,
    obligation.sourceStartEpochMilliseconds,
    obligation.sourceEndEpochMilliseconds,
    obligation.requiredCompensationMilliseconds,
    obligation.deadlineEpochMilliseconds,
  ].join(":");
}

type ObligationView = {
  evaluation: BranchCompensationEvaluation;
  obligation: CompensationObligation;
  result: CompensationObligationResult;
};

function obligationViews(engine: EngineEvaluation): ObligationView[] {
  const surviving = new Set(engine.allocation.branches.filter((branch) => branch.legalState !== "VIOLATED").map((branch) => branch.branchId));
  const evaluations = surviving.size
    ? engine.compensation.branchEvaluations.filter((evaluation) => surviving.has(evaluation.branchId))
    : engine.compensation.branchEvaluations;
  return evaluations.flatMap((evaluation) => evaluation.obligations.flatMap((obligation) => {
    const result = evaluation.obligationResults.find((item) => item.obligationId === obligation.obligationId);
    return result ? [{ evaluation, obligation, result }] : [];
  }));
}

function completionFor(view: ObligationView): number | null {
  if (!view.result.attachmentId) return null;
  return view.evaluation.attachments.find((item) => item.attachmentId === view.result.attachmentId)?.packageCompletionEpochMilliseconds ?? null;
}

function statusLifecycle(statuses: CompensationResultStatus[]): CompensationLifecycle {
  if (statuses.includes("REVIEW") || statuses.includes("UNRESOLVED_ATTACHMENT_DEADLINE")) return "REVIEW";
  if (statuses.includes("OVERDUE")) return "OVERDUE";
  if (statuses.includes("THRESHOLD_REACHED_PROVISIONAL")) return "PROVISIONAL";
  if (statuses.every((status) => status === "COMPLETED_ON_TIME")) return "COMPLETED";
  return "OUTSTANDING";
}

function bilingualText(
  lifecycle: CompensationLifecycle,
  required: number,
  remaining: number,
  deadline: number,
  completion: number | null,
  progress: number | null,
  option: number | null,
): Record<Phase8Language, string> {
  const amount = remaining || required;
  if (lifecycle === "FINAL_WEEK") return {
    en: `Final week: ${durationLabel(amount, "en")} compensation remains due by Sun 24:00.`,
    bg: `Последна седмица: остават ${durationLabel(amount, "bg")} компенсация до неделя 24:00.`,
  };
  if (lifecycle === "IN_PROGRESS" && progress != null && option != null) return {
    en: `Compensation due: ${durationLabel(progress, "en")} of ${durationLabel(option, "en")} completed.`,
    bg: `Дължиш компенсация: изпълнени са ${durationLabel(progress, "bg")} от ${durationLabel(option, "bg")}.`,
  };
  if (lifecycle === "PROVISIONAL") return {
    en: `Compensation threshold reached for ${durationLabel(required, "en")}. Completion remains provisional while the rest is ongoing.`,
    bg: `Прагът за ${durationLabel(required, "bg")} компенсация е достигнат. Изпълнението остава предварително, докато почивката продължава.`,
  };
  if (lifecycle === "COMPLETED" && completion != null) return {
    en: `${durationLabel(required, "en")} compensation completed on ${dateLabel(completion, "en")}.`,
    bg: `Компенсацията от ${durationLabel(required, "bg")} е изпълнена на ${dateLabel(completion, "bg")}.`,
  };
  if (lifecycle === "OVERDUE") return {
    en: `Overdue: ${durationLabel(amount, "en")} weekly-rest compensation was not completed by ${deadlineDateLabel(deadline, "en")}.`,
    bg: `Просрочено: компенсацията от ${durationLabel(amount, "bg")} не е изпълнена до ${deadlineDateLabel(deadline, "bg")}.`,
  };
  if (lifecycle === "REVIEW") return {
    en: "Weekly-rest compensation requires review before a final result can be shown.",
    bg: "Компенсацията за седмична почивка изисква преглед преди окончателен резултат.",
  };
  return {
    en: `Compensation due: ${durationLabel(amount, "en")}. Compensate by ${deadlineDateLabel(deadline, "en")}.`,
    bg: `Дължиш компенсация: ${durationLabel(amount, "bg")}. Върни до ${deadlineDateLabel(deadline, "bg")}.`,
  };
}

function pendingItem(warning: WarningAggregation): CompensationPresentationItem {
  const deadline = warning.earliestCandidateLegalDeadlineEpochMilliseconds;
  return {
    key: "allocation-pending",
    lifecycle: "ALLOCATION_PENDING",
    warningLevel: "YELLOW",
    requiredCompensationMilliseconds: null,
    remainingCompensationMilliseconds: null,
    deadlineEpochMilliseconds: deadline,
    completionEpochMilliseconds: null,
    progressMilliseconds: null,
    selectedOptionMilliseconds: null,
    text: {
      en: "Weekly rest required.",
      bg: "Нужна е седмична почивка.",
    },
    planningText: null,
  };
}

export function selectCompensationPanel(engine: EngineEvaluation, migration?: Pick<RestEngineMigration, "status" | "reviewReasons">): CompensationPanelPresentation {
  const initialWarning = aggregateBranchWarnings(engine);
  if (initialWarning.allocationPending) {
    return {
      source: "EngineEvaluation",
      visible: true,
      level: "YELLOW",
      warningId: initialWarning.warningId,
      debtOutstanding: initialWarning.debtOutstanding,
      allocationPending: true,
      items: [pendingItem(initialWarning)],
      reasons: initialWarning.reasons,
    };
  }

  const views = obligationViews(engine);
  const groups = new Map<string, ObligationView[]>();
  for (const view of views) groups.set(obligationKey(view.obligation), [...(groups.get(obligationKey(view.obligation)) ?? []), view]);
  const openInterval = [...engine.restIntervals]
    .filter((interval) => interval.state === "OPEN" && interval.startEpochMilliseconds != null)
    .sort((a, b) => (b.startEpochMilliseconds as number) - (a.startEpochMilliseconds as number))[0] ?? null;
  const items: CompensationPresentationItem[] = [];

  for (const [key, group] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const obligation = group[0].obligation;
    const statuses = unique(group.map((view) => view.result.status));
    let lifecycle = statusLifecycle(statuses);
    const remaining = Math.max(...group.map((view) => view.result.remainingCompensationMilliseconds));
    const completions = group.map(completionFor).filter((value): value is number => value != null);
    const completion = completions.length ? Math.max(...completions) : null;
    const option = ORDINARY_DAILY_REST + obligation.requiredCompensationMilliseconds;
    const openEligible = lifecycle === "OUTSTANDING"
      && openInterval?.startEpochMilliseconds != null
      && openInterval.startEpochMilliseconds >= obligation.createdAtEpochMilliseconds
      && openInterval.startEpochMilliseconds < obligation.deadlineEpochMilliseconds
      && openInterval.elapsedMilliseconds != null
      && openInterval.elapsedMilliseconds > 0;
    const progress = openEligible ? Math.min(openInterval.elapsedMilliseconds as number, option) : null;
    if (openEligible && (progress as number) < option) lifecycle = "IN_PROGRESS";
    const deadlineWeek = fixedLegalWeekForInstant(obligation.deadlineEpochMilliseconds - 1).weekId;
    if (lifecycle === "OUTSTANDING" && fixedLegalWeekForInstant(engine.asOfEpochMilliseconds).weekId === deadlineWeek) lifecycle = "FINAL_WEEK";
    const selectedOption = lifecycle === "IN_PROGRESS" || lifecycle === "OUTSTANDING" || lifecycle === "FINAL_WEEK" ? option : null;
    const warning = aggregateBranchWarnings(engine, selectedOption);
    const planning = selectedOption != null && warning.planningLatestStartEpochMilliseconds != null
      ? {
      en: `Compensate by ${timeLabel(warning.planningLatestStartEpochMilliseconds, "en")}.`,
      bg: `Върни до ${timeLabel(warning.planningLatestStartEpochMilliseconds, "bg")}.`,
        }
      : null;
    items.push({
      key,
      lifecycle,
      warningLevel: warning.level,
      requiredCompensationMilliseconds: obligation.requiredCompensationMilliseconds,
      remainingCompensationMilliseconds: remaining,
      deadlineEpochMilliseconds: obligation.deadlineEpochMilliseconds,
      completionEpochMilliseconds: completion,
      progressMilliseconds: progress,
      selectedOptionMilliseconds: selectedOption,
      text: bilingualText(lifecycle, obligation.requiredCompensationMilliseconds, remaining, obligation.deadlineEpochMilliseconds, completion, progress, selectedOption),
      planningText: planning,
    });
  }

  if (!items.length && migration?.status === "REVIEW_REQUIRED") {
    items.push({
      key: "migration-review",
      lifecycle: "REVIEW",
      warningLevel: "YELLOW",
      requiredCompensationMilliseconds: null,
      remainingCompensationMilliseconds: null,
      deadlineEpochMilliseconds: null,
      completionEpochMilliseconds: null,
      progressMilliseconds: null,
      selectedOptionMilliseconds: null,
      text: {
        en: "Rest history contains conflicting factual records and requires review.",
        bg: "Историята на почивките съдържа противоречиви фактически записи и изисква преглед.",
      },
      planningText: null,
    });
  }

  return {
    source: "EngineEvaluation",
    visible: items.length > 0,
    level: migration?.status === "REVIEW_REQUIRED" ? "YELLOW" : initialWarning.level,
    warningId: initialWarning.warningId,
    debtOutstanding: initialWarning.debtOutstanding,
    allocationPending: false,
    items,
    reasons: unique([...initialWarning.reasons, ...(migration?.reviewReasons ?? [])]),
  };
}

export function selectWeeklyRestPlan(engine: EngineEvaluation): WeeklyRestPlanPresentation {
  const warning = aggregateBranchWarnings(engine);
  const validBranches = engine.allocation.branches.filter((branch) => branch.legalState !== "VIOLATED");
  const terminal = validBranches.flatMap((branch) => branch.rollingCycleResets
    .filter((reset) => reset.nextComponentId == null && reset.dueEpochMilliseconds != null)
    .map((reset) => ({ due: reset.dueEpochMilliseconds as number, status: reset.status })));
  const dues = unique(terminal.map((item) => item.due)).sort((a, b) => a - b);
  const pending = dues.length > 1 || warning.allocationPending || terminal.some((item) => item.status === "REVIEW" || item.status === "PENDING" || item.status === "INSUFFICIENT_HISTORY");
  const due = dues[0] ?? null;
  const status = terminal[0]?.status ?? "NONE";
  const weeklyViolation = engine.allocation.branches.length > 0 && validBranches.length === 0;
  return {
    source: "EngineEvaluation",
    visible: due != null || weeklyViolation,
    allocationPending: pending,
    dueEpochMilliseconds: due,
    status,
    warningLevel: pending ? "YELLOW" : warning.level,
    text: due == null && weeklyViolation ? (warning.level === "RED" ? {
      en: "Weekly rest not completed.",
      bg: "Седмичната почивка не е спазена.",
    } : {
      en: "Weekly rest required.",
      bg: "Нужна е седмична почивка.",
    }) : due == null ? { en: "", bg: "" } : pending ? {
      en: "Weekly rest required.",
      bg: "Нужна е седмична почивка.",
    } : {
      en: `Weekly rest required. Latest legal weekly-rest start: ${timeLabel(due, "en")}.`,
      bg: `Нужна е седмична почивка. Краен законов старт на седмичната почивка: ${timeLabel(due, "bg")}.`,
    },
  };
}

export function selectWeekPreviewRestState(engine: EngineEvaluation, migration?: Pick<RestEngineMigration, "status" | "reviewReasons">): WeekPreviewRestState {
  const compensation = selectCompensationPanel(engine, migration);
  const weeklyRestPlan = selectWeeklyRestPlan(engine);
  return {
    source: "EngineEvaluation",
    evaluationFingerprint: engine.evaluationFingerprint,
    warningLevel: compensation.level,
    compensation,
    weeklyRestPlan,
  };
}
