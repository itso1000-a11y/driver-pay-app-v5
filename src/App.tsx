import React, { useEffect, useMemo, useRef, useState } from "react";


type Lang = "en" | "bg";
const APP_VERSION = "v5.1.2";
const LANGUAGE_STORAGE_KEY = "driverPayV4_language";
const ACTIVE_WEEK_STORAGE_KEY = "driverPayV4_activeSaturday";
const CLOSED_WEEKS_STORAGE_KEY = "driverPayV4_closedWeeks";
const WEEKLY_REST_CANDIDATE_STORAGE_KEY = "driverPayV4_weeklyRestCandidate";
let uiLang: Lang = "en";
const UI_TEXT: Record<Lang, Record<string, string>> = {
  en: {
    chooseLanguage: "Choose language", appTitle: "Driver Pay App V5", currentDay: "Current day", install: "Install", week: "Week", settings: "Settings", language: "Language",
    savedHistoricalWeek: "Saved historical week", historicalLocked: "This week is locked to protect old records.", unlockEditing: "Unlock editing",
    weekEndingSaturday: "Week ending Saturday", loadSelected: "Load selected", currentWeek: "Current week", previous: "Prev", next: "Next",
    dayType: "Day type", workDay: "Work day", holidayDay: "Holiday day", offDay: "Day Off", shift: "Shift", weekend: "Weekend", start: "Start", finish: "Finish", worked: "Worked", ot: "OT",
    kilometres: "Kilometres", suggested: "suggested", startKm: "Start km", finishKm: "Finish km", kmRun: "KM run", startKmManual: "Start km can be corrected manually.", startKmSuggested: "Grey start km is suggested from {source}. Type over it if it is wrong.", fromFinishKm: "from {source} finish km", lastSavedDay: "last saved day", lastWeek: "last week",
    restFromPreviousDay: "Rest from previous shift", noPreviousDay: "No previous shift found.", currentRest: "Current rest", holidayPay: "Holiday pay", taxed: "taxed", splitBreak: "Split break", weekActive: "Week active", nightOut: "Night out", bonuses: "Bonuses", addBonus: "Add bonus", add: "Add", noBonusesAdded: "No bonuses added.", saveNext: "Save & Next", weekView: "Week View",
    daySummary: "Day summary", hours: "Hours", overtime: "Overtime", km: "KM", yes: "Yes", no: "No", delete: "Delete",
    settingsTitle: "Settings", backupRestore: "Backup / Restore", recommended: "recommended", backupInfo: "Save a copy of all weeks, current entries, settings, archive, and payslip comparison. Restore it if Edge data is cleared or you move to another computer.", backup: "Backup", restore: "Restore", payRates: "Pay rates", companyName: "Company name (optional)", weekdayPayRate: "Weekday pay rate", saturdayPayRate: "Saturday pay rate", sundayPayRate: "Sunday pay rate", pensionMode: "Pension mode", noPension: "No pension", manualPension: "Ръчна пенсия", pensionDeduction: "Удръжка pension", payCalculationMode: "Режим на смятане", payeEstimate: "PAYE estimate", grossOnly: "Gross Only", grossOnlyNote: "Tax, NI и pension са OFF. Прегледът показва бруто.", deductionsOff: "Удръжките са изключени", payCalculationMode: "Pay calculation mode", payeEstimate: "PAYE estimate", grossOnly: "Gross Only", grossOnlyNote: "Tax, NI and pension are OFF. Preview shows gross pay.", deductionsOff: "Deductions off", payCalculationMode: "Pay calculation mode", payeEstimate: "PAYE estimate", grossOnly: "Gross Only", grossOnlyNote: "Tax, NI and pension are OFF. Preview shows gross pay.", deductionsOff: "Deductions off", overtimeThreshold: "Overtime threshold (hours)", overtimePayRate: "Overtime pay rate", foodAllowance: "Food allowance per worked day", nightOutPay: "Night out pay", bonusPayRates: "Bonus pay rates", customBonuses: "Custom bonuses", customBonusName: "Bonus name", customBonusRate: "Rate", done: "Done", paySetupV2: "Pay Setup v2", openPaySetup: "Open Pay Setup", currentProfile: "Current profile", profileName: "Profile name", profileSaved: "Profile saved", createProfile: "Create profile", updateProfile: "Update profile", saveAsNewProfile: "Save as new profile", newFromThis: "New from this", profilePreview: "Profile preview", organisationName: "Company / Agency", loadProfile: "Load profile", applyProfile: "Apply profile", applyFromNextEmptyDay: "Apply from next empty day", profileOnlySaved: "Profile saved. Apply it when ready.", currentDraft: "Current draft",
    weekPreview: "Week Preview", close: "Close", estimatedNet: "Estimated Net", payslipNet: "Payslip Net", difference: "Difference", days: "Days", noPoundsHere: "no £ here", holiday: "Holiday", off: "Off", showBreakdown: "Show breakdown", hideBreakdown: "Hide breakdown", basePay: "Base pay", food: "Food", tax: "Tax", ni: "NI", net: "Net", splitRests: "Split rests", back: "Back", endWeek: "End Week",
    endWeekPreview: "End Week Preview", totalHours: "Total hours", reducedRests: "Reduced rests", confirmInfo: "Confirming will close this week, save an automatic backup, and open the next week. Choose how to mark the remaining days.", confirmCloseWeek: "Confirm & Close Week", remainingOff: "Remaining Off", remainingHoliday: "Remaining Holiday",
    from11hRest: "from 11h rest", nineHourOption: "9h option", reducedLimitReached: "No reduced rests left", reducedLeft: "Left", noReducedLeft: "No reduced rests left", splitRestNotCounted: "", incompleteShift: "Incomplete shift.", finishBeforeStart: "Finish time is before start.", longShift: "Long shift", shiftLimitExceeded: "15h limit exceeded", rest11: "Daily rest", rest9: "Reduced rest", previousShiftTooLongFor11h: "11h rest unavailable", weeklyRest45Option: "Weekly rest", weeklyRest24Option: "Reduced", owedLater: "later", toFullWeeklyRest: "left", weeklyRestComplete: "Weekly rest", reducedWeeklyRest: "Reduced weekly rest", compensationMissing: "Hours missing", weeklyRestRequired: "Weekly rest needed", dailyRestCompleted: "", violation: "Rest violation", pending: "No start yet", backupRestored: "Backup restored successfully.", backupFailed: "This backup file could not be restored.", installHelp: "Use your browser menu and choose Install app / Add to Home screen.", futureWeekClose: "Close empty week", fastCloseHint: "This week has no work data. Mark the days and close it without filling day by day.", allOff: "All Off", allHoliday: "All Holiday", chooseDays: "Choose days", closeFutureWeek: "Close this week", goToCurrentWeek: "Go to current week", savedWeeks: "Saved weeks", noSavedWeeks: "No saved weeks yet", fullWeek: "full", partialWeek: "partial", selectSaturday: "Select Saturday", savedFull: "Saved full", savedPartial: "Saved partial", emptyWeek: "Empty", restSnapshot: "Rest snapshot", usedExtras: "Used extras / markers", detailedView: "Detailed view", hideDailyDetails: "Hide daily details", archiveWatermark: "ARCHIVE", editingArchive: "Archive edit mode"
  },
  bg: {
    chooseLanguage: "Избери език", appTitle: "Driver Pay App V5", currentDay: "Текущ ден", install: "Инсталирай", week: "Седмица", settings: "Настройки", language: "Език",
    savedHistoricalWeek: "Запазена стара седмица", historicalLocked: "Седмицата е заключена, за да пази старите данни.", unlockEditing: "Отключи редакция",
    weekEndingSaturday: "Седмица до събота", loadSelected: "Зареди избраната", currentWeek: "Текуща седмица", previous: "Назад", next: "Напред",
    dayType: "Тип ден", workDay: "Работен ден", holidayDay: "Отпуск", offDay: "Почивен ден", shift: "Смяна", weekend: "Уикенд", start: "Старт", finish: "Край", worked: "Работено", ot: "OT",
    kilometres: "Километри", suggested: "подсказано", startKm: "Старт км", finishKm: "Край км", kmRun: "Км", startKmManual: "Старт км може да се коригира ръчно.", startKmSuggested: "Сивият старт км е подсказан от {source}. Напиши отгоре, ако е грешен.", fromFinishKm: "от {source} краен км", lastSavedDay: "последен ден", lastWeek: "предишна седмица",
    restFromPreviousDay: "Почивка от предишната смяна", noPreviousDay: "Няма предишна смяна.", holidayPay: "Отпуск £", taxed: "облагаемо", splitBreak: "Сплит почивка", weekActive: "Маркирано тази седмица", nightOut: "Нощувка", bonuses: "Бонуси", addBonus: "Добави бонус", add: "Добави", noBonusesAdded: "Няма добавени бонуси.", saveNext: "Запази и следващ", weekView: "Седмица",
    daySummary: "Дневно превю", hours: "Часове", overtime: "Овъртайм", km: "Км", yes: "Да", no: "Не", delete: "Изтрий",
    settingsTitle: "Настройки", backupRestore: "Архив / Възстановяване", recommended: "препоръчително", backupInfo: "Запазва копие на всички седмици, текущите данни, настройките, архива и сравнението с фиша. Възстановява при изчистване на данните или смяна на компютър.", backup: "Направи backup", restore: "Възстанови", payRates: "Ставки", companyName: "Име на фирма (по избор)", weekdayPayRate: "Делнична ставка", saturdayPayRate: "Събота ставка", sundayPayRate: "Неделя ставка", pensionMode: "Пенсионен режим", noPension: "Без пенсия", manualPension: "Ръчна пенсия", pensionDeduction: "Пенсионно удържане", overtimeThreshold: "Праг за овъртайм (часове)", overtimePayRate: "Овъртайм ставка", foodAllowance: "Пари за храна на работен ден", nightOutPay: "Нощувка £", bonusPayRates: "Ставки за бонуси", customBonuses: "Допълнителни бонуси", customBonusName: "Име на бонус", customBonusRate: "Ставка", done: "Готово", paySetupV2: "Pay Setup v2", openPaySetup: "Отвори Pay Setup", currentProfile: "Текущ профил", profileName: "Име на профил", profileSaved: "Профилът е записан", createProfile: "Създай профил", updateProfile: "Обнови профила", saveAsNewProfile: "Запази като нов профил", newFromThis: "Нов от този", profilePreview: "Преглед на профил", organisationName: "Фирма / агенция", loadProfile: "Зареди профил", applyProfile: "Приложи профил", applyFromNextEmptyDay: "Приложи от следващ празен ден", profileOnlySaved: "Профилът е записан. Приложи го когато е готов.", currentDraft: "Текущ draft",
    weekPreview: "Седмично превю", close: "Затвори", estimatedNet: "Очаквано нето", payslipNet: "Нето по фиш", difference: "Разлика", days: "Дни", noPoundsHere: "без £ тук", holiday: "Отпуск", off: "Почивен", showBreakdown: "Покажи разбивка", hideBreakdown: "Скрий разбивка", basePay: "Основно плащане", food: "Храна", tax: "Данък", ni: "NI", net: "Нето", splitRests: "Сплит почивки", back: "Назад", endWeek: "Край на седмицата",
    endWeekPreview: "Превю преди край", totalHours: "Общо часове", reducedRests: "9ч редуцирани", confirmInfo: "Потвърждението затваря седмицата, прави автоматичен backup и отваря следващата седмица. Избери как да се маркират оставащите дни.", confirmCloseWeek: "Потвърди и затвори", remainingOff: "Оставащите почивни", remainingHoliday: "Оставащите отпуск",
    from11hRest: "от 11ч почивка", nineHourOption: "9ч старт", reducedLimitReached: "лимитът за 9ч е достигнат", splitRestNotCounted: "", incompleteShift: "Незавършена смяна.", finishBeforeStart: "Крайният час е преди стартовия.", longShift: "Дълга смяна", shiftLimitExceeded: "Надвишен лимит 15ч", rest11: "Дневна почивка", rest9: "Съкратена почивка", previousShiftTooLongFor11h: "11ч почивка не е възможна", weeklyRest45Option: "Седмична", weeklyRest24Option: "Съкратена", owedLater: "по-късно", toFullWeeklyRest: "остават", weeklyRestComplete: "Седмична почивка", reducedWeeklyRest: "Съкратена седмична почивка", compensationMissing: "Липсват часове", weeklyRestRequired: "Нужна седмична почивка", dailyRestCompleted: "", violation: "Нарушена почивка", pending: "Няма старт", backupRestored: "Backup-ът е възстановен.", backupFailed: "Този backup файл не може да се възстанови.", installHelp: "Използвай менюто на браузъра и избери Инсталирай приложението / Добави на началния екран.", futureWeekClose: "Затвори празна седмица", fastCloseHint: "Тази седмица няма работни данни. Маркирай дните и я затвори без попълване ден по ден.", allOff: "Всички почивни", allHoliday: "Всички отпуск", chooseDays: "Избор по дни", closeFutureWeek: "Затвори седмицата", goToCurrentWeek: "Върни към текущата седмица", savedWeeks: "Запазени седмици", noSavedWeeks: "Няма запазени седмици", fullWeek: "пълна", partialWeek: "частична", selectSaturday: "Избери събота", savedFull: "Запазена пълна", savedPartial: "Запазена частична", emptyWeek: "Празна", restSnapshot: "Почивки", usedExtras: "Използвани бонуси / маркери", detailedView: "Подробен изглед", hideDailyDetails: "Скрий дните", archiveWatermark: "АРХИВ", editingArchive: "Редакция на стара запазена седмица"
  }
};
function t(key: string): string { return UI_TEXT[uiLang]?.[key] || UI_TEXT.en[key] || key; }
function formatTemplate(template: string, values: Record<string, string>): string { return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template); }
function dayNameLabel(dayName: string): string { const bg: Record<string, string> = { Monday: "Понеделник", Tuesday: "Вторник", Wednesday: "Сряда", Thursday: "Четвъртък", Friday: "Петък", Saturday: "Събота", Sunday: "Неделя" }; return uiLang === "bg" ? bg[dayName] || dayName : dayName; }

type BonusType = string;
type CustomBonusConfig = { id: string; name: string; rate: string };
type DayType = "work" | "holiday" | "off";
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type WeekArchiveType = "worked" | "holiday" | "off";
type CompletionSource = "user" | "emptyWorkdaySave";
type RestStatus = "good" | "reduced" | "split" | "violation" | "unknown";

type BonusEntry = { id: string; type: BonusType; qty: number };

type DayRecord = {
  id: string;
  dayName: string;
  dateLabel: string;
  dateISO: string;
  start: string;
  finish: string;
  startKm: string;
  finishKm: string;
  holidayPay: string;
  dayType: DayType;
  splitBreak: boolean;
  nightOut: boolean;
  bonuses: BonusEntry[];
  completionSource?: CompletionSource;
};

type SettingsState = {
  grossOnly?: boolean;
  companyName: string;
  weekdayRate: string;
  saturdayRate: string;
  sundayRate: string;
  pensionMode: string;
  pensionManualAmount: string;
  overtimeThresholdHours: string;
  overtimeRate: string;
  foodAllowanceRate: string;
  nightOutRate: string;
  bonusRates: Record<string, string>;
  customBonuses: CustomBonusConfig[];
};


type PayProfileV2 = {
  id: string;
  name: string;
  companyName: string;
  organisationName?: string;
  sourceProfileId?: string | null;
  createdAt: string;
  updatedAt: string;
  settingsSnapshot: SettingsState;
};

const PAY_PROFILES_STORAGE_KEY = "driverPay_payProfiles_v2";
const ACTIVE_PAY_PROFILE_STORAGE_KEY = "driverPay_activePayProfileId_v2";

function makeProfileId() { return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function getProfileNameBase(settings: SettingsState) { return settings.companyName?.trim() || "Profile"; }
function getOrganisationName(profile: PayProfileV2 | null | undefined, fallbackSettings?: SettingsState) { return profile?.organisationName || profile?.companyName || fallbackSettings?.companyName || ""; }
function getNextProfileName(existing: PayProfileV2[], base = "Profile") {
  const cleanBase = base.trim() || "Profile";
  const names = new Set(existing.map((profile) => profile.name));
  if (!names.has(cleanBase)) return cleanBase;
  let index = 1;
  while (names.has(`${cleanBase} ${index}`)) index += 1;
  return `${cleanBase} ${index}`;
}
function makeProfileFromSettings(settings: SettingsState, existing: PayProfileV2[] = [], name?: string, sourceProfileId?: string | null): PayProfileV2 {
  const now = new Date().toISOString();
  const profileName = getNextProfileName(existing, name?.trim() || getProfileNameBase(settings) || "Profile");
  return { id: makeProfileId(), name: profileName, companyName: settings.companyName || "", organisationName: settings.companyName || "", sourceProfileId: sourceProfileId || null, createdAt: now, updatedAt: now, settingsSnapshot: settings };
}
function sanitizePayProfile(raw: unknown): PayProfileV2 | null {
  const r = (raw || {}) as Partial<PayProfileV2>;
  if (typeof r !== "object") return null;
  const snapshot = sanitizeSettings((r as any).settingsSnapshot);
  const id = typeof r.id === "string" && r.id ? r.id : makeProfileId();
  const name = typeof r.name === "string" && r.name.trim() ? r.name.trim() : "Profile";
  const companyName = typeof r.companyName === "string" ? r.companyName : snapshot.companyName || ""; const organisationName = typeof (r as any).organisationName === "string" ? (r as any).organisationName : companyName; return { id, name, companyName, organisationName, sourceProfileId: typeof r.sourceProfileId === "string" ? r.sourceProfileId : null, createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(), updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(), settingsSnapshot: snapshot };
}
function loadStoredPayProfiles(settings: SettingsState): PayProfileV2[] {
  if (typeof window === "undefined") return [makeProfileFromSettings(settings, [], settings.companyName || "Profile 1")];
  try {
    const parsed = JSON.parse(localStorage.getItem(PAY_PROFILES_STORAGE_KEY) || "[]");
    const profiles = Array.isArray(parsed) ? parsed.map(sanitizePayProfile).filter(Boolean) as PayProfileV2[] : [];
    return profiles.length ? profiles : [makeProfileFromSettings(settings, [], settings.companyName || "Profile 1")];
  } catch { return [makeProfileFromSettings(settings, [], settings.companyName || "Profile 1")]; }
}
function saveStoredPayProfiles(profiles: PayProfileV2[], activeProfileId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAY_PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  localStorage.setItem(ACTIVE_PAY_PROFILE_STORAGE_KEY, activeProfileId);
}

type ComputedDay = DayRecord & {
  weekend: boolean;
  workedMinutes: number | null;
  overtimeMinutes: number;
  kmRun: number | null;
  basePay: number;
  overtimePay: number;
  bonusPay: number;
  holidayPayAmount: number;
  nightOutPay: number;
  foodAllowancePay: number;
  taxablePay: number;
  untaxedPay: number;
  tax: number;
  ni: number;
  net: number;
  total: number;
};

type WeekTotals = {
  worked: number;
  overtime: number;
  km: number;
  taxable: number;
  untaxed: number;
  tax: number;
  ni: number;
  net: number;
  total: number;
};

type SavedWeekData = { days: DayRecord[]; settings: SettingsState; payslipActualWeek?: string };

const BONUS_TYPES: BonusType[] = ["ADR", "Genset", "Splitter", "Driver Assist", "London Bonus"];
const CUSTOM_BONUS_SLOT_COUNT = 6;
function makeEmptyCustomBonuses(): CustomBonusConfig[] { return Array.from({ length: CUSTOM_BONUS_SLOT_COUNT }, (_, index) => ({ id: `custom-${index + 1}`, name: "", rate: "" })); }
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const emptyTotals: WeekTotals = { worked: 0, overtime: 0, km: 0, taxable: 0, untaxed: 0, tax: 0, ni: 0, net: 0, total: 0 };

const initialSettings: SettingsState = {
  grossOnly: false,
  companyName: "",
  weekdayRate: "14.00",
  saturdayRate: "21.00",
  sundayRate: "21.00",
  pensionMode: "none",
  pensionManualAmount: "0.00",
  overtimeThresholdHours: "10.00",
  overtimeRate: "17.50",
  foodAllowanceRate: "10.00",
  nightOutRate: "26.00",
  bonusRates: { ADR: "11.25", Genset: "11.25", Splitter: "11.25", "Driver Assist": "11.25", "London Bonus": "15.00" },
  customBonuses: makeEmptyCustomBonuses(),
};

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f5f7fb", padding: 12, fontFamily: "Arial, sans-serif", color: "#0f172a" };
const shellStyle: React.CSSProperties = { maxWidth: 430, margin: "0 auto", background: "#ffffff", borderRadius: 24, border: "1px solid #e5e7eb", overflow: "hidden" };
const sectionStyle: React.CSSProperties = { padding: 16, borderTop: "1px solid #eef2f7" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid #dbe3ee", fontSize: 16, outline: "none", boxSizing: "border-box", background: "#fff" };
const buttonStyle: React.CSSProperties = { borderRadius: 14, border: "1px solid #dbe3ee", padding: "12px 14px", fontSize: 15, fontWeight: 700, cursor: "pointer", background: "#fff", transition: "transform 0.08s ease, filter 0.08s ease, background 0.08s ease, opacity 0.08s ease, box-shadow 0.08s ease", WebkitTapHighlightColor: "transparent", userSelect: "none" };

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

function formatISODateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getTaxWeekNumber(date: Date): number {
  const taxYearStart = new Date(date.getFullYear(), 3, 6);
  const start = date < taxYearStart ? new Date(date.getFullYear() - 1, 3, 6) : taxYearStart;
  return Math.floor(Math.floor((date.getTime() - start.getTime()) / 86400000) / 7) + 1;
}

function isWeekend(dayName: string): boolean {
  return dayName === "Saturday" || dayName === "Sunday";
}

function makeDay(id: string, dayName: string, date: Date): DayRecord {
  return {
    id,
    dayName,
    dateLabel: formatDateLabel(date),
    dateISO: toISODate(date),
    start: "",
    finish: "",
    startKm: "",
    finishKm: "",
    holidayPay: "",
    dayType: dayName === "Sunday" ? "off" : "work",
    splitBreak: false,
    nightOut: false,
    bonuses: [],
  };
}

function buildPayrollWeek(saturdayISO: string): DayRecord[] {
  const sat = fromISODate(saturdayISO);
  return [
    makeDay("mon", "Monday", addDays(sat, -5)),
    makeDay("tue", "Tuesday", addDays(sat, -4)),
    makeDay("wed", "Wednesday", addDays(sat, -3)),
    makeDay("thu", "Thursday", addDays(sat, -2)),
    makeDay("fri", "Friday", addDays(sat, -1)),
    makeDay("sat", "Saturday", sat),
    makeDay("sun", "Sunday", addDays(sat, -6)),
  ];
}

function getCurrentPayrollSaturdayISO(): string {
  const today = new Date();
  return toISODate(addDays(today, (6 - today.getDay() + 7) % 7));
}

function getStartupPayrollSaturdayISO(): string {
  const currentSaturday = getCurrentPayrollSaturdayISO();
  if (typeof window === "undefined") return currentSaturday;
  const saved = localStorage.getItem(ACTIVE_WEEK_STORAGE_KEY);
  const savedLooksValid = /^\d{4}-\d{2}-\d{2}$/.test(saved || "");

  // Startup must never drop a fresh install/tester into an old archive week.
  // Reuse the saved active week only when it is current/future and not closed.
  // Old closed/historical pointers are treated as stale PWA/localStorage state.
  if (savedLooksValid && (saved as string) >= currentSaturday && !isWeekClosed(saved as string)) return saved as string;

  if (savedLooksValid && saved !== currentSaturday) {
    localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, currentSaturday);
  }
  return currentSaturday;
}

function readClosedWeeks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CLOSED_WEEKS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => /^\d{4}-\d{2}-\d{2}$/.test(item)) : [];
  } catch {
    return [];
  }
}

function isWeekClosed(saturdayISO: string): boolean {
  return readClosedWeeks().includes(saturdayISO);
}

function markWeekClosed(saturdayISO: string): void {
  if (typeof window === "undefined") return;
  const closed = readClosedWeeks();
  if (!closed.includes(saturdayISO)) localStorage.setItem(CLOSED_WEEKS_STORAGE_KEY, JSON.stringify([...closed, saturdayISO]));
}

const initialDays = buildPayrollWeek(getStartupPayrollSaturdayISO());

function sanitizeBonusType(value: unknown): BonusType {
  return typeof value === "string" && value.trim() ? value.trim() : "ADR";
}

function sanitizeBonusEntry(raw: unknown): BonusEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { id: typeof r.id === "string" ? r.id : `${Date.now()}-${Math.random()}`, type: sanitizeBonusType(r.type), qty: Number.isFinite(Number(r.qty)) ? Math.max(1, Number(r.qty)) : 1 };
}

function sanitizeDayType(value: unknown): DayType {
  return value === "holiday" || value === "off" || value === "work" ? value : "work";
}

function sanitizeDayRecord(raw: unknown, fallback: DayRecord): DayRecord {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    ...fallback,
    id: typeof r.id === "string" ? r.id : fallback.id,
    dayName: typeof r.dayName === "string" ? r.dayName : fallback.dayName,
    dateLabel: typeof r.dateLabel === "string" ? r.dateLabel : fallback.dateLabel,
    dateISO: typeof r.dateISO === "string" ? r.dateISO : fallback.dateISO,
    start: typeof r.start === "string" ? r.start : "",
    finish: typeof r.finish === "string" ? r.finish : "",
    startKm: typeof r.startKm === "string" ? r.startKm : "",
    finishKm: typeof r.finishKm === "string" ? r.finishKm : "",
    holidayPay: typeof r.holidayPay === "string" ? r.holidayPay : "",
    dayType: sanitizeDayType(r.dayType),
    splitBreak: Boolean(r.splitBreak),
    nightOut: Boolean(r.nightOut),
    bonuses: Array.isArray(r.bonuses) ? r.bonuses.map(sanitizeBonusEntry) : [],
    completionSource: r.completionSource === "emptyWorkdaySave" ? "emptyWorkdaySave" : undefined,
  };
}

function sanitizeCustomBonuses(raw: unknown): CustomBonusConfig[] {
  const input = Array.isArray(raw) ? raw : [];
  const slots = makeEmptyCustomBonuses();
  return slots.map((slot, index) => {
    const item = (input[index] ?? {}) as Record<string, unknown>;
    return {
      id: typeof item.id === "string" ? item.id : slot.id,
      name: typeof item.name === "string" ? item.name : "",
      rate: typeof item.rate === "string" ? item.rate : "",
    };
  });
}

function getActiveBonusTypes(settings: SettingsState): BonusType[] {
  const custom = settings.customBonuses.map((bonus) => bonus.name.trim()).filter(Boolean);
  return Array.from(new Set([...BONUS_TYPES, ...custom]));
}

function getBonusRate(settings: SettingsState, type: BonusType): string {
  if (settings.bonusRates[type] != null) return settings.bonusRates[type];
  const custom = settings.customBonuses.find((bonus) => bonus.name.trim() === type);
  return custom?.rate || "0";
}

function sanitizeSettings(raw: unknown): SettingsState {
  const r = (raw ?? {}) as Record<string, unknown>;
  const br = (r.bonusRates ?? {}) as Record<string, unknown>;
  return {
    companyName: typeof r.companyName === "string" ? r.companyName : "",
    weekdayRate: typeof r.weekdayRate === "string" ? r.weekdayRate : initialSettings.weekdayRate,
    saturdayRate: typeof r.saturdayRate === "string" ? r.saturdayRate : (typeof r.weekendRate === "string" ? r.weekendRate : initialSettings.saturdayRate),
    sundayRate: typeof r.sundayRate === "string" ? r.sundayRate : (typeof r.weekendRate === "string" ? r.weekendRate : initialSettings.sundayRate),
    pensionMode: typeof r.pensionMode === "string" ? r.pensionMode : initialSettings.pensionMode,
    pensionManualAmount: typeof r.pensionManualAmount === "string" ? r.pensionManualAmount : initialSettings.pensionManualAmount,
    overtimeThresholdHours: typeof r.overtimeThresholdHours === "string" ? r.overtimeThresholdHours : initialSettings.overtimeThresholdHours,
    overtimeRate: typeof r.overtimeRate === "string" ? r.overtimeRate : initialSettings.overtimeRate,
    foodAllowanceRate: typeof r.foodAllowanceRate === "string" ? r.foodAllowanceRate : initialSettings.foodAllowanceRate,
    nightOutRate: typeof r.nightOutRate === "string" ? r.nightOutRate : initialSettings.nightOutRate,
    bonusRates: {
      ADR: typeof br.ADR === "string" ? br.ADR : initialSettings.bonusRates.ADR,
      Genset: typeof br.Genset === "string" ? br.Genset : initialSettings.bonusRates.Genset,
      Splitter: typeof br.Splitter === "string" ? br.Splitter : initialSettings.bonusRates.Splitter,
      "Driver Assist": typeof br["Driver Assist"] === "string" ? br["Driver Assist"] : initialSettings.bonusRates["Driver Assist"],
      "London Bonus": typeof br["London Bonus"] === "string" ? br["London Bonus"] : initialSettings.bonusRates["London Bonus"],
    },
    customBonuses: sanitizeCustomBonuses(r.customBonuses),
  };
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function formatTimeInput(raw: string): string {
  return digitsOnly(raw).slice(0, 4);
}

function normalizeTime(value: string): string {
  const d = digitsOnly(value).slice(0, 4);
  if (!d) return "";
  if (d.length === 1) return `0${d}:00`;
  if (d.length === 2) return `${String(Math.min(23, Number(d))).padStart(2, "0")}:00`;
  if (d.length === 3) return `0${d[0]}:${String(Math.min(59, Number(d.slice(1)))).padStart(2, "0")}`;
  return `${String(Math.min(23, Number(d.slice(0, 2)))).padStart(2, "0")}:${String(Math.min(59, Number(d.slice(2, 4)))).padStart(2, "0")}`;
}

function parseTimeToMinutes(value: string): number | null {
  const n = normalizeTime(value);
  if (!n) return null;
  const [h, m] = n.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
}

function minutesToTime(mins: number | null): string {
  if (mins == null) return "";
  return `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

function absMinutesToLocalTime(absMinutes: number | null): string {
  if (absMinutes == null) return "";
  const date = new Date(absMinutes * 60000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseDecimal(value: string): number {
  const parsed = Number(String(value || "").replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMinutes(value: number | null): string {
  if (value == null) return "";
  const safe = Math.max(0, Math.round(value));
  return `${Math.floor(safe / 60)}h ${(safe % 60).toString().padStart(2, "0")}m`;
}

function isGrossOnlyMode(settings: SettingsState) { return Boolean(settings.grossOnly); }
function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

function getWorkedMinutes(day: DayRecord): number | null {
  if (day.dayType !== "work") return null;
  const s = parseTimeToMinutes(day.start);
  const f = parseTimeToMinutes(day.finish);
  if (s == null || f == null || f <= s) return null;
  return f - s;
}

function getShiftValidationMessage(day: DayRecord): string | null {
  if (day.dayType !== "work") return null;
  const start = normalizeTime(day.start || "");
  const finish = normalizeTime(day.finish || "");
  const s = parseTimeToMinutes(start);
  const f = parseTimeToMinutes(finish);
  if ((start && !finish) || (!start && finish)) return t("incompleteShift");
  if (s != null && f != null && f <= s) return t("finishBeforeStart");
  if (s != null && f != null && f - s > 15 * 60) return `${t("shiftLimitExceeded")}: ${Math.floor((f - s) / 60)}h ${(f - s) % 60}m.`;
  return null;
}

function getKmRun(day: DayRecord): number | null {
  const start = Number(day.startKm);
  const finish = Number(day.finishKm);
  if (!day.startKm || !day.finishKm || !Number.isFinite(start) || !Number.isFinite(finish) || finish < start) return null;
  return finish - start;
}

function getRestBeforeMinutes(previous: DayRecord | undefined, current: DayRecord): number | null {
  if (!previous || current.dayType !== "work") return null;
  const pf = parseTimeToMinutes(previous.finish);
  const cs = parseTimeToMinutes(current.start);
  if (pf == null || cs == null) return null;
  return (cs < pf ? cs + 1440 : cs) - pf;
}

function getBaseRestStatus(restMinutes: number | null): RestStatus {
  if (restMinutes == null) return "unknown";
  if (restMinutes >= 11 * 60) return "good";
  if (restMinutes >= 9 * 60) return "reduced";
  return "violation";
}

function getOrderedDayIndices(days: DayRecord[]): number[] {
  return DAY_ORDER.map((id) => days.findIndex((d) => d.id === id)).filter((index) => index !== -1);
}

function getPreviousLogicalDay(days: DayRecord[], index: number): DayRecord | undefined {
  const ordered = getOrderedDayIndices(days);
  const pos = ordered.indexOf(index);
  return pos > 0 ? days[ordered[pos - 1]] : undefined;
}

function getLastFinishKmBeforeIndex(days: DayRecord[], index: number): string {
  const ordered = getOrderedDayIndices(days);
  const pos = ordered.indexOf(index);
  if (pos <= 0) return "";
  for (let i = pos - 1; i >= 0; i -= 1) {
    const finishKm = days[ordered[i]]?.finishKm || "";
    if (finishKm) return finishKm;
  }
  return "";
}

function isSplitDailyRest(previous: DayRecord | undefined, restMinutes: number | null): boolean {
  return Boolean(previous?.splitBreak && restMinutes != null && restMinutes >= 9 * 60);
}

function getWeeklyReducedRestCountBeforeIndex(days: DayRecord[], targetIndex: number): number {
  const ordered = getOrderedDayIndices(days);
  const targetPos = ordered.indexOf(targetIndex);
  if (targetPos <= 0) return 0;
  let count = 0;
  for (let pos = 1; pos < targetPos; pos += 1) {
    const previous = days[ordered[pos - 1]];
    const current = days[ordered[pos]];
    const restMinutes = getRestBeforeMinutes(previous, current);
    if (getBaseRestStatus(restMinutes) === "reduced" && !isSplitDailyRest(previous, restMinutes)) count += 1;
  }
  return count;
}

function getEffectiveRestStatus(restMinutes: number | null, previousWorkedMinutes: number | null, previousSplitBreak: boolean, reducedCountBeforeCurrent: number): RestStatus {
  const base = getBaseRestStatus(restMinutes);
  if (base === "unknown" || base === "violation") return base;
  const splitDailyRest = previousSplitBreak && restMinutes != null && restMinutes >= 9 * 60;
  if (splitDailyRest && base === "reduced") return "split";
  if (previousWorkedMinutes != null && previousWorkedMinutes > 13 * 60 && restMinutes != null && restMinutes >= 9 * 60) return splitDailyRest ? "split" : (reducedCountBeforeCurrent >= 3 ? "violation" : "reduced");
  if (base === "reduced" && reducedCountBeforeCurrent >= 3) return "violation";
  return base;
}

type SuggestedStarts = { h11: number | null; h9: number | null; h9Blocked: boolean; longPreviousShift: boolean; splitRestAvailable: boolean };
function getSuggestedStartTimes(prevFinish: number | null, reducedCount: number, previousWorkedMinutes: number | null, previousSplitBreak: boolean): SuggestedStarts {
  if (prevFinish == null) return { h11: null, h9: null, h9Blocked: false, longPreviousShift: false, splitRestAvailable: false };
  const over13h = previousWorkedMinutes != null && previousWorkedMinutes > 13 * 60;
  const splitRestAvailable = previousSplitBreak;
  const longPreviousShift = over13h;
  return {
    h11: over13h ? null : prevFinish + 11 * 60,
    h9: prevFinish + 9 * 60,
    h9Blocked: reducedCount >= 3 && !splitRestAvailable,
    longPreviousShift,
    splitRestAvailable,
  };
}

function isSameLocalDayAbs(absMinutes: number, day: DayRecord): boolean {
  const target = new Date(absMinutes * 60000);
  const dayDate = fromISODate(day.dateISO);
  return target.getFullYear() === dayDate.getFullYear() && target.getMonth() === dayDate.getMonth() && target.getDate() === dayDate.getDate();
}

function getSuggestedStartTimesForDay(anchor: PreviousShiftAnchor | null, current: DayRecord, reducedCount: number, previousWorkedMinutes: number | null, previousSplitBreak: boolean): SuggestedStarts {
  if (!anchor || current.dayType !== "work") return { h11: null, h9: null, h9Blocked: false, longPreviousShift: false, splitRestAvailable: false };
  const base = getSuggestedStartTimes(anchor.finishAbs, reducedCount, previousWorkedMinutes, previousSplitBreak);
  return {
    ...base,
    // Daily start suggestions are only useful when the suggested start actually belongs
    // to the current day. Weekly/long-rest targets are shown as helper information only.
    h11: base.h11 != null && isSameLocalDayAbs(base.h11, current) ? base.h11 : null,
    h9: base.h9 != null && isSameLocalDayAbs(base.h9, current) ? base.h9 : null,
  };
}

function getPrimarySuggestedStart(suggested: SuggestedStarts): string {
  if (suggested.h11 != null) return absMinutesToLocalTime(suggested.h11);
  if (suggested.h9 != null && !suggested.h9Blocked) return absMinutesToLocalTime(suggested.h9);
  return "";
}

function getSuggestedStartHelp(suggested: SuggestedStarts): string {
  const parts: string[] = [];
  if (suggested.longPreviousShift) {
    parts.push(t("previousShiftTooLongFor11h"));
  } else if (suggested.h9 != null) {
    parts.push(`${t("nineHourOption")}: ${absMinutesToLocalTime(suggested.h9)}`);
  }
  if (suggested.h9Blocked) parts.push(t("reducedLimitReached"));
  return parts.join(" · ");
}

type PreviousShiftAnchor = { day: DayRecord; finishAbs: number };
type WeeklyRestCandidate = { closingSaturdayISO: string; finishAbs: number };

function getDayTimeAbsMinutes(day: DayRecord, time: string): number | null {
  const mins = parseTimeToMinutes(time);
  if (mins == null) return null;
  const date = fromISODate(day.dateISO);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 60000) + mins;
}

function getDayStartAbsMinutes(day: DayRecord): number {
  const date = fromISODate(day.dateISO);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 60000);
}

function formatShortDayTime(absMinutes: number | null): string {
  if (absMinutes == null) return "";
  const date = new Date(absMinutes * 60000);
  const day = uiLang === "bg"
    ? ["Нед", "Пон", "Вт", "Ср", "Чет", "Пет", "Съб"][date.getDay()]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  return `${day} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getLastCompletedWorkShiftBeforeIndex(days: DayRecord[], index: number, saturdayISO: string): PreviousShiftAnchor | null {
  const ordered = getOrderedDayIndices(days);
  const pos = ordered.indexOf(index);
  for (let i = pos - 1; i >= 0; i -= 1) {
    const day = days[ordered[i]];
    if (day?.dayType !== "work") continue;
    if (!day.finish) {
      // A completely untouched past Work day is only a soft missed/no-activity day.
      // It must not break the chronological rest chain.
      // But a touched Work day without Finish is a real incomplete day and must stop lookup.
      if (dayHasEnteredData(day)) return null;
      continue;
    }
    const finishAbs = getDayTimeAbsMinutes(day, day.finish);
    if (finishAbs != null) return { day, finishAbs };
  }
  if (typeof window === "undefined") return null;
  try {
    const previousSaturdayISO = toISODate(addDays(fromISODate(saturdayISO), -7));
    const saved = localStorage.getItem(getWeekStorageKey(previousSaturdayISO));
    let parsed: any = saved ? JSON.parse(saved) : null;
    if (!parsed) {
      const archiveItems = JSON.parse(localStorage.getItem("archive") || "[]");
      if (Array.isArray(archiveItems)) {
        parsed = archiveItems.find((item) => Array.isArray(item?.days) && getSaturdayDay(item.days).dateISO === previousSaturdayISO) || null;
      }
    }
    if (!parsed) return null;
    const rawDays = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.days) ? parsed.days : [];
    const previousWeek = buildPayrollWeek(previousSaturdayISO).map((day, weekIndex) => sanitizeDayRecord(rawDays[weekIndex], day));
    const previousOrdered = getOrderedDayIndices(previousWeek);
    for (let i = previousOrdered.length - 1; i >= 0; i -= 1) {
      const day = previousWeek[previousOrdered[i]];
      if (day?.dayType === "work" && day.finish) {
        const finishAbs = getDayTimeAbsMinutes(day, day.finish);
        if (finishAbs != null) return { day, finishAbs };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function getRestDisplayEndAbs(current: DayRecord): number | null {
  if (current.dayType !== "work") return null;
  const startAbs = getDayTimeAbsMinutes(current, current.start);
  if (startAbs != null) return startAbs;

  // Before Start is entered, the Rest card should still show the live factual rest
  // from the previous real Finish to now. For past days, cap at the end of that day;
  // for future days, do not invent a rest value.
  const dayStartAbs = getDayStartAbsMinutes(current);
  const dayEndAbs = dayStartAbs + 24 * 60;
  const nowAbs = Math.floor(Date.now() / 60000);
  if (nowAbs < dayStartAbs) return null;
  return Math.min(nowAbs, dayEndAbs);
}

function getRestFromPreviousShiftMinutes(anchor: PreviousShiftAnchor | null, current: DayRecord): number | null {
  if (!anchor || current.dayType !== "work") return null;
  const endAbs = getRestDisplayEndAbs(current);
  if (endAbs == null) return null;
  return Math.max(0, endAbs - anchor.finishAbs);
}

function getLastCompletedWorkShiftInWeek(days: DayRecord[]): PreviousShiftAnchor | null {
  const ordered = getOrderedDayIndices(days);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const day = days[ordered[i]];
    if (day?.dayType === "work" && day.finish) {
      const finishAbs = getDayTimeAbsMinutes(day, day.finish);
      if (finishAbs != null) return { day, finishAbs };
    }
  }
  return null;
}

function readWeeklyRestCandidate(): WeeklyRestCandidate | null {
  // Stable recovery rule:
  // Weekly Rest bridge/candidate is disabled. It was an experimental helper
  // and must not affect Start suggestions or the Rest card in the golden base.
  return null;
}

function writeWeeklyRestCandidate(candidate: WeeklyRestCandidate | null) {
  // Keep cleanup only. Do not persist a weekly-rest bridge in this stable base.
  if (typeof window === "undefined") return;
  localStorage.removeItem(WEEKLY_REST_CANDIDATE_STORAGE_KEY);
}

function getWeeklyRestCandidateForSelectedWeek(selectedSaturdayISO: string): WeeklyRestCandidate | null {
  // Weekly Rest will be planned as a separate module later.
  // No backfill/bridge overlay is allowed in this stable base.
  return null;
}

function getWeeklyRestTargets(anchor: { finishAbs: number } | null) {
  if (!anchor) return null;
  const reducedStart = anchor.finishAbs + 24 * 60;
  const fullStart = anchor.finishAbs + 45 * 60;
  return { reducedStart, fullStart, reducedOwedHours: 21 };
}

function getWeeklyRestPrimaryStart(anchor: { finishAbs: number } | null, enabled: boolean): string {
  const targets = enabled ? getWeeklyRestTargets(anchor) : null;
  return targets ? absMinutesToLocalTime(targets.fullStart) : "";
}

function getWeeklyRestSuggestionHelp(anchor: { finishAbs: number } | null, current: DayRecord, enabled: boolean): string {
  if (!enabled || !anchor || current.dayType !== "work") return "";
  const targets = getWeeklyRestTargets(anchor);
  if (!targets) return "";
  const helperEndAbs = getRestDisplayEndAbs(current) ?? getDayStartAbsMinutes(current);
  if (helperEndAbs > anchor.finishAbs + 72 * 60) return "";
  // Weekly rest is helper information only. It must never fill the Start field.
  return `${t("weeklyRest45Option")}: ${formatShortDayTime(targets.fullStart)} · ${t("weeklyRest24Option")}: ${formatShortDayTime(targets.reducedStart)} (+${targets.reducedOwedHours}h ${t("owedLater")})`;
}

function getWeeklyRestPalette(restMinutes: number | null, requiredMinutes: number) {
  if (restMinutes == null) return null;
  if (restMinutes < 24 * 60) return { ...statusPalette("violation"), label: t("weeklyRestRequired") };
  if (requiredMinutes > 45 * 60) return restMinutes >= requiredMinutes ? { ...statusPalette("good"), label: t("weeklyRestComplete") } : { ...statusPalette("violation"), label: t("compensationMissing") };
  if (restMinutes >= 45 * 60) return { ...statusPalette("good"), label: t("weeklyRestComplete") };
  return { ...statusPalette("reduced"), label: t("reducedWeeklyRest") };
}

function getWeeklyRestContextHelp(restMinutes: number | null, requiredMinutes: number): string {
  if (restMinutes == null) return "";
  if (requiredMinutes > 45 * 60) {
    const missing = Math.ceil(Math.max(0, requiredMinutes - restMinutes) / 60);
    return restMinutes >= requiredMinutes ? "" : `+${missing}h ${t("owedLater")}`;
  }
  if (restMinutes >= 45 * 60) return "";
  if (restMinutes >= 24 * 60) {
    const remaining = Math.ceil((45 * 60 - restMinutes) / 60);
    return `+${remaining}h ${t("owedLater")}`;
  }
  return t("weeklyRestRequired");
}

function getRestContextHelp(restMinutes: number | null): string {
  // Keep daily Rest card quiet: the card label + real rest time are enough.
  return "";
}

function getRestCardLabel(status: RestStatus, reducedCountBeforeCurrent: number): string {
  if (status === "reduced") {
    const left = Math.max(0, 3 - reducedCountBeforeCurrent - 1);
    return left === 0 ? `${t("rest9")} • ${t("noReducedLeft")}` : `${t("rest9")} • ${t("reducedLeft")}: ${left}`;
  }
  return statusPalette(status).label;
}

function getRestCardPalette(restMinutes: number | null, status: RestStatus, reducedCountBeforeCurrent: number) {
  // Label-only classification for the Rest card. A long gap before the next shift
  // should not be shown as Daily rest just because it is measured from the previous shift.
  if (restMinutes != null && restMinutes >= 45 * 60) return { ...statusPalette("good"), label: t("weeklyRestComplete") };
  if (restMinutes != null && restMinutes >= 24 * 60) return { ...statusPalette("reduced"), label: t("reducedWeeklyRest") };
  return { ...statusPalette(status), label: getRestCardLabel(status, reducedCountBeforeCurrent) };
}

function statusPalette(status: RestStatus) {
  if (status === "good") return { bg: "linear-gradient(135deg,#ffffff 0%,#dcfce7 100%)", border: "#86efac", text: "#166534", label: t("rest11") };
  if (status === "split") return { bg: "linear-gradient(135deg,#bbf7d0 0%,#fde047 100%)", border: "#84cc16", text: "#365314", label: "Split rest" };
  if (status === "reduced") return { bg: "linear-gradient(135deg,#ffffff 0%,#fef9c3 100%)", border: "#fde68a", text: "#a16207", label: t("rest9") };
  if (status === "violation") return { bg: "linear-gradient(135deg,#ffffff 0%,#fee2e2 100%)", border: "#fca5a5", text: "#b91c1c", label: t("violation") };
  return { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", label: t("pending") };
}


function dayHasEnteredData(day: DayRecord): boolean {
  // KM alone is not work data. A carried-forward start/finish km must not block Off/Holiday.
  const hasRealKmRun = Boolean(day.startKm && day.finishKm && day.finishKm !== day.startKm);
  return Boolean(day.start || day.finish || hasRealKmRun || day.holidayPay || day.bonuses.length || day.nightOut || day.splitBreak);
}

function dayHasDestructiveWorkData(day: DayRecord): boolean {
  // A single suggested/typed start time or carried-forward km is treated as draft data.
  // Real worked data is finish time, actual km run, bonuses, night out or split break.
  const hasRealKmRun = Boolean(day.startKm && day.finishKm && day.finishKm !== day.startKm);
  return Boolean(day.finish || hasRealKmRun || day.bonuses.length || day.nightOut || day.splitBreak);
}

function isEmptyForRemainingClose(day: DayRecord): boolean {
  // Empty for closing means no shift/pay/bonus data. Carried-forward km may exist and should be preserved.
  return !day.start && !day.finish && !day.holidayPay && day.bonuses.length === 0 && !day.nightOut && !day.splitBreak;
}

function weekHasWorkData(days: DayRecord[]): boolean {
  return days.some(dayHasEnteredData);
}

function findLastKnownKm(days: DayRecord[]): string {
  const ordered = getOrderedDayIndices(days);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const day = days[ordered[i]];
    if (day.finishKm) return day.finishKm;
    if (day.startKm) return day.startKm;
  }
  return "";
}

function carryKmThroughNonWorkingDays(days: DayRecord[]): DayRecord[] {
  let lastKm = "";
  const next = [...days];
  for (const index of getOrderedDayIndices(days)) {
    const day = next[index];
    const startKm = day.startKm || lastKm;
    if (day.dayType === "off" || day.dayType === "holiday") {
      next[index] = { ...day, startKm, finishKm: day.finishKm || startKm };
    } else if (startKm && !day.startKm) {
      next[index] = { ...day, startKm };
    }
    if (next[index].finishKm) lastKm = next[index].finishKm;
    else if (next[index].startKm) lastKm = next[index].startKm;
  }
  return next;
}

function isDayComplete(day: DayRecord): boolean {
  return (day.dayType === "work" && Boolean(normalizeTime(day.start || "") && normalizeTime(day.finish || ""))) || day.dayType === "off" || day.dayType === "holiday";
}

function getFirstIncompleteIndex(days: DayRecord[]): number {
  const ordered = getOrderedDayIndices(days);
  for (const index of ordered) if (!isDayComplete(days[index])) return index;

  // If the whole week is complete, do not fall back to Saturday Off.
  // Saturday is usually a closed/non-working end marker, and opening on it
  // makes the app look stuck after End Week or restart.
  const monday = days.findIndex((d) => d.id === "mon");
  return monday >= 0 ? monday : (ordered[0] ?? 0);
}

function getPreferredOpenDayIndex(days: DayRecord[]): number {
  const todayISO = toISODate(new Date());
  const currentSaturday = getCurrentPayrollSaturdayISO();
  const weekSaturday = getSaturdayDay(days).dateISO;
  const todayIndex = days.findIndex((day) => day.dateISO === todayISO);

  // Smart current-day priority: if the active/current week contains today,
  // open today when it is still practically changeable. This prevents planned
  // Holiday/Day Offs from pushing the driver past today when plans change.
  if (weekSaturday === currentSaturday && todayIndex >= 0 && !isWeekClosed(weekSaturday)) {
    const today = days[todayIndex];
    const firstIncomplete = getFirstIncompleteIndex(days);
    const isIncompleteWorkDay = today.dayType === "work" && !isDayComplete(today);
    const isCurrentNonWorkingPlan = (today.dayType === "holiday" || today.dayType === "off") && today.completionSource !== "emptyWorkdaySave";

    // Open today only when it still needs attention, or when today's planned
    // Holiday/Day Off may realistically need changing back to Work. Do not
    // trap the user on an empty Work day that Save & Next intentionally converted to Off.
    if (isIncompleteWorkDay) return todayIndex;
    if (isCurrentNonWorkingPlan && firstIncomplete > todayIndex) return todayIndex;
  }

  return getFirstIncompleteIndex(days);
}

function getAdjacentLogicalIndex(days: DayRecord[], currentIndex: number, direction: 1 | -1): number {
  const ordered = getOrderedDayIndices(days);
  const currentPos = ordered.indexOf(currentIndex);
  const nextPos = currentPos + direction;
  if (currentPos === -1 || nextPos < 0 || nextPos >= ordered.length) return currentIndex;
  return ordered[nextPos];
}

function getSaturdayDay(days: DayRecord[]): DayRecord {
  return days.find((day) => day.id === "sat") || days[5] || days[days.length - 1];
}

function getWeekStorageKey(saturdayISO: string): string {
  return `driverApp_week_${saturdayISO}`;
}

function getSavedWeekIndicators(): { saturdayISO: string; label: string; status: "full" | "partial" }[] {
  if (typeof window === "undefined") return [];
  const items: { saturdayISO: string; label: string; status: "full" | "partial" }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || "";
    if (!key.startsWith("driverApp_week_")) continue;
    const saturdayISO = key.replace("driverApp_week_", "");
    if (seen.has(saturdayISO)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      const fallback = buildPayrollWeek(saturdayISO);
      const rawDays = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.days) ? parsed.days : [];
      const days = fallback.map((day, index) => sanitizeDayRecord(rawDays[index], day));
      if (!weekHasWorkData(days)) continue;
      const completed = getOrderedDayIndices(days).filter((index) => isDayComplete(days[index])).length;
      const status = completed >= 7 ? "full" : "partial";
      items.push({ saturdayISO, label: getWeekEndingLabel(days), status });
      seen.add(saturdayISO);
    } catch {}
  }
  return items.sort((a, b) => b.saturdayISO.localeCompare(a.saturdayISO)).slice(0, 8);
}

function saveWeekData(days: DayRecord[], settings: SettingsState, payslipActualWeek: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getWeekStorageKey(getSaturdayDay(days).dateISO), JSON.stringify({ days, settings, payslipActualWeek }));
}

function loadSavedWeekDataOrBlank(saturdayISO: string): SavedWeekData {
  const fallbackDays = buildPayrollWeek(saturdayISO);
  const fallback = { days: fallbackDays, settings: initialSettings, payslipActualWeek: "" };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(getWeekStorageKey(saturdayISO));
    let parsed: any = null;
    if (saved) parsed = JSON.parse(saved);
    if (!parsed) {
      const archiveItems = JSON.parse(localStorage.getItem("archive") || "[]");
      if (Array.isArray(archiveItems)) {
        parsed = archiveItems.find((item) => Array.isArray(item?.days) && getSaturdayDay(item.days).dateISO === saturdayISO) || null;
      }
    }
    if (!parsed) return fallback;
    const rawDays = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.days) ? parsed.days : [];
    return { days: fallbackDays.map((day, index) => sanitizeDayRecord(rawDays[index], day)), settings: Array.isArray(parsed) ? initialSettings : sanitizeSettings(parsed?.settings), payslipActualWeek: typeof parsed?.payslipActualWeek === "string" ? parsed.payslipActualWeek : "" };
  } catch {
    return fallback;
  }
}

function getLastFinishKmFromPreviousWeek(saturdayISO: string): string {
  if (typeof window === "undefined") return "";
  try {
    const previousSaturdayISO = toISODate(addDays(fromISODate(saturdayISO), -7));
    const saved = localStorage.getItem(getWeekStorageKey(previousSaturdayISO));
    if (!saved) return "";
    const parsed = JSON.parse(saved);
    const rawDays = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.days) ? parsed.days : [];
    const previousWeek = buildPayrollWeek(previousSaturdayISO).map((day, index) => sanitizeDayRecord(rawDays[index], day));
    const ordered = getOrderedDayIndices(previousWeek);
    for (let i = ordered.length - 1; i >= 0; i -= 1) {
      const finishKm = previousWeek[ordered[i]]?.finishKm || "";
      if (finishKm) return finishKm;
    }
  } catch {
    return "";
  }
  return "";
}

function getWeekEndingLabel(days: DayRecord[]): string {
  const saturday = getSaturdayDay(days);
  const date = fromISODate(saturday.dateISO);
  return `Tax Week ${getTaxWeekNumber(date)} - ending ${saturday.dateLabel} ${date.getFullYear()}`;
}

function getDifferenceStyle(value: number): React.CSSProperties {
  if (value > 0) return { background: "linear-gradient(135deg,#ffffff 0%,#dcfce7 100%)", border: "1px solid #86efac", color: "#166534" };
  if (value < 0) return { background: "linear-gradient(135deg,#ffffff 0%,#fee2e2 100%)", border: "1px solid #fca5a5", color: "#b91c1c" };
  return { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b" };
}

function runDevTests() {
  if (typeof window === "undefined" || (window as any).__driverPayTestsRun) return;
  (window as any).__driverPayTestsRun = true;
  console.assert(normalizeTime("7") === "07:00", "normalizeTime single digit failed");
  console.assert(normalizeTime("703") === "07:03", "normalizeTime 3 digits failed");
  console.assert(getSuggestedStartTimes(17 * 60, 0, 14 * 60, false).h11 === null, "11h suggestion hidden after >13h previous shift");
  console.assert(getSuggestedStartTimes(17 * 60, 0, 14 * 60, true).h11 === null, "11h suggestion should stay unavailable after >13h even with split rest");
  console.assert(getKmRun({ ...makeDay("x", "Monday", new Date()), startKm: "1000", finishKm: "1123" }) === 123, "km run failed");
  console.assert(getKmRun({ ...makeDay("x", "Monday", new Date()), startKm: "1123", finishKm: "1000" }) === null, "negative km should be null");
  console.assert(isDayComplete({ ...makeDay("x", "Monday", new Date()), dayType: "off" }), "off day complete failed");
  console.assert(isDayComplete({ ...makeDay("x", "Monday", new Date()), dayType: "holiday" }), "holiday day complete failed");
  const carryDays = buildPayrollWeek("2026-05-02");
  carryDays[0] = { ...carryDays[0], dayType: "work", finishKm: "123456" };
  carryDays[1] = { ...carryDays[1], dayType: "holiday", startKm: getLastFinishKmBeforeIndex(carryDays, 1), finishKm: getLastFinishKmBeforeIndex(carryDays, 1) };
  console.assert(carryDays[1].startKm === "123456" && carryDays[1].finishKm === "123456", "holiday should carry start km to finish km");
  console.assert(getWorkedMinutes({ ...makeDay("x", "Monday", new Date()), dayType: "holiday", start: "0700", finish: "1700" }) === null, "holiday must not count hours");
  const testWeek = buildPayrollWeek("2026-04-25");
  console.assert(getOrderedDayIndices(testWeek).map((i) => testWeek[i].id).join(",") === "sun,mon,tue,wed,thu,fri,sat", "logical day order failed");
  console.assert(getSuggestedStartTimes(600, 3, 8 * 60, false).h9Blocked === true, "9h should be flagged when reduced limit reached");
  const customSettings = { ...initialSettings, customBonuses: [{ id: "custom-1", name: "Waiting", rate: "12" }, ...makeEmptyCustomBonuses().slice(1)] };
  console.assert(getActiveBonusTypes(customSettings).includes("Waiting"), "custom bonus should be active when named");
  console.assert(getBonusRate(customSettings, "Waiting") === "12", "custom bonus rate failed");
}


type DriverBackup = {
  version: 1;
  exportedAt: string;
  activeWeekSaturdayISO: string;
  days: DayRecord[];
  settings: SettingsState;
  payslipActualWeek: string;
  archive: any[];
  savedWeeks: Record<string, SavedWeekData>;
  closedWeeks?: string[];
  payProfiles?: PayProfileV2[];
  activePayProfileId?: string;
};

function collectSavedWeeksFromLocalStorage(): Record<string, SavedWeekData> {
  const savedWeeks: Record<string, SavedWeekData> = {};
  if (typeof window === "undefined") return savedWeeks;
  for (let i = 0; i < localStorage.length; i += 1) {
    const storageKey = localStorage.key(i) || "";
    if (!storageKey.startsWith("driverApp_week_")) continue;
    try {
      const saturdayISO = storageKey.replace("driverApp_week_", "");
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (Array.isArray(parsed?.days)) savedWeeks[saturdayISO] = parsed;
    } catch {}
  }
  return savedWeeks;
}

function downloadDriverBackup(days: DayRecord[], settings: SettingsState, payslipActualWeek: string, archive: any[]) {
  const activeWeekSaturdayISO = getSaturdayDay(days).dateISO;
  const backup: DriverBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    activeWeekSaturdayISO,
    days,
    settings,
    payslipActualWeek,
    archive,
    savedWeeks: collectSavedWeeksFromLocalStorage(),
    closedWeeks: readClosedWeeks(),
    payProfiles: loadStoredPayProfiles(settings),
    activePayProfileId: typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PAY_PROFILE_STORAGE_KEY) || undefined : undefined,
  };
  backup.savedWeeks[activeWeekSaturdayISO] = { days, settings, payslipActualWeek };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `driver-pay-backup-${activeWeekSaturdayISO}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function restoreDriverBackupFile(file: File, callbacks: {
  setDays: React.Dispatch<React.SetStateAction<DayRecord[]>>;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  setPayslipActualWeek: React.Dispatch<React.SetStateAction<string>>;
  setArchive: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedSaturday: React.Dispatch<React.SetStateAction<string>>;
  setHistoricalEditEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onDone?: () => void;
}) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}")) as Partial<DriverBackup>;
      const restoredDays = Array.isArray(parsed.days) ? parsed.days : [];
      const restoredSettings = parsed.settings ? sanitizeSettings(parsed.settings) : initialSettings;
      const restoredArchive = Array.isArray(parsed.archive) ? parsed.archive : [];
      const restoredPayslip = typeof parsed.payslipActualWeek === "string" ? parsed.payslipActualWeek : "";
      if (!restoredDays.length) throw new Error("No days in backup");
      if (parsed.savedWeeks && typeof parsed.savedWeeks === "object") {
        Object.entries(parsed.savedWeeks).forEach(([saturdayISO, weekData]) => {
          const rawWeek = weekData as Partial<SavedWeekData>;
          if (saturdayISO && rawWeek && Array.isArray(rawWeek.days)) {
            const fallbackDays = buildPayrollWeek(saturdayISO);
            const cleanedWeek: SavedWeekData = {
              days: fallbackDays.map((day, index) => sanitizeDayRecord(rawWeek.days?.[index], day)),
              settings: sanitizeSettings(rawWeek.settings),
              payslipActualWeek: typeof rawWeek.payslipActualWeek === "string" ? rawWeek.payslipActualWeek : "",
            };
            localStorage.setItem(getWeekStorageKey(saturdayISO), JSON.stringify(cleanedWeek));
          }
        });
      }
      const activeSaturday = typeof parsed.activeWeekSaturdayISO === "string" ? parsed.activeWeekSaturdayISO : getSaturdayDay(restoredDays).dateISO;
      if (Array.isArray(parsed.closedWeeks)) localStorage.setItem(CLOSED_WEEKS_STORAGE_KEY, JSON.stringify(parsed.closedWeeks.filter((item) => typeof item === "string")));
      if (Array.isArray(parsed.payProfiles)) { const restoredProfiles = parsed.payProfiles.map(sanitizePayProfile).filter(Boolean) as PayProfileV2[]; if (restoredProfiles.length) { localStorage.setItem(PAY_PROFILES_STORAGE_KEY, JSON.stringify(restoredProfiles)); if (typeof parsed.activePayProfileId === "string") localStorage.setItem(ACTIVE_PAY_PROFILE_STORAGE_KEY, parsed.activePayProfileId); } }
      localStorage.setItem(getWeekStorageKey(activeSaturday), JSON.stringify({ days: restoredDays, settings: restoredSettings, payslipActualWeek: restoredPayslip }));
      localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, activeSaturday);
      localStorage.setItem("days", JSON.stringify(restoredDays));
      localStorage.setItem("driverApp_days", JSON.stringify(restoredDays));
      localStorage.setItem("settings", JSON.stringify(restoredSettings));
      localStorage.setItem("archive", JSON.stringify(restoredArchive));
      callbacks.setDays(restoredDays);
      callbacks.setSettings(restoredSettings);
      callbacks.setPayslipActualWeek(restoredPayslip);
      callbacks.setArchive(restoredArchive);
      callbacks.setSelectedSaturday(activeSaturday);
      callbacks.setHistoricalEditEnabled(false);
      callbacks.setCurrentIndex(getPreferredOpenDayIndex(restoredDays));
      callbacks.onDone?.();
      window.alert(t("backupRestored"));
    } catch {
      window.alert(t("backupFailed"));
    }
  };
  reader.readAsText(file);
}


type SavedWeekIndicator = { saturdayISO: string; label: string; status: "full" | "partial" };

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function MiniWeekCalendar({
  selectedSaturday,
  savedWeekIndicators,
  onSelectSaturday,
}: {
  selectedSaturday: string;
  savedWeekIndicators: SavedWeekIndicator[];
  onSelectSaturday: (saturdayISO: string) => void;
}) {
  const selectedDate = fromISODate(selectedSaturday);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    const next = fromISODate(selectedSaturday);
    setVisibleMonth((current) => isSameMonth(current, next) ? current : new Date(next.getFullYear(), next.getMonth(), 1));
  }, [selectedSaturday]);

  const statusBySaturday = useMemo(() => {
    const map = new Map<string, "full" | "partial">();
    savedWeekIndicators.forEach((item) => map.set(item.saturdayISO, item.status));
    return map;
  }, [savedWeekIndicators]);

  const cells = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday first
    const gridStart = addDays(first, -startOffset);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  const dayLabels = uiLang === "bg" ? ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"] : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <button type="button" aria-label="Previous month" style={{ ...buttonStyle, padding: "7px 0", borderRadius: 10 }} onClick={() => setVisibleMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
        <div style={{ textAlign: "center", fontSize: 13, fontWeight: 900, color: "#334155" }}>{monthLabel}</div>
        <button type="button" aria-label="Next month" style={{ ...buttonStyle, padding: "7px 0", borderRadius: 10 }} onClick={() => setVisibleMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {dayLabels.map((label) => <div key={label} style={{ textAlign: "center", fontSize: 10, fontWeight: 900, color: "#64748b" }}>{label}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((date) => {
          const iso = toISODate(date);
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const isSaturday = date.getDay() === 6;
          const isSelected = iso === selectedSaturday;
          const status = isSaturday ? statusBySaturday.get(iso) : undefined;
          const closed = isSaturday && isWeekClosed(iso);
          const bg = status === "full" ? "#bbf7d0" : status === "partial" ? "#fde68a" : isSaturday ? "#e5e7eb" : "#fff";
          const borderColor = isSelected ? "#0f172a" : closed ? "#64748b" : status === "full" ? "#22c55e" : status === "partial" ? "#f59e0b" : isSaturday ? "#94a3b8" : "#e2e8f0";
          const color = isCurrentMonth ? "#0f172a" : "#94a3b8";
          return (
            <button
              type="button"
              key={iso}
              disabled={!isSaturday}
              title={isSaturday ? `${iso}${status ? ` - ${status}` : ""}` : ""}
              onClick={() => onSelectSaturday(iso)}
              style={{
                minHeight: 34,
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                background: bg,
                color,
                fontSize: 13,
                fontWeight: isSaturday || isSelected ? 900 : 600,
                opacity: isSaturday ? 1 : 0.55,
                boxShadow: isSelected ? "0 0 0 3px rgba(15,23,42,.18)" : closed ? "inset 0 0 0 2px rgba(100,116,139,.35)" : "none",
                cursor: isSaturday ? "pointer" : "default",
              }}
            >
              <div>{date.getDate()}</div>
              {status && <div style={{ fontSize: 11, lineHeight: "10px" }}>{status === "full" ? "✓" : "◐"}</div>}{closed && <div style={{ fontSize: 9, lineHeight: "9px" }}>A</div>}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 10, fontSize: 11, fontWeight: 800, color: "#475569" }}>
        <span style={{ padding: "5px 8px", borderRadius: 999, background: "#bbf7d0", border: "1px solid #22c55e" }}>✓ {t("fullWeek")}</span>
        <span style={{ padding: "5px 8px", borderRadius: 999, background: "#fde68a", border: "1px solid #f59e0b" }}>◐ {t("partialWeek")}</span>
        <span style={{ padding: "5px 8px", borderRadius: 999, background: "#e5e7eb", border: "1px solid #94a3b8" }}>{t("emptyWeek")}</span>
      </div>
    </div>
  );
}

export default function App() {
  runDevTests();
  const [language, setLanguageState] = useState<Lang>(() => { if (typeof window === "undefined") return "en"; return (localStorage.getItem(LANGUAGE_STORAGE_KEY) as Lang) || "en"; });
  const [hasChosenLanguage, setHasChosenLanguage] = useState(() => typeof window !== "undefined" && Boolean(localStorage.getItem(LANGUAGE_STORAGE_KEY)));
  uiLang = language;
  function setLanguage(next: Lang) { setLanguageState(next); setHasChosenLanguage(true); if (typeof window !== "undefined") localStorage.setItem(LANGUAGE_STORAGE_KEY, next); }
  const [days, setDays] = useState<DayRecord[]>(() => {
    if (typeof window === "undefined") return initialDays;
    const startupSaturday = getStartupPayrollSaturdayISO();
    const weekData = loadSavedWeekDataOrBlank(startupSaturday);
    localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, startupSaturday);
    return weekData.days;
  });
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return initialSettings;
    try { const saved = localStorage.getItem("settings"); return saved ? sanitizeSettings(JSON.parse(saved)) : initialSettings; } catch { return initialSettings; }
  });
  const [payProfiles, setPayProfiles] = useState<PayProfileV2[]>((() => loadStoredPayProfiles(settings)));
  const [activePayProfileId, setActivePayProfileId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ACTIVE_PAY_PROFILE_STORAGE_KEY) || "";
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const didAutoSelectRef = useRef(false);
  const [showWeekView, setShowWeekView] = useState(false);
  const [showPaySetupV2, setShowPaySetupV2] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [draftBonusType, setDraftBonusType] = useState<BonusType>("ADR");
  const [draftBonusQty, setDraftBonusQty] = useState("1");
  const [payslipActualWeek, setPayslipActualWeek] = useState("");
  const [selectedSaturday, setSelectedSaturday] = useState(() => getStartupPayrollSaturdayISO());
  const [archive, setArchive] = useState<any[]>(() => { try { const saved = localStorage.getItem("archive"); const parsed = saved ? JSON.parse(saved) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } });
  const [savedWeekIndicators, setSavedWeekIndicators] = useState<{ saturdayISO: string; label: string; status: "full" | "partial" }[]>(() => getSavedWeekIndicators());
  const [historicalEditEnabled, setHistoricalEditEnabled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [suppressStartKmSuggestion, setSuppressStartKmSuggestion] = useState(false);

  const currentDay = days[currentIndex] ?? initialDays[0];
  const orderedIndices = getOrderedDayIndices(days);
  const currentPos = orderedIndices.indexOf(currentIndex);
  const previousDay = currentPos > 0 ? days[orderedIndices[currentPos - 1]] : undefined;
  const lastFinishKmThisWeek = getLastFinishKmBeforeIndex(days, currentIndex);
  const previousWeekFinishKm = !lastFinishKmThisWeek ? getLastFinishKmFromPreviousWeek(getSaturdayDay(days).dateISO) : "";
  const previousFinishKm = lastFinishKmThisWeek || previousWeekFinishKm;
  const startKmSuggestionSource = lastFinishKmThisWeek ? "last saved day" : previousWeekFinishKm ? "last week" : "";
  const displayStartKm = currentDay.startKm || (suppressStartKmSuggestion ? "" : previousFinishKm);
  const startKmIsSuggested = Boolean(!suppressStartKmSuggestion && previousFinishKm && displayStartKm === previousFinishKm && !dayHasDestructiveWorkData(currentDay));
  const hasWeeklySplitBreak = useMemo(() => days.some((day) => day.splitBreak), [days]);
  const weekEndingLabel = useMemo(() => getWeekEndingLabel(days), [days]);
  const currentWeekSaturdayISO = getSaturdayDay(days).dateISO;
  const weekIsHistorical = currentWeekSaturdayISO < getCurrentPayrollSaturdayISO();
  const weekIsClosed = isWeekClosed(currentWeekSaturdayISO);
  const archiveMode = weekIsHistorical || weekIsClosed;
  const weekLocked = archiveMode && !historicalEditEnabled;
  const shiftValidationMessage = useMemo(() => getShiftValidationMessage(currentDay), [currentDay]);

  useEffect(() => { setSuppressStartKmSuggestion(false); }, [currentDay.id]);
  useEffect(() => { if (typeof window !== "undefined") { localStorage.setItem("days", JSON.stringify(days)); localStorage.setItem("driverApp_days", JSON.stringify(days)); saveWeekData(days, settings, payslipActualWeek); } }, [days, settings, payslipActualWeek]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { if (!payProfiles.length) return; const activeId = activePayProfileId && payProfiles.some((profile) => profile.id === activePayProfileId) ? activePayProfileId : payProfiles[0].id; if (activeId !== activePayProfileId) setActivePayProfileId(activeId); saveStoredPayProfiles(payProfiles, activeId); }, [payProfiles, activePayProfileId]);
  useEffect(() => { if (typeof window !== "undefined") { localStorage.setItem("archive", JSON.stringify(archive)); setSavedWeekIndicators(getSavedWeekIndicators()); } }, [archive, days]);
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);
  useEffect(() => {
    const refreshEnterHints = () => {
      const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("input:not([disabled]), select:not([disabled]), button:not([disabled])"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        });
      controls.forEach((element, index) => {
        if (element instanceof HTMLInputElement) {
          element.setAttribute("enterkeyhint", index === controls.length - 1 ? "done" : "next");
        }
      });
    };

    const handleEnterNavigation = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !(active instanceof HTMLInputElement || active instanceof HTMLSelectElement)) return;
      const controls = Array.from(document.querySelectorAll<HTMLElement>("input:not([disabled]), select:not([disabled]), button:not([disabled])"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        });
      const current = controls.indexOf(active);
      if (current === -1) return;
      event.preventDefault();
      const next = controls[current + 1];
      if (next) {
        next.focus();
        if (next instanceof HTMLInputElement) next.select();
      } else {
        active.blur();
      }
    };

    refreshEnterHints();
    document.addEventListener("keydown", handleEnterNavigation, true);
    const timer = window.setTimeout(refreshEnterHints, 50);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleEnterNavigation, true);
    };
  }, [currentIndex, currentDay.dayType, currentDay.bonuses.length, showBonusForm, showWeekView, showSettings, showWeekPicker]);
  useEffect(() => { if (!didAutoSelectRef.current) { setCurrentIndex(getPreferredOpenDayIndex(days)); didAutoSelectRef.current = true; } }, [days]);
  useEffect(() => { setSelectedSaturday(getSaturdayDay(days).dateISO); }, [days]);
  useEffect(() => { const active = getActiveBonusTypes(settings); if (!active.includes(draftBonusType)) setDraftBonusType(active[0] || "ADR"); }, [settings, draftBonusType]);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  }
  function updateCurrentDay<K extends keyof DayRecord>(key: K, value: DayRecord[K]) { if (weekLocked) return; setDays((prev) => prev.map((day, index) => (index === currentIndex ? { ...day, [key]: value } : day))); }
  function updateTimeValue(field: "start" | "finish", rawValue: string) {
    if (rawValue === "") { updateCurrentDay(field, ""); return; }
    updateCurrentDay(field, formatTimeInput(rawValue));
  }
  function normalizeTimeValue(field: "start" | "finish") { updateCurrentDay(field, normalizeTime(currentDay[field] || "")); }
  function updateKmValue(field: "startKm" | "finishKm", rawValue: string) {
    const value = digitsOnly(rawValue);
    if (field === "startKm") setSuppressStartKmSuggestion(value === "");
    updateCurrentDay(field, value);
  }
  function removeBonus(id: string) { updateCurrentDay("bonuses", currentDay.bonuses.filter((bonus) => bonus.id !== id)); }
  function updateBonusQty(id: string, rawValue: string) { const qty = Math.max(1, Number(digitsOnly(rawValue) || "1") || 1); updateCurrentDay("bonuses", currentDay.bonuses.map((bonus) => bonus.id === id ? { ...bonus, qty } : bonus)); }
  function addBonus() { const qty = Math.max(1, Number(draftBonusQty || "1") || 1); const existing = currentDay.bonuses.find((bonus) => bonus.type === draftBonusType); if (existing) { updateCurrentDay("bonuses", currentDay.bonuses.map((bonus) => bonus.id === existing.id ? { ...bonus, qty: bonus.qty + qty } : bonus)); } else { updateCurrentDay("bonuses", [...currentDay.bonuses, { id: `${Date.now()}-${Math.random()}`, type: draftBonusType, qty }]); } setDraftBonusQty("1"); setShowBonusForm(false); }
  function navigateLogical(direction: 1 | -1) { setCurrentIndex((prev) => getAdjacentLogicalIndex(days, prev, direction)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function loadWeekBySaturday(saturdayISO: string, shouldClosePicker = false) { saveWeekData(days, settings, payslipActualWeek); const loaded = loadSavedWeekDataOrBlank(saturdayISO); setSelectedSaturday(saturdayISO); setDays(loaded.days); setSettings(sanitizeSettings(loaded.settings)); setPayslipActualWeek(loaded.payslipActualWeek || ""); setHistoricalEditEnabled(false); setCurrentIndex(getPreferredOpenDayIndex(loaded.days)); if (shouldClosePicker) setShowWeekPicker(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function loadSelectedWeek() { loadWeekBySaturday(selectedSaturday); }
  function loadCurrentWeek() {
    const activeSaturday = getStartupPayrollSaturdayISO();
    loadWeekBySaturday(activeSaturday, true);
  }
  function setCurrentDayType(type: DayType) {
    if (weekLocked) return;
    const current = days[currentIndex];
    if (type !== "work" && current && dayHasDestructiveWorkData(current)) {
      const ok = window.confirm("This will clear the worked shift data for this day. Continue?");
      if (!ok) return;
    }
    const currentWeeklyCandidate = readWeeklyRestCandidate();
    const currentDayStartAbs = current ? getDayStartAbsMinutes(current) : null;
    const cancelWeeklyCandidate = Boolean(
      currentWeeklyCandidate &&
      type === "work" &&
      (current.dayType === "holiday" || current.dayType === "off") &&
      currentDayStartAbs != null &&
      currentDayStartAbs >= currentWeeklyCandidate.finishAbs
    );
    // Do not clear the weekly-rest candidate immediately on Off/Holiday -> Work.
    // The first real work start after End Week is exactly where we need to measure
    // the achieved weekly rest. Later days naturally fall back to daily rest because
    // there will be a completed shift earlier in the current week.
    if (cancelWeeklyCandidate) { /* measured by first work start; keep candidate for this view */ }
    setDays((prev) => prev.map((day, index) => {
      if (index !== currentIndex) return day;
      if (type === "work") {
        const wasNonWorking = day.dayType === "holiday" || day.dayType === "off";
        const autoGeneratedFinishKm = wasNonWorking && Boolean(day.finishKm) && day.finishKm === (day.startKm || previousFinishKm || "");
        // Switching Off/Holiday back to Work must not save any suggested Start as a fact.
        // The field can show a daily suggestion visually; user input or Finish can accept it later.
        return { ...day, dayType: "work", start: day.start || "", finishKm: autoGeneratedFinishKm ? "" : day.finishKm, completionSource: undefined };
      }
      const carryKm = day.startKm || previousFinishKm || "";
      if (type === "holiday") return { ...day, dayType: "holiday", start: "", finish: "", holidayPay: day.holidayPay, startKm: carryKm, finishKm: carryKm, bonuses: [], nightOut: false, splitBreak: false, completionSource: undefined };
      return { ...day, dayType: "off", start: "", finish: "", holidayPay: "", startKm: carryKm, finishKm: carryKm, bonuses: [], nightOut: false, splitBreak: false, completionSource: undefined };
    }));
  }
  function saveAndGo() {
    const day = days[currentIndex];
    const autoAcceptedDailyDraft = Boolean(day.start && dailyPrimarySuggestedStart && day.start === dailyPrimarySuggestedStart && !day.finish && !dayHasDestructiveWorkData(day));
    const rawStart = autoAcceptedDailyDraft ? "" : day.start;
    // Only a valid daily suggestion may be accepted by entering Finish.
    // Weekly rest helper info is never saved as Start.
    const start = normalizeTime(rawStart || (day.finish && dailyPrimarySuggestedStart ? dailyPrimarySuggestedStart : ""));
    const finish = normalizeTime(day.finish || "");
    const s = parseTimeToMinutes(start);
    const f = parseTimeToMinutes(finish);
    const emptyWorkDay = day.dayType === "work" && !start && !finish && !day.finishKm && !day.holidayPay && day.bonuses.length === 0 && !day.nightOut && !day.splitBreak;
    if (weekLocked) { window.alert("This is an older saved week. Press Unlock editing if you want to change it."); return; }
    if (day.dayType === "work" && !emptyWorkDay) {
      if ((start && !finish) || (!start && finish)) { window.alert("Work day needs both Start and Finish. Choose Off/Holiday if this was not a working day."); return; }
      if (s != null && f != null && f <= s) { if (!window.confirm("Finish time is before start. Continue anyway?")) return; }
      if (s != null && f != null && f - s > 15 * 60) { if (!window.confirm(`${t("shiftLimitExceeded")}: ${Math.floor((f - s) / 60)}h ${(f - s) % 60}m. Confirm?`)) return; }
    }
    const finalDayType: DayType = emptyWorkDay ? "off" : day.dayType;
    const effectiveStartKm = day.startKm || previousFinishKm || day.finishKm || "";
    const effectiveFinishKm = finalDayType === "work" ? day.finishKm : (day.finishKm || effectiveStartKm);
    const nextIndex = getAdjacentLogicalIndex(days, currentIndex, 1);
    setDays((prev) => prev.map((d, index) => index === currentIndex ? {
      ...d,
      dayType: finalDayType,
      start: finalDayType === "work" ? start : "",
      finish: finalDayType === "work" ? finish : "",
      startKm: effectiveStartKm,
      finishKm: effectiveFinishKm,
      completionSource: emptyWorkDay ? "emptyWorkdaySave" : undefined,
    } : d));
    setShowBonusForm(false);
    setCurrentIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const computedWeek = useMemo<ComputedDay[]>(() => days.map((day, index) => {
    const effectiveDay = { ...day, startKm: day.startKm || getLastFinishKmBeforeIndex(days, index) || "" };
    const workedMinutes = getWorkedMinutes(day);
    const kmRun = getKmRun(effectiveDay);
    const weekend = isWeekend(day.dayName);
    const saturday = day.dayName === "Saturday";
    const sunday = day.dayName === "Sunday";
    const baseRate = saturday ? parseDecimal(settings.saturdayRate) : sunday ? parseDecimal(settings.sundayRate) : parseDecimal(settings.weekdayRate);
    const hoursDecimal = workedMinutes ? workedMinutes / 60 : 0;
    const guaranteedHours = parseDecimal(settings.overtimeThresholdHours);
    const hasWorkedDay = day.dayType === "work" && workedMinutes != null && workedMinutes > 0;
    let baseHoursDecimal = 0;
    let overtimeDecimal = 0;
    if (weekend) baseHoursDecimal = hasWorkedDay ? hoursDecimal : 0;
    else if (hasWorkedDay) { overtimeDecimal = Math.max(0, hoursDecimal - guaranteedHours); baseHoursDecimal = guaranteedHours; }
    const basePay = baseHoursDecimal * baseRate;
    const overtimePay = overtimeDecimal * parseDecimal(settings.overtimeRate);
    const bonusPay = hasWorkedDay ? day.bonuses.reduce((sum, bonus) => sum + bonus.qty * parseDecimal(getBonusRate(settings, bonus.type)), 0) : 0;
    const holidayPayAmount = day.dayType === "holiday" ? parseDecimal(day.holidayPay || "") : 0;
    const nightOutPay = hasWorkedDay && day.nightOut ? parseDecimal(settings.nightOutRate) : 0;
    const foodAllowancePay = hasWorkedDay ? parseDecimal(settings.foodAllowanceRate) : 0;
    const taxablePay = basePay + overtimePay + bonusPay + holidayPayAmount;
    const untaxedPay = nightOutPay + foodAllowancePay;
    const total = taxablePay + untaxedPay;
    return { ...day, weekend, workedMinutes, overtimeMinutes: Math.round(overtimeDecimal * 60), kmRun, basePay, overtimePay, bonusPay, holidayPayAmount, nightOutPay, foodAllowancePay, taxablePay, untaxedPay, tax: 0, ni: 0, net: total, total };
  }), [days, settings]);

  const weeklyTaxModel = useMemo(() => {
    const taxable = computedWeek.reduce((sum, day) => sum + day.taxablePay, 0);
    const untaxed = computedWeek.reduce((sum, day) => sum + day.untaxedPay, 0);
    const gross = taxable + untaxed;
    const tax = Math.round(Math.max(0, taxable - 12570 / 52) * 0.2 * 100) / 100;
    const ni = Math.round((taxable > 242 ? (taxable - 242) * 0.08 : 0) * 100) / 100;
    return { taxable, untaxed, gross, tax, ni, net: gross - tax - ni };
  }, [computedWeek]);

  const taxedWeek = useMemo(() => computedWeek.map((day) => {
    const share = weeklyTaxModel.taxable > 0 ? day.taxablePay / weeklyTaxModel.taxable : 0;
    const tax = weeklyTaxModel.tax * share;
    const ni = weeklyTaxModel.ni * share;
    return { ...day, tax, ni, net: day.total - tax - ni };
  }), [computedWeek, weeklyTaxModel]);

  const currentComputed = taxedWeek[currentIndex] ?? { ...currentDay, weekend: false, workedMinutes: null, overtimeMinutes: 0, kmRun: null, basePay: 0, overtimePay: 0, bonusPay: 0, holidayPayAmount: 0, nightOutPay: 0, foodAllowancePay: 0, taxablePay: 0, untaxedPay: 0, tax: 0, ni: 0, net: 0, total: 0 };
  const previousShiftAnchor = getLastCompletedWorkShiftBeforeIndex(days, currentIndex, getSaturdayDay(days).dateISO);
  const restBeforeMinutes = getRestFromPreviousShiftMinutes(previousShiftAnchor, currentDay) ?? getRestBeforeMinutes(previousDay, currentDay);
  const previousWorked = previousShiftAnchor ? getWorkedMinutes(previousShiftAnchor.day) : (previousDay ? getWorkedMinutes(previousDay) : null);
  const reducedCount = getWeeklyReducedRestCountBeforeIndex(days, currentIndex);
  const effectiveRestStatus = getEffectiveRestStatus(restBeforeMinutes, previousWorked, Boolean(previousShiftAnchor?.day.splitBreak || previousDay?.splitBreak), reducedCount);
  const restBeforeColors = getRestCardPalette(restBeforeMinutes, effectiveRestStatus, reducedCount);
  const futureDayNoStart = !currentDay.start && currentDay.dateISO > toISODate(new Date());
  const displayRestColors = futureDayNoStart ? { ...restBeforeColors, label: "Future day" } : restBeforeColors;
  const displayRestValue = futureDayNoStart ? "No start time yet" : formatMinutes(restBeforeMinutes);
  const suggestedTimes = getSuggestedStartTimesForDay(previousShiftAnchor, currentDay, reducedCount, previousWorked, Boolean(previousShiftAnchor?.day.splitBreak || previousDay?.splitBreak));
  const dailyPrimarySuggestedStart = getPrimarySuggestedStart(suggestedTimes);
  const weeklyRestCandidate = getWeeklyRestCandidateForSelectedWeek(selectedSaturday);
  const selectedWeekStartISO = toISODate(addDays(fromISODate(selectedSaturday), -6));
  const previousShiftIsInsideSelectedWeek = Boolean(previousShiftAnchor && previousShiftAnchor.day.dateISO >= selectedWeekStartISO);
  const hasCompletedWorkBeforeCurrentInThisWeek = Boolean(
    weeklyRestCandidate &&
    previousShiftAnchor &&
    previousShiftIsInsideSelectedWeek &&
    previousShiftAnchor.finishAbs > weeklyRestCandidate.finishAbs
  );
  const weeklyRestBaseActive = Boolean(weeklyRestCandidate && selectedSaturday > weeklyRestCandidate.closingSaturdayISO && currentDay.dayType === "work" && !hasCompletedWorkBeforeCurrentInThisWeek);
  const weeklyRestBasePrimaryStart = getWeeklyRestPrimaryStart(weeklyRestCandidate ? { finishAbs: weeklyRestCandidate.finishAbs } : null, weeklyRestBaseActive);
  const userStartedBeforeWeeklyRest = Boolean(
    weeklyRestBaseActive &&
    currentDay.start &&
    weeklyRestBasePrimaryStart &&
    currentDay.start !== weeklyRestBasePrimaryStart &&
    !currentDay.finish &&
    !dayHasDestructiveWorkData(currentDay)
  );
  const weeklyRestCandidateActive = Boolean(weeklyRestBaseActive && !userStartedBeforeWeeklyRest && !(currentDay.start && !currentDay.finish));
  const weeklyRestRequiredMinutes = 45 * 60;
  const weeklyRestPrimaryStart = getWeeklyRestPrimaryStart(weeklyRestCandidate ? { finishAbs: weeklyRestCandidate.finishAbs } : null, weeklyRestCandidateActive);
  const weeklyRestSuggestionHelpRaw = getWeeklyRestSuggestionHelp(weeklyRestCandidate ? { finishAbs: weeklyRestCandidate.finishAbs } : null, currentDay, weeklyRestCandidateActive);
  const autoAcceptedDailyDraft = Boolean(currentDay.start && dailyPrimarySuggestedStart && currentDay.start === dailyPrimarySuggestedStart && !currentDay.finish && !dayHasDestructiveWorkData(currentDay));
  const displayStartValue = autoAcceptedDailyDraft ? "" : (currentDay.start || "");
  const dailyStartIsManual = Boolean(displayStartValue && dailyPrimarySuggestedStart && displayStartValue !== dailyPrimarySuggestedStart);
  const weeklyRestSuggestionHelp = weeklyRestSuggestionHelpRaw;
  const dailySuggestionHelp = dailyStartIsManual ? "" : getSuggestedStartHelp(suggestedTimes);
  const startFieldHint = (!displayStartValue && dailyPrimarySuggestedStart && suggestedTimes.h11 != null) ? t("from11hRest") : "";
  const weeklyRestPalette = weeklyRestCandidateActive ? getWeeklyRestPalette(restBeforeMinutes, weeklyRestRequiredMinutes) : null;
  // Before a real visible Start is entered, the rest card is factual information only.
  // Do not show reduced/daily/weekly warning colours for a suggested or empty Start.
  const currentRestPalette = { ...statusPalette("unknown"), label: t("currentRest") };
  const activeRestColors = futureDayNoStart ? displayRestColors : (!displayStartValue ? currentRestPalette : (weeklyRestPalette || restBeforeColors));
  const restContextHelp = !displayStartValue ? "" : (weeklyRestCandidateActive ? getWeeklyRestContextHelp(restBeforeMinutes, weeklyRestRequiredMinutes) : getRestContextHelp(restBeforeMinutes));
  const activeBonusTypes = useMemo(() => getActiveBonusTypes(settings), [settings]);
  const previewWeek = useMemo(() => [...taxedWeek].sort((a, b) => DAY_ORDER.indexOf(a.id) - DAY_ORDER.indexOf(b.id)), [taxedWeek]);
  const weekTotals = taxedWeek.reduce<WeekTotals>((acc, day) => { acc.worked += day.workedMinutes || 0; acc.overtime += day.overtimeMinutes || 0; acc.km += day.kmRun || 0; acc.taxable += day.taxablePay || 0; acc.untaxed += day.untaxedPay || 0; acc.tax += day.tax || 0; acc.ni += day.ni || 0; acc.net += day.net || 0; acc.total += day.total || 0; return acc; }, { ...emptyTotals });
  const weekDifference = payslipActualWeek ? parseDecimal(payslipActualWeek) - weekTotals.net : 0;
  const weekBonusSummary = useMemo(() => taxedWeek.reduce((acc, day) => { for (const bonus of day.bonuses) acc[bonus.type] = (acc[bonus.type] || 0) + bonus.qty; if (day.nightOut) acc.nightOuts = (acc.nightOuts || 0) + 1; return acc; }, { nightOuts: 0 } as Record<BonusType | "nightOuts", number>), [taxedWeek]);

  function saveClosedWeekCorrection(type: WeekArchiveType) {
    const closingSaturday = getSaturdayDay(days).dateISO;
    saveWeekData(days, settings, payslipActualWeek);
    setArchive((prev) => {
      const existingIndex = prev.findIndex((item) => Array.isArray(item?.days) && getSaturdayDay(item.days).dateISO === closingSaturday);
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;
      const updatedItem = {
        ...(existing || {}),
        id: existing?.id ?? Date.now(),
        label: existing?.label || weekEndingLabel,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        days,
        settings,
        totals: weekTotals,
        payslip: payslipActualWeek,
        type: existing?.type || type,
      };
      if (existingIndex < 0) return [updatedItem, ...prev];
      return prev.map((item, index) => index === existingIndex ? updatedItem : item);
    });
    setSavedWeekIndicators(getSavedWeekIndicators());
  }

  function endWeek(type: WeekArchiveType, dayTypeOverrides?: Record<string, DayType>) {
    const closingSaturday = getSaturdayDay(days).dateISO;
    if (isWeekClosed(closingSaturday)) {
      saveClosedWeekCorrection(type);
      return;
    }
    const requestedType: DayType = type === "holiday" ? "holiday" : "off";
    const markEmptyDay = (d: DayRecord, selectedType: DayType): DayRecord => ({ ...d, dayType: selectedType, start: "", finish: "", holidayPay: selectedType === "holiday" ? d.holidayPay : "", bonuses: [], nightOut: false, splitBreak: false });
    const markedDays = type === "worked" && !dayTypeOverrides
      ? days.map((d) => (isEmptyForRemainingClose(d) && isWeekend(d.dayName) ? markEmptyDay(d, "off") : d))
      : days.map((d) => {
        if (!isEmptyForRemainingClose(d)) return d;
        const selectedType = dayTypeOverrides?.[d.id] || requestedType;
        return markEmptyDay(d, selectedType);
      });
    const finalDays = carryKmThroughNonWorkingDays(markedDays);
    // Clear any old experimental Weekly Rest bridge state. Do not create one here.
    writeWeeklyRestCandidate(null);
    const carryKm = findLastKnownKm(finalDays);
    saveWeekData(finalDays, settings, payslipActualWeek);
    markWeekClosed(closingSaturday);
    setArchive((prev) => prev.some((item) => getSaturdayDay(item.days || []).dateISO === closingSaturday) ? prev : [{ id: Date.now(), label: weekEndingLabel, createdAt: new Date().toISOString(), days: finalDays, settings, totals: weekTotals, payslip: payslipActualWeek, type }, ...prev]);
    const nextSaturday = toISODate(addDays(fromISODate(closingSaturday), 7));
    const nextWeek = loadSavedWeekDataOrBlank(nextSaturday);
    const mondayIndex = nextWeek.days.findIndex((d) => d.id === "mon");
    const nextDays = nextWeek.days.map((d, index) => index === mondayIndex && carryKm && !d.startKm ? { ...d, startKm: carryKm } : d);
    localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, nextSaturday);
    setSelectedSaturday(nextSaturday);
    setDays(nextDays);
    setSettings(nextWeek.settings);
    setPayslipActualWeek(nextWeek.payslipActualWeek || "");
    setCurrentIndex(mondayIndex >= 0 ? mondayIndex : getFirstIncompleteIndex(nextDays));
    setSavedWeekIndicators(getSavedWeekIndicators());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  if (!hasChosenLanguage) {
    return <div style={pageStyle}><div style={{ ...shellStyle, padding: 20 }}><div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>{t("appTitle")}</div><div style={{ fontSize: 15, color: "#64748b", marginBottom: 16 }}>{t("chooseLanguage")}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={() => setLanguage("en")}>English</button><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={() => setLanguage("bg")}>Български</button></div></div></div>;
  }

  return <div style={{ ...pageStyle, ...(archiveMode ? { background: "#cbd5e1" } : {}) }}><style>{`html{-webkit-text-size-adjust:100%;touch-action:pan-y;overscroll-behavior:none}body{touch-action:pan-y;overscroll-behavior:none}button{transition:transform .08s ease,filter .08s ease,background .08s ease,opacity .08s ease,box-shadow .08s ease;-webkit-tap-highlight-color:transparent;user-select:none}button:active:not(:disabled){transform:scale(.96);filter:brightness(.92)}button:disabled{opacity:.45;cursor:not-allowed}input,select{transition:border-color .12s ease,box-shadow .12s ease,background .12s ease}input:focus,select:focus{border-color:#94a3b8!important;box-shadow:0 0 0 3px rgba(148,163,184,.22)}`}</style><div style={{ ...shellStyle, position: "relative", ...(archiveMode ? { background: "#e2e8f0", borderColor: "#64748b", boxShadow: "0 0 0 4px rgba(100,116,139,.28)" } : {}) }}>{archiveMode && <div style={{ position: "absolute", inset: "150px 0 auto 0", textAlign: "center", pointerEvents: "none", zIndex: 0, fontSize: 58, fontWeight: 950, letterSpacing: 8, color: "rgba(71,85,105,.13)", transform: "rotate(-18deg)" }}>{t("archiveWatermark")}</div>}<div style={{ position: "relative", zIndex: 1 }}><Header currentDay={currentDay} weekEndingLabel={weekEndingLabel} onWeek={() => setShowWeekView(true)} onSettings={() => setShowSettings(true)} onInstall={installApp} canInstall={Boolean(installPrompt)} />{archiveMode && <div style={{ position: "sticky", top: 8, zIndex: 5, margin: 16, marginTop: 0, padding: 12, borderRadius: 14, background: "#cbd5e1", border: "2px solid #475569", color: "#1f2937", boxShadow: "0 10px 24px rgba(15,23,42,.16)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><div><div style={{ fontSize: 14, fontWeight: 950, letterSpacing: .4 }}>{t("savedHistoricalWeek")}</div><div style={{ fontSize: 12, marginTop: 4 }}>{weekLocked ? t("historicalLocked") : t("editingArchive")}</div></div><div style={{ fontSize: 12, fontWeight: 950, padding: "6px 8px", borderRadius: 999, background: "#64748b", color: "white" }}>ARCHIVE</div></div><div style={{ display: "grid", gridTemplateColumns: weekLocked ? "1fr 1fr" : "1fr", gap: 8, marginTop: 10 }}><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={loadCurrentWeek}>{t("goToCurrentWeek")}</button>{weekLocked && <button style={{ ...buttonStyle, background: "#64748b", color: "white", borderColor: "#64748b" }} onClick={() => setHistoricalEditEnabled(true)}>{t("unlockEditing")}</button>}</div></div>}<div style={{ padding: 16, borderTop: "1px solid #eef2f7" }}><button type="button" style={{ ...buttonStyle, width: "100%", padding: 12, textAlign: "left", background: "#f8fafc", borderColor: "#eef2f7" }} onClick={() => setShowWeekPicker(true)}><div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 6 }}>{t("weekEndingSaturday")}</div><div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{formatISODateDisplay(selectedSaturday)}</div></button><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}><button style={buttonStyle} disabled={currentIndex === orderedIndices[0]} onClick={() => navigateLogical(-1)}>← {t("previous")}</button><button style={buttonStyle} disabled={currentIndex === orderedIndices[orderedIndices.length - 1]} onClick={() => navigateLogical(1)}>{t("next")} →</button></div></div><div style={sectionStyle}><SectionHeading title={t("dayType")} /><div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}><DayTypeButton label={t("workDay")} variant="work" active={currentDay.dayType === "work"} onClick={() => setCurrentDayType("work")} /><DayTypeButton label={t("holidayDay")} variant="holiday" active={currentDay.dayType === "holiday"} onClick={() => setCurrentDayType("holiday")} /><DayTypeButton label={t("offDay")} variant="off" active={currentDay.dayType === "off"} onClick={() => setCurrentDayType("off")} /></div></div>{currentDay.dayType === "work" && <div style={sectionStyle}><SectionHeading title={t("shift")} right={currentComputed.weekend ? t("weekend") : undefined} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "end" }}><TimeRow label={t("start")} value={displayStartValue} placeholder={dailyPrimarySuggestedStart || t("start")} hint={startFieldHint} onChange={(value) => updateTimeValue("start", value)} onBlur={() => normalizeTimeValue("start")} /><TimeRow label={t("finish")} value={currentDay.finish || ""} placeholder={t("finish")} onChange={(value) => updateTimeValue("finish", value)} onBlur={() => normalizeTimeValue("finish")} /></div>{dailySuggestionHelp && <HelperLine text={dailySuggestionHelp} />}{weeklyRestSuggestionHelp && <HelperLine text={weeklyRestSuggestionHelp} />}<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}><MiniStat label={t("worked")} value={formatMinutes(currentComputed.workedMinutes)} tone={(currentComputed.workedMinutes ?? 0) > 15 * 60 ? "danger" : undefined} /><MiniStat label={t("ot")} value={currentComputed.overtimeMinutes > 0 ? formatMinutes(currentComputed.overtimeMinutes) : (currentComputed.workedMinutes != null ? t("no") : "")} /></div>{shiftValidationMessage && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{shiftValidationMessage}</div>}</div>}{currentDay.dayType === "work" && <div style={{ ...sectionStyle, background: activeRestColors.bg, paddingTop: 12, paddingBottom: 12 }}><SectionHeading title={t("restFromPreviousDay")} /><RestCard value={displayRestValue} colors={activeRestColors} />{restContextHelp && <div style={{ marginTop: 6, fontSize: 12, color: activeRestColors.text, fontWeight: 800 }}>{restContextHelp}</div>}{currentIndex === orderedIndices[0] && !previousShiftAnchor && <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>{t("noPreviousDay")}</div>}</div>}<div style={sectionStyle}><SectionHeading title={t("kilometres")} /><div style={{ display: "grid", gridTemplateColumns: currentDay.dayType === "work" ? "1fr 1fr" : "1fr", gap: 10 }}><Field label={t("startKm")}><div style={{ position: "relative" }}><input style={{ ...inputStyle, fontSize: 22, fontWeight: 700, textAlign: "center", color: startKmIsSuggested ? "#94a3b8" : "#0f172a", background: startKmIsSuggested ? "#f8fafc" : "#fff", paddingBottom: startKmIsSuggested ? 24 : 12 }} inputMode="numeric" value={displayStartKm} onChange={(e) => updateKmValue("startKm", e.target.value)} onBlur={() => setSuppressStartKmSuggestion(false)} placeholder="Start" />{startKmIsSuggested && <div style={{ position: "absolute", left: 0, right: 0, bottom: 6, textAlign: "center", fontSize: 10, fontWeight: 800, color: "#64748b", pointerEvents: "none" }}>{formatTemplate(t("fromFinishKm"), { source: startKmSuggestionSource === "last saved day" ? t("lastSavedDay") : t("lastWeek") })}</div>}</div></Field>{currentDay.dayType === "work" && <Field label={t("finishKm")}><input style={{ ...inputStyle, fontSize: 22, fontWeight: 700, textAlign: "center" }} inputMode="numeric" value={currentDay.finishKm || ""} onChange={(e) => updateKmValue("finishKm", e.target.value)} placeholder="Finish" /></Field>}</div>{currentDay.dayType === "work" && <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 14, border: "1px solid #eef2f7", background: "#f8fafc" }}><div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{t("kmRun")}</div><div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>{currentComputed.kmRun == null ? "" : currentComputed.kmRun}</div></div>}</div>{currentDay.dayType === "holiday" && <div style={sectionStyle}><SectionHeading title={t("holidayPay")} right={t("taxed")} /><input style={inputStyle} type="text" inputMode="decimal" value={currentDay.holidayPay || ""} onChange={(e) => updateCurrentDay("holidayPay", e.target.value)} placeholder="0.00" /></div>}{currentDay.dayType === "work" && <div style={sectionStyle}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><ToggleRow label={t("nightOut")} variant="success" value={currentDay.nightOut} onChange={(checked) => updateCurrentDay("nightOut", checked)} /><ToggleRow label={t("splitBreak")} variant="warning" right={hasWeeklySplitBreak ? t("weekActive") : undefined} value={currentDay.splitBreak} onChange={(checked) => updateCurrentDay("splitBreak", checked)} /></div></div>}{currentDay.dayType === "work" && <div style={sectionStyle}><SectionHeading title={t("bonuses")} />{!showBonusForm && <button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={() => setShowBonusForm(true)}>+ {t("addBonus")}</button>}{showBonusForm && <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 88px", gap: 8 }}><select style={inputStyle} value={draftBonusType} onChange={(e) => setDraftBonusType(sanitizeBonusType(e.target.value))}>{activeBonusTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><input style={inputStyle} inputMode="numeric" value={draftBonusQty} onChange={(e) => setDraftBonusQty(digitsOnly(e.target.value))} /><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={addBonus}>{t("add")}</button></div>}<div style={{ display: "grid", gap: 8, marginTop: 12 }}>{currentDay.bonuses.map((bonus) => <BonusRow key={bonus.id} bonus={bonus} rate={getBonusRate(settings, bonus.type)} onDelete={() => removeBonus(bonus.id)} onQtyChange={(value) => updateBonusQty(bonus.id, value)} />)}</div></div>}<SummarySection currentComputed={currentComputed} dayType={currentDay.dayType} /><div style={{ ...sectionStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={saveAndGo}>{t("saveNext")}</button><button style={buttonStyle} onClick={() => setShowWeekView(true)}>{t("weekView")}</button></div>{showWeekPicker && <WeekPickerModal selectedSaturday={selectedSaturday} savedWeekIndicators={savedWeekIndicators} onSelectSaturday={(saturdayISO) => loadWeekBySaturday(saturdayISO, true)} onCurrentWeek={loadCurrentWeek} onClose={() => setShowWeekPicker(false)} />} {showPaySetupV2 && <PaySetupV2Modal settings={settings} setSettings={setSettings} payProfiles={payProfiles} setPayProfiles={setPayProfiles} activePayProfileId={activePayProfileId} setActivePayProfileId={setActivePayProfileId} onClose={() => setShowPaySetupV2(false)} />}
      {showSettings && <ModalErrorBoundary onClose={() => setShowSettings(false)}><SettingsModal settings={sanitizeSettings(settings)} setSettings={setSettings} days={days} setDays={setDays} archive={Array.isArray(archive) ? archive : []} setArchive={setArchive} payslipActualWeek={payslipActualWeek} setPayslipActualWeek={setPayslipActualWeek} setCurrentIndex={setCurrentIndex} setSelectedSaturday={setSelectedSaturday} setHistoricalEditEnabled={setHistoricalEditEnabled} language={language} setLanguage={setLanguage} onOpenPaySetupV2={() => { setShowSettings(false); setShowPaySetupV2(true); }} onClose={() => setShowSettings(false)} /></ModalErrorBoundary>}{showWeekView && <WeekViewModal weekEndingLabel={weekEndingLabel} settings={settings} weekTotals={weekTotals} payslipActualWeek={payslipActualWeek} setPayslipActualWeek={setPayslipActualWeek} weekDifference={weekDifference} weekBonusSummary={weekBonusSummary} previewWeek={previewWeek} taxedWeek={taxedWeek} setCurrentIndex={setCurrentIndex} close={() => setShowWeekView(false)} endWeek={endWeek} goToCurrentWeek={() => { loadCurrentWeek(); setShowWeekView(false); }} />}</div></div></div>;
}

function Header({ currentDay, weekEndingLabel, onWeek, onSettings, onInstall, canInstall }: { currentDay: DayRecord; weekEndingLabel: string; onWeek: () => void; onSettings: () => void; onInstall: () => void; canInstall: boolean }) { const compactButtonStyle = { ...buttonStyle, padding: "8px 10px", fontSize: 13 }; return <div style={{ padding: "11px 14px 10px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>{t("appTitle")} · {t("currentDay")}</div><div style={{ fontSize: 25, fontWeight: 900, marginTop: 2, lineHeight: 1.02 }}>{dayNameLabel(currentDay.dayName)}</div><div style={{ fontSize: 20, color: "#0f172a", fontWeight: 900, marginTop: 2, lineHeight: 1.05 }}>{currentDay.dateLabel}</div><div style={{ fontSize: 13, color: "#334155", fontWeight: 800, marginTop: 5, lineHeight: 1.15 }}>{weekEndingLabel}</div></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>{canInstall && <button style={compactButtonStyle} onClick={onInstall}>{t("install")}</button>}<button style={compactButtonStyle} onClick={onWeek}>{t("week")}</button><button style={compactButtonStyle} onClick={onSettings}>{t("settings")}</button></div></div></div>; }
function SectionHeading({ title, right }: { title: string; right?: string }) { return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ fontSize: 15, fontWeight: 900 }}>{title}</div>{right && <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{right}</div>}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "grid", gap: 6 }}><div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{label}</div>{children}</label>; }
function TimeRow({ label, value, onChange, onBlur, placeholder = "Start", hint = "" }: { label: string; value: string; onChange: (value: string) => void; onBlur: () => void; placeholder?: string; hint?: string }) { return <Field label={label}><div style={{ position: "relative" }}><input style={{ ...inputStyle, height: 58, fontSize: 24, fontWeight: 900, textAlign: "center", letterSpacing: 1, paddingLeft: 8, paddingRight: 8, paddingBottom: hint && !value ? 22 : 12 }} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} />{hint && !value && <div style={{ position: "absolute", left: 0, right: 0, bottom: 6, textAlign: "center", fontSize: 10, fontWeight: 800, color: "#64748b", pointerEvents: "none" }}>{hint}</div>}</div></Field>; }
function HelperLine({ text }: { text: string }) { return <div style={{ marginTop: 10, fontSize: 14, fontWeight: 900, color: text.includes("unavailable") || text.includes("недостъпна") || text.includes("limit") ? "#b45309" : "#166534", lineHeight: 1.25 }}>{text}</div>; }
function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "danger" }) { const danger = tone === "danger"; return <div style={{ padding: 12, borderRadius: 14, border: danger ? "1px solid #fecaca" : "1px solid #eef2f7", background: danger ? "#fef2f2" : "#f8fafc", color: danger ? "#991b1b" : undefined }}><div style={{ fontSize: 12, color: danger ? "#b91c1c" : "#64748b", fontWeight: 700 }}>{label}</div><div style={{ fontSize: 17, fontWeight: 900, marginTop: 3 }}>{value}</div></div>; }
function RestCard({ value, colors }: { value: string; colors: { bg: string; border: string; text: string; label: string } }) { return <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.65)", color: colors.text }}>{colors.label && <div style={{ fontSize: 12, fontWeight: 800 }}>{colors.label}</div>}<div style={{ fontSize: 24, fontWeight: 900, marginTop: colors.label ? 4 : 0 }}>{value}</div></div>; }

type ToggleVariant = "danger" | "warning" | "success";
function ToggleRow({ label, value, onChange, right, variant }: { label: string; value: boolean; onChange: (checked: boolean) => void; right?: string; variant: ToggleVariant }) { const palettes: Record<ToggleVariant, { bg: string; border: string; text: string; shadow: string }> = { danger: { bg: "linear-gradient(135deg,#ffffff 0%,#fee2e2 100%)", border: "#ef4444", text: "#991b1b", shadow: "inset 0 3px 8px rgba(153,27,27,0.22)" }, warning: { bg: "linear-gradient(135deg,#ffffff 0%,#fed7aa 100%)", border: "#f97316", text: "#9a3412", shadow: "inset 0 3px 8px rgba(154,52,18,0.20)" }, success: { bg: "linear-gradient(135deg,#ffffff 0%,#dcfce7 100%)", border: "#22c55e", text: "#166534", shadow: "inset 0 3px 8px rgba(22,101,52,0.20)" } }; const p = palettes[variant]; const style: React.CSSProperties = value ? { ...buttonStyle, width: "100%", textAlign: "left", background: p.bg, border: `2px solid ${p.border}`, color: p.text, boxShadow: p.shadow, transform: "translateY(2px)", padding: "13px 14px" } : { ...buttonStyle, width: "100%", textAlign: "left", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", boxShadow: "0 2px 0 #cbd5e1", padding: "13px 14px" }; return <button type="button" style={style} onClick={() => onChange(!value)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><div><div style={{ fontSize: 15, fontWeight: 900 }}>{label}</div>{right && <div style={{ marginTop: 3, fontSize: 11, fontWeight: 800, opacity: 0.8 }}>{right}</div>}</div><div style={{ fontSize: 16, fontWeight: 950, letterSpacing: 0.6 }}>{value ? "✓" : ""}</div></div></button>; }

type DayButtonVariant = "work" | "holiday" | "off";
function DayTypeButton({ label, active, onClick, variant }: { label: string; active: boolean; onClick: () => void; variant: DayButtonVariant }) { const palettes: Record<DayButtonVariant, { bg: string; border: string; text: string }> = { work: { bg: "linear-gradient(135deg,#ffffff 0%,#dcfce7 100%)", border: "#22c55e", text: "#166534" }, holiday: { bg: "linear-gradient(135deg,#ffffff 0%,#fed7aa 100%)", border: "#f97316", text: "#9a3412" }, off: { bg: "linear-gradient(135deg,#ffffff 0%,#fee2e2 100%)", border: "#ef4444", text: "#991b1b" } }; const p = palettes[variant]; const style: React.CSSProperties = active ? { ...buttonStyle, width: "100%", textAlign: "center", background: p.bg, border: `2px solid ${p.border}`, color: p.text, boxShadow: "inset 0 4px 10px rgba(15,23,42,0.16)", transform: "translateY(2px)", padding: "10px 6px" } : { ...buttonStyle, width: "100%", textAlign: "center", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", boxShadow: "0 2px 0 #cbd5e1", padding: "10px 6px" }; const icons: Record<DayButtonVariant, string> = { work: "■", holiday: "✱", off: "○" }; return <button type="button" style={style} onClick={onClick}><div style={{ display: "grid", gridTemplateColumns: "16px minmax(0,1fr) 16px", alignItems: "center", minHeight: 24, width: "100%" }}><span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1, textAlign: "center" }}>{icons[variant]}</span><span style={{ fontSize: 13, fontWeight: 950, lineHeight: 1.15, textAlign: "center", whiteSpace: "normal" }}>{label}</span><span aria-hidden="true" /></div></button>; }

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", fontSize: strong ? 16 : 14, fontWeight: strong ? 900 : 600 }}><div style={{ color: strong ? "#0f172a" : "#475569" }}>{label}</div><div>{value}</div></div>; }
function BonusRow({ bonus, rate, onDelete, onQtyChange }: { bonus: BonusEntry; rate: string; onDelete: () => void; onQtyChange: (value: string) => void }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 86px 44px", gap: 8, alignItems: "stretch" }}><div style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid #dbe3ee", background: "#f8fafc" }}><div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>{bonus.type}</div><div style={{ marginTop: 2, fontSize: 12, color: "#64748b", fontWeight: 700 }}>{formatMoney(bonus.qty * parseDecimal(rate))}</div></div><input style={{ ...inputStyle, padding: "10px 8px", textAlign: "center", fontWeight: 900 }} inputMode="numeric" value={String(bonus.qty)} onChange={(e) => onQtyChange(e.target.value)} /><button type="button" style={{ ...buttonStyle, padding: "8px 6px", color: "#b91c1c" }} onClick={onDelete}>×</button></div>; }
function SummarySection({ currentComputed, dayType }: { currentComputed: ComputedDay; dayType: DayType }) { const hasCompletedWork = dayType === "work" && currentComputed.workedMinutes != null; const bonusText = currentComputed.bonuses.length ? currentComputed.bonuses.map((b) => `${b.type} x${b.qty}`).join(", ") : (hasCompletedWork ? t("no") : ""); const isSoft = dayType === "holiday" || dayType === "off"; return <div style={{ ...sectionStyle, opacity: isSoft ? 0.68 : 1 }}><SectionHeading title={t("daySummary")} /><Row label={t("hours")} value={formatMinutes(currentComputed.workedMinutes)} /><Row label={t("overtime")} value={currentComputed.overtimeMinutes > 0 ? formatMinutes(currentComputed.overtimeMinutes) : (hasCompletedWork ? t("no") : "")} /><Row label={t("km")} value={currentComputed.kmRun == null ? "" : String(currentComputed.kmRun)} /><Row label={t("bonuses")} value={bonusText} /><Row label={t("nightOut")} value={currentComputed.nightOut ? t("yes") : t("no")} /></div>; }


function PaySetupV2Modal(props: { settings: SettingsState; setSettings: React.Dispatch<React.SetStateAction<SettingsState>>; payProfiles: PayProfileV2[]; setPayProfiles: React.Dispatch<React.SetStateAction<PayProfileV2[]>>; activePayProfileId: string; setActivePayProfileId: (id: string) => void; onClose: () => void }) {
  const activeProfile = props.payProfiles.find((profile) => profile.id === props.activePayProfileId) || props.payProfiles[0] || makeProfileFromSettings(props.settings, [], "Profile 1");
  const [mode, setMode] = useState<"edit" | "createFromTemplate">("edit");
  const [sourceProfileId, setSourceProfileId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfile.id);
  const selectedProfile = props.payProfiles.find((profile) => profile.id === selectedProfileId) || activeProfile;
  const [draftName, setDraftName] = useState(selectedProfile.name || "Profile 1");
  const [draftOrganisation, setDraftOrganisation] = useState(getOrganisationName(selectedProfile, props.settings));
  const [draftSettings, setDraftSettings] = useState<SettingsState>(selectedProfile.settingsSnapshot || props.settings);
  const [savedMessage, setSavedMessage] = useState("");

  function patchDraftSettings(next: Partial<SettingsState>) { setDraftSettings({ ...draftSettings, ...next }); }

  function loadProfile(profileId: string) {
    const profile = props.payProfiles.find((item) => item.id === profileId);
    if (!profile) return;
    setSelectedProfileId(profile.id);
    setMode("edit");
    setSourceProfileId(null);
    setDraftName(profile.name || "Profile 1");
    setDraftOrganisation(getOrganisationName(profile, props.settings));
    setDraftSettings(profile.settingsSnapshot || props.settings);
    setSavedMessage("");
  }

  function updateProfileOnly() {
    const targetId = selectedProfile.id;
    const now = new Date().toISOString();
    const cleanName = draftName.trim() || selectedProfile.name || "Profile 1";
    const organisationName = draftOrganisation.trim();
    const profileSettings = { ...draftSettings, companyName: organisationName };
    const updated = props.payProfiles.map((profile) => profile.id === targetId ? { ...profile, name: cleanName, companyName: organisationName, organisationName, updatedAt: now, settingsSnapshot: profileSettings } : profile);
    props.setPayProfiles(updated);
    props.setActivePayProfileId(targetId);
    // Important: do NOT call setSettings here. Updating a profile must not recalculate saved days/weeks.
    setSavedMessage(t("profileOnlySaved"));
  }

  function createProfile(sourceId: string | null) {
    const existing = props.payProfiles;
    const organisationName = draftOrganisation.trim();
    const profileSettings = { ...draftSettings, companyName: organisationName };
    const cleanName = getNextProfileName(existing, draftName.trim() || organisationName || getProfileNameBase(profileSettings) || "Profile");
    const created = makeProfileFromSettings(profileSettings, existing, cleanName, sourceId);
    const createdWithOrganisation = { ...created, companyName: organisationName, organisationName };
    props.setPayProfiles([...existing, createdWithOrganisation]);
    props.setActivePayProfileId(createdWithOrganisation.id);
    setSelectedProfileId(createdWithOrganisation.id);
    setMode("edit");
    setSourceProfileId(null);
    setDraftName(createdWithOrganisation.name);
    setSavedMessage(t("profileOnlySaved"));
    // Important: create profile only stores the setup. It does not silently apply it to old/saved data.
  }

  function applyDraftToCurrentSettings() {
    const organisationName = draftOrganisation.trim();
    const nextSettings = { ...draftSettings, companyName: organisationName };
    props.setSettings(nextSettings);
    props.setActivePayProfileId(selectedProfile.id);
    setSavedMessage(`${t("applyProfile")}: ${t("applyFromNextEmptyDay")}`);
  }

  function startNewFromThis() {
    setMode("createFromTemplate");
    setSourceProfileId(selectedProfile.id);
    setDraftName(getNextProfileName(props.payProfiles, selectedProfile.name || "Profile"));
    setDraftOrganisation(getOrganisationName(selectedProfile, props.settings));
    setDraftSettings({ ...selectedProfile.settingsSnapshot });
    setSavedMessage("");
  }

  const primaryText = mode === "createFromTemplate" ? t("createProfile") : `${t("updateProfile")} ${draftName.trim() || selectedProfile.name}`;

  return <Overlay onClose={props.onClose}><ModalCard><ModalTitle>{t("paySetupV2")}</ModalTitle>
    {props.payProfiles.length > 0 && <div style={{ marginBottom: 12, padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #dbe3ee" }}>
      <SectionHeading title={t("loadProfile")} right={String(props.payProfiles.length)} />
      <select value={selectedProfileId} onChange={(event) => loadProfile(event.target.value)} style={{ ...inputStyle, width: "100%" }}>
        {props.payProfiles.map((profile) => <option key={profile.id} value={profile.id}>{getOrganisationName(profile, props.settings) ? `${getOrganisationName(profile, props.settings)} — ${profile.name}` : profile.name}</option>)}
      </select>
    </div>}

    <div style={{ marginBottom: 12, padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #dbe3ee" }}>
      <SectionHeading title={t("profilePreview")} right={mode === "createFromTemplate" ? t("newFromThis") : t("currentDraft")} />
      <SettingsInput label={t("organisationName")} textMode value={draftOrganisation} onChange={setDraftOrganisation} />
      <SettingsInput label={t("profileName")} textMode value={draftName} onChange={setDraftName} />
    </div>

    <SectionHeading title={t("payRates")} />
    <SettingsInput label={t("weekdayPayRate")} value={draftSettings.weekdayRate} onChange={(value) => patchDraftSettings({ weekdayRate: value })} />
    <SettingsInput label={t("overtimeThreshold")} value={draftSettings.overtimeThresholdHours} onChange={(value) => patchDraftSettings({ overtimeThresholdHours: value })} />
    <SettingsInput label={t("overtimePayRate")} value={draftSettings.overtimeRate} onChange={(value) => patchDraftSettings({ overtimeRate: value })} />
    <SettingsInput label={t("saturdayPayRate")} value={draftSettings.saturdayRate} onChange={(value) => patchDraftSettings({ saturdayRate: value })} />
    <SettingsInput label={t("sundayPayRate")} value={draftSettings.sundayRate} onChange={(value) => patchDraftSettings({ sundayRate: value })} />
    <SettingsInput label={t("foodAllowance")} value={draftSettings.foodAllowanceRate} onChange={(value) => patchDraftSettings({ foodAllowanceRate: value })} />
    <SettingsInput label={t("nightOutPay")} value={draftSettings.nightOutRate} onChange={(value) => patchDraftSettings({ nightOutRate: value })} />

    {savedMessage && <div style={{ padding: 10, borderRadius: 12, background: "#dcfce7", border: "1px solid #86efac", color: "#166534", fontWeight: 900, fontSize: 13, marginTop: 8 }}>{savedMessage}</div>}

    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 12 }}>
      <button style={{ ...buttonStyle, width: "100%", background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={() => mode === "createFromTemplate" ? createProfile(sourceProfileId) : updateProfileOnly()}>{primaryText}</button>
      <button style={{ ...buttonStyle, width: "100%" }} onClick={applyDraftToCurrentSettings}>{t("applyProfile")} — {t("applyFromNextEmptyDay")}</button>
      {mode !== "createFromTemplate" && <button style={{ ...buttonStyle, width: "100%" }} onClick={() => createProfile(selectedProfile.id)}>{t("saveAsNewProfile")}</button>}
      {mode !== "createFromTemplate" && <button style={{ ...buttonStyle, width: "100%" }} onClick={startNewFromThis}>{t("newFromThis")}</button>}
      <button style={{ ...buttonStyle, width: "100%" }} onClick={props.onClose}>{t("done")}</button>
    </div>
    <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", fontWeight: 800 }}>Profile changes are saved separately. Applying them to saved periods must be explicit.</div>
  </ModalCard></Overlay>;
}

class ModalErrorBoundary extends React.Component<{ onClose: () => void; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { onClose: () => void; children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error("Settings modal crashed", error); }
  render() {
    if (this.state.hasError) {
      return <Overlay onClose={this.props.onClose}><ModalCard><ModalTitle>{t("settingsTitle")}</ModalTitle><div style={{ padding: 12, borderRadius: 14, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: 14, fontWeight: 800 }}>Settings could not open safely. Close this and try again after refresh.</div><button style={{ ...buttonStyle, width: "100%", marginTop: 12, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={this.props.onClose}>{t("close")}</button></ModalCard></Overlay>;
    }
    return this.props.children;
  }
}

function WeekPickerModal({ selectedSaturday, savedWeekIndicators, onSelectSaturday, onCurrentWeek, onClose }: { selectedSaturday: string; savedWeekIndicators: SavedWeekIndicator[]; onSelectSaturday: (saturdayISO: string) => void; onCurrentWeek: () => void; onClose: () => void }) {
  return <Overlay onClose={onClose}><ModalCard><ModalTitle>{t("weekEndingSaturday")}</ModalTitle><MiniWeekCalendar selectedSaturday={selectedSaturday} savedWeekIndicators={savedWeekIndicators} onSelectSaturday={onSelectSaturday} /><button style={{ ...buttonStyle, width: "100%", marginTop: 12, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={onCurrentWeek}>{t("currentWeek")}</button><button style={{ ...buttonStyle, width: "100%", marginTop: 8 }} onClick={onClose}>{t("close")}</button></ModalCard></Overlay>;
}

function SettingsInput({ label, value, onChange, textMode = false }: { label: string; value: string; onChange: (value: string) => void; textMode?: boolean }) {
  return <Field label={label}><input style={{ ...inputStyle, marginBottom: 8 }} type="text" inputMode={textMode ? "text" : "decimal"} value={value || ""} onChange={(e) => onChange(e.target.value)} /></Field>;
}

function SettingsModal({ settings, setSettings, days, setDays, archive, setArchive, payslipActualWeek, setPayslipActualWeek, setCurrentIndex, setSelectedSaturday, setHistoricalEditEnabled, language, setLanguage, onOpenPaySetupV2, onClose }: { settings: SettingsState; setSettings: React.Dispatch<React.SetStateAction<SettingsState>>; days: DayRecord[]; setDays: React.Dispatch<React.SetStateAction<DayRecord[]>>; archive: any[]; setArchive: React.Dispatch<React.SetStateAction<any[]>>; payslipActualWeek: string; setPayslipActualWeek: React.Dispatch<React.SetStateAction<string>>; setCurrentIndex: React.Dispatch<React.SetStateAction<number>>; setSelectedSaturday: React.Dispatch<React.SetStateAction<string>>; setHistoricalEditEnabled: React.Dispatch<React.SetStateAction<boolean>>; language: Lang; setLanguage: (value: Lang) => void; onOpenPaySetupV2: () => void; onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return <Overlay onClose={onClose}><ModalCard><ModalTitle>{t("settingsTitle")}</ModalTitle><SectionHeading title={t("language")} /><select style={{ ...inputStyle, marginBottom: 14 }} value={language} onChange={(e) => setLanguage(e.target.value as Lang)}><option value="en">English</option><option value="bg">Български</option></select><div style={{ marginBottom: 14, padding: 12, borderRadius: 14, border: "1px solid #dbe3ee", background: "#f8fafc" }}><SectionHeading title={t("backupRestore")} right={t("recommended")} /><div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.35, marginBottom: 10 }}>{t("backupInfo")}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={() => downloadDriverBackup(days, settings, payslipActualWeek, archive)}>{t("backup")}</button><button style={buttonStyle} onClick={() => fileInputRef.current?.click()}>{t("restore")}</button></div><input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) restoreDriverBackupFile(file, { setDays, setSettings, setPayslipActualWeek, setArchive, setCurrentIndex, setSelectedSaturday, setHistoricalEditEnabled, onDone: onClose }); e.currentTarget.value = ""; }} /></div><div style={{ marginBottom: 14, padding: 12, borderRadius: 14, border: "1px solid #dbe3ee", background: "#f8fafc" }}><SectionHeading title={t("paySetupV2")} right="v2" /><div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.35, marginBottom: 10 }}>{t("currentProfile")}: {settings.companyName || "Profile 1"}</div><button style={{ ...buttonStyle, width: "100%", background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={onOpenPaySetupV2}>{t("openPaySetup")}</button></div><SectionHeading title={t("payRates")} /><SettingsInput label={t("companyName")} textMode value={settings.companyName || ""} onChange={(v) => setSettings({ ...settings, companyName: v })} /><SettingsInput label={t("weekdayPayRate")} value={settings.weekdayRate} onChange={(v) => setSettings({ ...settings, weekdayRate: v })} /><SettingsInput label={t("saturdayPayRate")} value={settings.saturdayRate} onChange={(v) => setSettings({ ...settings, saturdayRate: v })} /><SettingsInput label={t("sundayPayRate")} value={settings.sundayRate} onChange={(v) => setSettings({ ...settings, sundayRate: v })} /><div style={{marginTop:8}}><label>{t("pensionMode")}</label><select value={settings.pensionMode} onChange={(e)=>setSettings({...settings,pensionMode:e.target.value})}><option value="none">{t("noPension")}</option><option value="manual">{t("manualPension")}</option></select>{settings.pensionMode==="manual" && <SettingsInput label={t("pensionDeduction")} value={settings.pensionManualAmount} onChange={(v)=>setSettings({...settings,pensionManualAmount:v})} />}</div><SettingsInput label={t("overtimeThreshold")} value={settings.overtimeThresholdHours} onChange={(v) => setSettings({ ...settings, overtimeThresholdHours: v })} /><SettingsInput label={t("overtimePayRate")} value={settings.overtimeRate} onChange={(v) => setSettings({ ...settings, overtimeRate: v })} /><SettingsInput label={t("foodAllowance")} value={settings.foodAllowanceRate} onChange={(v) => setSettings({ ...settings, foodAllowanceRate: v })} /><SettingsInput label={t("nightOutPay")} value={settings.nightOutRate} onChange={(v) => setSettings({ ...settings, nightOutRate: v })} /><SectionHeading title={t("bonusPayRates")} />{BONUS_TYPES.map((bonusType) => <SettingsInput key={bonusType} label={bonusType} value={settings.bonusRates[bonusType]} onChange={(v) => setSettings({ ...settings, bonusRates: { ...settings.bonusRates, [bonusType]: v } })} />)}<SectionHeading title={t("customBonuses")} />{settings.customBonuses.map((customBonus, index) => <div key={customBonus.id} style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 8, marginBottom: 8 }}><input style={inputStyle} value={customBonus.name} onChange={(e) => { const customBonuses = settings.customBonuses.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item); setSettings({ ...settings, customBonuses }); }} placeholder={`${t("customBonusName")} ${index + 1}`} /><input style={inputStyle} inputMode="decimal" value={customBonus.rate} onChange={(e) => { const customBonuses = settings.customBonuses.map((item, itemIndex) => itemIndex === index ? { ...item, rate: e.target.value } : item); setSettings({ ...settings, customBonuses }); }} placeholder={t("customBonusRate")} /></div>)}<div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, fontWeight: 800 }}>Driver Pay App {APP_VERSION}</div><button style={{ ...buttonStyle, width: "100%", marginTop: 8, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={onClose}>{t("done")}</button></ModalCard></Overlay>;
}
function WeekViewModal(props: { weekEndingLabel: string; settings: SettingsState; weekTotals: WeekTotals; payslipActualWeek: string; setPayslipActualWeek: (value: string) => void; weekDifference: number; weekBonusSummary: Record<BonusType | "nightOuts", number>; previewWeek: ComputedDay[]; taxedWeek: ComputedDay[]; setCurrentIndex: (index: number) => void; close: () => void; endWeek: (type: WeekArchiveType, dayTypeOverrides?: Record<string, DayType>) => void; goToCurrentWeek: () => void }) {
  const p = props;
  const [showDetails, setShowDetails] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [fastCloseMode, setFastCloseMode] = useState<"simple" | "choose">("simple");
  const [futureTypes, setFutureTypes] = useState<Record<string, DayType>>(() => Object.fromEntries(DAY_ORDER.map((id) => [id, id === "sat" || id === "sun" ? "off" : "holiday"])) as Record<string, DayType>);
  const differenceStyle = getDifferenceStyle(p.weekDifference);
  const hasPayslip = Boolean(p.payslipActualWeek);
  const splitDays = p.previewWeek.filter((day) => day.splitBreak);
  const nightOutDays = p.previewWeek.filter((day) => day.nightOut);
  const isFastCloseWeek = !weekHasWorkData(p.previewWeek);
  const restSummary = p.previewWeek.reduce((acc, day, index) => {
    if (index === 0) return acc;
    const previous = p.previewWeek[index - 1];
    const restMinutes = getRestBeforeMinutes(previous, day);
    const previousWorked = getWorkedMinutes(previous);
    const status = getEffectiveRestStatus(restMinutes, previousWorked, Boolean(previous?.splitBreak), acc.reduced);
    if (status === "good") acc.good += 1;
    if (status === "reduced") acc.reduced += 1;
    if (status === "split") acc.split += 1;
    if (status === "violation") acc.violation += 1;
    return acc;
  }, { good: 0, reduced: 0, split: 0, violation: 0 });
  const totalBasePay = p.previewWeek.reduce((sum, day) => sum + day.basePay, 0);
  const totalOvertimePay = p.previewWeek.reduce((sum, day) => sum + day.overtimePay, 0);
  const totalBonusPay = p.previewWeek.reduce((sum, day) => sum + day.bonusPay, 0);
  const totalFood = p.previewWeek.reduce((sum, day) => sum + day.foodAllowancePay, 0);
  const totalNightOut = p.previewWeek.reduce((sum, day) => sum + day.nightOutPay, 0);
  const bonusCount = p.previewWeek.reduce((sum, day) => sum + day.bonuses.reduce((s, b) => s + b.qty, 0), 0);
  const closeTypeStyle = { ...buttonStyle, fontWeight: 900 };
  const bonusTextForDay = (day: ComputedDay) => day.bonuses.length ? day.bonuses.map((b) => `${b.type} x${b.qty}`).join(", ") : "—";
  const closeAndExit = (type: WeekArchiveType, overrides?: Record<string, DayType>) => { p.endWeek(type, overrides); setShowCloseConfirm(false); p.close(); };
  const usedExtras = [
    ...Object.entries(p.weekBonusSummary).filter(([key, value]) => key !== "nightOuts" && Number(value) > 0).map(([key, value]) => `${key} x${value}`),
    ...(nightOutDays.length ? [`${t("nightOut")} ${nightOutDays.length}`] : []),
    ...(splitDays.length ? [`${t("splitRests")} ${splitDays.length}`] : []),
    ...(restSummary.reduced ? [`${t("reducedRests")} ${restSummary.reduced}`] : []),
  ];

  if (showCloseConfirm && isFastCloseWeek) {
    const setAll = (type: DayType) => setFutureTypes(Object.fromEntries(DAY_ORDER.map((id) => [id, type])) as Record<string, DayType>);
    return <Overlay onClose={() => setShowCloseConfirm(false)}><ModalCard><ModalTitle>{t("futureWeekClose")}</ModalTitle><div style={{ fontSize: 13, color: "#475569", fontWeight: 700, marginBottom: 12 }}>{p.weekEndingLabel}</div><div style={{ padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #eef2f7", color: "#334155", fontSize: 13, fontWeight: 700 }}>{t("fastCloseHint")}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}><button style={closeTypeStyle} onClick={() => { setFastCloseMode("simple"); setAll("off"); }}>{t("allOff")}</button><button style={closeTypeStyle} onClick={() => { setFastCloseMode("simple"); setAll("holiday"); }}>{t("allHoliday")}</button></div><button style={{ ...buttonStyle, width: "100%", marginTop: 8, background: fastCloseMode === "choose" ? "#e2e8f0" : "#fff" }} onClick={() => setFastCloseMode(fastCloseMode === "choose" ? "simple" : "choose")}>{t("chooseDays")}</button>{fastCloseMode === "choose" && <div style={{ display: "grid", gap: 6, marginTop: 10 }}>{p.previewWeek.map((day) => <div key={day.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px", gap: 6, alignItems: "center" }}><div style={{ fontSize: 13, fontWeight: 900 }}>{dayNameLabel(day.dayName)}</div><button style={{ ...buttonStyle, padding: "8px 6px", background: futureTypes[day.id] === "off" ? "#dcfce7" : "#fff" }} onClick={() => setFutureTypes({ ...futureTypes, [day.id]: "off" })}>{t("off")}</button><button style={{ ...buttonStyle, padding: "8px 6px", background: futureTypes[day.id] === "holiday" ? "#fef3c7" : "#fff" }} onClick={() => setFutureTypes({ ...futureTypes, [day.id]: "holiday" })}>{t("holiday")}</button></div>)}</div>}<div style={{ display: "grid", gap: 8, marginTop: 12 }}><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a", fontWeight: 900 }} onClick={() => closeAndExit("off", futureTypes)}>{t("closeFutureWeek")}</button><button style={buttonStyle} onClick={p.goToCurrentWeek}>{t("goToCurrentWeek")}</button><button style={buttonStyle} onClick={() => setShowCloseConfirm(false)}>{t("back")}</button></div></ModalCard></Overlay>;
  }

  if (showCloseConfirm) {
    return <Overlay onClose={() => setShowCloseConfirm(false)}><ModalCard><ModalTitle>{t("endWeekPreview")}</ModalTitle><div style={{ fontSize: 14, fontWeight: 800, color: "#334155", marginBottom: 12 }}>{p.weekEndingLabel}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><MiniStat label={t("totalHours")} value={formatMinutes(p.weekTotals.worked)} /><MiniStat label={t("km")} value={String(p.weekTotals.km)} /><MiniStat label={t("estimatedNet")} value={formatMoney(p.weekTotals.net)} /><label style={{ ...inputStyle, padding: 10, display: "grid", gap: 3 }}><div style={{ fontSize: 11, fontWeight: 900, color: "#64748b" }}>{t("payslipNet")}</div><input style={{ border: 0, outline: 0, background: "transparent", fontSize: 20, fontWeight: 900, width: "100%" }} type="text" inputMode="decimal" value={p.payslipActualWeek} onChange={(e) => p.setPayslipActualWeek(e.target.value)} placeholder="0.00" /></label><MiniStat label={t("reducedRests")} value={String(restSummary.reduced)} /><MiniStat label={t("splitRests")} value={String(splitDays.length)} /></div>{usedExtras.length > 0 && <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc" }}><div style={{ fontSize: 12, fontWeight: 900, color: "#475569", marginBottom: 8 }}>{t("usedExtras")}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{usedExtras.map((item) => <span key={item} style={{ padding: "5px 9px", borderRadius: 999, background: "#e2e8f0", color: "#334155", fontSize: 12, fontWeight: 900 }}>{item}</span>)}</div></div>}<div style={{ ...differenceStyle, borderRadius: 14, padding: 12, marginTop: 12 }}><div style={{ fontSize: 12, marginBottom: 4 }}>{t("difference")}</div><div style={{ fontSize: 22, fontWeight: 900 }}>{hasPayslip ? formatMoney(p.weekDifference) : "—"}</div></div><div style={{ display: "grid", gap: 10, marginTop: 14 }}><button style={{ ...closeTypeStyle, background: "#0f172a", color: "white", borderColor: "#0f172a" }} onClick={() => closeAndExit("worked")}>{t("confirmCloseWeek")}</button><div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}><div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, marginBottom: 6 }}>Mark only empty remaining days:</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button style={closeTypeStyle} onClick={() => closeAndExit("off")}>{t("remainingOff")}</button><button style={closeTypeStyle} onClick={() => closeAndExit("holiday")}>{t("remainingHoliday")}</button></div></div><button style={buttonStyle} onClick={() => setShowCloseConfirm(false)}>{t("back")}</button></div></ModalCard></Overlay>;
  }

  return <Overlay onClose={p.close}><ModalCard><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div><ModalTitle>{t("weekPreview")}</ModalTitle><div style={{ fontSize: 14, fontWeight: 800, color: "#334155", marginTop: 4 }}>{p.weekEndingLabel}</div>{p.settings.companyName?.trim() && <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginTop: 4 }}>{p.settings.companyName.trim()}</div>}</div><button style={{ ...buttonStyle, padding: "8px 12px" }} onClick={p.close}>{t("close")}</button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}><MiniStat label={t("hours")} value={formatMinutes(p.weekTotals.worked)} /><MiniStat label={t("ot")} value={p.weekTotals.overtime > 0 ? formatMinutes(p.weekTotals.overtime) : "—"} /><MiniStat label={t("km")} value={p.weekTotals.km ? String(p.weekTotals.km) : "—"} /><MiniStat label={t("estimatedNet")} value={formatMoney(p.weekTotals.net)} /><MiniStat label={t("bonuses")} value={bonusCount ? `x${bonusCount}` : "—"} /><MiniStat label={t("nightOut")} value={nightOutDays.length ? `x${nightOutDays.length}` : "—"} /></div><div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc" }}><div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{t("restSnapshot")}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}><MiniStat label="11h" value={String(restSummary.good)} /><MiniStat label="9h" value={String(restSummary.reduced)} /><MiniStat label="SR" value={String(splitDays.length)} /></div>{restSummary.violation > 0 && <div style={{ marginTop: 8, color: "#b91c1c", fontWeight: 900 }}>Rest warnings: {restSummary.violation}</div>}</div><button style={{ ...buttonStyle, width: "100%", marginTop: 12, background: showDetails ? "#e2e8f0" : "#f8fafc" }} onClick={() => setShowDetails((value) => !value)}>{showDetails ? t("hideDailyDetails") : t("detailedView")}</button>{showDetails && <div style={{ marginTop: 12 }}><SectionHeading title={t("days")} right={t("noPoundsHere")} />{p.previewWeek.map((day) => { const originalIndex = p.taxedWeek.findIndex((d) => d.id === day.id); const isWorked = day.dayType === "work" && day.workedMinutes != null; const hasNightOut = Boolean(day.nightOut); return <button key={day.id} onClick={() => { p.setCurrentIndex(originalIndex); p.close(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ ...buttonStyle, display: "grid", gap: 5, textAlign: "left", padding: 12, marginBottom: 8, background: day.splitBreak ? "linear-gradient(135deg,#ecfccb 0%,#fef08a 100%)" : "#fff" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div style={{ fontWeight: 900, fontSize: 16 }}>{dayNameLabel(day.dayName)} · {day.dateLabel}</div><div style={{ display: "flex", gap: 5 }}>{hasNightOut && <span style={{ padding: "2px 8px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 900 }}>NO</span>}{day.splitBreak && <span style={{ padding: "2px 8px", borderRadius: 999, background: "#fde047", color: "#365314", fontSize: 11, fontWeight: 900 }}>SR</span>}</div></div><div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{day.dayType === "holiday" ? t("holiday") : day.dayType === "off" ? t("off") : `${normalizeTime(day.start) || "—"} → ${normalizeTime(day.finish) || "—"}`}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px", fontSize: 12, color: "#0f172a", alignItems: "start" }}><span style={{ whiteSpace: "nowrap" }}>{t("hours")}: <b>{formatMinutes(day.workedMinutes)}</b></span><span style={{ whiteSpace: "nowrap" }}>{t("km")}: <b>{day.kmRun ?? "—"}</b></span><span style={{ whiteSpace: "nowrap" }}>{t("ot")}: <b>{day.overtimeMinutes > 0 ? formatMinutes(day.overtimeMinutes) : "—"}</b></span></div>{isWorked && <div style={{ fontSize: 12, color: "#64748b" }}>{t("bonuses")}: {bonusTextForDay(day)}</div>}</button>; })}</div>}<div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button style={buttonStyle} onClick={p.close}>{t("back")}</button><button style={{ ...buttonStyle, background: "#0f172a", color: "white", borderColor: "#0f172a", fontWeight: 900 }} onClick={() => setShowCloseConfirm(true)}>{t("endWeek")}</button></div></ModalCard></Overlay>;
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { return <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", padding: 12, zIndex: 100, overflow: "auto" }} onMouseDown={onClose}><div onMouseDown={(e) => e.stopPropagation()}>{children}</div></div>; }
function ModalCard({ children }: { children: React.ReactNode }) { return <div style={{ maxWidth: 430, margin: "24px auto", background: "white", borderRadius: 22, padding: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 50px rgba(15,23,42,0.25)" }}>{children}</div>; }
function ModalTitle({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>{children}</div>; }
