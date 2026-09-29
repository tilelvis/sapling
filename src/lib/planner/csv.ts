// CSV export utilities for the 48-month plan.
import type { ProjectionResult, PlannerSettings } from "./types";
import { MONTH_NAMES_FULL } from "./engine";

/**
 * Build a CSV string of the full 48-month projection.
 * Mirrors the Excel workbook columns: month, starting, contribution,
 * withdrawal, interest, ending, cumulative saved, cumulative interest.
 */
export function projectionToCsv(
  projection: ProjectionResult,
  settings: PlannerSettings,
): string {
  const headers = [
    "Month #",
    "Calendar Month",
    "Calendar Year",
    "Academic Year",
    "Starting Balance",
    "Monthly Contribution",
    "Fee Withdrawal",
    "Interest Earned",
    "Ending Balance",
    "Cumulative Saved",
    "Cumulative Interest",
    "Cumulative Withdrawn",
    "Is Fee Month",
    "Fee Label",
  ];

  const rows = projection.months.map((m) => [
    m.monthIndex + 1,
    MONTH_NAMES_FULL[m.calendarMonth],
    m.calendarYear,
    m.year,
    Math.round(m.startingBalance),
    Math.round(m.contribution),
    Math.round(m.withdrawal),
    Math.round(m.interest),
    Math.round(m.endingBalance),
    Math.round(m.cumulativeSaved),
    Math.round(m.cumulativeInterest),
    Math.round(m.cumulativeWithdrawn),
    m.isFeeMonth ? "Yes" : "No",
    m.feeLabel ?? "",
  ]);

  // Add summary rows
  const summaryRows: (string | number)[][] = [
    [],
    ["SUMMARY"],
    ["Total Contributions", Math.round(projection.totalContributions)],
    ["Total Interest", Math.round(projection.totalInterest)],
    ["Total Withdrawn", Math.round(projection.totalWithdrawn)],
    ["Final Balance", Math.round(projection.finalBalance)],
    ["Minimum Balance", Math.round(projection.minBalance)],
    ["Has Shortfall", projection.hasShortfall ? "Yes" : "No"],
    ["Shortfall Amount", Math.round(projection.shortfallAmount)],
    ["Required Monthly Saving", Math.round(projection.requiredMonthlySaving)],
    [],
    ["ASSUMPTIONS"],
    ["Tuition per year", settings.tuitionPerYear],
    ["Starting MMF", settings.startingMMF],
    ["Monthly saving", settings.monthlySaving],
    ["MMF annual return", `${(settings.mmfAnnualReturn * 100).toFixed(1)}%`],
    ["HELB Y1", settings.helbY1],
    ["HELB Y2", settings.helbY2],
    ["HELB Y3", settings.helbY3],
    ["HELB Y4", settings.helbY4],
    ["Academic start", `${MONTH_NAMES_FULL[settings.academicStartMonth]} ${settings.academicStartYear}`],
  ];

  const allRows = [headers, ...rows, ...summaryRows];

  return allRows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          // Escape cells containing commas, quotes, or newlines
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(","),
    )
    .join("\r\n");
}

/**
 * Trigger a browser download of the CSV file.
 */
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
