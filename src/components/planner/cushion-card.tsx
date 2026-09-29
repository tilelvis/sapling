"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, ArrowUp, ArrowRight, CheckCircle2, CalendarClock, TrendingUp, Info, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/planner/engine";
import type { CushionAnalysis, UpcomingFee } from "@/lib/planner/types";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import { AnimatedNumber } from "./animated-number";
import { useApplyCushion } from "./hooks";

export function CushionCard({ cushion }: { cushion: CushionAnalysis }) {
  const { baseSaving, maxRequiredSaving, recommendedAdjustment, nextFee, upcomingFees } = cushion;
  const total = baseSaving + recommendedAdjustment;
  const hasAdjustment = recommendedAdjustment > 0;
  const applyCushion = useApplyCushion();

  return (
    <Card className="p-3 border-primary/20 card-shadow hero-gradient overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-semibold truncate">Your saving plan</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground shrink-0">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px]">
                <p className="text-xs">
                  Three layers: (1) your base monthly saving, (2) a cushion
                  adjustment the app recommends so you reach every fee on time,
                  and (3) MMF interest as a bonus — never relied upon.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* The three layers breakdown */}
        <div className="space-y-1.5">
          <Layer
            label="① Base saving"
            value={formatKsh(baseSaving)}
            sub="Your normal monthly target"
            color="primary"
          />
          {hasAdjustment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Layer
                        label="② Cushion adjustment"
                        value={`+${formatKsh(recommendedAdjustment)}`}
                        sub={`Needed to reach all fees on time`}
                        color="destructive"
                        warning
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px]">
                    <p className="text-xs">
                      <strong>How we calculate this:</strong> We look at every
                      upcoming fee, find the largest gap between the fee and your
                      projected balance, and divide by the months remaining. The
                      break-even saving is the amount that brings your final
                      balance to ~zero.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          )}
          <div className="h-px bg-border my-1" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Save this month</span>
            <span className="text-lg font-bold tnum text-primary truncate">
              <AnimatedNumber value={total} format={(n) => formatKsh(Math.round(n))} />
              <span className="text-xs font-normal text-muted-foreground">/month</span>
            </span>
          </div>
          {!hasAdjustment && (
            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-lg p-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>On track — your base saving covers all fees.</span>
            </div>
          )}
          {hasAdjustment && (
            <Button
              size="sm"
              className="w-full mt-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              variant="secondary"
              onClick={() => applyCushion.mutate(total)}
              disabled={applyCushion.isPending}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {applyCushion.isPending
                ? "Updating…"
                : `Set saving to ${formatKsh(total)}/month`}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Layer({
  label, value, sub, color, warning,
}: {
  label: string;
  value: string;
  sub: string;
  color: "primary" | "destructive";
  warning?: boolean;
}) {
  const colorCls = color === "primary" ? "text-primary" : "text-destructive";
  return (
    <div className={cn(
      "flex items-center justify-between rounded-lg px-2.5 py-1.5 gap-2",
      warning ? "bg-destructive/5 border border-destructive/20" : "bg-muted/50",
    )}>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
      </div>
      <span className={cn("text-sm font-bold tnum shrink-0", colorCls)}>
        {value}
      </span>
    </div>
  );
}

/** Compact list of upcoming fees with their required saving. */
export function UpcomingFeesCard({ cushion }: { cushion: CushionAnalysis }) {
  const { upcomingFees } = cushion;
  if (upcomingFees.length === 0) {
    return (
      <Card className="p-4 card-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Upcoming fees</h3>
        </div>
        <p className="text-sm text-muted-foreground">No more fees scheduled. 🎓</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">Upcoming fees & required saving</h3>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto fancy-scroll">
        <AnimatePresence>
          {upcomingFees.map((fee) => (
            <UpcomingFeeRow key={fee.monthIndex} fee={fee} baseSaving={cushion.baseSaving} />
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function UpcomingFeeRow({ fee, baseSaving }: { fee: UpcomingFee; baseSaving: number }) {
  const isCovered = fee.status === "covered";
  const needsMore = fee.requiredMonthlySaving > baseSaving;
  const readinessPct = fee.feeAmount > 0
    ? Math.min(100, (fee.projectedBalanceAtFee / fee.feeAmount) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "rounded-lg border p-2.5",
        isCovered
          ? "border-primary/30 bg-primary/5"
          : "border-destructive/30 bg-destructive/5",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{fee.feeLabel}</p>
          <p className="text-[10px] text-muted-foreground">
            {fee.monthLabel} · {fee.monthsAway} months away
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-bold tnum text-destructive">{formatKsh(fee.feeAmount)}</p>
          <p className="text-[10px] text-muted-foreground tnum">
            of {formatKsh(fee.projectedBalanceAtFee)} projected
          </p>
        </div>
      </div>
      <Progress
        value={readinessPct}
        className={`h-1.5 ${isCovered ? "[&>div]:bg-primary" : "[&>div]:bg-destructive"}`}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {isCovered ? (
            <span className="text-primary flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Covered
            </span>
          ) : (
            <span className="text-destructive flex items-center gap-1">
              <ArrowUp className="h-2.5 w-2.5" /> {formatKsh(fee.gap)} short
            </span>
          )}
        </span>
        {needsMore ? (
          <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive bg-destructive/5 tnum">
            Save {formatKsh(fee.requiredMonthlySaving)}/mo
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] border-primary/40 text-primary bg-primary/5">
            <ArrowRight className="h-2 w-2 mr-0.5" /> Base covers
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
