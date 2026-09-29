// Financial planner — shared types

export interface PlannerSettings {
  tuitionPerYear: number;
  startingMMF: number;
  monthlySaving: number;
  mmfAnnualReturn: number; // e.g. 0.12 for 12%
  helbY1: number;
  helbY2: number;
  helbY3: number;
  helbY4: number;
  academicStartMonth: number; // 0-indexed (8 = September)
  academicStartYear: number;
  studentName: string;
  onboarded?: boolean; // flag for first-run wizard
}

export interface FeeEntry {
  monthIndex: number; // 0-47
  amount: number;
  label: string;
}

export interface MonthRow {
  monthIndex: number; // 0-47
  date: Date;
  year: number; // academic year 1-4
  calendarYear: number;
  calendarMonth: number; // 0-11
  monthLabel: string; // "Sep 2026"
  shortMonth: string; // "Sep"
  startingBalance: number;
  contribution: number;
  withdrawal: number;
  interest: number;
  endingBalance: number; // projected (may go negative to reveal deficit)
  cumulativeSaved: number;
  cumulativeInterest: number;
  cumulativeWithdrawn: number;
  isFeeMonth: boolean;
  feeLabel: string | null;
  // Cushion-adjustment recommendation for THIS month
  recommendedSaving: number; // base + cushion adjustment
  cushionAdjustment: number; // how much extra above base is recommended
  // Actual tracking
  hasActual: boolean;
  actualEndingBalance: number | null;
  actualContribution: number | null;
  actualInterest: number | null;
}

export interface YearSummary {
  year: number;
  startBalance: number;
  endBalance: number;
  totalContributions: number;
  totalInterest: number;
  totalWithdrawn: number;
  tuition: number;
  helb: number;
  studentFunding: number; // tuition - helb
  netChange: number;
}

/** Upcoming fee with its cushion analysis. */
export interface UpcomingFee {
  monthIndex: number;
  monthLabel: string;
  feeLabel: string;
  feeAmount: number;
  monthsAway: number;
  projectedBalanceAtFee: number; // balance just before the fee (at base saving)
  gap: number; // feeAmount - projectedBalanceAtFee (positive = shortfall)
  requiredMonthlySaving: number; // gap / monthsAway, rounded up to 10
  status: "covered" | "shortfall" | "surplus";
}

export interface CushionAnalysis {
  upcomingFees: UpcomingFee[]; // sorted by monthIndex, only future fees
  nextFee: UpcomingFee | null;
  /** The single highest required-saving across all upcoming fees
   *  (the binding constraint for the plan). */
  maxRequiredSaving: number;
  /** Current base monthly saving from settings. */
  baseSaving: number;
  /** Cushion adjustment = max(0, maxRequiredSaving - baseSaving). */
  recommendedAdjustment: number;
}

export interface ProjectionResult {
  months: MonthRow[];
  years: YearSummary[];
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
  totalWithdrawn: number;
  minBalance: number;
  minBalanceMonth: MonthRow | null;
  hasShortfall: boolean;
  shortfallAmount: number; // positive number = how much below zero
  shortfallMonthIndex: number | null;
  requiredMonthlySaving: number; // contribution needed to break even (~0 final)
  fundingStatus: "on-track" | "shortfall" | "surplus";
  surplusAmount: number;
  cushion: CushionAnalysis;
}

export interface ActualTransaction {
  monthIndex: number;
  actualSaving: number | null;
  actualInterest: number | null;
  actualWithdrawal: number | null;
  actualEndingBalance: number | null;
  completedAt: string | null;
  notes: string | null;
}
