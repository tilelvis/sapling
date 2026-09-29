"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt, BarChart3, Download, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh, formatKshShort, MONTH_NAMES_FULL } from "@/lib/planner/engine";
import type { ProjectionBundle } from "./hooks";
import { YearlyReviewCard } from "./yearly-review-card";
import { MetricStrip, type Metric } from "./metric-strip";
import { projectionToCsv, downloadCsv } from "@/lib/planner/csv";

export function FeePlanView({ bundle }: { bundle: ProjectionBundle }) {
  const { settings, projection } = bundle;

  const totalTuition = settings.tuitionPerYear * 4;
  const totalHelb = settings.helbY1 + settings.helbY2 + settings.helbY3 + settings.helbY4;
  const totalStudentFunding = totalTuition - totalHelb;

  const handleExport = () => {
    const csv = projectionToCsv(projection, settings);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `forestry-tuition-plan-${date}.csv`);
  };

  // Compact metric strip — no cards, just plain metrics with dividers
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

  // Savings breakdown strip
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

      {/* Top metric strip — tuition / HELB / graduation */}
      <MetricStrip metrics={topMetrics} />

      {/* Savings breakdown strip — saved / interest / start */}
      <MetricStrip metrics={savingsMetrics} />

      {/* Chart note — compact, no card */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-muted-foreground">
        <BarChart3 className="h-3 w-3 shrink-0" />
        <span>Annual chart: Home tab → Charts → "Annual"</span>
      </div>

      {/* Yearly review (year-over-year progress) */}
      <YearlyReviewCard years={projection.years} />

      {/* Year cards */}
      <div className="space-y-3">
        {projection.years.map((y) => {
          const credit = y.helb > y.tuition;
          const fundingNeeded = y.studentFunding;
          return (
            <Card
              key={y.year}
              className={cn(
                "p-4 card-shadow border-l-4",
                y.endBalance < 0 ? "border-l-destructive" : "border-l-primary",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Academic Year</p>
                  <h3 className="text-lg font-bold">Year {y.year}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">MMF at year end</p>
                  <p
                    className={cn(
                      "text-lg font-bold tnum",
                      y.endBalance < 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {formatKsh(y.endBalance)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Row
                  icon={<GraduationCap className="h-3.5 w-3.5" />}
                  label="Tuition"
                  value={formatKshShort(y.tuition)}
                />
                <Row
                  icon={<PiggyBank className="h-3.5 w-3.5" />}
                  label="HELB"
                  value={formatKshShort(y.helb)}
                  tone={credit ? "primary" : "neutral"}
                />
                <Row
                  icon={<Wallet className="h-3.5 w-3.5" />}
                  label="You fund"
                  value={formatKshShort(Math.max(0, fundingNeeded))}
                  tone={fundingNeeded > 0 ? "destructive" : "primary"}
                />
                <Row
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  label="Saved"
                  value={formatKshShort(y.totalContributions)}
                  tone="primary"
                />
                <Row
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  label="Interest"
                  value={formatKshShort(Math.round(y.totalInterest))}
                  tone="accent"
                />
                <Row
                  icon={<TrendingDown className="h-3.5 w-3.5" />}
                  label="Fees out"
                  value={formatKshShort(y.totalWithdrawn)}
                  tone="destructive"
                />
              </div>

              {/* Status line */}
              <div className="mt-3 pt-3 border-t border-border/60">
                {credit ? (
                  <p className="text-xs text-primary">
                    HELB fully covers this year — surplus of {formatKsh(y.helb - y.tuition)} stays in your MMF.
                  </p>
                ) : fundingNeeded === 0 ? (
                  <p className="text-xs text-primary">HELB covers tuition exactly this year.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You need to cover{" "}
                    <strong className="text-foreground">{formatKsh(fundingNeeded)}</strong>{" "}
                    from your MMF savings this year.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fee dates reference */}
      <Card className="p-4 card-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Receipt className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">When fees are due</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          These are the months money leaves your MMF for tuition.
        </p>
        <div className="space-y-1.5">
          {projection.months.filter((m) => m.isFeeMonth).map((m) => (
            <div
              key={m.monthIndex}
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {MONTH_NAMES_FULL[m.calendarMonth]} {m.calendarYear}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Year {m.year} · {m.feeLabel}
                </p>
              </div>
              <Badge variant="outline" className="text-destructive border-destructive/30 tnum bg-destructive/5 shrink-0">
                {formatKshShort(m.withdrawal)}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Export button */}
      <Button variant="outline" className="w-full card-shadow" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export full plan to CSV
      </Button>
    </div>
  );
}

function Row({
  icon, label, value, tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "primary" | "destructive" | "accent";
}) {
  const toneCls = {
    neutral: "text-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
    accent: "text-chart-3",
  }[tone];
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 gap-1.5">
      <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <span className={cn("tnum font-medium shrink-0 whitespace-nowrap", toneCls)}>{value}</span>
    </div>
  );
}
