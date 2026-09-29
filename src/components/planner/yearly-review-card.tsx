"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Calendar, Wallet, Sparkles, Award, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatKsh, formatKshShort } from "@/lib/planner/engine";
import type { YearSummary } from "@/lib/planner/types";

/**
 * Yearly review card: a visual year-over-year progress summary.
 * Shows how the MMF balance grew (or shrank) each year, the funding
 * progress per year, and highlights the best/worst year.
 */
export function YearlyReviewCard({ years }: { years: YearSummary[] }) {
  if (years.length === 0) return null;

  // Find the best year (highest net change) and worst year (lowest net change)
  const netChanges = years.map((y) => ({ year: y.year, net: y.netChange }));
  const bestYear = netChanges.reduce((a, b) => (a.net > b.net ? a : b));
  const worstYear = netChanges.reduce((a, b) => (a.net < b.net ? a : b));

  // Total funding progress: cumulative saved vs cumulative needed
  const totalFunded = years.reduce((s, y) => s + y.totalContributions, 0);
  const totalNeeded = years.reduce((s, y) => s + Math.max(0, y.studentFunding), 0);
  const overallProgress = totalNeeded > 0 ? (totalFunded / totalNeeded) * 100 : 100;

  // Year-over-year balance trajectory
  const startBalance = years[0].startBalance;
  const endBalance = years[years.length - 1].endBalance;
  const totalGrowth = endBalance - startBalance;
  const isGrowth = totalGrowth >= 0;

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Award className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Yearly review</h3>
        </div>
        <Badge variant="outline" className="text-[10px] tnum">
          {overallProgress.toFixed(0)}% funded
        </Badge>
      </div>

      {/* Overall progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
          <span>Saved vs needed (all years)</span>
          <span className="tnum">
            {formatKshShort(totalFunded)} / {formatKshShort(totalNeeded)}
          </span>
        </div>
        <Progress
          value={Math.min(100, overallProgress)}
          className="h-2.5 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-primary [&>[data-slot=progress-indicator]]:to-chart-2"
        />
      </div>

      {/* Year-over-year trajectory */}
      <div className="rounded-lg bg-muted/40 p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Balance trajectory</p>
            <p className="text-xs text-muted-foreground tnum mt-0.5">
              {formatKshShort(startBalance)} → {formatKshShort(endBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Net change</p>
            <p className={cn(
              "text-sm font-bold tnum flex items-center gap-0.5 justify-end",
              isGrowth ? "text-primary" : "text-destructive",
            )}>
              {isGrowth ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {formatKsh(Math.abs(Math.round(totalGrowth)))}
            </p>
          </div>
        </div>
      </div>

      {/* Per-year mini bars */}
      <div className="space-y-2">
        {years.map((y) => {
          const fundingNeeded = Math.max(0, y.studentFunding);
          const funded = y.totalContributions;
          const pct = fundingNeeded > 0 ? Math.min(100, (funded / fundingNeeded) * 100) : 100;
          const isBest = y.year === bestYear.year;
          const isWorst = y.year === worstYear.year && bestYear.year !== worstYear.year;
          const netPositive = y.netChange >= 0;

          return (
            <motion.div
              key={y.year}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: y.year * 0.05 }}
              className={cn(
                "rounded-lg border p-2",
                isBest ? "border-primary/30 bg-primary/5" :
                isWorst ? "border-destructive/30 bg-destructive/5" :
                "border-border/60 bg-muted/20",
              )}
            >
              {/* Line 1: Year + badge (left) | net change (right) */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-semibold shrink-0">Year {y.year}</span>
                  {isBest && (
                    <Badge className="text-[9px] h-4 px-1 bg-primary/15 text-primary border border-primary/30 shrink-0">
                      <Award className="h-2 w-2 mr-0.5" />Best
                    </Badge>
                  )}
                  {isWorst && (
                    <Badge className="text-[9px] h-4 px-1 bg-destructive/15 text-destructive border border-destructive/30 shrink-0">
                      Tightest
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold tnum flex items-center gap-0.5 shrink-0",
                  netPositive ? "text-primary" : "text-destructive",
                )}>
                  {netPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {formatKshShort(Math.abs(Math.round(y.netChange)))}
                </span>
              </div>
              {/* Line 2: balance trajectory (full width, no crowding) */}
              <p className="text-[10px] text-muted-foreground tnum mb-1.5">
                {formatKshShort(y.startBalance)} → {formatKshShort(y.endBalance)}
              </p>
              {/* Line 3: funding progress */}
              <div className="flex items-center gap-2">
                <Progress
                  value={pct}
                  className={cn(
                    "h-1.5 flex-1",
                    pct >= 100 ? "[&>div]:bg-primary" : "[&>div]:bg-chart-3",
                  )}
                />
                <span className="text-[9px] text-muted-foreground tnum w-8 text-right shrink-0">
                  {pct.toFixed(0)}%
                </span>
              </div>
              {/* Line 4: saved vs needed */}
              <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5 min-w-0">
                  <Wallet className="h-2 w-2 shrink-0" />
                  <span className="truncate">{formatKshShort(funded)} saved</span>
                </span>
                <span className="shrink-0 ml-1">
                  {fundingNeeded > 0 ? `${formatKshShort(fundingNeeded)} needed` : "HELB covers"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary insight */}
      <div className="mt-3 rounded-lg bg-accent/10 border border-accent/20 p-2.5 flex items-start gap-1.5">
        <Sparkles className="h-3 w-3 text-accent-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-accent-foreground leading-relaxed">
          {isGrowth
            ? `Your MMF is projected to grow by ${formatKsh(Math.round(totalGrowth))} over 4 years. Best year: Year ${bestYear.year} (+${formatKshShort(Math.round(bestYear.net))}).`
            : `Your MMF is projected to change by ${formatKsh(Math.round(totalGrowth))} over 4 years. Tightest year: Year ${worstYear.year} (${formatKshShort(Math.round(worstYear.net))}).`}
        </p>
      </div>
    </Card>
  );
}
