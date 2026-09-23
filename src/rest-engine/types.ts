export const LONDON_TIME_ZONE = "Europe/London" as const;

export type FactTimeProvenance = "EXPLICIT" | "ASSUMED";

export type FactTimeResolution =
  | "VALID"
  | "AMBIGUOUS_FOLD"
  | "NONEXISTENT_GAP"
  | "REVIEW_REQUIRED";

export type InstantCandidate = {
  epochMilliseconds: number;
  instantUtc: string;
  offset: string;
  offsetMinutes: number;
};

export type ZonedFactTime = {
  wallDate: string;
  wallTime: string;
  timeZone: typeof LONDON_TIME_ZONE;
  provenance: FactTimeProvenance;
  resolution: FactTimeResolution;
  reviewRequired: boolean;
  reviewReasons: string[];
  epochMilliseconds: number | null;
  instantUtc: string | null;
  offset: string | null;
  offsetMinutes: number | null;
  candidates: InstantCandidate[];
};

export type LondonCivilTime = {
  wallDate: string;
  wallTime: string;
  timeZone: typeof LONDON_TIME_ZONE;
  offset: string;
  offsetMinutes: number;
  dayOfWeek: number;
};

export type LondonCivilDayBounds = {
  wallDate: string;
  startEpochMilliseconds: number;
  endEpochMilliseconds: number;
  elapsedMinutes: number;
};

export type FixedLegalWeek = {
  weekId: string;
  mondayDate: string;
  sundayDate: string;
  startEpochMilliseconds: number;
  endEpochMilliseconds: number;
  elapsedMinutes: number;
};

export type LegalBoundary = {
  civilMeaning: "SUNDAY_24_00_EQ_MONDAY_00_00";
  mondayDate: string;
  epochMilliseconds: number;
  instantUtc: string;
};

export type ReviewStatus = "CLEAR" | "REVIEW_REQUIRED";

export type ActivityFactKind = "WORK" | "OFF" | "HOLIDAY";

export type ActivityFactStatus = "FACTUAL" | "PLANNED" | "PLACEHOLDER";

export type FactCoverage = "FULL_CIVIL_DAY" | "BOUNDED_ONLY" | "NONE";

export type FactSourceRef = {
  sourceKey: string;
  recordId: string;
  wallDate: string;
};

export type ActivityFactTimeInput =
  | ZonedFactTime
  | {
      wallDate: string;
      wallTime: string;
      timeZone?: string;
      provenance?: FactTimeProvenance;
      reviewReason?: string;
    };

export type ActivityFactInput = {
  factId: string;
  sourceRef: FactSourceRef;
  kind: ActivityFactKind;
  factStatus: ActivityFactStatus;
  coverage: FactCoverage;
  start: ActivityFactTimeInput | null;
  end: ActivityFactTimeInput | null;
  provenance?: FactTimeProvenance;
  reviewReasons?: string[];
  revision?: number;
  revisionFingerprint?: string;
  supersedesFactIds?: string[];
};

export type ActivityFact = {
  factId: string;
  sourceRef: FactSourceRef;
  kind: ActivityFactKind;
  factStatus: ActivityFactStatus;
  coverage: FactCoverage;
  start: ZonedFactTime | null;
  end: ZonedFactTime | null;
  provenance: FactTimeProvenance;
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
  revision: number | null;
  revisionFingerprint: string;
  supersedesFactIds: string[];
};

export type ChronologyIssueCode =
  | "DUPLICATE_FACT_DEDUPED"
  | "CONFLICTING_DUPLICATE_FACTS"
  | "INCOMPLETE_WORK_START"
  | "INCOMPLETE_WORK_FINISH"
  | "INVALID_WORK_ORDER"
  | "UNRESOLVED_FACT_TIME"
  | "OVERLAPPING_WORK_FACTS"
  | "FACTUAL_COVERAGE_GAP"
  | "REVIEW_PROPAGATED";

export type ChronologyIssue = {
  issueId: string;
  code: ChronologyIssueCode;
  affectedFactIds: string[];
  startEpochMilliseconds: number | null;
  endEpochMilliseconds: number | null;
  reviewReason: string;
};

export type RestBoundary = {
  sourceFactIds: string[];
  role: "COVERAGE_START" | "WORK_END" | "WORK_START" | "COVERAGE_END" | "AS_OF";
  time: ZonedFactTime | null;
  epochMilliseconds: number | null;
};

export type RestInterval = {
  restIntervalId: string;
  startBoundary: RestBoundary;
  endBoundary: RestBoundary | null;
  startEpochMilliseconds: number | null;
  endEpochMilliseconds: number | null;
  observedThroughEpochMilliseconds: number;
  elapsedMilliseconds: number | null;
  elapsedRangeMilliseconds: { minimum: number; maximum: number } | null;
  supportingFactIds: string[];
  state: "CLOSED" | "OPEN";
  provenance: FactTimeProvenance;
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
};

export type WeeklyRestLengthClassification = "REDUCED_LENGTH" | "REGULAR_LENGTH";

export type WeeklyRestOptionPattern =
  | "SINGLE_REDUCED"
  | "SINGLE_REGULAR"
  | "REGULAR_THEN_REDUCED"
  | "REDUCED_THEN_REGULAR"
  | "REGULAR_THEN_REGULAR"
  | "REVIEW_ONLY";

export type ComponentConstraint = {
  classification: WeeklyRestLengthClassification;
  minimumDurationMilliseconds: number;
  maximumDurationMilliseconds: number;
  actualDurationMilliseconds: number | null;
  startOffsetMinimumMilliseconds: number;
  startOffsetMaximumMilliseconds: number;
};

export type FixedWeekBoundaryCrossing = {
  boundaryEpochMilliseconds: number;
  offsetMilliseconds: number;
  weekBeforeId: string;
  weekAfterId: string;
};

export type FixedWeekOverlap = {
  weekId: string;
  startOffsetMilliseconds: number;
  endOffsetMilliseconds: number;
};

export type WeeklyRestPlacementDomain = {
  coordinateSystem: "REST_INTERVAL_HALF_OPEN";
  startOffsetMinimumMilliseconds: number;
  startOffsetMaximumMilliseconds: number;
  mustBeContiguous: true;
  componentsMustBeAdjacent: boolean;
  distinctFixedWeeksRequired: boolean;
  unallocatedCapacityMilliseconds: number;
};

export type WeeklyRestComponentOption = {
  optionId: string;
  restIntervalId: string;
  pattern: WeeklyRestOptionPattern;
  components: ComponentConstraint[];
  totalMinimumDurationMilliseconds: number;
  availableDurationMilliseconds: number | null;
  placementDomain: WeeklyRestPlacementDomain | null;
  crossedFixedWeekBoundaries: FixedWeekBoundaryCrossing[];
  fixedWeekOverlaps: FixedWeekOverlap[];
  eligibleAdjacentWeekPairs: Array<{ firstWeekId: string; secondWeekId: string }>;
  capacity: {
    maximumRegularComponents: number;
    maximumMinimumRestComponents: number;
  } | null;
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
};

export type WeeklyRestComponentClassification = "REGULAR" | "REDUCED";

export type WeeklyRestAllocationRole = "COUNTED" | "ADDITIONAL";

export type RollingWeeklyRestQualification = "QUALIFYING_WEEKLY_REST";

export type WeeklyRestComponent = {
  componentId: string;
  restIntervalId: string;
  sourceOptionId: string;
  componentIndex: number;
  startEpochMilliseconds: number;
  endEpochMilliseconds: number;
  startOffsetMilliseconds: number;
  endOffsetMilliseconds: number;
  durationMilliseconds: number;
  classification: WeeklyRestComponentClassification;
  role: WeeklyRestAllocationRole;
  provenance: FactTimeProvenance;
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
};

export type FixedWeekAssignment = {
  assignmentId: string;
  fixedWeekId: string;
  componentId: string;
  assignmentRole: "COUNTED_FOR_FIXED_WEEK";
  weekStartEpochMilliseconds: number;
  weekEndEpochMilliseconds: number;
};

export type RollingQualifyingWeeklyRest = {
  rollingRestId: string;
  restIntervalId: string;
  sourceComponentIds: string[];
  qualification: RollingWeeklyRestQualification;
  startEpochMilliseconds: number;
  completeRestIntervalEndEpochMilliseconds: number | null;
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
};

export type RollingCycleStatus =
  | "BEFORE_DUE"
  | "EXACTLY_DUE"
  | "AFTER_DUE"
  | "REVIEW"
  | "INSUFFICIENT_HISTORY"
  | "PENDING";

export type RollingCycleReset = {
  evaluationId: string;
  previousComponentId: string | null;
  nextComponentId: string | null;
  previousRestIntervalId: string | null;
  nextRestIntervalId: string | null;
  previousQualifyingEndEpochMilliseconds: number | null;
  nextQualifyingStartEpochMilliseconds: number | null;
  dueEpochMilliseconds: number | null;
  exactElapsedMilliseconds: number | null;
  status: RollingCycleStatus;
  reviewReasons: string[];
};

export type TwoWeekEvaluationStatus =
  | "SATISFIED"
  | "VIOLATED"
  | "REVIEW"
  | "PENDING"
  | "INSUFFICIENT_HISTORY";

export type TwoWeekEvaluation = {
  evaluationId: string;
  firstWeekId: string;
  secondWeekId: string;
  countedRoles: Array<{
    fixedWeekId: string;
    componentId: string;
    classification: WeeklyRestComponentClassification;
  }>;
  status: TwoWeekEvaluationStatus;
  reviewReasons: string[];
};

export type AllocationBranchLegalState = "COMPLIANT" | "VIOLATED" | "REVIEW" | "PENDING";

export type AllocationBranch = {
  branchId: string;
  branchFingerprint: string;
  components: WeeklyRestComponent[];
  fixedWeekAssignments: FixedWeekAssignment[];
  additionalComponents: WeeklyRestComponent[];
  rollingQualifyingRests: RollingQualifyingWeeklyRest[];
  rollingCycleResets: RollingCycleReset[];
  twoWeekEvaluations: TwoWeekEvaluation[];
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
  legalState: AllocationBranchLegalState;
  invalidReasons: string[];
  sourceOptionIds: string[];
};

export type PriorQualifyingWeeklyRest = {
  componentId: string;
  restIntervalId?: string;
  endEpochMilliseconds: number;
  reviewStatus: ReviewStatus;
  reviewReasons?: string[];
};

export type WeeklyRestAllocationContext = {
  asOfEpochMilliseconds: number;
  evaluationWeekIds: string[];
  historyStartEpochMilliseconds: number | null;
  factualCoverageCompleteThroughAsOf: boolean;
  priorQualifyingWeeklyRest?: PriorQualifyingWeeklyRest;
};

export type Phase4IssueCode =
  | "MISSING_SOURCE_INTERVAL"
  | "INVALID_EVALUATION_HORIZON"
  | "OVERLAPPING_WEEKLY_REST_MINIMUM"
  | "REDUNDANT_COUNTED_COMPONENT"
  | "REVIEW_OPTION_NOT_COUNTED";

export type Phase4Issue = {
  issueId: string;
  code: Phase4IssueCode;
  sourceIds: string[];
  reason: string;
};

export type SolveWeeklyRestAllocationsResult = {
  branches: AllocationBranch[];
  eliminatedBranchesOrDiagnostics: Phase4Issue[];
  issues: Phase4Issue[];
};

export type CompensationObligation = {
  obligationId: string;
  branchId: string;
  sourceComponentId: string;
  sourceRestIntervalId: string;
  sourceFixedWeekAssignmentId: string;
  sourceFixedWeekId: string;
  sourceStartEpochMilliseconds: number;
  sourceEndEpochMilliseconds: number;
  sourceReducedDurationMilliseconds: number;
  requiredCompensationMilliseconds: number;
  createdAtEpochMilliseconds: number;
  deadlineEpochMilliseconds: number;
  deadlineFixedWeekId: string;
  reviewStatus: ReviewStatus;
  provenance: FactTimeProvenance;
};

export type AttachmentBaseKind = "ORDINARY_9H_BASE" | "WEEKLY_REST_BASE";
export type AttachmentLayout = "BASE_THEN_BLOCK" | "BLOCK_THEN_BASE";
export type CompensationDeadlineCase = "CASE_A" | "CASE_B" | "CASE_C";
export type CompensationResultStatus =
  | "OUTSTANDING"
  | "COMPLETED_ON_TIME"
  | "THRESHOLD_REACHED_PROVISIONAL"
  | "UNRESOLVED_ATTACHMENT_DEADLINE"
  | "OVERDUE"
  | "REVIEW";

export type CompensationBlock = {
  blockId: string;
  obligationId: string;
  restIntervalId: string;
  startEpochMilliseconds: number;
  endEpochMilliseconds: number;
  durationMilliseconds: number;
  allocationPriority: number;
  layout: AttachmentLayout;
  reviewStatus: ReviewStatus;
};

export type AttachmentBase = {
  baseId: string;
  restIntervalId: string;
  baseKind: AttachmentBaseKind;
  minimumRequiredMilliseconds: number;
  startEpochMilliseconds: number;
  completionEpochMilliseconds: number;
  sourceWeeklyComponentId: string | null;
  sharedForMultipleBlocks: boolean;
};

export type AttachmentRelation = {
  attachmentId: string;
  obligationId: string;
  blockId: string;
  baseId: string;
  restIntervalId: string;
  layout: AttachmentLayout;
  packageCompletionEpochMilliseconds: number;
  deadlineCase: CompensationDeadlineCase;
  status: CompensationResultStatus;
  reviewStatus: ReviewStatus;
};

export type CompensationObligationResult = {
  obligationId: string;
  status: CompensationResultStatus;
  remainingCompensationMilliseconds: number;
  attachmentId: string | null;
  reviewReasons: string[];
};

export type CompensationUnallocatedCapacity = {
  restIntervalId: string;
  availableCompensationMilliseconds: number;
  unusedCompensationMilliseconds: number;
};

export type Phase5DiagnosticCode =
  | "MISSING_SOURCE_ASSIGNMENT"
  | "REPAYMENT_REVIEW_REQUIRED"
  | "ORDINARY_SHARED_BASE_UNSUPPORTED"
  | "INSUFFICIENT_CONTIGUOUS_CAPACITY"
  | "SOURCE_INTERVAL_EXCLUDED";

export type Phase5Diagnostic = {
  diagnosticId: string;
  code: Phase5DiagnosticCode;
  sourceIds: string[];
  reason: string;
};

export type BranchCompensationEvaluation = {
  evaluationId: string;
  branchId: string;
  phase4BranchFingerprint: string;
  layoutStrategy: AttachmentLayout;
  obligations: CompensationObligation[];
  blocks: CompensationBlock[];
  attachmentBases: AttachmentBase[];
  attachments: AttachmentRelation[];
  obligationResults: CompensationObligationResult[];
  completedObligationIds: string[];
  outstandingObligationIds: string[];
  unallocatedCapacity: CompensationUnallocatedCapacity[];
  diagnostics: Phase5Diagnostic[];
  evaluationFingerprint: string;
};

export type CompensationConvergence = {
  convergenceId: string;
  publicOutcomeFingerprint: string;
  evaluationIds: string[];
  branchIds: string[];
};

export type CompensationEvaluationContext = {
  asOfEpochMilliseconds: number;
  factualCoverageCompleteThroughAsOf: boolean;
};

export type EvaluateCompensationResult = {
  branchEvaluations: BranchCompensationEvaluation[];
  convergences: CompensationConvergence[];
};
