"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import type { YearSummary } from "@/lib/planner/types";
import { formatKsh, formatKshShort } from "@/lib/planner/engine";

export function AnnualSummaryChart({ years }: { years: YearSummary[] }) {
  const data = years.map((y) => ({
    year: `Year ${y.year}`,
    contributions: Math.round(y.totalContributions),
    interest: Math.round(y.totalInterest),
    withdrawn: Math.round(y.totalWithdrawn),
    net: Math.round(y.netChange),
  }));

  // Auto-scale Y-axis to fit the largest single bar value (max of contributions,
  // interest, withdrawn across all years) with ~10% headroom.
  const allValues = data.flatMap((d) => [d.contributions, d.interest, d.withdrawn]);
  const maxValue = Math.max(...allValues, 1000);
  // Round up to a "nice" number (e.g., 160000 → 180000)
  const niceCeil = (n: number) => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
    return Math.ceil((n * 1.1) / (magnitude / 2)) * (magnitude / 2);
  };
  const yMax = niceCeil(maxValue);

  return (
    <div className="h-56 w-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 150 / 0.15)" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }}
            axisLine={false}
            tickLine={false}
            height={18}
          />
          <YAxis
            domain={[0, yMax]}
            tickCount={5}
            tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }}
            axisLine={false}
            tickLine={false}
            width={42}
            tickFormatter={(v) => formatKshShort(Number(v))}
          />
          <Tooltip
            cursor={{ fill: "oklch(0.45 0.12 150 / 0.06)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              return (
                <div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs space-y-1">
                  <p className="font-semibold mb-1">{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey} className="flex items-center gap-1.5 tnum">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: p.color }}
                      />
                      <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
                      <span className="font-medium">{formatKsh(Number(p.value))}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="contributions" name="Saved" fill="oklch(0.5 0.13 150)" radius={[4, 4, 0, 0]} animationDuration={600} />
          <Bar dataKey="interest" name="Interest" fill="oklch(0.68 0.14 75)" radius={[4, 4, 0, 0]} animationDuration={700} />
          <Bar dataKey="withdrawn" name="Fees out" fill="oklch(0.6 0.16 35)" radius={[4, 4, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
