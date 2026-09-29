"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt, BarChart3, Download,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatKsh, formatKshShort, MONTH_NAMES_FULL } from "@/lib/planner/engine";
import type { ProjectionBundle } from "./hooks";
import type { YearSummary } from "@/lib/planner/types";
import { MetricStrip, type Metric } from "./metric-strip";
import { projectionToCsv, downloadCsv } from "@/lib/planner/csv";

export function FeePlanView({ bundle }: { bundle: ProjectionBundle }) {
  const { settings, projection } = bundle;
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const totalTuition = settings.tuitionPerYear * 4;
  const totalHelb = settings.helbY1 + settings.helbY2 + settings.helbY3 + settings.helbY4;
  const totalStudentFunding = totalTuition - totalHelb;

  const handleExport = () => {
    const csv = projectionToCsv(projection, settings);
    downloadCsv(csv, `forestry-tuition-plan-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Compact metric strips — no cards
  const topMetrics: Metric[] = [
    {
      label: "Tuition/yr",
      value: formatKshShort(settings.tuitionPerYear),
      sub: `${formatKshShort(totalTuition)} total`,
    },
    {
      label: "HELB total",
      value: formatKshShort(totalHelb),
      trend: "up",
      trendValue: "loan",
      sub: `${formatKshShort(totalStudentFunding)} you fund`,
      negative: totalStudentFunding > 0,
    },
    {
      label: "Graduation",
      value: formatKshShort(projection.finalBalance),
      trend: projection.finalBalance >= 0 ? "up" : "down",
      trendValue: projection.hasShortfall ? "shortfall" : "surplus",
      sub: `Aug ${settings.academicStartYear + 4}`,
      negative: projection.finalBalance < 0,
    },
  ];

  const savingsMetrics: Metric[] = [
    {
      label: "You'll save",
      value: formatKshShort(projection.totalContributions),
      sub: `${formatKshShort(settings.monthlySaving)}/mo`,
    },
    {
      label: "Interest",
      value: formatKshShort(projection.totalInterest),
      trend: "up",
      trendValue: "cushion",
      sub: `${Math.round(settings.mmfAnnualReturn * 100)}% pa`,
    },
    {
      label: "Start MMF",
      value: formatKshShort(settings.startingMMF),
      sub: "buffer",
    },
  ];

  const feeMonths = projection.months.filter((m) => m.isFeeMonth);

  return (
    <div className="space-y-3 slide-up-fade">
      {/* Header — compact, no card */}
      <div className="flex items-center gap-2 px-1">
        <GraduationCap className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Fee plan</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Sep {settings.academicStartYear} → Aug {settings.academicStartYear + 4}
        </span>
      </div>

      {/* Top metric strip */}
      <MetricStrip metrics={topMetrics} />

      {/* Savings breakdown strip */}
      <MetricStrip metrics={savingsMetrics} />

      {/* Chart note */}
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground">
        <BarChart3 className="h-3 w-3 shrink-0" />
        <span>Annual chart: Home → Charts → "Annual"</span>
      </div>

      {/* YEARS — flat strip with dividers, tap to open carousel popup */}
      <div className="border-y border-border/60">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground px-2 pt-2 pb-1 font-medium">
          Academic years · tap for details
        </p>
        <div className="grid grid-cols-4 divide-x divide-border/60">
          {projection.years.map((y) => {
            const fundingNeeded = Math.max(0, y.studentFunding);
            const funded = y.totalContributions >= fundingNeeded && fundingNeeded > 0;
            const credit = y.helb > y.tuition;
            return (
              <button
                key={y.year}
                onClick={() => setSelectedYear(y.year - 1)}
                className="px-1.5 py-2 text-center active:bg-muted/40 transition-colors"
              >
                <p className="text-[9px] text-muted-foreground leading-none">Year</p>
                <p className="text-base font-bold leading-none mt-0.5">{y.year}</p>
                <p className={cn(
                  "text-[10px] font-semibold tnum mt-1 leading-none",
                  y.endBalance < 0 ? "text-destructive" : "text-foreground",
                )}>
                  {formatKshShort(y.endBalance)}
                </p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {credit ? (
                    <span className="text-[8px] text-primary">surplus</span>
                  ) : funded ? (
                    <span className="text-[8px] text-primary">funded</span>
                  ) : (
                    <span className="text-[8px] text-destructive">gap</span>
                  )}
                </div>
                {/* Mini funding bar */}
                <div className="h-0.5 rounded-full bg-muted mt-1 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", funded ? "bg-primary" : "bg-destructive")}
                    style={{
                      width: `${Math.min(100, fundingNeeded > 0 ? (y.totalContributions / fundingNeeded) * 100 : 100)}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FEE DATES — flat list with dividers, no cards */}
      <div className="border-b border-border/60">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground px-2 pt-2 pb-1 font-medium">
          When fees are due
        </p>
        <div className="divide-y divide-border/40">
          {feeMonths.map((m) => (
            <div key={m.monthIndex} className="flex items-center justify-between px-2 py-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate leading-tight">
                  {MONTH_NAMES_FULL[m.calendarMonth]} {m.calendarYear}
                </p>
                <p className="text-[9px] text-muted-foreground truncate leading-tight">
                  Year {m.year} · {m.feeLabel}
                </p>
              </div>
              <span className="text-[11px] font-bold tnum text-destructive shrink-0 ml-2">
                −{formatKshShort(m.withdrawal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <Button variant="outline" size="sm" className="w-full" onClick={handleExport}>
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Export to CSV
      </Button>

      {/* Year carousel popup */}
      <YearCarouselDialog
        years={projection.years}
        open={selectedYear !== null}
        onOpenChange={(b) => !b && setSelectedYear(null)}
        initialYear={selectedYear ?? 0}
      />
    </div>
  );
}

// === Year Carousel Dialog ===
function YearCarouselDialog({
  years, open, onOpenChange, initialYear,
}: {
  years: YearSummary[];
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initialYear: number;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialYear);

  // Sync when opened
  useState(() => {
    if (open) setCurrentIdx(initialYear);
  });

  if (!open || years.length === 0) return null;

  const year = years[currentIdx];
  if (!year) return null;

  const goNext = () => setCurrentIdx((i) => Math.min(years.length - 1, i + 1));
  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const credit = year.helb > year.tuition;
  const fundingNeeded = Math.max(0, year.studentFunding);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0.18 0.02 150 / 0.5)" }} onClick={() => onOpenChange(false)}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-card rounded-2xl card-shadow-lg w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with carousel nav */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60 bg-muted/30">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors", currentIdx === 0 ? "text-muted-foreground/30" : "text-foreground hover:bg-muted/50 active:scale-90")}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold">Year {year.year}</p>
            <p className="text-[9px] text-muted-foreground">{currentIdx + 1} of {years.length}</p>
          </div>
          <button
            onClick={goNext}
            disabled={currentIdx === years.length - 1}
            className={cn("flex h-7 w-7 items-center justify-center rounded-lg transition-colors", currentIdx === years.length - 1 ? "text-muted-foreground/30" : "text-foreground hover:bg-muted/50 active:scale-90")}
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-90 transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Year content — flat dividers, no cards */}
        <div className="p-4 space-y-3">
          {/* End balance — big number */}
          <div className="text-center pb-3 border-b border-border/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">MMF at year end</p>
            <p className={cn("text-2xl font-bold tnum mt-1", year.endBalance < 0 ? "text-destructive" : "text-primary")}>
              {formatKsh(year.endBalance)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {year.startBalance >= 0 ? formatKshShort(year.startBalance) : "—"} → {formatKshShort(year.endBalance)}
              <span className={cn("ml-1 font-medium", year.netChange >= 0 ? "text-primary" : "text-destructive")}>
                ({year.netChange >= 0 ? "+" : ""}{formatKshShort(Math.round(year.netChange))})
              </span>
            </p>
          </div>

          {/* Flat metric rows with dividers */}
          <div className="divide-y divide-border/40">
            <FlatRow icon={<GraduationCap className="h-3 w-3" />} label="Tuition" value={formatKsh(year.tuition)} />
            <FlatRow icon={<PiggyBank className="h-3 w-3" />} label="HELB" value={formatKsh(year.helb)} tone={credit ? "primary" : undefined} />
            <FlatRow icon={<Wallet className="h-3 w-3" />} label="You fund" value={formatKsh(fundingNeeded)} tone={fundingNeeded > 0 ? "destructive" : "primary"} />
            <FlatRow icon={<TrendingUp className="h-3 w-3" />} label="Saved" value={formatKsh(Math.round(year.totalContributions))} tone="primary" />
            <FlatRow icon={<TrendingUp className="h-3 w-3" />} label="Interest" value={formatKsh(Math.round(year.totalInterest))} tone="accent" />
            <FlatRow icon={<TrendingDown className="h-3 w-3" />} label="Fees out" value={formatKsh(year.totalWithdrawn)} tone="destructive" />
          </div>

          {/* Status line */}
          <div className="pt-2 border-t border-border/60">
            {credit ? (
              <p className="text-[11px] text-primary text-center">
                HELB fully covers — surplus {formatKsh(year.helb - year.tuition)} stays in MMF
              </p>
            ) : fundingNeeded === 0 ? (
              <p className="text-[11px] text-primary text-center">HELB covers tuition exactly</p>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center">
                You need to cover <strong className="text-foreground">{formatKsh(fundingNeeded)}</strong> from MMF savings
              </p>
            )}
          </div>
        </div>

        {/* Swipe hint */}
        <div className="px-4 pb-3 flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
          <ChevronLeft className="h-2.5 w-2.5" />
          <span>Swipe or tap arrows to navigate years</span>
          <ChevronRight className="h-2.5 w-2.5" />
        </div>
      </motion.div>
    </div>
  );
}

function FlatRow({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "destructive" | "accent";
}) {
  const toneCls = {
    primary: "text-primary",
    destructive: "text-destructive",
    accent: "text-chart-3",
  }[tone ?? ""] ?? "text-foreground";
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="shrink-0">{icon}</span>
        {label}
      </span>
      <span className={cn("text-[11px] font-semibold tnum", toneCls)}>{value}</span>
    </div>
  );
}
