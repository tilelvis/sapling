"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Scale, ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatKsh, formatKshShort, MONTH_NAMES_FULL } from "@/lib/planner/engine";
import type { ProjectionResult } from "@/lib/planner/types";
import { AnimatedNumber } from "./animated-number";
import { VarianceSparkline } from "./variance-sparkline";

/**
 * Actual vs Planned variance tracking.
 * Shows completed months with their actual vs planned ending balance, plus
 * a summary of cumulative variance (ahead/behind).
 */
export function VarianceCard({ projection }: { projection: ProjectionResult }) {
  const completedMonths = projection.months.filter((m) => m.hasActual);
  const completedCount = completedMonths.length;

  if (completedCount === 0) {
    return (
      <Card className="p-4 card-shadow border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Scale className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Plan vs Actual</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Once you mark months as complete, you'll see how your actual MMF
          balance compares to what was planned.
        </p>
        <div className="rounded-lg bg-muted/40 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            No completed months yet. Go to{" "}
            <strong className="text-foreground">48 Months</strong>{" "}
            and tap a month to start tracking.
          </p>
        </div>
      </Card>
    );
  }

  // Compute cumulative variance from the first completed month
  const latest = completedMonths[completedMonths.length - 1];
  const plannedBalance = Math.round(latest.endingBalance);
  const actualBalance = latest.actualEndingBalance ?? plannedBalance;
  const variance = actualBalance - plannedBalance;
  const variancePct = plannedBalance !== 0
    ? (variance / Math.abs(plannedBalance)) * 100
    : 0;

  const isAhead = variance > 0;
  const isBehind = variance < 0;

  // Total actual saved vs planned saved
  const totalActualSaved = completedMonths.reduce(
    (s, m) => s + (m.actualContribution ?? m.contribution), 0,
  );
  const totalPlannedSaved = completedMonths.reduce((s, m) => s + m.contribution, 0);
  const savedVariance = totalActualSaved - totalPlannedSaved;

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Scale className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Plan vs Actual</h3>
        </div>
        <Badge variant="outline" className="text-[10px] tnum">
          {completedCount} month{completedCount !== 1 ? "s" : ""} tracked
        </Badge>
      </div>

      {/* Latest variance hero */}
      <div className={cn(
        "rounded-lg p-3 mb-3 border",
        isAhead ? "bg-primary/10 border-primary/20" :
        isBehind ? "bg-destructive/10 border-destructive/20" :
        "bg-muted/40 border-border",
      )}>
        <p className="text-[11px] text-muted-foreground mb-1">
          Latest variance ({latest.monthLabel})
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className={cn(
              "text-2xl font-bold tnum",
              isAhead ? "text-primary" : isBehind ? "text-destructive" : "text-foreground",
            )}>
              <AnimatedNumber value={variance} format={(n) => `${n >= 0 ? "+" : "-"}Ksh ${Math.abs(Math.round(n)).toLocaleString("en-KE")}`} />
            </p>
            <p className="text-[10px] text-muted-foreground tnum mt-0.5">
              {variancePct >= 0 ? "+" : ""}{variancePct.toFixed(1)}% vs plan
            </p>
          </div>
          <div className="text-right text-[11px]">
            <div className="flex items-center gap-1 justify-end text-muted-foreground">
              Planned <span className="tnum font-medium text-foreground">{formatKshShort(plannedBalance)}</span>
            </div>
            <div className="flex items-center gap-1 justify-end text-muted-foreground mt-0.5">
              Actual <span className={cn("tnum font-medium", isAhead ? "text-primary" : isBehind ? "text-destructive" : "text-foreground")}>
                {formatKshShort(actualBalance)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {isAhead ? (
            <>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-medium">You're ahead of plan</span>
            </>
          ) : isBehind ? (
            <>
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive font-medium">You're behind plan</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-medium">Exactly on plan</span>
            </>
          )}
        </div>
      </div>

      {/* Saved variance summary */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="rounded-md bg-muted/40 px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-muted-foreground">Planned saved</span>
          <span className="tnum font-medium">{formatKsh(totalPlannedSaved)}</span>
        </div>
        <div className="rounded-md bg-muted/40 px-2.5 py-1.5 flex items-center justify-between">
          <span className="text-muted-foreground">Actual saved</span>
          <span className={cn("tnum font-medium", savedVariance > 0 ? "text-primary" : savedVariance < 0 ? "text-destructive" : "")}>
            {formatKsh(totalActualSaved)}
          </span>
        </div>
      </div>

      {/* Variance trend sparkline (only if 2+ months tracked) */}
      {completedMonths.length >= 2 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Activity className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Variance trend</span>
          </div>
          <VarianceSparkline
            data={completedMonths.map((m) => ({
              monthLabel: m.monthLabel,
              variance: (m.actualEndingBalance ?? m.endingBalance) - m.endingBalance,
            }))}
          />
        </div>
      )}

      {/* Recent completed months mini-list */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground mb-1">Recent tracked months</p>
        {completedMonths.slice(-3).reverse().map((m) => {
          const planned = Math.round(m.endingBalance);
          const actual = m.actualEndingBalance ?? planned;
          const diff = actual - planned;
          return (
            <div
              key={m.monthIndex}
              className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-1.5"
            >
              <span className="text-xs text-muted-foreground">{m.monthLabel}</span>
              <div className="flex items-center gap-2 text-xs tnum">
                <span className="text-muted-foreground">
                  {formatKshShort(actual)}
                </span>
                {diff > 0 && (
                  <Badge className="text-[9px] bg-primary/15 text-primary border border-primary/30 h-4 px-1.5">
                    <ArrowUpRight className="h-2 w-2 mr-0.5" />{formatKshShort(diff)}
                  </Badge>
                )}
                {diff < 0 && (
                  <Badge className="text-[9px] bg-destructive/15 text-destructive border border-destructive/30 h-4 px-1.5">
                    <ArrowDownRight className="h-2 w-2 mr-0.5" />{formatKshShort(Math.abs(diff))}
                  </Badge>
                )}
                {diff === 0 && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">on plan</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
