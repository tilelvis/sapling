"use client";

import { Flame, Award, TrendingUp, Bell, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKshShort } from "@/lib/planner/engine";
import type { ProjectionResult, PlannerSettings } from "@/lib/planner/types";
import { currentMonthIndex } from "@/lib/planner/engine";

interface StatsRailProps {
  projection: ProjectionResult;
  settings: PlannerSettings;
  onChipClick: (id: string) => void;
}

/**
 * Horizontal scrollable row of compact stat chips: streak, achievements,
 * variance, reminders. Each chip is tappable to expand the relevant section.
 */
export function StatsRail({ projection, settings, onChipClick }: StatsRailProps) {
  const curIdx = currentMonthIndex(settings);
  const months = projection.months;

  // Streak count
  let streak = 0;
  for (let i = curIdx - 1; i >= 0; i--) {
    if (months[i]?.hasActual) streak++;
    else break;
  }
  if (months[curIdx]?.hasActual) streak++;

  // Achievements unlocked count
  const totalCompleted = months.filter((m) => m.hasActual).length;
  const totalSaved = projection.totalContributions;
  const totalInterest = projection.totalInterest;
  const achievementsUnlocked = [
    totalCompleted >= 1,
    totalCompleted >= 3,
    totalCompleted >= 12,
    totalSaved >= 100000,
    totalSaved >= 240000,
    totalInterest >= 10000,
    !projection.hasShortfall && projection.finalBalance > 0,
    projection.finalBalance >= 20000,
  ].filter(Boolean).length;

  // Reminders count (urgent only)
  const urgentReminders = projection.hasShortfall ? 1 : 0;
  const upcomingFeeCount = projection.cushion.upcomingFees.length;

  // Variance (latest)
  const completedMonths = months.filter((m) => m.hasActual);
  const latestVariance = completedMonths.length > 0
    ? (completedMonths[completedMonths.length - 1].actualEndingBalance ?? 0) -
      completedMonths[completedMonths.length - 1].endingBalance
    : null;

  const chips = [
    {
      id: "streak",
      icon: Flame,
      label: `${streak}`,
      sub: "streak",
      tone: streak > 0 ? "primary" : "muted",
    },
    {
      id: "achievements",
      icon: Award,
      label: `${achievementsUnlocked}/8`,
      sub: "badges",
      tone: achievementsUnlocked > 0 ? "gold" : "muted",
    },
    {
      id: "variance",
      icon: TrendingUp,
      label: latestVariance !== null ? formatKshShort(latestVariance) : "—",
      sub: "variance",
      tone: latestVariance === null ? "muted" : latestVariance >= 0 ? "primary" : "destructive",
    },
    {
      id: "reminders",
      icon: Bell,
      label: `${urgentReminders + upcomingFeeCount}`,
      sub: "alerts",
      tone: urgentReminders > 0 ? "destructive" : "muted",
    },
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto fancy-scroll pb-1 -mx-4 px-4">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const toneCls = {
          primary: "bg-primary/10 text-primary border-primary/20",
          gold: "bg-chart-2/15 text-chart-3 border-chart-2/30",
          destructive: "bg-destructive/10 text-destructive border-destructive/20",
          muted: "bg-muted/50 text-muted-foreground border-border/60",
        }[chip.tone];

        return (
          <button
            key={chip.id}
            onClick={() => onChipClick(chip.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 shrink-0 active:scale-95 transition-transform",
              toneCls,
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="text-[11px] font-bold tnum leading-none">{chip.label}</span>
            <span className="text-[9px] opacity-70 leading-none">{chip.sub}</span>
            <ArrowRight className="h-2.5 w-2.5 opacity-40" />
          </button>
        );
      })}
    </div>
  );
}
