// 48-Month Calculation Engine
// Pure TypeScript. No side effects. Mirrors the Excel workbook logic.
//
// Rules (per the user's spec):
//  - Savings are the PRIMARY funding mechanism. Interest is a CUSHION only.
//  - Monthly interest = availableBeforeInterest × annualRate / 12
//  - availableBeforeInterest = previousEnding + contribution - withdrawal
//  - The PROJECTED balance may go negative (to reveal a deficit).
//  - The ACTUAL balance never goes below 0; shortfalls are tracked separately.
//  - Required monthly saving is solved so the projected final balance ≈ 0.

import type {
  PlannerSettings,
  FeeEntry,
  MonthRow,
  YearSummary,
  ProjectionResult,
  ActualTransaction,
  UpcomingFee,
  CushionAnalysis,
} from "./types";

export const TOTAL_MONTHS = 48;
export const MONTHS_PER_YEAR = 12;
export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function defaultFeeSchedule(): FeeEntry[] {
  // Per the user's improved workbook:
  //  Y2: Ksh 60,000 in September
  //  Y3: Ksh 65,000 in September + Ksh 65,000 in April
  //  Y4: Ksh 80,000 in September + Ksh 80,000 in April
  // Academic year starts in September. Month indices (0-based from academic start):
  //  Y1: Sep=0 ... Aug=11
  //  Y2: Sep=12 ... Aug=23
  //  Y3: Sep=24 ... Aug=35  (April = 24+7 = 31)
  //  Y4: Sep=36 ... Aug=47  (April = 36+7 = 43)
  return [
    { monthIndex: 12, amount: 60000, label: "Y2 September fee" },
    { monthIndex: 31, amount: 65000, label: "Y3 April fee" },
    { monthIndex: 24, amount: 65000, label: "Y3 September fee" },
    { monthIndex: 43, amount: 80000, label: "Y4 April fee" },
    { monthIndex: 36, amount: 80000, label: "Y4 September fee" },
  ];
}

export function defaultSettings(): PlannerSettings {
  return {
    tuitionPerYear: 160000,
    startingMMF: 60000,
    monthlySaving: 5000,
    mmfAnnualReturn: 0.12,
    helbY1: 120000,
    helbY2: 60000,
    helbY3: 30000,
    helbY4: 0,
    academicStartMonth: 8, // September
    academicStartYear: 2026,
    studentName: "Forestry Student",
    onboarded: false,
  };
}

function dateForMonth(
  startMonth: number,
  startYear: number,
  monthIndex: number,
): Date {
  // monthIndex 0 = academic start month/year
  const totalMonths = startYear * 12 + startMonth + monthIndex;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths % 12;
  return new Date(year, month, 1);
}

function helbForYear(year: number, s: PlannerSettings): number {
  switch (year) {
    case 1: return s.helbY1;
    case 2: return s.helbY2;
    case 3: return s.helbY3;
    case 4: return s.helbY4;
    default: return 0;
  }
}

export function academicYearForMonthIndex(monthIndex: number): number {
  return Math.floor(monthIndex / MONTHS_PER_YEAR) + 1;
}

/**
 * Build the 48-month projection.
 *
 * @param settings Planner assumptions
 * @param fees Scheduled fee withdrawals (monthIndex → amount)
 * @param overrideMonthlySaving If set, use this instead of settings.monthlySaving (for What-If)
 * @param actuals Recorded actual transactions (for plan-vs-actual display)
 */
export function buildProjection(
  settings: PlannerSettings,
  fees: FeeEntry[],
  overrideMonthlySaving?: number,
  actuals: ActualTransaction[] = [],
): ProjectionResult {
  const monthlySaving = overrideMonthlySaving ?? settings.monthlySaving;
  const feeMap = new Map<number, FeeEntry>();
  for (const f of fees) feeMap.set(f.monthIndex, f);
  const actualMap = new Map<number, ActualTransaction>();
  for (const a of actuals) actualMap.set(a.monthIndex, a);

  const monthlyRate = settings.mmfAnnualReturn / 12;
  const months: MonthRow[] = [];

  let runningBalance = settings.startingMMF;
  let cumulativeSaved = 0;
  let cumulativeInterest = 0;
  let cumulativeWithdrawn = 0;
  let minBalance = runningBalance;
  let minBalanceMonth: MonthRow | null = null;

  for (let i = 0; i < TOTAL_MONTHS; i++) {
    const date = dateForMonth(
      settings.academicStartMonth,
      settings.academicStartYear,
      i,
    );
    const academicYear = academicYearForMonthIndex(i);
    const calendarYear = date.getFullYear();
    const calendarMonth = date.getMonth();
    const fee = feeMap.get(i) ?? null;
    const withdrawal = fee?.amount ?? 0;

    const startingBalance = runningBalance;
    const contribution = monthlySaving;

    // availableBeforeInterest = previous + contribution - withdrawal
    const availableBeforeInterest = startingBalance + contribution - withdrawal;

    // Interest = available × rate / 1  (monthlyRate already /12)
    // Only earn interest on positive balances (MMF can't earn on a deficit)
    const interestBase = Math.max(0, availableBeforeInterest);
    const interest = interestBase * monthlyRate;

    const endingBalance = availableBeforeInterest + interest;

    cumulativeSaved += contribution;
    cumulativeInterest += interest;
    cumulativeWithdrawn += withdrawal;

    const actual = actualMap.get(i);
    const hasActual = !!actual;

    const row: MonthRow = {
      monthIndex: i,
      date,
      year: academicYear,
      calendarYear,
      calendarMonth,
      monthLabel: `${MONTH_NAMES[calendarMonth]} ${calendarYear}`,
      shortMonth: MONTH_NAMES[calendarMonth],
      startingBalance,
      contribution,
      withdrawal,
      interest,
      endingBalance,
      cumulativeSaved,
      cumulativeInterest,
      cumulativeWithdrawn,
      isFeeMonth: withdrawal > 0,
      feeLabel: fee?.label ?? null,
      // Cushion fields are filled in after the loop (see computeCushionForMonth)
      recommendedSaving: monthlySaving,
      cushionAdjustment: 0,
      hasActual,
      actualEndingBalance: actual?.actualEndingBalance ?? null,
      actualContribution: actual?.actualSaving ?? null,
      actualInterest: actual?.actualInterest ?? null,
    };

    months.push(row);
    runningBalance = endingBalance;

    if (endingBalance < minBalance) {
      minBalance = endingBalance;
      minBalanceMonth = row;
    }
  }

  // Year summaries
  const years: YearSummary[] = [];
  for (let y = 1; y <= 4; y++) {
    const startIdx = (y - 1) * 12;
    const endIdx = startIdx + 11;
    const yearMonths = months.slice(startIdx, endIdx + 1);
    const startBalance = yearMonths[0].startingBalance;
    const endBalance = yearMonths[yearMonths.length - 1].endingBalance;
    const totalContributions = yearMonths.reduce((s, m) => s + m.contribution, 0);
    const totalInterest = yearMonths.reduce((s, m) => s + m.interest, 0);
    const totalWithdrawn = yearMonths.reduce((s, m) => s + m.withdrawal, 0);
    const tuition = settings.tuitionPerYear;
    const helb = helbForYear(y, settings);
    years.push({
      year: y,
      startBalance,
      endBalance,
      totalContributions,
      totalInterest,
      totalWithdrawn,
      tuition,
      helb,
      studentFunding: tuition - helb,
      netChange: endBalance - startBalance,
    });
  }

  const finalBalance = runningBalance;
  const totalContributions = cumulativeSaved;
  const totalInterest = cumulativeInterest;
  const totalWithdrawn = cumulativeWithdrawn;
  const hasShortfall = minBalance < 0;
  const shortfallAmount = hasShortfall ? Math.abs(minBalance) : 0;
  const shortfallMonthIndex = hasShortfall && minBalanceMonth ? minBalanceMonth.monthIndex : null;

  // Solve required monthly saving so final balance ≈ 0.
  const requiredMonthlySaving = solveRequiredMonthlySaving(settings, fees);

  // Compute the cushion analysis: for each upcoming fee, how much must be
  // saved per month to cover it? This implements the user's "three layers"
  // model: base saving + cushion adjustment + MMF interest as bonus.
  // The global recommendedAdjustment uses the break-even solver (which accounts
  // for ALL fees cumulatively); per-fee rows show individual gap analysis.
  const globalRequiredSaving = requiredMonthlySaving;
  const cushion = computeCushionAnalysis(settings, fees, months, globalRequiredSaving);

  // Backfill per-month cushion recommendations on each MonthRow.
  // Each month's recommended saving = the global break-even (so saving that
  // amount every month keeps you on track for ALL fees, not just the next one).
  for (const m of months) {
    m.recommendedSaving = globalRequiredSaving;
    m.cushionAdjustment = Math.max(0, globalRequiredSaving - settings.monthlySaving);
  }

  const surplusAmount = finalBalance > 0 ? finalBalance : 0;
  let fundingStatus: ProjectionResult["fundingStatus"];
  if (hasShortfall) fundingStatus = "shortfall";
  else if (finalBalance > settings.monthlySaving) fundingStatus = "surplus";
  else fundingStatus = "on-track";

  return {
    months,
    years,
    finalBalance,
    totalContributions,
    totalInterest,
    totalWithdrawn,
    minBalance,
    minBalanceMonth,
    hasShortfall,
    shortfallAmount,
    shortfallMonthIndex,
    requiredMonthlySaving,
    fundingStatus,
    surplusAmount,
    cushion,
  };
}

/**
 * Compute the cushion analysis: for each upcoming fee (at or after the
 * current month), determine the projected balance just before the fee and
 * the per-month saving required to close any gap.
 *
 * This implements the user's "three layers" model:
 *   1. Base saving (settings.monthlySaving)
 *   2. Cushion adjustment (extra saving needed to reach the next fee)
 *   3. MMF interest (bonus, never relied upon)
 *
 * The "required monthly saving" for a fee is:
 *   max(0, feeAmount - projectedBalanceAtFee) / monthsAway
 * rounded up to the nearest 10 Ksh.
 */
export function computeCushionAnalysis(
  settings: PlannerSettings,
  fees: FeeEntry[],
  months: MonthRow[],
  globalRequiredSaving: number,
): CushionAnalysis {
  const now = new Date();
  const currentIdx = currentMonthIndex(settings, now);

  const sortedFees = fees.slice().sort((a, b) => a.monthIndex - b.monthIndex);
  const upcoming: UpcomingFee[] = [];

  for (const fee of sortedFees) {
    // Only consider fees at or after the current month.
    if (fee.monthIndex < currentIdx) continue;

    // Projected balance at the START of the fee month (i.e., the ending
    // balance of the previous month + this month's base contribution).
    // This is what the MMF would hold just before the fee is deducted.
    const prevMonth = fee.monthIndex > 0 ? months[fee.monthIndex - 1] : null;
    const startingBalance = prevMonth
      ? prevMonth.endingBalance
      : settings.startingMMF;
    const projectedAtFee = startingBalance + settings.monthlySaving;

    const gap = fee.amount - projectedAtFee;
    const monthsAway = Math.max(1, fee.monthIndex - currentIdx);
    // Per-fee required saving to close THIS fee's gap (rounded up to nearest 10).
    const perFeeRequired = gap > 0
      ? Math.ceil(gap / monthsAway / 10) * 10
      : 0;

    let status: UpcomingFee["status"];
    if (gap <= 0) status = "covered";
    else status = "shortfall";

    const month = months[fee.monthIndex];
    upcoming.push({
      monthIndex: fee.monthIndex,
      monthLabel: month?.monthLabel ?? `Month ${fee.monthIndex}`,
      feeLabel: fee.label,
      feeAmount: fee.amount,
      monthsAway,
      projectedBalanceAtFee: projectedAtFee,
      gap: Math.max(0, gap),
      // The recommended per-month saving is the global break-even (which
      // accounts for ALL fees cumulatively), not just this single fee.
      requiredMonthlySaving: Math.max(settings.monthlySaving, globalRequiredSaving),
      status,
    });
  }

  const maxRequiredSaving = Math.max(settings.monthlySaving, globalRequiredSaving);
  const nextFee = upcoming.length > 0 ? upcoming[0] : null;

  return {
    upcomingFees: upcoming,
    nextFee,
    maxRequiredSaving,
    baseSaving: settings.monthlySaving,
    recommendedAdjustment: Math.max(0, globalRequiredSaving - settings.monthlySaving),
  };
}

/**
 * Binary-search the monthly contribution that drives the projected final
 * balance to approximately zero. The relationship is monotonic: more saving →
 * higher balance (and more interest). We bracket the root and refine.
 */
export function solveRequiredMonthlySaving(
  settings: PlannerSettings,
  fees: FeeEntry[],
): number {
  const target = 0;
  // Quick check: if default already breaks even or surplus, find the min that breaks even.
  const lowProj = buildProjectionRaw(settings, fees, 0);
  if (lowProj.finalBalance >= target) return 0; // starting buffer alone is enough

  // Upper bound: a generous saving that surely covers everything.
  // Total student funding = sum(tuition - helb) over 4 years.
  const totalStudentFunding =
    (settings.tuitionPerYear - settings.helbY1) +
    (settings.tuitionPerYear - settings.helbY2) +
    (settings.tuitionPerYear - settings.helbY3) +
    (settings.tuitionPerYear - settings.helbY4);
  // Subtract starting buffer; divide by 48 months; round up generously.
  let hi = Math.max(
    1000,
    Math.ceil((totalStudentFunding - settings.startingMMF) / TOTAL_MONTHS) + 5000,
  );
  let lo = 0;

  // Ensure hi actually reaches the target.
  let guard = 0;
  while (buildProjectionRaw(settings, fees, hi).finalBalance < target && guard < 60) {
    hi *= 2;
    guard++;
  }

  // Binary search for the smallest saving whose final balance >= 0.
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    const proj = buildProjectionRaw(settings, fees, mid);
    if (proj.finalBalance >= target) {
      hi = mid;
    } else {
      lo = mid;
    }
    if (hi - lo < 1) break;
  }
  // Round up to the nearest 10 shillings for a clean recommendation.
  return Math.ceil(hi / 10) * 10;
}

// Internal: projection that returns only what we need for the solver (no actuals).
function buildProjectionRaw(
  settings: PlannerSettings,
  fees: FeeEntry[],
  monthlySaving: number,
): { finalBalance: number; minBalance: number } {
  const feeMap = new Map<number, number>();
  for (const f of fees) feeMap.set(f.monthIndex, f.amount);
  const monthlyRate = settings.mmfAnnualReturn / 12;

  let balance = settings.startingMMF;
  let minBalance = balance;
  for (let i = 0; i < TOTAL_MONTHS; i++) {
    const withdrawal = feeMap.get(i) ?? 0;
    const available = balance + monthlySaving - withdrawal;
    const interestBase = Math.max(0, available);
    const interest = interestBase * monthlyRate;
    balance = available + interest;
    if (balance < minBalance) minBalance = balance;
  }
  return { finalBalance: balance, minBalance };
}

/**
 * Format a Kenyan shilling amount with thousands separators and a sign.
 */
export function formatKsh(amount: number, opts: { sign?: boolean } = {}): string {
  const sign = opts.sign && amount > 0 ? "+" : "";
  const neg = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.round(amount));
  return `${neg}${sign}Ksh ${abs.toLocaleString("en-KE")}`;
}

export function formatKshShort(amount: number): string {
  const neg = amount < 0 ? "-" : "";
  const abs = Math.abs(Math.round(amount));
  if (abs >= 1_000_000) return `${neg}Ksh ${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${neg}Ksh ${(abs / 1_000).toFixed(0)}K`;
  return `${neg}Ksh ${abs}`;
}

/**
 * Determine the current month index relative to the academic start.
 * Returns null if we're before the academic start, or 47+ if past.
 */
export function currentMonthIndex(
  settings: PlannerSettings,
  now: Date = new Date(),
): number {
  const startTotalMonths = settings.academicStartYear * 12 + settings.academicStartMonth;
  const nowTotalMonths = now.getFullYear() * 12 + now.getMonth();
  const idx = nowTotalMonths - startTotalMonths;
  if (idx < 0) return 0;
  if (idx >= TOTAL_MONTHS) return TOTAL_MONTHS - 1;
  return idx;
}

/**
 * Find the next upcoming fee month (>= currentMonthIndex) with a withdrawal.
 */
export function nextFeeMonth(
  months: MonthRow[],
  currentIndex: number,
): MonthRow | null {
  for (let i = currentIndex; i < months.length; i++) {
    if (months[i].isFeeMonth) return months[i];
  }
  // Look ahead from start if none found (e.g., past graduation)
  for (let i = 0; i < months.length; i++) {
    if (months[i].isFeeMonth) return months[i];
  }
  return null;
}
