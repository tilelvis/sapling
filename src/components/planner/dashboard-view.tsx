"use client";

import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, Sparkles,
  ChevronDown, Layers, Wallet,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjection } from "./hooks";
import { useWhatIf } from "./what-if-context";
import { useApplyCushion } from "./hooks";
import {
  formatKsh, formatKshShort, currentMonthIndex, nextFeeMonth,
} from "@/lib/planner/engine";
import type { ProjectionBundle } from "./hooks";
import { WhatIfSlider } from "./what-if-slider";
import { CompleteMonthSheet } from "./complete-month-sheet";
import { CushionCard } from "./cushion-card";
import { NotificationOptIn } from "./notification-opt-in";
import { EdgeFabs } from "./edge-fabs";
import { ChartCard } from "./chart-card";
import { MetricStrip, type Metric } from "./metric-strip";
import { projectionToCsv, downloadCsv } from "@/lib/planner/csv";
import { cn } from "@/lib/utils";

export function DashboardView({ bundle }: { bundle: ProjectionBundle }) {
  const { settings, projection } = bundle;
  const { whatIfEnabled, whatIfSaving, setWhatIfEnabled, setWhatIfSaving } = useWhatIf();
  const whatIfBundle = useProjection(whatIfEnabled ? whatIfSaving : undefined);
  const effective = whatIfEnabled && whatIfBundle.data ? whatIfBundle.data.projection : projection;
  const effSettings = whatIfEnabled && whatIfBundle.data ? whatIfBundle.data.settings : settings;
  const applyCushion = useApplyCushion();

  const curIdx = currentMonthIndex(effSettings);
  const curMonth = effective.months[curIdx];
  const nextFee = nextFeeMonth(effective.months, curIdx);
  const required = effective.requiredMonthlySaving;
  const cushionAdj = effective.cushion.recommendedAdjustment;
  const totalSave = effSettings.monthlySaving + cushionAdj;
  const finalBalance = effective.finalBalance;
  const hasShortfall = effective.hasShortfall;
  const savingDelta = required - effSettings.monthlySaving;

  // Variance for the latest completed month
  const completedMonths = effective.months.filter((m) => m.hasActual);
  const latestVariance = completedMonths.length > 0
    ? (completedMonths[completedMonths.length - 1].actualEndingBalance ?? 0) -
      completedMonths[completedMonths.length - 1].endingBalance
    : null;

  // Streak count
  let streak = 0;
  for (let i = curIdx - 1; i >= 0; i--) {
    if (effective.months[i]?.hasActual) streak++;
    else break;
  }
  if (effective.months[curIdx]?.hasActual) streak++;

  // Achievements count
  const totalCompleted = effective.months.filter((m) => m.hasActual).length;
  const achievementsUnlocked = [
    totalCompleted >= 1, totalCompleted >= 3, totalCompleted >= 12,
    effective.totalContributions >= 100000, effective.totalContributions >= 240000,
    effective.totalInterest >= 10000,
    !hasShortfall && finalBalance > 0, finalBalance >= 20000,
  ].filter(Boolean).length;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string>("");

  const handleExport = () => {
    const csv = projectionToCsv(effective, effSettings);
    downloadCsv(csv, `forestry-tuition-plan-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const balanceTrend = curMonth && curMonth.interest > 0 ? "up" : "down";
  const saveTrend = cushionAdj > 0 ? "up" : "neutral";
  const gradTrend = hasShortfall ? "down" : "up";
  // Compact trend value (no "Ksh " prefix) so the metric strip fits 390px width.
  const compactKsh = (n: number) => formatKshShort(n).replace(/^(-)?Ksh\s*/, "$1");
  const balanceInterestStr = curMonth && curMonth.interest > 0
    ? `+${compactKsh(curMonth.interest)}`
    : compactKsh(curMonth?.interest ?? 0);

  // Build the compact metric strip
  const metrics: Metric[] = [
    {
      label: "Balance",
      value: formatKshShort(curMonth?.endingBalance ?? 0),
      trend: balanceTrend as "up" | "down",
      trendValue: balanceInterestStr,
      sub: curMonth?.monthLabel,
      negative: (curMonth?.endingBalance ?? 0) < 0,
    },
    {
      label: "Save/mo",
      value: formatKshShort(totalSave),
      trend: saveTrend as "up" | "neutral",
      trendValue: cushionAdj > 0 ? `+${compactKsh(cushionAdj)}` : "base",
      sub: cushionAdj > 0 ? "cushion" : "on base",
      onClick: () => setOpenSection("cushion"),
    },
    {
      label: nextFee ? "Next fee" : "Graduation",
      value: nextFee ? formatKshShort(nextFee.withdrawal) : formatKshShort(finalBalance),
      trend: nextFee ? "neutral" : (gradTrend as "up" | "down"),
      trendValue: nextFee ? `${nextFee.monthIndex - curIdx}mo` : (hasShortfall ? "shortfall" : "surplus"),
      sub: nextFee?.monthLabel ?? `Aug ${effSettings.academicStartYear + 4}`,
      negative: !nextFee && hasShortfall,
    },
  ];

  return (
    <>
      {/* Main scrolling content */}
      <div className="space-y-2 slide-up-fade">
        {/* PRIMARY METRIC STRIP — plain metrics with tiny dividers, no cards */}
        <MetricStrip metrics={metrics} />

        {/* Funding status — single compact line, no card */}
        <div className={cn(
          "flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-xs",
          hasShortfall ? "bg-destructive/8 text-destructive" : "bg-primary/8 text-primary",
        )}>
          <span className="flex items-center gap-1.5 font-medium min-w-0 truncate">
            {hasShortfall ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">
              {hasShortfall ? `Shortfall ${formatKsh(finalBalance)}` : `On track +${formatKsh(finalBalance)}`}
            </span>
          </span>
          {savingDelta > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10 shrink-0"
              onClick={() => applyCushion.mutate(totalSave)}
              disabled={applyCushion.isPending}
            >
              <Sparkles className="h-3 w-3 mr-0.5" />
              Set {formatKshShort(totalSave)}
            </Button>
          )}
        </div>

        {/* CHART CARD — restored, always visible, no accordion */}
        <ChartCard
          months={effective.months}
          years={effective.years}
          currentMonthIndex={curIdx}
          mmfReturn={effSettings.mmfAnnualReturn}
        />

        {/* Notification opt-in (only shows when permission is "default") */}
        <NotificationOptIn />

        {/* ACCORDION — only Saving plan + What-If (Charts now always visible above) */}
        <Accordion
          type="single" collapsible
          value={openSection} onValueChange={setOpenSection}
          className="space-y-2"
        >
          {/* Saving plan (3 layers) */}
          <AccordionItem value="cushion" className="border-0 rounded-xl overflow-hidden card-shadow">
            <Card className="p-0">
              <AccordionTrigger className="px-2.5 py-2.5 hover:no-underline [&>[data-slot=accordion-ico]]:hidden">
                <div className="flex items-center gap-1.5 w-full min-w-0">
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold flex-1 text-left truncate">Saving plan</span>
                  {cushionAdj > 0 && <Badge className="text-[9px] bg-destructive/15 text-destructive border border-destructive/30 shrink-0">+{formatKshShort(cushionAdj)}</Badge>}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2.5 pb-2.5">
                <CushionCard cushion={effective.cushion} />
              </AccordionContent>
            </Card>
          </AccordionItem>

          {/* What-If slider */}
          <AccordionItem value="whatif" className="border-0 rounded-xl overflow-hidden card-shadow">
            <Card className="p-0">
              <AccordionTrigger className="px-2.5 py-2.5 hover:no-underline [&>[data-slot=accordion-ico]]:hidden">
                <div className="flex items-center gap-1.5 w-full min-w-0">
                  <Sparkles className={cn("h-3.5 w-3.5 shrink-0", whatIfEnabled ? "text-chart-3" : "text-muted-foreground")} />
                  <span className="text-xs font-semibold flex-1 text-left truncate">What-If</span>
                  {whatIfEnabled && <Badge className="text-[9px] bg-chart-2/20 text-chart-3 border border-chart-2/40 shrink-0">{formatKshShort(whatIfSaving ?? 0)}</Badge>}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2.5 pb-2.5">
                <WhatIfSlider baseSaving={settings.monthlySaving} />
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        {/* Complete month — compact single line, no card */}
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-muted/40 active:bg-muted/60 transition-colors text-xs"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {curMonth?.hasActual ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> : <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className="font-medium truncate">{curMonth?.hasActual ? "Month done" : "Complete this month"}</span>
            <span className="text-muted-foreground tnum shrink-0">· {curMonth?.monthLabel}</span>
          </span>
          <span className="text-primary font-medium shrink-0">{curMonth?.hasActual ? "Edit →" : "Complete →"}</span>
        </button>
      </div>

      {/* FAB — fixed to bottom, outside the scrolling content, never folds */}
      <EdgeFabs
        currentMonthIndex={curIdx}
        onCompleteMonth={() => setSheetOpen(true)}
        onToggleWhatIf={() => {
          setWhatIfEnabled(!whatIfEnabled);
          setWhatIfSaving(effSettings.monthlySaving);
          setOpenSection("whatif");
        }}
        whatIfEnabled={whatIfEnabled}
        onExport={handleExport}
        sheetOpen={sheetOpen}
      />

      <CompleteMonthSheet open={sheetOpen} onOpenChange={setSheetOpen} monthIndex={curIdx} />
    </>
  );
}
