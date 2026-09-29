"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Zap, Award, TrendingUp, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { currentMonthIndex } from "@/lib/planner/engine";
import type { ProjectionResult, PlannerSettings } from "@/lib/planner/types";
import { CalendarHeatmap } from "./calendar-heatmap";
import { toast } from "sonner";

/**
 * Saving streak tracker: counts consecutive completed months leading up to
 * the current month. Gamifies the saving discipline.
 */
export function StreakCard({
  projection, settings,
}: { projection: ProjectionResult; settings: PlannerSettings }) {
  const curIdx = currentMonthIndex(settings);
  const months = projection.months;

  // Count consecutive completed months ending at (but not including) the
  // current month. Walk backward from curIdx-1.
  let streak = 0;
  for (let i = curIdx - 1; i >= 0; i--) {
    if (months[i]?.hasActual) {
      streak++;
    } else {
      break;
    }
  }

  // Also count if the current month is already completed (active streak continues)
  const currentCompleted = months[curIdx]?.hasActual ?? false;
  const displayStreak = currentCompleted ? streak + 1 : streak;

  // Total completed months
  const totalCompleted = months.filter((m) => m.hasActual).length;

  // Streak level/milestone
  const level = getStreakLevel(displayStreak);
  const Icon = level.icon;
  const nextMilestone = streakMilestones.find((m) => m.count > displayStreak);

  const handleShare = async () => {
    const shareText = `I'm on a ${displayStreak}-month saving streak for my forestry degree tuition! 🔥 ${level.label} level. ${totalCompleted} month${totalCompleted !== 1 ? "s" : ""} completed total. #ForestryDegree #SavingStreak`;
    const shareData = {
      title: "Forestry Tuition Plan — Saving Streak!",
      text: shareText,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared your streak!");
      } catch {
        // user cancelled
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Copied to clipboard — paste anywhere to share!");
      } catch {
        toast.error("Could not copy — try taking a screenshot instead");
      }
    }
  };

  return (
    <Card className={cn(
      "p-4 card-shadow relative overflow-hidden",
      displayStreak > 0 && "border-primary/30",
    )}>
      {displayStreak > 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              displayStreak > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold">Saving streak</h3>
          </div>
          {totalCompleted > 0 && (
            <Badge variant="outline" className="text-[10px] tnum">
              {totalCompleted} total
            </Badge>
          )}
        </div>

        {displayStreak === 0 ? (
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <Flame className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-[11px] text-muted-foreground">
              No streak yet. Complete this month to start a streak!
            </p>
          </div>
        ) : (
          <>
            {/* Streak number */}
            <div className="flex items-baseline gap-2 mb-2">
              <motion.span
                key={displayStreak}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 12 }}
                className="text-3xl font-bold tnum text-primary"
              >
                {displayStreak}
              </motion.span>
              <span className="text-sm text-muted-foreground">
                month{displayStreak !== 1 ? "s" : ""} in a row 🔥
              </span>
            </div>

            {/* Level badge */}
            <div className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold mb-3",
              level.bg,
              level.color,
            )}>
              <Icon className="h-3 w-3" />
              {level.label}
            </div>

            {/* Next milestone */}
            {nextMilestone && (
              <div className="rounded-lg bg-muted/30 p-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Next: {nextMilestone.label}</span>
                  <span className="tnum">{displayStreak}/{nextMilestone.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (displayStreak / nextMilestone.count) * 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Encouragement */}
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {getEncouragement(displayStreak)}
            </p>

            {/* Share streak button */}
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 text-[11px] h-7"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share streak
            </Button>
          </>
        )}

        {/* Calendar heatmap — always show, even with 0 streak */}
        <div className="mt-3">
          <CalendarHeatmap months={months} currentMonthIndex={curIdx} />
        </div>
      </div>
    </Card>
  );
}

interface StreakLevel {
  threshold: number;
  label: string;
  icon: typeof Flame;
  bg: string;
  color: string;
}

const streakMilestones = [
  { count: 3, label: "3-month streak", icon: Zap },
  { count: 6, label: "6-month streak", icon: Flame },
  { count: 12, label: "1-year streak", icon: Trophy },
  { count: 24, label: "2-year streak", icon: Award },
  { count: 48, label: "Full degree streak", icon: Trophy },
];

function getStreakLevel(streak: number): StreakLevel {
  if (streak >= 48) {
    return { threshold: 48, label: "Degree Champion", icon: Trophy, bg: "bg-chart-2/20", color: "text-chart-3" };
  }
  if (streak >= 12) {
    return { threshold: 12, label: "Year Master", icon: Trophy, bg: "bg-primary/15", color: "text-primary" };
  }
  if (streak >= 6) {
    return { threshold: 6, label: "On Fire", icon: Flame, bg: "bg-chart-3/15", color: "text-chart-3" };
  }
  if (streak >= 3) {
    return { threshold: 3, label: "Getting Consistent", icon: Zap, bg: "bg-chart-2/15", color: "text-chart-3" };
  }
  return { threshold: 1, label: "Started", icon: TrendingUp, bg: "bg-primary/10", color: "text-primary" };
}

function getEncouragement(streak: number): string {
  if (streak >= 12) return "Incredible discipline! You're a saving machine. 💪";
  if (streak >= 6) return "Half a year of consistency! Keep the fire going. 🔥";
  if (streak >= 3) return "Three months strong — you're building a real habit. ⚡";
  if (streak >= 1) return "Great start! Complete next month to keep the streak alive. 🌱";
  return "Complete this month to start your streak!";
}
