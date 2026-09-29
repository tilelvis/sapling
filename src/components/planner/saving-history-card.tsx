"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { History, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKsh } from "@/lib/planner/engine";

interface HistoryEntry {
  id: number;
  monthlySaving: number;
  mmfReturn: number;
  changedAt: string;
  note: string | null;
}

/**
 * Monthly saving history chart. Shows how the user's monthly saving target
 * has changed over time — an audit trail of their financial decisions.
 */
export function SavingHistoryCard({ currentSaving }: { currentSaving: number }) {
  const { data, isLoading } = useQuery<HistoryEntry[]>({
    queryKey: ["saving-history"],
    queryFn: async () => {
      const r = await fetch("/api/saving-history");
      if (!r.ok) throw new Error("Failed to load history");
      return r.json();
    },
  });

  const history = data ?? [];

  // Build chart data: include the current setting as the latest point so the
  // chart always reflects reality even before a new history row is written.
  const chartData = history.map((h) => ({
    label: new Date(h.changedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
    saving: h.monthlySaving,
    return: h.mmfReturn,
    note: h.note,
    timestamp: h.changedAt,
  }));

  // Determine trend (up/down/stable) by comparing first and last
  const hasMultiple = chartData.length >= 2;
  const firstVal = chartData[0]?.saving ?? currentSaving;
  const lastVal = chartData[chartData.length - 1]?.saving ?? currentSaving;
  const trend = lastVal > firstVal ? "up" : lastVal < firstVal ? "down" : "stable";
  const trendDelta = lastVal - firstVal;

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <History className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">Saving history</h3>
        </div>
        {hasMultiple && (
          <Badge
            variant="outline"
            className={`text-[10px] tnum ${
              trend === "up"
                ? "border-primary/40 text-primary bg-primary/5"
                : trend === "down"
                  ? "border-destructive/40 text-destructive bg-destructive/5"
                  : ""
            }`}
          >
            {trend === "up" && <TrendingUp className="h-2.5 w-2.5 mr-0.5" />}
            {trend === "down" && <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
            {trend === "up" ? "+" : trend === "down" ? "" : ""}
            {trend !== "stable" ? formatKsh(Math.abs(trendDelta)) : "stable"}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        How your monthly saving target has changed over time.
      </p>

      {isLoading ? (
        <div className="h-32 rounded-lg shimmer" />
      ) : chartData.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-4 text-center">
          <History className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-[11px] text-muted-foreground">
            No changes recorded yet. When you adjust your monthly saving, the
            history will appear here.
          </p>
        </div>
      ) : chartData.length === 1 ? (
        <div className="rounded-lg bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Started at{" "}
            <strong className="text-foreground tnum">{formatKsh(chartData[0].saving)}</strong>
            /month on{" "}
            <strong className="text-foreground">{chartData[0].label}</strong>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Change your saving to see the trend build up.
          </p>
        </div>
      ) : (
        <>
          <div className="h-32 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 150 / 0.12)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
                  axisLine={false}
                  tickLine={false}
                  height={14}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => formatKsh(Number(v))}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs space-y-1">
                        <p className="font-semibold">{p.label}</p>
                        <p className="tnum text-primary">
                          {formatKsh(p.saving)}/month
                        </p>
                        <p className="tnum text-muted-foreground">
                          {Math.round(p.return * 100)}% return
                        </p>
                        {p.note && (
                          <p className="text-[10px] text-muted-foreground italic mt-1">
                            {p.note}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="stepAfter"
                  dataKey="saving"
                  stroke="oklch(0.45 0.12 150)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "oklch(0.45 0.12 150)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {chartData.length} change{chartData.length !== 1 ? "s" : ""} recorded ·
            started at {formatKsh(firstVal)}/mo · now {formatKsh(lastVal)}/mo
          </p>
        </>
      )}
    </Card>
  );
}
