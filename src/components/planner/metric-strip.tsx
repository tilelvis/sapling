"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Metric {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sub?: string;
  negative?: boolean;
  onClick?: () => void;
}

/**
 * Compact metric strip — plain metrics with tiny dividers, no cards.
 * Each metric is a tight block: label on top, value (with optional trend
 * indicator to the LEFT), sub label below. Dividers between metrics are
 * thin vertical lines on the sides and a thin horizontal line at the bottom.
 *
 * No double metrics: trend/delta is shown inline to the left of the value,
 * not as a separate stat.
 */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="border-b border-border/60">
      <div className="grid grid-cols-3 divide-x divide-border/60">
        {metrics.map((m, i) => {
          const TrendIcon = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
          const trendColor = m.trend === "up"
            ? "text-primary"
            : m.trend === "down"
              ? "text-destructive"
              : "text-muted-foreground";
          return (
            <button
              key={i}
              onClick={m.onClick}
              disabled={!m.onClick}
              className={cn(
                "px-2 py-1.5 text-left min-w-0 overflow-hidden",
                m.onClick && "active:bg-muted/40 transition-colors cursor-pointer",
              )}
            >
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground leading-none font-medium truncate">
                {m.label}
              </p>
              <div className="flex items-center gap-0.5 mt-1 min-w-0">
                {m.trend && m.trend !== "neutral" && (
                  <TrendIcon className={cn("h-2.5 w-2.5 shrink-0", trendColor)} />
                )}
                {m.trendValue && (
                  <span className={cn("text-[9px] tnum leading-none shrink-0 truncate", trendColor)}>
                    {m.trendValue}
                  </span>
                )}
                <span className={cn(
                  "text-[12px] font-bold tnum leading-none ml-auto truncate",
                  m.negative ? "text-destructive" : "text-foreground",
                )}>
                  {m.value}
                </span>
              </div>
              {m.sub && (
                <p className="text-[8px] text-muted-foreground leading-none mt-1 truncate">
                  {m.sub}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
