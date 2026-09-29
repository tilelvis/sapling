"use client";

import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

/**
 * Tiny inline sparkline showing variance (actual - planned) over time
 * for completed months. Green when ahead, red when behind.
 */
export function VarianceSparkline({
  data,
}: {
  data: { monthLabel: string; variance: number }[];
}) {
  if (data.length < 2) return null;

  const chartData = data.map((d) => ({
    label: d.monthLabel,
    v: Math.round(d.variance),
  }));

  const allNegative = chartData.every((d) => d.v <= 0);
  const allPositive = chartData.every((d) => d.v >= 0);
  const strokeColor = allNegative
    ? "oklch(0.58 0.22 28)"
    : allPositive
      ? "oklch(0.5 0.13 150)"
      : "oklch(0.68 0.14 75)";

  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ReferenceLine y={0} stroke="oklch(0.5 0.02 150 / 0.3)" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={{ r: 2, fill: strokeColor }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
