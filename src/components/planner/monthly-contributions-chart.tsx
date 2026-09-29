"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import type { MonthRow } from "@/lib/planner/types";
import { formatKsh, formatKshShort } from "@/lib/planner/engine";

/**
 * Monthly cash flow chart for the Plan view.
 *
 * Design choice: The 5,000/month contributions and 60-80K fees are on very
 * different scales. Instead of cramming both into one axis (which makes the
 * 5K bars invisible), we render a single bar per month whose color encodes
 * the type (green for normal saving month, red for fee month) and whose
 * height represents the dominant value:
 *   - Normal month: bar = contribution (5K, small green nub)
 *   - Fee month: bar = withdrawal (60-80K, tall red bar)
 * This way the chart reads as "small green ticks most months, big red spikes
 * at fee dates" — which is exactly the visual story the user needs.
 */
export function MonthlyContributionsChart({
  months, currentMonthIndex,
}: {
  months: MonthRow[];
  currentMonthIndex: number;
}) {
  const data = months.map((m) => ({
    idx: m.monthIndex,
    label: m.shortMonth,
    // Show the larger of contribution/withdrawal so fee months get tall bars
    value: Math.max(m.contribution, m.withdrawal),
    isFee: m.isFeeMonth,
    contribution: Math.round(m.contribution),
    withdrawn: Math.round(m.withdrawal),
  }));

  // Y-axis: scale to fit the largest value (fees) with ~15% headroom.
  const maxValue = Math.max(...data.map((d) => d.value), 10000);
  const yMax = Math.ceil(maxValue * 1.15 / 10000) * 10000;

  return (
    <div className="h-44 w-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 150 / 0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            interval={5}
            tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
            axisLine={false}
            tickLine={false}
            height={16}
          />
          <YAxis
            domain={[0, yMax]}
            tickCount={5}
            tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => formatKshShort(Number(v))}
          />
          <ReferenceLine
            x={currentMonthIndex}
            stroke="oklch(0.45 0.12 150)"
            strokeDasharray="2 2"
            strokeWidth={1}
            label={{ value: "Now", fontSize: 9, fill: "oklch(0.45 0.12 150)", position: "top" }}
          />
          <Tooltip
            cursor={{ fill: "oklch(0.45 0.12 150 / 0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const idx = Number(payload[0].payload.idx);
              const m = months[idx];
              if (!m) return null;
              return (
                <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs space-y-1 max-w-[200px]">
                  <p className="font-semibold">{m.monthLabel}</p>
                  <p className="tnum text-primary">
                    +{formatKsh(m.contribution)} saved
                  </p>
                  {m.isFeeMonth && (
                    <p className="tnum text-destructive">
                      −{formatKsh(m.withdrawal)} fee
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[2, 2, 0, 0]}
            maxBarSize={14}
            animationDuration={500}
          >
            {data.map((d) => (
              <Cell
                key={d.idx}
                fill={d.isFee
                  ? "oklch(0.6 0.16 35 / 0.85)"
                  : "oklch(0.5 0.13 150 / 0.75)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

