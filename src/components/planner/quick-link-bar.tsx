"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarClock, Bell, Scale, Flame, Star, Download, Moon, Sun,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { formatKsh, formatKshShort, currentMonthIndex } from "@/lib/planner/engine";
import type { ProjectionResult, PlannerSettings, UpcomingFee } from "@/lib/planner/types";

export type QuickLinkKey = "fees" | "alerts" | "variance" | "streak" | "awards";

interface QuickLinkBarProps {
  onExport: () => void;
  projection: ProjectionResult;
  settings: PlannerSettings;
}

/**
 * Single-row inline icon bar in the header. Each section icon drops down a
 * compact card listing what that section contains — like a notification panel.
 * No separate sheet/page — just a dropdown that appears below the icon.
 */
export function QuickLinkBar({ onExport, projection, settings }: QuickLinkBarProps) {
  const [openKey, setOpenKey] = useState<QuickLinkKey | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const curIdx = currentMonthIndex(settings);
  const months = projection.months;

  // Streak count
  let streak = 0;
  for (let i = curIdx - 1; i >= 0; i--) {
    if (months[i]?.hasActual) streak++;
    else break;
  }
  if (months[curIdx]?.hasActual) streak++;

  // Achievements
  const totalCompleted = months.filter((m) => m.hasActual).length;
  const achievementsUnlocked = [
    totalCompleted >= 1, totalCompleted >= 3, totalCompleted >= 12,
    projection.totalContributions >= 100000, projection.totalContributions >= 240000,
    projection.totalInterest >= 10000,
    !projection.hasShortfall && projection.finalBalance > 0, projection.finalBalance >= 20000,
  ].filter(Boolean).length;

  // Variance
  const completedMonths = months.filter((m) => m.hasActual);
  const latestVariance = completedMonths.length > 0
    ? (completedMonths[completedMonths.length - 1].actualEndingBalance ?? 0) -
      completedMonths[completedMonths.length - 1].endingBalance
    : null;

  const feeCount = projection.cushion.upcomingFees.length;
  const alertCount = (projection.hasShortfall ? 1 : 0) + feeCount;

  return (
    <TooltipProvider delayDuration={150}>
      <div ref={barRef} className="flex items-center gap-0.5 shrink-0 relative">
        {/* Fees */}
        <DropdownLink
          icon={CalendarClock}
          label="Fees"
          badge={feeCount}
          isOpen={openKey === "fees"}
          onToggle={() => setOpenKey(openKey === "fees" ? null : "fees")}
        >
          <FeesDropdown fees={projection.cushion.upcomingFees} curIdx={curIdx} />
        </DropdownLink>

        {/* Alerts */}
        <DropdownLink
          icon={Bell}
          label="Alerts"
          badge={alertCount}
          badgeTone={alertCount > 0 ? "destructive" : "muted"}
          pulse={projection.hasShortfall}
          isOpen={openKey === "alerts"}
          onToggle={() => setOpenKey(openKey === "alerts" ? null : "alerts")}
        >
          <AlertsDropdown projection={projection} settings={settings} curIdx={curIdx} />
        </DropdownLink>

        {/* Variance */}
        <DropdownLink
          icon={Scale}
          label="Variance"
          isOpen={openKey === "variance"}
          onToggle={() => setOpenKey(openKey === "variance" ? null : "variance")}
        >
          <VarianceDropdown
            completedCount={completedMonths.length}
            latestVariance={latestVariance}
            totalSaved={projection.totalContributions}
            months={months}
          />
        </DropdownLink>

        {/* Streak */}
        <DropdownLink
          icon={Flame}
          label="Streak"
          badge={streak}
          badgeTone={streak > 0 ? "primary" : "muted"}
          isOpen={openKey === "streak"}
          onToggle={() => setOpenKey(openKey === "streak" ? null : "streak")}
        >
          <StreakDropdown streak={streak} totalCompleted={totalCompleted} months={months} curIdx={curIdx} />
        </DropdownLink>

        {/* Awards — stars */}
        <DropdownLink
          customTrigger={
            <StarsTrigger unlocked={achievementsUnlocked} total={8} />
          }
          label="Awards"
          isOpen={openKey === "awards"}
          onToggle={() => setOpenKey(openKey === "awards" ? null : "awards")}
        >
          <AwardsDropdown unlocked={achievementsUnlocked} total={8}
            totalCompleted={totalCompleted}
            totalSaved={projection.totalContributions}
            totalInterest={projection.totalInterest}
            finalBalance={projection.finalBalance}
            hasShortfall={projection.hasShortfall}
          />
        </DropdownLink>

        {/* Divider */}
        <div className="h-5 w-px bg-border/60 mx-0.5" />

        {/* Export */}
        <QuickLink icon={Download} label="Export" onClick={onExport} />
        {/* Theme */}
        <ThemeToggleCompact />
      </div>
    </TooltipProvider>
  );
}

// === Dropdown link wrapper ===
function DropdownLink({
  icon: Icon, label, badge, badgeTone = "muted", pulse, customTrigger,
  isOpen, onToggle, children,
}: {
  icon?: typeof CalendarClock;
  label: string;
  badge?: number;
  badgeTone?: "destructive" | "primary" | "muted";
  pulse?: boolean;
  customTrigger?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const showBadge = badge !== undefined && badge > 0;
  const badgeCls = {
    destructive: "bg-destructive text-destructive-foreground",
    primary: "bg-primary text-primary-foreground",
    muted: "bg-muted-foreground text-background",
  }[badgeTone];
  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-90 transition-all",
              pulse && "pulse-ring",
              isOpen && "bg-muted/60 text-foreground",
            )}
            aria-label={label}
          >
            {customTrigger ?? <Icon className="h-3.5 w-3.5" />}
            {Icon && showBadge && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 min-w-3 h-3 px-0.5 rounded-full text-[7px] font-bold flex items-center justify-center tnum leading-none",
                badgeCls,
              )}>
                {badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
      </Tooltip>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border/60 bg-popover shadow-lg card-shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
            <span className="text-xs font-semibold">{label}</span>
            <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto fancy-scroll">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: typeof Download; label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-90 transition-all"
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
    </Tooltip>
  );
}

// === Stars trigger ===
function StarsTrigger({ unlocked, total }: { unlocked: number; total: number }) {
  const starsTotal = 4;
  const starsFilled = Math.min(starsTotal, Math.ceil((unlocked / total) * starsTotal));
  return (
    <div className="flex items-center gap-0.5 px-0.5">
      {Array.from({ length: starsTotal }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < starsFilled ? "fill-chart-2 text-chart-2" : "fill-none text-muted-foreground/30",
          )}
        />
      ))}
      <span className="text-[9px] font-semibold tnum ml-0.5">{unlocked}</span>
    </div>
  );
}

// === Fees dropdown ===
function FeesDropdown({ fees, curIdx }: { fees: UpcomingFee[]; curIdx: number }) {
  if (fees.length === 0) {
    return <EmptyDropdown msg="No upcoming fees. 🎓" />;
  }
  return (
    <div className="divide-y divide-border/40">
      {fees.map((f) => {
        const monthsAway = Math.max(0, f.monthIndex - curIdx);
        return (
          <div key={f.monthIndex} className={cn("px-3 py-2", f.status === "shortfall" && "bg-destructive/5")}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium truncate">{f.feeLabel}</span>
              <span className={cn("text-[11px] font-bold tnum shrink-0", f.gap > 0 ? "text-destructive" : "text-foreground")}>
                {formatKshShort(f.feeAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] text-muted-foreground">{f.monthLabel} · {monthsAway}mo</span>
              {f.gap > 0 ? (
                <span className="text-[9px] text-destructive flex items-center gap-0.5">
                  <AlertTriangle className="h-2 w-2" /> {formatKshShort(f.gap)} gap
                </span>
              ) : (
                <span className="text-[9px] text-primary flex items-center gap-0.5">
                  <CheckCircle2 className="h-2 w-2" /> covered
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === Alerts dropdown ===
function AlertsDropdown({ projection, settings, curIdx }: { projection: ProjectionResult; settings: PlannerSettings; curIdx: number }) {
  const reminders: { title: string; detail: string; priority: "urgent" | "warning" | "info"; icon: typeof Bell }[] = [];

  // Monthly saving
  const curMonth = projection.months[curIdx];
  if (curMonth) {
    reminders.push({
      title: `Save ${formatKsh(settings.monthlySaving)} this month`,
      detail: curMonth.monthLabel,
      priority: "info",
      icon: Bell,
    });
  }

  // Fee alerts
  for (const fee of projection.cushion.upcomingFees) {
    const monthsAway = fee.monthsAway;
    if (monthsAway <= 3) {
      reminders.push({
        title: `${fee.feeLabel} due in ${monthsAway}mo`,
        detail: `${formatKsh(fee.feeAmount)} · ${fee.gap > 0 ? `${formatKshShort(fee.gap)} gap` : "covered"}`,
        priority: "urgent",
        icon: CalendarClock,
      });
    } else if (monthsAway <= 6) {
      reminders.push({
        title: `${fee.feeLabel} in ${monthsAway}mo`,
        detail: `${formatKsh(fee.feeAmount)} · ${fee.monthLabel}`,
        priority: "warning",
        icon: CalendarClock,
      });
    }
  }

  // Shortfall
  if (projection.hasShortfall && projection.minBalanceMonth) {
    reminders.push({
      title: `Balance goes negative in ${projection.minBalanceMonth.monthLabel}`,
      detail: `Deficit ${formatKsh(Math.round(projection.shortfallAmount))} · save ${formatKsh(projection.requiredMonthlySaving)}/mo`,
      priority: "urgent",
      icon: AlertTriangle,
    });
  }

  if (reminders.length === 0) {
    return <EmptyDropdown msg="No active alerts. You're all caught up! 🎉" />;
  }

  const order = { urgent: 0, warning: 1, info: 2 };
  reminders.sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <div className="divide-y divide-border/40">
      {reminders.map((r, i) => {
        const Icon = r.icon;
        const toneCls = {
          urgent: "bg-destructive/5 text-destructive",
          warning: "bg-chart-3/5 text-chart-3",
          info: "bg-primary/5 text-primary",
        }[r.priority];
        return (
          <div key={i} className={cn("px-3 py-2 flex items-start gap-2", toneCls)}>
            <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-tight">{r.title}</p>
              <p className="text-[9px] opacity-80 mt-0.5 leading-tight">{r.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === Variance dropdown ===
function VarianceDropdown({
  completedCount, latestVariance, totalSaved, months,
}: {
  completedCount: number;
  latestVariance: number | null;
  totalSaved: number;
  months: import("@/lib/planner/types").MonthRow[];
}) {
  if (completedCount === 0) {
    return <EmptyDropdown msg="No tracked months yet. Complete a month to see variance." />;
  }
  const recent = months.filter((m) => m.hasActual).slice(-5).reverse();
  return (
    <div className="divide-y divide-border/40">
      <div className="px-3 py-2 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Latest variance</span>
          <span className={cn("text-sm font-bold tnum", latestVariance !== null && latestVariance >= 0 ? "text-primary" : "text-destructive")}>
            {latestVariance !== null ? `${latestVariance >= 0 ? "+" : ""}${formatKshShort(latestVariance)}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">{completedCount} tracked · {formatKshShort(totalSaved)} saved</span>
        </div>
      </div>
      {recent.map((m) => {
        const planned = Math.round(m.endingBalance);
        const actual = m.actualEndingBalance ?? planned;
        const diff = actual - planned;
        return (
          <div key={m.monthIndex} className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{m.monthLabel}</span>
            <div className="flex items-center gap-2 text-[10px] tnum">
              <span className="text-muted-foreground">{formatKshShort(actual)}</span>
              {diff > 0 && <span className="text-primary flex items-center gap-0.5"><TrendingUp className="h-2 w-2" />{formatKshShort(diff)}</span>}
              {diff < 0 && <span className="text-destructive flex items-center gap-0.5"><TrendingDown className="h-2 w-2" />{formatKshShort(Math.abs(diff))}</span>}
              {diff === 0 && <span className="text-muted-foreground">on plan</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === Streak dropdown ===
function StreakDropdown({ streak, totalCompleted, months, curIdx }: { streak: number; totalCompleted: number; months: import("@/lib/planner/types").MonthRow[]; curIdx: number }) {
  const level = streak >= 12 ? "Year Master" : streak >= 6 ? "On Fire" : streak >= 3 ? "Consistent" : streak >= 1 ? "Started" : "—";
  return (
    <div className="divide-y divide-border/40">
      <div className="px-3 py-2 bg-primary/5 text-center">
        <p className="text-2xl font-bold tnum text-primary leading-none">{streak}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">month{streak !== 1 ? "s" : ""} in a row 🔥</p>
        {streak > 0 && <p className="text-[9px] font-medium text-primary mt-1">{level}</p>}
      </div>
      <div className="px-3 py-2">
        <p className="text-[9px] text-muted-foreground mb-1.5">{totalCompleted} total completed</p>
        {/* Mini heatmap — 4 rows × 12 cols */}
        <div className="space-y-0.5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-12 gap-0.5">
              {months.slice(row * 12, row * 12 + 12).map((m) => (
                <div
                  key={m.monthIndex}
                  title={m.monthLabel}
                  className={cn(
                    "h-2.5 rounded-sm",
                    m.hasActual && "bg-primary",
                    !m.hasActual && m.monthIndex === curIdx && "border border-primary bg-primary/10",
                    !m.hasActual && m.monthIndex < curIdx && "bg-muted-foreground/15",
                    !m.hasActual && m.monthIndex > curIdx && "bg-muted-foreground/8",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Awards dropdown ===
function AwardsDropdown({
  unlocked, total, totalCompleted, totalSaved, totalInterest, finalBalance, hasShortfall,
}: {
  unlocked: number; total: number;
  totalCompleted: number; totalSaved: number; totalInterest: number;
  finalBalance: number; hasShortfall: boolean;
}) {
  const badges = [
    { name: "First Step", desc: "Complete 1 month", done: totalCompleted >= 1 },
    { name: "Consistent", desc: "Complete 3 months", done: totalCompleted >= 3 },
    { name: "Year One", desc: "Complete 12 months", done: totalCompleted >= 12 },
    { name: "Ksh 100K", desc: "Save 100,000", done: totalSaved >= 100000 },
    { name: "Ksh 240K", desc: "Save 240,000", done: totalSaved >= 240000 },
    { name: "Interest", desc: "Earn 10,000 interest", done: totalInterest >= 10000 },
    { name: "Funded", desc: "Positive graduation", done: !hasShortfall && finalBalance > 0 },
    { name: "Cushion", desc: "20K+ surplus", done: finalBalance >= 20000 },
  ];
  return (
    <div className="divide-y divide-border/40">
      <div className="px-3 py-2 bg-chart-2/5 text-center">
        <p className="text-lg font-bold tnum text-chart-3 leading-none">{unlocked}/{total}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">badges unlocked</p>
      </div>
      {badges.map((b) => (
        <div key={b.name} className={cn("px-3 py-1.5 flex items-center gap-2", !b.done && "opacity-50")}>
          <div className={cn("flex h-5 w-5 items-center justify-center rounded-full shrink-0",
            b.done ? "bg-chart-2/20 text-chart-3" : "bg-muted text-muted-foreground")}>
            {b.done ? <CheckCircle2 className="h-3 w-3" /> : <Star className="h-2.5 w-2.5 fill-none" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium leading-tight">{b.name}</p>
            <p className="text-[8px] text-muted-foreground leading-tight">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyDropdown({ msg }: { msg: string }) {
  return (
    <div className="px-3 py-6 text-center">
      <p className="text-[10px] text-muted-foreground">{msg}</p>
    </div>
  );
}

// === Theme toggle ===
function ThemeToggleCompact() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground" aria-label="Toggle theme">
        <Sun className="h-3.5 w-3.5" />
      </button>
    );
  }
  const isDark = (resolvedTheme ?? theme) === "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-90 transition-all"
          aria-label={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">
        {isDark ? "Light" : "Dark"}
      </TooltipContent>
    </Tooltip>
  );
}
