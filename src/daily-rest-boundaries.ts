/**
 * Shared ordinary daily-rest boundaries for the established daily workflow.
 * Start suggestions and Finish guidance consume these same values; eligibility
 * remains with their existing callers.
 */
const DAILY_REST_WINDOW_MINUTES = 24 * 60;
const REGULAR_DAILY_REST_MINUTES = 11 * 60;
const REDUCED_DAILY_REST_MINUTES = 9 * 60;

export function getDailyRestStartBoundaries(previousFinishAbsMinutes: number): {
  regularStartAbsMinutes: number;
  reducedStartAbsMinutes: number;
} {
  return {
    regularStartAbsMinutes: previousFinishAbsMinutes + REGULAR_DAILY_REST_MINUTES,
    reducedStartAbsMinutes: previousFinishAbsMinutes + REDUCED_DAILY_REST_MINUTES,
  };
}

export function getDailyRestFinishBoundaries(factualStartAbsMinutes: number): {
  regularFinishAbsMinutes: number;
  reducedFinishAbsMinutes: number;
} {
  return {
    regularFinishAbsMinutes: factualStartAbsMinutes + DAILY_REST_WINDOW_MINUTES - REGULAR_DAILY_REST_MINUTES,
    reducedFinishAbsMinutes: factualStartAbsMinutes + DAILY_REST_WINDOW_MINUTES - REDUCED_DAILY_REST_MINUTES,
  };
}
