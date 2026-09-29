"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import type { MonthRow } from "@/lib/planner/types";
import { formatKsh, formatKshShort } from "@/lib/planner/engine";

export function ProjectionChart({
  months, currentMonthIndex,
}: { months: MonthRow[]; currentMonthIndex: number }) {
  const data = months.map((m) => ({
    idx: m.monthIndex,
    label: m.shortMonth,
    balance: Math.round(m.endingBalance),
    fee: m.isFeeMonth,
  }));

  const minBalance = Math.min(...data.map((d) => d.balance), 0);
  const maxBalance = Math.max(...data.map((d) => d.balance), 10000);
  const padding = (maxBalance - minBalance) * 0.08;

  const feeDots = data.filter((d) => d.fee);

  return (
    <div className="h-44 w-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.45 0.12 150)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.45 0.12 150)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            interval={5}
            tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
            axisLine={false}
            tickLine={false}
            height={16}
          />
          <YAxis
            domain={[minBalance - padding, maxBalance + padding]}
            tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => formatKshShort(Number(v))}
          />
          <ReferenceLine y={0} stroke="oklch(0.58 0.22 28)" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine
            x={currentMonthIndex}
            stroke="oklch(0.45 0.12 150)"
            strokeWidth={1}
            strokeDasharray="2 2"
            label={{ value: "Now", fontSize: 9, fill: "oklch(0.45 0.12 150)", position: "top" }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const idx = Number(payload[0].payload.idx);
              const m = months[idx];
              if (!m) return null;
              return (
                <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs space-y-1 max-w-[200px]">
                  <p className="font-semibold">{m.monthLabel}</p>
                  <p className="tnum text-primary font-medium">
                    Balance: {formatKsh(m.endingBalance)}
                  </p>
                  {m.isFeeMonth && (
                    <p className="text-destructive tnum">
                      Fee: -{formatKsh(m.withdrawal)}
                    </p>
                  )}
                  <p className="text-muted-foreground tnum">
                    +{formatKsh(m.contribution)} saved
                  </p>
                  <p className="text-muted-foreground tnum">
                    +{formatKsh(m.interest)} interest
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="oklch(0.45 0.12 150)"
            strokeWidth={2}
            fill="url(#balGrad)"
            isAnimationActive={false}
          />
          {feeDots.map((d) => (
            <ReferenceDot
              key={d.idx}
              x={d.idx}
              y={d.balance}
              r={3}
              fill="oklch(0.6 0.16 35)"
              stroke="oklch(1 0 0)"
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
