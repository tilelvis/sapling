"use client";

import { motion } from "framer-motion";
import {
  Award, Target, Flame, TrendingUp, PiggyBank, Calendar, Zap, Trophy,
  Lock, CheckCircle2, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatKsh, currentMonthIndex } from "@/lib/planner/engine";
import type { ProjectionResult, PlannerSettings } from "@/lib/planner/types";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Award;
  unlocked: boolean;
  progress?: number; // 0-100 if not unlocked
  tier: "bronze" | "silver" | "gold" | "platinum";
}

/**
 * Milestone achievements: unlock badges for hitting saving goals.
 * Derived from the projection + completed months — no extra storage needed.
 */
export function AchievementsCard({
  projection, settings,
}: { projection: ProjectionResult; settings: PlannerSettings }) {
  const curIdx = currentMonthIndex(settings);
  const months = projection.months;
  const totalCompleted = months.filter((m) => m.hasActual).length;
  const finalBalance = projection.finalBalance;
  const hasShortfall = projection.hasShortfall;
  const totalSaved = projection.totalContributions;
  const totalInterest = projection.totalInterest;

  const achievements: Achievement[] = [
    {
      id: "first-month",
      name: "First Step",
      description: "Complete your first month",
      icon: Zap,
      unlocked: totalCompleted >= 1,
      progress: Math.min(100, (totalCompleted / 1) * 100),
      tier: "bronze",
    },
    {
      id: "three-months",
      name: "Consistent",
      description: "Complete 3 months",
      icon: Flame,
      unlocked: totalCompleted >= 3,
      progress: Math.min(100, (totalCompleted / 3) * 100),
      tier: "bronze",
    },
    {
      id: "one-year",
      name: "Year One",
      description: "Complete 12 months",
      icon: Calendar,
      unlocked: totalCompleted >= 12,
      progress: Math.min(100, (totalCompleted / 12) * 100),
      tier: "silver",
    },
    {
      id: "saving-100k",
      name: "Ksh 100K Saved",
      description: "Save Ksh 100,000 total",
      icon: PiggyBank,
      unlocked: totalSaved >= 100000,
      progress: Math.min(100, (totalSaved / 100000) * 100),
      tier: "silver",
    },
    {
      id: "saving-240k",
      name: "Ksh 240K Saved",
      description: "Save Ksh 240,000 (full plan)",
      icon: Target,
      unlocked: totalSaved >= 240000,
      progress: Math.min(100, (totalSaved / 240000) * 100),
      tier: "gold",
    },
    {
      id: "interest-10k",
      name: "Interest Earner",
      description: "Earn Ksh 10,000 in MMF interest",
      icon: TrendingUp,
      unlocked: totalInterest >= 10000,
      progress: Math.min(100, (totalInterest / 10000) * 100),
      tier: "silver",
    },
    {
      id: "funded",
      name: "Fully Funded",
      description: "Reach a positive graduation balance",
      icon: Trophy,
      unlocked: !hasShortfall && finalBalance > 0,
      progress: hasShortfall
            ? Math.max(0, 100 - (projection.shortfallAmount / 50000) * 100)
            : finalBalance > 0 ? 100 : 90,
      tier: "gold",
    },
    {
      id: "cushion-master",
      name: "Cushion Master",
      description: "Project a Ksh 20,000+ surplus at graduation",
      icon: Sparkles,
      unlocked: finalBalance >= 20000,
      progress: Math.min(100, (Math.max(0, finalBalance) / 20000) * 100),
      tier: "platinum",
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Award className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Achievements</h3>
        </div>
        <Badge variant="outline" className="text-[10px] tnum">
          {unlockedCount}/{totalCount} unlocked
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Unlock badges as you hit saving milestones. {unlockedCount === 0 ? "Start by completing your first month!" : `${unlockedCount} badge${unlockedCount !== 1 ? "s" : ""} earned so far.`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {achievements.map((a, i) => {
          const Icon = a.unlocked ? a.icon : Lock;
          const tierCls = {
            bronze: "from-chart-3/30 to-chart-3/10 text-chart-3 border-chart-3/30",
            silver: "from-muted-foreground/20 to-muted-foreground/5 text-foreground border-border",
            gold: "from-chart-2/30 to-chart-2/10 text-chart-3 border-chart-2/40",
            platinum: "from-primary/25 to-primary/5 text-primary border-primary/30",
          }[a.tier];

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "rounded-lg border p-2.5 relative overflow-hidden",
                a.unlocked
                  ? `bg-gradient-to-br ${tierCls}`
                  : "bg-muted/30 border-border/60 opacity-70",
              )}
            >
              {a.unlocked && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
              )}
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md mb-1.5",
                a.unlocked ? "bg-white/30 dark:bg-black/20" : "bg-muted",
              )}>
                <Icon className={cn("h-3.5 w-3.5", !a.unlocked && "text-muted-foreground")} />
              </div>
              <p className="text-[11px] font-semibold leading-tight">{a.name}</p>
              <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                {a.description}
              </p>
              {!a.unlocked && a.progress !== undefined && a.progress > 0 && (
                <div className="mt-1.5">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.progress}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                      className="h-full bg-primary/60 rounded-full"
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground tnum mt-0.5">
                    {a.progress.toFixed(0)}%
                  </p>
                </div>
              )}
              {a.unlocked && (
                <p className="text-[8px] font-medium mt-1 opacity-80 uppercase tracking-wide">
                  ✓ {a.tier}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
