"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MonthRow } from "@/lib/planner/types";
import { MONTH_NAMES } from "@/lib/planner/engine";

/**
 * Calendar heatmap of completed months. Renders a 4-row × 12-column grid
 * (one row per academic year) where each cell is a month. Completed months
 * are filled green, the current month is outlined, and future months are
 * dimmed.
 */
export function CalendarHeatmap({
  months, currentMonthIndex,
}: {
  months: MonthRow[];
  currentMonthIndex: number;
}) {
  // Group months into 4 rows of 12 (one row per academic year)
  const rows = [
    months.slice(0, 12),
    months.slice(12, 24),
    months.slice(24, 36),
    months.slice(36, 48),
  ];

  return (
    <div className="rounded-lg bg-muted/20 p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">
          48-month calendar
        </span>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <span className="h-2 w-2 rounded-sm bg-primary" />
            done
          </span>
          <span className="flex items-center gap-0.5">
            <span className="h-2 w-2 rounded-sm border border-primary" />
            now
          </span>
          <span className="flex items-center gap-0.5">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/30" />
            future
          </span>
        </div>
      </div>
      {/* Month header (Sep-Oct-Nov-...-Aug) */}
      <div className="grid grid-cols-12 gap-0.5 mb-0.5">
        {rows[0].map((m) => (
          <div
            key={`h-${m.monthIndex}`}
            className="text-[7px] text-center text-muted-foreground/70 font-medium"
          >
            {m.shortMonth[0]}
          </div>
        ))}
      </div>
      {/* 4 rows × 12 cols */}
      <div className="space-y-0.5">
        {rows.map((row, yearIdx) => (
          <div key={yearIdx} className="grid grid-cols-12 gap-0.5">
            {row.map((m) => {
              const isCompleted = m.hasActual;
              const isCurrent = m.monthIndex === currentMonthIndex;
              const isPast = m.monthIndex < currentMonthIndex;
              const isFuture = m.monthIndex > currentMonthIndex;
              const isFeeMonth = m.isFeeMonth;

              return (
                <motion.div
                  key={m.monthIndex}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: m.monthIndex * 0.005, duration: 0.2 }}
                  title={`${m.monthLabel} · ${m.hasActual ? "Completed" : isFuture ? "Upcoming" : "Not tracked"}${m.isFeeMonth ? " · Fee month" : ""}`}
                  className={cn(
                    "h-4 rounded-sm relative",
                    isCompleted && "bg-primary",
                    !isCompleted && isCurrent && "border-2 border-primary bg-primary/10",
                    !isCompleted && isPast && !isCurrent && "bg-muted-foreground/15",
                    !isCompleted && isFuture && !isCurrent && "bg-muted-foreground/8",
                    isFeeMonth && "ring-1 ring-inset ring-chart-3/50",
                  )}
                >
                  {isFeeMonth && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-0.5 w-0.5 rounded-full bg-chart-3/80" />
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Year labels */}
      <div className="flex justify-between mt-1 text-[8px] text-muted-foreground/70">
        <span>Year 1</span>
        <span>Year 2</span>
        <span>Year 3</span>
        <span>Year 4</span>
      </div>
    </div>
  );
}
