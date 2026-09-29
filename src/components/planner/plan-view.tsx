"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown, ChevronUp, CircleCheck, TrendingUp, TrendingDown,
  Receipt, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatKsh, formatKshShort, currentMonthIndex } from "@/lib/planner/engine";
import type { ProjectionBundle } from "./hooks";
import { CompleteMonthSheet } from "./complete-month-sheet";
import { MetricStrip, type Metric } from "./metric-strip";
import { MonthRow } from "@/lib/planner/types";

export function PlanView({ bundle }: { bundle: ProjectionBundle }) {
  const { settings, projection } = bundle;
  const curIdx = currentMonthIndex(settings);
  const [openMonth, setOpenMonth] = useState<number | null>(null);
  const [sheetMonth, setSheetMonth] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<number | "all">("all");

  const months = useMemo(() => {
    if (yearFilter === "all") return projection.months;
    return projection.months.filter((m) => m.year === yearFilter);
  }, [projection.months, yearFilter]);

  // Compact metric strip — no cards
  const summaryMetrics: Metric[] = [
    {
      label: "Saved",
      value: formatKshShort(projection.totalContributions),
      trend: "up",
      trendValue: `${formatKshShort(settings.monthlySaving)}/mo`,
      sub: "total",
    },
    {
      label: "Interest",
      value: formatKshShort(projection.totalInterest),
      trend: "up",
      trendValue: "cushion",
      sub: `${Math.round(settings.mmfAnnualReturn * 100)}% pa`,
    },
    {
      label: "Fees out",
      value: formatKshShort(projection.totalWithdrawn),
      trend: "down",
      trendValue: `${projection.cushion.upcomingFees.length} fees`,
      sub: "total",
      negative: true,
    },
  ];

  return (
    <div className="space-y-2 slide-up-fade">
      {/* Header — compact, no card. flex-wrap so chips wrap below if needed at 390px. */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <h2 className="text-sm font-semibold whitespace-nowrap">48-Month Plan</h2>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 whitespace-nowrap">
          Sep {settings.academicStartYear} → Aug {settings.academicStartYear + 4}
        </Badge>
        <div className="flex flex-wrap gap-1 ml-auto">
          <FilterChip active={yearFilter === "all"} onClick={() => setYearFilter("all")}>
            All
          </FilterChip>
          {[1, 2, 3, 4].map((y) => (
            <FilterChip key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
              Y{y}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Summary metric strip — no cards, just plain metrics with dividers */}
      <MetricStrip metrics={summaryMetrics} />

      {/* Legend — compact, no card */}
      <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: "oklch(0.6 0.16 35)" }} />
          Fee month
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} />
          Current month
        </span>
        <span className="flex items-center gap-1">
          <CircleCheck className="h-3 w-3 text-primary" />
          Completed
        </span>
      </div>

      {/* Chart note — compact, no card */}
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground">
        <BarChart3 className="h-3 w-3 shrink-0" />
        <span>Cash flow chart: Home tab → Charts → "Cash flow"</span>
      </div>

      {/* Timeline */}
      <Card className="p-0 overflow-hidden card-shadow">
        <div className="max-h-[55vh] overflow-y-auto fancy-scroll divide-y divide-border/60">
          {months.map((m) => (
            <TimelineRow
              key={m.monthIndex}
              m={m}
              prevBalance={m.monthIndex > 0 ? projection.months[m.monthIndex - 1].endingBalance : settings.startingMMF}
              isCurrent={m.monthIndex === curIdx}
              isPast={m.monthIndex < curIdx}
              expanded={openMonth === m.monthIndex}
              onToggle={() => setOpenMonth(openMonth === m.monthIndex ? null : m.monthIndex)}
              onComplete={() => setSheetMonth(m.monthIndex)}
            />
          ))}
        </div>
      </Card>

      {sheetMonth !== null && (
        <CompleteMonthSheet
          open={sheetMonth !== null}
          onOpenChange={(b) => !b && setSheetMonth(null)}
          monthIndex={sheetMonth}
        />
      )}
    </div>
  );
}

function FilterChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-0 h-5 text-[10px] font-medium leading-none transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}

function TimelineRow({
  m, prevBalance, isCurrent, isPast, expanded, onToggle, onComplete,
}: {
  m: MonthRow;
  prevBalance: number;
  isCurrent: boolean;
  isPast: boolean;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
}) {
  const negative = m.endingBalance < 0;
  const trend = m.endingBalance >= prevBalance ? "up" : "down";
  const trendPct = prevBalance !== 0
    ? Math.abs(((m.endingBalance - prevBalance) / prevBalance) * 100)
    : 0;

  return (
    <div
      className={cn(
        "relative transition-colors",
        isCurrent && "current-row",
        m.isFeeMonth && !isCurrent && "fee-row",
      )}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-2 py-2.5 flex items-center gap-2"
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg",
            m.isFeeMonth ? "bg-chart-3/10" : "bg-muted/60",
          )}
        >
          <span className="text-[9px] font-medium text-muted-foreground leading-none">
            {m.shortMonth}
          </span>
          <span className="text-[9px] font-bold leading-none mt-0.5 text-foreground/80">
            {String(m.calendarYear).slice(-2)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[13px] font-medium truncate leading-tight">
              {m.monthLabel}
            </p>
            {m.isFeeMonth && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 h-3.5 border-chart-3/40 text-chart-3 bg-chart-3/10"
              >
                <Receipt className="h-2 w-2 mr-0.5" />FEE
              </Badge>
            )}
            {isCurrent && (
              <Badge className="text-[9px] px-1 py-0 h-3.5 bg-primary/15 text-primary border border-primary/30 pulse-ring-soft">
                NOW
              </Badge>
            )}
            {m.hasActual && (
              <CircleCheck className="h-3 w-3 text-primary shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground tnum truncate leading-tight mt-0.5">
            {m.isFeeMonth ? `-${formatKsh(m.withdrawal)} fee · ` : ""}
            +{formatKsh(m.contribution)} saved
            {m.cushionAdjustment > 0 && (
              <span className="text-destructive">
                {" · "}+{formatKsh(m.cushionAdjustment)} cushion
              </span>
            )}
          </p>
          {/* Mini trend bar */}
          <div className="mt-0.5 flex items-center gap-1">
            {trend === "up" ? (
              <TrendingUp className="h-2.5 w-2.5 text-primary" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 text-destructive" />
            )}
            <span className={cn("text-[9px] tnum leading-none", trend === "up" ? "text-primary" : "text-destructive")}>
              {trendPct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 ml-1">
          <p
            className={cn(
              "text-[13px] font-bold tnum leading-tight whitespace-nowrap",
              negative ? "text-destructive" : "text-foreground",
            )}
          >
            {formatKsh(m.endingBalance)}
          </p>
          <p className="text-[10px] text-muted-foreground leading-none">
            {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </p>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-2 pb-2.5 pt-1 space-y-2"
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Detail label="Starting balance" value={formatKsh(m.startingBalance)} />
            <Detail label="Monthly saving" value={`+${formatKsh(m.contribution)}`} positive />
            {m.isFeeMonth && (
              <Detail label="Fee withdrawal" value={`-${formatKsh(m.withdrawal)}`} negative />
            )}
            <Detail label="Interest earned" value={`+${formatKsh(Math.round(m.interest))}`} positive />
            <Detail
              label="Ending balance"
              value={formatKsh(m.endingBalance)}
              negative={m.endingBalance < 0}
              strong
            />
            <Detail
              label="Cumulative saved"
              value={formatKsh(m.cumulativeSaved)}
            />
          </div>

          {negative && (
            <div className="rounded-lg bg-destructive/10 p-2 text-[11px] text-destructive">
              <strong>Heads up:</strong> the projected balance dips below zero
              here. Your real MMF can't go negative — this means you'd need{" "}
              {formatKsh(Math.abs(m.endingBalance))} from another source.
            </div>
          )}

          {m.hasActual && m.actualEndingBalance !== null && (
            <div className="rounded-lg bg-primary/10 p-2 text-[11px]">
              <p className="font-medium text-primary">Actual recorded</p>
              <p className="tnum text-foreground mt-0.5">
                Ending balance: {formatKsh(m.actualEndingBalance)}
                {m.actualEndingBalance !== Math.round(m.endingBalance) && (
                  <span className="text-muted-foreground ml-1">
                    (planned {formatKsh(Math.round(m.endingBalance))})
                  </span>
                )}
              </p>
            </div>
          )}

          <Button
            size="sm"
            variant={m.hasActual ? "outline" : "secondary"}
            className="w-full"
            onClick={onComplete}
          >
            {m.hasActual ? "Edit this month" : "Mark month complete"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function Detail({
  label, value, positive, negative, strong,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  strong?: boolean;
}) {
  // Stacked label-above-value layout — keeps each cell narrow enough for a
  // 2-column grid at 390px without overflow. Label can truncate; value is
  // whitespace-nowrap so it stays on one line.
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-1.5 py-1 min-w-0">
      <span className="text-[9px] text-muted-foreground truncate leading-none">
        {label}
      </span>
      <span
        className={cn(
          "tnum text-[11px] leading-none whitespace-nowrap",
          strong && "font-bold",
          positive && "text-primary",
          negative && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}
