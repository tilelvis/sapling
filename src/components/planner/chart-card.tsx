"use client";

import { useState } from "react";
import { BarChart3, AreaChart, CalendarRange } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ProjectionChart } from "./projection-chart";
import { MonthlyContributionsChart } from "./monthly-contributions-chart";
import { AnnualSummaryChart } from "./annual-summary-chart";
import type { MonthRow, YearSummary } from "@/lib/planner/types";

type ChartType = "balance" | "cashflow" | "annual";

const CHART_OPTIONS: { value: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { value: "balance", label: "Balance", icon: AreaChart },
  { value: "cashflow", label: "Cash flow", icon: BarChart3 },
  { value: "annual", label: "Annual", icon: CalendarRange },
];

interface ChartCardProps {
  months: MonthRow[];
  years: YearSummary[];
  currentMonthIndex: number;
  mmfReturn: number;
}

/**
 * Consolidated chart card. One card, one dropdown in the corner to switch
 * between the three main charts: Balance (area), Cash flow (bars), Annual
 * (year-by-year bars). Saves vertical space — no more 3 separate chart cards.
 */
export function ChartCard({ months, years, currentMonthIndex, mmfReturn }: ChartCardProps) {
  const [chart, setChart] = useState<ChartType>("balance");
  const option = CHART_OPTIONS.find((o) => o.value === chart)!;

  return (
    <Card className="p-2.5 card-shadow overflow-hidden">
      {/* Header row: title + dropdown selector */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <option.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold truncate">
            {chart === "balance" && "MMF balance · 48 months"}
            {chart === "cashflow" && "Monthly cash flow"}
            {chart === "annual" && "Annual breakdown"}
          </span>
        </div>
        <Select value={chart} onValueChange={(v) => setChart(v as ChartType)}>
          <SelectTrigger size="sm" className="h-7 w-[96px] text-[11px] gap-1 px-2 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_OPTIONS.map((o) => {
              const Icon = o.icon;
              return (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3" />
                    {o.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* The selected chart */}
      <div className="mt-1">
        {chart === "balance" && (
          <>
            <ProjectionChart months={months} currentMonthIndex={currentMonthIndex} />
            <p className="mt-1 text-[10px] text-muted-foreground leading-tight">
              Dots show fee months (Sep &amp; Apr). Line dips below zero to warn you early.
            </p>
          </>
        )}
        {chart === "cashflow" && (
          <>
            <MonthlyContributionsChart months={months} currentMonthIndex={currentMonthIndex} />
            <div className="mt-1 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm" style={{ background: "oklch(0.5 0.13 150 / 0.75)" }} />
                Saving months
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm" style={{ background: "oklch(0.6 0.16 35 / 0.85)" }} />
                Fee months
              </span>
            </div>
          </>
        )}
        {chart === "annual" && (
          <>
            <AnnualSummaryChart years={years} />
            <p className="mt-1 text-[10px] text-muted-foreground leading-tight">
              Each year shows what you save, the interest earned as a cushion, and the fees going out.
            </p>
          </>
        )}
      </div>

      {/* Footer: return badge */}
      {chart !== "annual" && (
        <div className="mt-1.5 flex items-center justify-between">
          <Badge variant="outline" className="text-[9px]">
            {Math.round(mmfReturn * 100)}% planning return
          </Badge>
          <span className="text-[9px] text-muted-foreground">
            {chart === "balance" ? "Projected MMF" : chart === "cashflow" ? "Per month" : ""}
          </span>
        </div>
      )}
    </Card>
  );
}
